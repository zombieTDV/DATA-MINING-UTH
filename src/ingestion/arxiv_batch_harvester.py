"""Robust Batch Harvester for scaling up to 10,000+ scientific preprints via arXiv OAI-PMH Protocol.

Key Engineering Features:
- Official arXiv Bulk Ingestion standard (OAI-PMH verb=ListRecords, metadataPrefix=arXiv)
- High throughput (1,000+ records per HTTP call) without triggering Search API rate-limits
- Filter by AI/DS categories (cs.AI, cs.LG, cs.CV, cs.CL, stat.ML, cs.IR, cs.RO, cs.NE)
- Detailed per-paper logging (ID, Title, Authors, Category, Date, Abstract)
- Clean professional logging format without emojis/icons
- Resumable checkpointing via OAI-PMH resumptionToken
- Direct vaulting into Cloudflare R2 Bronze layer and Silver Parquet
"""

import datetime
import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import httpx
import xmltodict

from src.config.settings import settings
from src.storage.r2_client import R2Client
from src.transformation.silver_writer import SilverLakehouseWriter


class ArxivBatchHarvester:
    """Manages resilient bulk harvesting using the official arXiv OAI-PMH protocol."""

    OAI_ENDPOINT = "https://oaipmh.arxiv.org/oai"

    def __init__(
        self,
        r2_client: Optional[R2Client] = None,
        checkpoint_dir: Optional[Path] = None,
        request_delay: float = 10.0,
    ):
        self.r2 = r2_client or R2Client()
        self.request_delay = request_delay
        self.checkpoint_dir = checkpoint_dir or settings.MANIFEST_DIR
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_file = self.checkpoint_dir / "batch_checkpoint.json"

        self.http_client = httpx.Client(
            headers={
                "User-Agent": "UTH-Scientific-DataMining-OAIHarvester/2.0 (academic research; contact: data-mining@uth.edu.vn)"
            },
            timeout=60.0,
            follow_redirects=True,
        )

    def load_checkpoint(self) -> Dict[str, Any]:
        """Tai trang thai checkpoint cua lan chay truoc."""
        if self.checkpoint_file.exists():
            try:
                with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (OSError, json.JSONDecodeError) as exc:
                raise RuntimeError(
                    "Invalid batch checkpoint; restore it or explicitly reset"
                ) from exc
        return {
            "resumption_token": None,
            "page_num": 0,
            "total_ingested": 0,
            "last_updated": None,
        }

    def save_checkpoint(
        self, resumption_token: Optional[str], page_num: int, total_ingested: int, **state
    ):
        """Luu lai tien do kem resumptionToken de tiep tuc neu gap su co mang."""
        checkpoint_data = {
            "resumption_token": resumption_token,
            "page_num": page_num,
            "total_ingested": total_ingested,
            "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        checkpoint_data.update(state)
        temporary = self.checkpoint_file.with_suffix(".tmp")
        temporary.write_text(json.dumps(checkpoint_data, indent=2), encoding="utf-8")
        temporary.replace(self.checkpoint_file)

    def normalize_oai_record(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Chuyen doi ban ghi OAI-PMH sang schema tieu chuan cua he thong."""
        header = record.get("header", {})
        if header.get("@status") == "deleted":
            return None

        metadata = record.get("metadata", {})
        if not metadata:
            return None

        arxiv_meta = metadata.get("arXiv", {})
        if not arxiv_meta:
            return None

        paper_id = arxiv_meta.get("id", "").strip()
        if not paper_id:
            # Fallback tu identifier
            raw_ident = header.get("identifier", "")
            paper_id = raw_ident.replace("oai:arXiv.org:", "").strip()

        if not paper_id:
            return None

        title = re.sub(r"\s+", " ", arxiv_meta.get("title", "")).strip()
        abstract = re.sub(r"\s+", " ", arxiv_meta.get("abstract", "")).strip()

        # Parse danh sach categories
        cats_str = arxiv_meta.get("categories", "")
        categories = [c.strip() for c in cats_str.split() if c.strip()]
        primary_cat = categories[0] if categories else "cs.AI"

        # Parse danh sach tac gia
        authors_data = arxiv_meta.get("authors", {}).get("author", [])
        if isinstance(authors_data, dict):
            authors_data = [authors_data]
        authors = []
        for a in authors_data:
            if isinstance(a, dict):
                fn = a.get("forenames", "").strip()
                kn = a.get("keyname", "").strip()
                full = f"{fn} {kn}".strip() if fn else kn
                if full:
                    authors.append(full)
            elif isinstance(a, str) and a.strip():
                authors.append(a.strip())

        pub_date = arxiv_meta.get("created") or header.get("datestamp", "")
        updated_date = arxiv_meta.get("updated") or pub_date

        return {
            "paper_id": paper_id,
            "doi": arxiv_meta.get("doi") or "",
            "journal_ref": arxiv_meta.get("journal-ref") or "",
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "categories": categories,
            "primary_category": primary_cat,
            "published_date": pub_date,
            "updated_date": updated_date,
            "pdf_url": f"https://arxiv.org/pdf/{paper_id}.pdf",
            "html_url": f"https://arxiv.org/html/{paper_id}",
            "crawled_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "has_html": False,
            "html_r2_uri": None,
            "html_sha256": None,
        }

    def fetch_oai_page(
        self,
        resumption_token: Optional[str] = None,
        set_spec: str = "cs",
        from_date: str = "2024-01-01",
        max_retries: int = 5,
    ) -> Dict[str, Any]:
        """Gui request OAI-PMH voi co che retry va xu ly Retry-After tu dong."""
        if resumption_token:
            params = {"verb": "ListRecords", "resumptionToken": resumption_token}
        else:
            params = {
                "verb": "ListRecords",
                "metadataPrefix": "arXiv",
                "from": from_date,
            }
            if set_spec:
                params["set"] = set_spec

        for attempt in range(1, max_retries + 1):
            try:
                resp = self.http_client.get(self.OAI_ENDPOINT, params=params)

                # arXiv OAI-PMH su dung 503 khi can thoi gian tao token tiep theo
                if resp.status_code == 503:
                    retry_after = int(resp.headers.get("Retry-After", 15))
                    print(
                        f"[RETRY_AFTER] arXiv OAI-PMH dang chuan bi trang tiep theo. Cho {retry_after}s..."
                    )
                    time.sleep(retry_after + 2)
                    continue

                if resp.status_code == 429:
                    retry_after = int(resp.headers.get("Retry-After", 30))
                    print(f"[RATE_LIMIT] arXiv yeu cau giam toc. Cho {retry_after}s...")
                    time.sleep(retry_after + 2)
                    continue

                resp.raise_for_status()
                data = xmltodict.parse(resp.text)

                # Kiem tra the loi trong XML OAI-PMH
                oai_root = data.get("OAI-PMH", {})
                if "error" in oai_root:
                    err = oai_root["error"]
                    err_msg = err.get("#text", str(err)) if isinstance(err, dict) else str(err)
                    if isinstance(err, dict) and err.get("@code") == "noRecordsMatch":
                        return {"records_raw": [], "resumption_token": None, "raw_xml": resp.text}
                    raise RuntimeError(f"Loi OAI-PMH tu arXiv: {err_msg}")

                list_records = oai_root.get("ListRecords", {})
                records_raw = list_records.get("record", [])
                if isinstance(records_raw, dict):
                    records_raw = [records_raw]

                # Lay resumptionToken cho trang ke tiep
                token_elem = list_records.get("resumptionToken")
                next_token = None
                if isinstance(token_elem, dict):
                    next_token = token_elem.get("#text")
                elif isinstance(token_elem, str):
                    next_token = token_elem.strip() if token_elem.strip() else None

                return {
                    "records_raw": records_raw,
                    "resumption_token": next_token,
                    "raw_xml": resp.text,
                }

            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                wait_sec = attempt * 8
                print(
                    f"[RETRY] Request loi ({e}). Thu lai lan {attempt}/{max_retries} sau {wait_sec}s..."
                )
                time.sleep(wait_sec)

        raise RuntimeError(f"Khong the lay du lieu OAI-PMH sau {max_retries} lan thu.")

    def harvest_large_corpus(
        self,
        total_target: int = 10000,
        batch_size: int = 100,
        categories: Optional[List[str]] = None,
        reset_checkpoint: bool = False,
        sync_silver_every_n_batches: int = 5,
        from_date: str = "2024-01-01",
    ) -> int:
        """Persist Bronze and Silver before advancing a resumable page cursor.

        batch_size controls Silver flush size; OAI controls the HTTP page size.
        A partially consumed page is replayed with its original request token.
        """
        from src.utils.hasher import compute_sha256

        if total_target < 1 or batch_size < 1 or sync_silver_every_n_batches < 1:
            raise ValueError("target, batch_size and sync interval must be positive")
        datetime.date.fromisoformat(from_date)
        target_cats: Set[str] = set(categories or settings.ARXIV_CATEGORIES)
        config = {"from_date": from_date, "categories": sorted(target_cats)}
        writer = SilverLakehouseWriter(r2_client=self.r2)
        checkpoint = {} if reset_checkpoint else self.load_checkpoint()
        if checkpoint.get("config") and checkpoint["config"] != config:
            raise ValueError(
                "Checkpoint filters differ; use a separate checkpoint or explicitly reset"
            )
        if checkpoint.get("page_num", 0) and "page_offset" not in checkpoint:
            raise ValueError("Legacy checkpoint cannot guarantee lossless resume; explicitly reset")
        token = checkpoint.get("resumption_token")
        page_num = checkpoint.get("page_num", 0)
        offset = checkpoint.get("page_offset", 0)
        total = checkpoint.get("total_ingested", 0)
        if checkpoint.get("exhausted"):
            return total

        while total < total_target:
            page = self.fetch_oai_page(resumption_token=token, set_spec="", from_date=from_date)
            page_signature = compute_sha256(
                json.dumps(page["records_raw"], sort_keys=True).encode()
            )
            if offset and checkpoint.get("page_signature") != page_signature:
                raise RuntimeError("Resumed page changed; cannot safely apply saved offset")
            raw_xml = page["raw_xml"]
            digest = compute_sha256(raw_xml.encode("utf-8"))
            raw_key = f"bronze/arxiv/oai/raw/{digest}.xml"
            if not self.r2.object_exists(raw_key):
                self.r2.upload_text(raw_xml, raw_key, content_type="application/xml")
            papers = []
            for raw in page["records_raw"]:
                paper = self.normalize_oai_record(raw)
                if paper and set(paper["categories"]).intersection(target_cats):
                    papers.append(paper)
            if offset > len(papers):
                raise RuntimeError("Resumed page changed; checkpoint offset is no longer valid")
            stop = min(len(papers), offset + total_target - total)
            flush_size = batch_size * sync_silver_every_n_batches
            while offset < stop:
                end = min(stop, offset + flush_size)
                rows = [writer.prepare_record(p, {}) for p in papers[offset:end]]
                writer.save_and_upload_parquet(rows)
                total += end - offset
                offset = end
                self.save_checkpoint(
                    token,
                    page_num,
                    total,
                    page_offset=offset,
                    config=config,
                    exhausted=False,
                    page_signature=page_signature,
                )
                print(f"[PROGRESS] Persisted {total}/{total_target} papers")
            if offset < len(papers):
                break
            token = page["resumption_token"]
            page_num += 1
            offset = 0
            checkpoint = {}
            self.save_checkpoint(
                token, page_num, total, page_offset=0, config=config, exhausted=not token
            )
            if not token:
                break
            if total < total_target:
                time.sleep(self.request_delay)
        return total

    def close(self):
        self.http_client.close()
