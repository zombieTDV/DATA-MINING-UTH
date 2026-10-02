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

    OAI_ENDPOINT = "https://export.arxiv.org/oai2"

    def __init__(
        self,
        r2_client: Optional[R2Client] = None,
        checkpoint_dir: Optional[Path] = None,
        request_delay: float = 10.0,
    ):
        self.r2 = r2_client or R2Client()
        self.request_delay = request_delay
        self.checkpoint_dir = checkpoint_dir or (settings.ROOT_DIR / "data" / "manifests")
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
            except Exception:
                pass
        return {
            "resumption_token": None,
            "page_num": 0,
            "total_ingested": 0,
            "last_updated": None,
        }

    def save_checkpoint(self, resumption_token: Optional[str], page_num: int, total_ingested: int):
        """Luu lai tien do kem resumptionToken de tiep tuc neu gap su co mang."""
        checkpoint_data = {
            "resumption_token": resumption_token,
            "page_num": page_num,
            "total_ingested": total_ingested,
            "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        with open(self.checkpoint_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint_data, f, indent=2)

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
                "set": set_spec,
                "from": from_date,
            }

        for attempt in range(1, max_retries + 1):
            try:
                resp = self.http_client.get(self.OAI_ENDPOINT, params=params)

                # arXiv OAI-PMH su dung 503 khi can thoi gian tao token tiep theo
                if resp.status_code == 503:
                    retry_after = int(resp.headers.get("Retry-After", 15))
                    print(f"[RETRY_AFTER] arXiv OAI-PMH dang chuan bi trang tiep theo. Cho {retry_after}s...")
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
                }

            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                wait_sec = attempt * 8
                print(f"[RETRY] Request loi ({e}). Thu lai lan {attempt}/{max_retries} sau {wait_sec}s...")
                time.sleep(wait_sec)

        raise RuntimeError(f"Khong the lay du lieu OAI-PMH sau {max_retries} lan thu.")

    def harvest_large_corpus(
        self,
        total_target: int = 10000,
        batch_size: int = 100,  # Giu tuong thich interface CLI
        categories: Optional[List[str]] = None,
        reset_checkpoint: bool = False,
        sync_silver_every_n_batches: int = 5,
        from_date: str = "2024-01-01",
    ) -> int:
        """Thu thap du lieu quy mo lon su dung arXiv OAI-PMH va luu vao Lakehouse."""
        # Chuyen muc AI/DS muc tieu
        target_cats: Set[str] = set(categories or settings.ARXIV_CATEGORIES)
        # Mo rong them cac category thuoc mien AI/DS lien quan
        target_cats.update({"cs.AI", "cs.LG", "cs.CV", "cs.CL", "stat.ML", "cs.NE", "cs.IR", "cs.RO"})

        writer = SilverLakehouseWriter(r2_client=self.r2)

        checkpoint = (
            {"resumption_token": None, "page_num": 0, "total_ingested": 0}
            if reset_checkpoint
            else self.load_checkpoint()
        )
        resumption_token = checkpoint.get("resumption_token")
        page_num = checkpoint.get("page_num", 0)
        total_ingested = checkpoint.get("total_ingested", 0)

        print("-" * 80)
        print("[CONFIG] Giao thuc: arXiv OAI-PMH Bulk Harvesting (export.arxiv.org/oai2)")
        print(f"[CONFIG] Muc tieu tong: {total_target:,} bai bao")
        print(f"[CONFIG] Bo loc chuyen muc AI/DS: {', '.join(sorted(target_cats))}")
        print(f"[CONFIG] Thoi gian nghi giua cac trang OAI: {self.request_delay}s")
        if total_ingested > 0 and resumption_token:
            print(f"[RESUME] Tiep tuc tu Checkpoint: Da co={total_ingested:,} bai (Trang={page_num})")
        else:
            print(f"[START] Bat dau phien cào moi tu ngay {from_date}")
        print("-" * 80)

        buffered_silver_records = []

        while total_ingested < total_target:
            page_num += 1
            print(f"\n[PAGE] Dang lay du lieu Trang {page_num} tu arXiv OAI-PMH...")

            try:
                page_data = self.fetch_oai_page(
                    resumption_token=resumption_token,
                    set_spec="cs",
                    from_date=from_date,
                )
            except Exception as e:
                print(f"[ERROR] Dung tien trinh do loi ket noi OAI-PMH: {e}")
                break

            records_raw = page_data.get("records_raw", [])
            resumption_token = page_data.get("resumption_token")

            if not records_raw:
                print("[INFO] Khong con ban ghi nao trong phan hoi OAI-PMH.")
                break

            print(f"[BATCH] Trang {page_num} tra ve {len(records_raw):,} ban ghi tu arXiv.")

            # Chuan hoa va loc cac bai bao thuoc mien AI/DS
            parsed_papers = []
            for r in records_raw:
                p = self.normalize_oai_record(r)
                if not p:
                    continue

                # Loc theo chuyen muc AI/DS
                paper_cats = set(p.get("categories", []))
                if not paper_cats.intersection(target_cats):
                    continue

                parsed_papers.append(p)

            print(f"[FILTER] Giu lai {len(parsed_papers):,} bai bao thuoc mien AI/DS tu trang nay.")

            # 1. Luu goi batch JSON vao R2 Bronze
            batch_key = f"bronze/arxiv/batches/oai/batch_page_{page_num:04d}.json"
            try:
                self.r2.upload_json(
                    payload={
                        "protocol": "oai-pmh",
                        "page": page_num,
                        "count": len(parsed_papers),
                        "papers": parsed_papers,
                    },
                    key=batch_key,
                    metadata={"page": str(page_num), "count": str(len(parsed_papers))},
                )
            except Exception as e:
                print(f"[WARNING] Loi upload R2 Bronze bundle: {e}")

            # 2. Log chi tiet tung bai bao va chuan bi ban ghi cho Silver
            for p in parsed_papers:
                if total_ingested >= total_target:
                    break

                total_ingested += 1
                paper_id = p["paper_id"]
                title = p["title"]
                authors_list = p.get("authors", [])
                authors_str = ", ".join(authors_list[:4])
                if len(authors_list) > 4:
                    authors_str += f" va {len(authors_list) - 4} tac gia khac"
                pub_date = p.get("published_date", "")[:10]
                abstract_snippet = (
                    p.get("abstract", "")[:130] + "..."
                    if len(p.get("abstract", "")) > 130
                    else p.get("abstract", "")
                )

                # In chi tiet thong tin tung bai bao (khong dung icon)
                print(f"  [PAPER {total_ingested:,}/{total_target:,}] ID: {paper_id} | Chuyen muc: {p.get('primary_category')} | Ngay: {pub_date}")
                print(f"    Tieu de: {title}")
                print(f"    Tac gia: {authors_str if authors_str else 'N/A'}")
                print(f"    Tom tat: {abstract_snippet}")

                # Chuan bi cau truc ban ghi Silver
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

            # Luu Checkpoint
            self.save_checkpoint(resumption_token, page_num, total_ingested)
            pct = (total_ingested / total_target) * 100
            print(f"[TIEN DO] Da hoan thanh {total_ingested:,}/{total_target:,} bai ({pct:.1f}%)\n")

            # Luu Silver Parquet dinh ky (cu moi >= 500 ban ghi hoac khi xong muc tieu)
            if len(buffered_silver_records) >= 500 or total_ingested >= total_target:
                print(f"[STORAGE] Luu {len(buffered_silver_records)} ban ghi vao Silver Parquet va dong bo R2...")
                writer.save_and_upload_parquet(buffered_silver_records, year="2026")
                buffered_silver_records = []
                print("[STORAGE] Hoan tat dong bo Tang Silver Parquet.\n")

            if not resumption_token:
                print("[INFO] Da thu thap het toan bo danh muc tu arXiv OAI-PMH.")
                break

            # Nghi giua cac trang OAI theo khuyen nghi cua arXiv
            if total_ingested < total_target:
                print(f"[WAIT] Nghi {self.request_delay}s de arXiv khoi tao trang tiep theo...")
                time.sleep(self.request_delay)

        # Ghi not so ban ghi con lai vao Silver Parquet neu con
        if buffered_silver_records:
            print(f"[STORAGE] Ghi not {len(buffered_silver_records)} ban ghi vao Silver Parquet...")
            writer.save_and_upload_parquet(buffered_silver_records, year="2026")

        print("=" * 80)
        print(f"[HOAN TAT] Thu thap thanh cong tong cong {total_ingested:,} bai bao vao Bronze & Silver.")
        print("=" * 80)
        return total_ingested
