"""Robust Batch Harvester for scaling up to 10,000+ scientific preprints via arXiv REST API.

Key Engineering Features:
- Category-by-category pagination (cs.AI, cs.LG, cs.CV, cs.CL, stat.ML) to minimize arXiv query overhead
- Dynamic Retry-After header parsing for resilient 429 rate-limit handling
- Resumable checkpointing (interrupted runs resume smoothly)
- Direct vaulting into Cloudflare R2 Bronze layer and Silver Parquet
"""

import datetime
import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx
import xmltodict

from src.config.settings import settings
from src.storage.r2_client import R2Client
from src.transformation.silver_writer import SilverLakehouseWriter


class ArxivBatchHarvester:
    """Manages resilient batch pagination harvesting from arXiv API."""

    API_ENDPOINT = "https://export.arxiv.org/api/query"

    def __init__(
        self,
        r2_client: Optional[R2Client] = None,
        checkpoint_dir: Optional[Path] = None,
        request_delay: float = 6.0,
    ):
        self.r2 = r2_client or R2Client()
        self.request_delay = request_delay
        self.checkpoint_dir = checkpoint_dir or (settings.ROOT_DIR / "data" / "manifests")
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_file = self.checkpoint_dir / "batch_checkpoint.json"

        self.http_client = httpx.Client(
            headers={
                "User-Agent": "UTH-Scientific-DataMining-BatchHarvester/1.0 (academic research; contact: data-mining@uth.edu.vn)"
            },
            timeout=45.0,
            follow_redirects=True,
        )

    def load_checkpoint(self) -> Dict[str, Any]:
        """Tải trạng thái checkpoint của lần chạy trước."""
        if self.checkpoint_file.exists():
            try:
                with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"category_index": 0, "offset_in_category": 0, "total_ingested": 0, "last_updated": None}

    def save_checkpoint(self, cat_idx: int, offset: int, total_ingested: int):
        """Lưu lại tiến độ để tiếp tục nếu gặp sự cố mạng."""
        checkpoint_data = {
            "category_index": cat_idx,
            "offset_in_category": offset,
            "total_ingested": total_ingested,
            "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        with open(self.checkpoint_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint_data, f, indent=2)

    def extract_clean_arxiv_id(self, raw_id_or_url: str) -> str:
        """Trích xuất ID chuẩn dạng YYYY.NNNNN."""
        match = re.search(r"(\d{4}\.\d{4,5})(v\d+)?", raw_id_or_url)
        if match:
            return match.group(1)
        return raw_id_or_url.split("/")[-1].replace(".pdf", "")

    def normalize_entry(self, entry: Dict[str, Any], default_cat: str = "cs.AI") -> Dict[str, Any]:
        """Chuẩn hóa một bản ghi XML từ API thành schema metadata sạch."""
        raw_id = entry.get("id", "")
        clean_id = self.extract_clean_arxiv_id(raw_id)

        title = re.sub(r"\s+", " ", entry.get("title", "")).strip()
        abstract = re.sub(r"\s+", " ", entry.get("summary", "")).strip()

        # Chuẩn hóa danh sách tác giả
        authors = []
        raw_authors = entry.get("author", [])
        if isinstance(raw_authors, dict):
            raw_authors = [raw_authors]
        for a in raw_authors:
            if isinstance(a, dict) and "name" in a:
                authors.append(a["name"].strip())

        # Chuẩn hóa categories
        categories = []
        raw_cats = entry.get("category", [])
        if isinstance(raw_cats, dict):
            raw_cats = [raw_cats]
        for c in raw_cats:
            if isinstance(c, dict) and "@term" in c:
                categories.append(c["@term"].strip())

        primary_cat_dict = entry.get("arxiv:primary_category", {})
        primary_cat = (
            primary_cat_dict.get("@term")
            if isinstance(primary_cat_dict, dict)
            else (categories[0] if categories else default_cat)
        )

        pdf_url = f"https://arxiv.org/pdf/{clean_id}.pdf"
        links = entry.get("link", [])
        if isinstance(links, dict):
            links = [links]
        for l in links:
            if isinstance(l, dict) and l.get("@title") == "pdf":
                pdf_url = l.get("@href", pdf_url)

        return {
            "paper_id": clean_id,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "categories": categories if categories else [default_cat],
            "primary_category": primary_cat,
            "published_date": entry.get("published", ""),
            "updated_date": entry.get("updated", ""),
            "pdf_url": pdf_url,
            "html_url": f"https://arxiv.org/html/{clean_id}",
            "crawled_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "has_html": False,
            "html_r2_uri": None,
            "html_sha256": None,
        }

    def fetch_api_batch_resilient(self, category: str, start: int, max_results: int = 100, max_retries: int = 5) -> List[Dict[str, Any]]:
        """Gửi request lấy batch bài báo kèm xử lý chính xác header Retry-After khi gặp 429."""
        params = {
            "search_query": f"cat:{category}",
            "start": start,
            "max_results": max_results,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
        }

        for attempt in range(1, max_retries + 1):
            try:
                resp = self.http_client.get(self.API_ENDPOINT, params=params)

                # Xử lý Rate Limit 429 chuẩn quốc tế
                if resp.status_code == 429:
                    retry_after = int(resp.headers.get("Retry-After", 30))
                    print(f"      ⚠️ arXiv Rate Limit (429). Server yêu cầu chờ {retry_after}s. Đang tạm dừng...")
                    time.sleep(retry_after + 2)
                    continue

                resp.raise_for_status()
                data = xmltodict.parse(resp.text)
                entries = data.get("feed", {}).get("entry", [])
                if isinstance(entries, dict):
                    entries = [entries]

                return [self.normalize_entry(e, default_cat=category) for e in entries]

            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                wait_sec = attempt * 5
                print(f"      ⚠️ Thử lần {attempt}/{max_retries} thất bại ({e}). Chờ {wait_sec}s...")
                time.sleep(wait_sec)

        raise RuntimeError(f"Không thể tải batch category={category}, offset={start} sau {max_retries} lần thử.")

    def harvest_large_corpus(
        self,
        total_target: int = 10000,
        batch_size: int = 100,
        categories: Optional[List[str]] = None,
        reset_checkpoint: bool = False,
        sync_silver_every_n_batches: int = 5,
    ):
        """Thu thập 10,000 bài báo phân bổ đều qua các chuyên mục AI/DS."""
        cats = categories or settings.ARXIV_CATEGORIES
        target_per_category = total_target // len(cats)

        writer = SilverLakehouseWriter(r2_client=self.r2)

        checkpoint = {"category_index": 0, "offset_in_category": 0, "total_ingested": 0} if reset_checkpoint else self.load_checkpoint()
        cat_start_idx = checkpoint.get("category_index", 0)
        offset_in_cat = checkpoint.get("offset_in_category", 0)
        total_ingested = checkpoint.get("total_ingested", 0)

        print(f"🎯 Tổng mục tiêu: {total_target:,} bài ({target_per_category:,} bài/chuyên mục)")
        print(f"📂 Danh mục: {', '.join(cats)}")
        if total_ingested > 0:
            print(f"🔄 Tiếp tục từ Checkpoint: Đã có={total_ingested:,} bài (bắt đầu tại cat[{cat_start_idx}] offset={offset_in_cat:,})")
        else:
            print("🚀 Bắt đầu phiên cào mới từ Offset=0")

        buffered_silver_records = []

        for c_idx in range(cat_start_idx, len(cats)):
            current_category = cats[c_idx]
            cur_offset = offset_in_cat if c_idx == cat_start_idx else 0
            category_target = target_per_category

            print(f"\n📁 [Chuyên mục {c_idx + 1}/{len(cats)}]: {current_category} (Mục tiêu: {category_target:,} bài)")

            while cur_offset < category_target and total_ingested < total_target:
                current_batch_size = min(batch_size, category_target - cur_offset, total_target - total_ingested)
                print(f"   📡 Tải Batch {current_category} tại offset {cur_offset:,} (+{current_batch_size} bài)...")

                try:
                    papers = self.fetch_api_batch_resilient(
                        category=current_category,
                        start=cur_offset,
                        max_results=current_batch_size,
                    )
                except Exception as e:
                    print(f"   ❌ Bỏ qua batch sau nhiều lần thử lỗi: {e}")
                    cur_offset += current_batch_size
                    continue

                if not papers:
                    print(f"   ℹ️ Đã hết bài mới cho chuyên mục {current_category}.")
                    break

                # 1. Lưu Batch JSON vào R2 Bronze (Batch bundle tối ưu số lượng request)
                batch_key = f"bronze/arxiv/batches/{current_category}/batch_offset_{cur_offset:06d}.json"
                try:
                    self.r2.upload_json(
                        payload={"category": current_category, "offset": cur_offset, "count": len(papers), "papers": papers},
                        key=batch_key,
                        metadata={"category": current_category, "count": str(len(papers))},
                    )
                except Exception as e:
                    print(f"   ⚠️ Lỗi upload R2 batch bundle: {e}")

                # 2. Chuẩn bị bản ghi cho Silver Layer
                for p in papers:
                    parsed_dummy = {
                        "parsed_title": p["title"],
                        "parsed_abstract": p["abstract"],
                        "sections": [
                            {
                                "section_id": "abstract",
                                "section_title": "Abstract",
                                "section_type": "abstract",
                                "content": p["abstract"],
                                "paragraphs": [p["abstract"]],
                                "paragraph_count": 1,
                                "math_count": 0,
                                "word_count": len(p["abstract"].split()),
                            }
                        ],
                        "total_sections": 1,
                        "total_math_count": 0,
                        "total_words": len(p["abstract"].split()),
                    }
                    silver_rec = writer.prepare_record(raw_meta=p, parsed_html=parsed_dummy)
                    buffered_silver_records.append(silver_rec)

                total_ingested += len(papers)
                cur_offset += len(papers)

                # Lưu Checkpoint
                self.save_checkpoint(c_idx, cur_offset, total_ingested)
                print(f"      ✅ Tiến độ: {total_ingested:,}/{total_target:,} bài ({(total_ingested/total_target)*100:.1f}%)")

                # Cập nhật định kỳ Silver Parquet và đẩy lên R2
                if len(buffered_silver_records) >= (batch_size * sync_silver_every_n_batches) or total_ingested >= total_target:
                    print(f"   💾 Đang cập nhật Tầng Silver Parquet với {len(buffered_silver_records)} bài mới...")
                    writer.save_and_upload_parquet(buffered_silver_records, year="2026")
                    buffered_silver_records = []
                    print("   ✅ Đã cập nhật xong Silver Parquet lên Cloudflare R2!")

                # Nghỉ lịch sự giữa các batch API
                time.sleep(self.request_delay)

            # Đặt lại offset cho chuyên mục tiếp theo
            offset_in_cat = 0

        if buffered_silver_records:
            print(f"   💾 Xuất nốt {len(buffered_silver_records)} bản ghi vào Silver Parquet...")
            writer.save_and_upload_parquet(buffered_silver_records, year="2026")

        print(f"\n🎉 HOÀN TẤT THU THẬP BATCH: Đã nạp tổng cộng {total_ingested:,} bài báo vào Bronze và Silver!")
        return total_ingested
