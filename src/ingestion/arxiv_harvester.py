"""Real-Time arXiv Harvester for AI/DS literature.

Fetches paper metadata via RSS/API, downloads standardized HTML5 full-text,
and vaults raw payloads into the Cloudflare R2 Bronze Lakehouse layer
with cryptographic SHA-256 integrity hashes.
"""

import datetime
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import feedparser
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from src.config.settings import settings
from src.storage.r2_client import R2Client
from src.utils.hasher import compute_sha256


class ArxivHarvester:
    """Automated harvester for arXiv preprints."""

    BASE_RSS_URL = "http://export.arxiv.org/rss"
    BASE_API_URL = "http://export.arxiv.org/api/query"
    BASE_HTML_URL = "https://arxiv.org/html"

    def __init__(
        self,
        r2_client: Optional[R2Client] = None,
        categories: Optional[List[str]] = None,
        request_delay: Optional[float] = None,
    ):
        self.r2 = r2_client or R2Client()
        self.categories = categories or settings.ARXIV_CATEGORIES
        self.request_delay = request_delay or settings.ARXIV_REQUEST_DELAY_SECONDS
        self.http_client = httpx.Client(
            headers={
                "User-Agent": "UTH-Scientific-DataMining-Harvester/1.0 (academic research; contact: data-mining@uth.edu.vn)"
            },
            timeout=30.0,
            follow_redirects=True,
        )

    def extract_clean_arxiv_id(self, raw_id_or_url: str) -> str:
        """Trích xuất ID arXiv chuẩn hóa dạng YYYY.NNNNN (bỏ URL prefix và version nếu cần)."""
        match = re.search(r"(\d{4}\.\d{4,5})(v\d+)?", raw_id_or_url)
        if match:
            return match.group(1)
        return raw_id_or_url.split("/")[-1].replace(".pdf", "")

    def fetch_rss_feed(self, category: str) -> List[Dict[str, Any]]:
        """Lấy danh sách các bài báo mới nhất trong ngày từ arXiv RSS feed."""
        url = f"{self.BASE_RSS_URL}/{category}"
        feed = feedparser.parse(url)
        papers = []

        for entry in feed.entries:
            clean_id = self.extract_clean_arxiv_id(entry.link)
            title = re.sub(r"\s+", " ", entry.title).strip()
            # arXiv RSS thường có định dạng: "Title. (arXiv:2401.xxxxx [category])"
            title = re.sub(r"\(arXiv:\d{4}\.\d{4,5}.*?\)$", "", title).strip()

            summary = re.sub(r"\s+", " ", entry.summary).strip()
            # Loại bỏ đoạn prefix rác do RSS sinh ra nếu có
            summary = re.sub(r"^<p>", "", summary)
            summary = re.sub(r"</p>$", "", summary).strip()

            authors = []
            if hasattr(entry, "authors"):
                authors = [a.name for a in entry.authors if hasattr(a, "name")]
            elif hasattr(entry, "author"):
                authors = [entry.author]

            papers.append(
                {
                    "paper_id": clean_id,
                    "title": title,
                    "abstract": summary,
                    "authors": authors,
                    "categories": [category],
                    "rss_category": category,
                    "link": entry.link,
                    "pdf_url": f"https://arxiv.org/pdf/{clean_id}.pdf",
                    "html_url": f"{self.BASE_HTML_URL}/{clean_id}",
                    "published_date": getattr(entry, "published", datetime.datetime.now(datetime.timezone.utc).isoformat()),
                    "crawled_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                }
            )

        return papers

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def download_paper_html(self, clean_id: str) -> Optional[str]:
        """Tải bản Full-text HTML của bài báo từ arXiv HTML5 (ar5iv/latexml)."""
        html_url = f"{self.BASE_HTML_URL}/{clean_id}"
        resp = self.http_client.get(html_url)

        # Nếu bài báo chưa có bản HTML hoặc chưa render xong
        if resp.status_code == 404:
            return None

        resp.raise_for_status()
        text = resp.text

        # Kiểm tra xem có phải trang HTML bài báo thực sự không
        if "ltx_document" in text or "ltx_page_main" in text or "<article" in text:
            return text
        return None

    def ingest_paper(self, paper_meta: Dict[str, Any], download_html: bool = True) -> Dict[str, Any]:
        """Thu thập 1 bài báo và đẩy thẳng vào kho Bronze trên Cloudflare R2."""
        paper_id = paper_meta["paper_id"]
        # Phân loại thư mục theo năm: 2401 -> 2024
        year_prefix = f"20{paper_id[:2]}" if paper_id[:2].isdigit() else "unknown"

        meta_key = f"bronze/arxiv/raw_metadata/{year_prefix}/{paper_id}.json"
        html_key = f"bronze/arxiv/raw_html/{year_prefix}/{paper_id}.html"

        # 1. Kiểm tra deduplication: nếu metadata đã tồn tại trên R2 thì bỏ qua
        if self.r2.object_exists(meta_key):
            return {
                "paper_id": paper_id,
                "status": "SKIPPED_EXISTING",
                "meta_uri": f"s3://{self.r2.bucket_name}/{meta_key}",
            }

        html_saved = False
        html_uri = None
        html_sha256 = None

        # 2. Tải bản Full-text HTML nếu được yêu cầu
        if download_html:
            try:
                html_content = self.download_paper_html(paper_id)
                if html_content:
                    html_res = self.r2.upload_text(
                        text=html_content,
                        key=html_key,
                        content_type="text/html; charset=utf-8",
                        metadata={"paper_id": paper_id},
                    )
                    html_saved = True
                    html_uri = html_res["uri"]
                    html_sha256 = html_res["sha256"]
            except Exception as e:
                # Nếu không lấy được HTML vẫn tiếp tục lưu metadata
                pass

        # 3. Làm giàu metadata và lưu vào Bronze
        paper_meta["has_html"] = html_saved
        paper_meta["html_r2_uri"] = html_uri
        paper_meta["html_sha256"] = html_sha256

        meta_res = self.r2.upload_json(
            payload=paper_meta,
            key=meta_key,
            metadata={"paper_id": paper_id},
        )

        return {
            "paper_id": paper_id,
            "status": "INGESTED",
            "has_html": html_saved,
            "meta_uri": meta_res["uri"],
            "html_uri": html_uri,
            "sha256": meta_res["sha256"],
        }

    def harvest_daily_papers(self, max_per_category: int = 5) -> List[Dict[str, Any]]:
        """Chạy harvest bài báo hàng ngày trên tất cả các danh mục được cấu hình."""
        all_results = []

        for category in self.categories:
            papers = self.fetch_rss_feed(category)
            selected = papers[:max_per_category]

            for paper in selected:
                res = self.ingest_paper(paper, download_html=True)
                all_results.append(res)
                # Polite rate limiting
                time.sleep(self.request_delay)

        return all_results
