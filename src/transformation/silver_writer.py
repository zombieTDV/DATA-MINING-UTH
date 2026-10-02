"""Silver Layer Lakehouse Writer.

Transforms parsed paper structures into columnar Apache Parquet format
with zstd compression and uploads to Cloudflare R2 Silver Zone.
"""

import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from src.config.settings import settings
from src.storage.r2_client import R2Client


class SilverLakehouseWriter:
    """Manages the creation, schema validation, and upload of Silver Parquet datasets."""

    def __init__(self, r2_client: Optional[R2Client] = None, local_silver_dir: Optional[Path] = None):
        self.r2 = r2_client or R2Client()
        self.local_dir = local_silver_dir or (settings.ROOT_DIR / "data" / "silver")
        self.local_dir.mkdir(parents=True, exist_ok=True)

    def prepare_record(self, raw_meta: Dict[str, Any], parsed_html: Dict[str, Any]) -> Dict[str, Any]:
        """Gộp metadata thô và kết quả bóc tách HTML thành 1 bản ghi Silver chuẩn hóa."""
        paper_id = raw_meta.get("paper_id", "")
        title = parsed_html.get("parsed_title") or raw_meta.get("title", "")
        abstract = parsed_html.get("parsed_abstract") or raw_meta.get("abstract", "")
        sections = parsed_html.get("sections", [])

        # Ghép toàn bộ nội dung các mục thành một văn bản liên tục có cấu trúc
        full_text_parts = [f"Title: {title}", f"Abstract: {abstract}"]
        for s in sections:
            full_text_parts.append(f"\n## {s['section_title']}\n{s['content']}")
        clean_full_text = "\n\n".join(full_text_parts)

        categories = raw_meta.get("categories", [])
        primary_cat = categories[0] if categories else "unknown"

        return {
            "paper_id": str(paper_id),
            "title": str(title),
            "abstract": str(abstract),
            "authors": [str(a) for a in raw_meta.get("authors", [])],
            "categories": [str(c) for c in categories],
            "primary_category": str(primary_cat),
            "published_date": str(raw_meta.get("published_date", "")),
            "crawled_at": str(raw_meta.get("crawled_at", "")),
            "pdf_url": str(raw_meta.get("pdf_url", "")),
            "html_url": str(raw_meta.get("html_url", "")),
            "total_sections": int(parsed_html.get("total_sections", len(sections))),
            "total_math_count": int(parsed_html.get("total_math_count", 0)),
            "total_words": int(parsed_html.get("total_words", len(clean_full_text.split()))),
            "sections_json": json.dumps(sections, ensure_ascii=False),
            "clean_full_text": clean_full_text,
            "transformed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    def save_and_upload_parquet(
        self,
        records: List[Dict[str, Any]],
        year: str = "2026",
    ) -> Dict[str, Any]:
        """Chuyển đổi danh sách bản ghi thành Parquet nén zstd và tải lên R2 Silver."""
        if not records:
            return {"status": "NO_RECORDS", "count": 0}

        df = pd.DataFrame(records)

        # Định nghĩa PyArrow Schema chuẩn
        schema = pa.schema(
            [
                ("paper_id", pa.string()),
                ("title", pa.string()),
                ("abstract", pa.string()),
                ("authors", pa.list_(pa.string())),
                ("categories", pa.list_(pa.string())),
                ("primary_category", pa.string()),
                ("published_date", pa.string()),
                ("crawled_at", pa.string()),
                ("pdf_url", pa.string()),
                ("html_url", pa.string()),
                ("total_sections", pa.int64()),
                ("total_math_count", pa.int64()),
                ("total_words", pa.int64()),
                ("sections_json", pa.string()),
                ("clean_full_text", pa.string()),
                ("transformed_at", pa.string()),
            ]
        )

        table = pa.Table.from_pandas(df, schema=schema, preserve_index=False)

        # Lưu file local
        year_dir = self.local_dir / f"year={year}"
        year_dir.mkdir(parents=True, exist_ok=True)
        local_parquet_path = year_dir / "papers.parquet"

        # Nếu file đã tồn tại cục bộ, hợp nhất (idempotent upsert by paper_id)
        if local_parquet_path.exists():
            existing_table = pq.read_table(local_parquet_path)
            existing_df = existing_table.to_pandas()
            combined_df = pd.concat([existing_df, df], ignore_index=True)
            combined_df = combined_df.drop_duplicates(subset=["paper_id"], keep="last")
            table = pa.Table.from_pandas(combined_df, schema=schema, preserve_index=False)

        pq.write_table(table, local_parquet_path, compression="zstd")

        # Tải lên Cloudflare R2 Silver Zone
        r2_key = f"silver/papers/year={year}/papers.parquet"
        res = self.r2.upload_file(
            file_path=local_parquet_path,
            key=r2_key,
            content_type="application/vnd.apache.parquet",
        )

        return {
            "status": "SUCCESS",
            "count": len(table),
            "local_path": str(local_parquet_path),
            "r2_uri": res["uri"],
            "size_bytes": res["size_bytes"],
            "sha256": res["sha256"],
        }
