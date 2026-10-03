"""Silver Layer Lakehouse Writer.

Transforms parsed paper structures into columnar Apache Parquet format
with zstd compression and uploads to Cloudflare R2 Silver Zone.
"""

import datetime
import json
import re
from email.utils import parsedate_to_datetime
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from src.config.settings import settings
from src.storage.r2_client import R2Client
from src.utils.hasher import compute_sha256


class SilverLakehouseWriter:
    """Manages the creation, schema validation, and upload of Silver Parquet datasets."""

    def __init__(
        self,
        r2_client: Optional[R2Client] = None,
        local_silver_dir: Optional[Path] = None,
        local_only: bool = False,
    ):
        self.r2 = None if local_only else (r2_client or R2Client())
        self.local_dir = Path(local_silver_dir or settings.SILVER_DIR).resolve()
        self.local_dir.mkdir(parents=True, exist_ok=True)

    def prepare_record(
        self, raw_meta: Dict[str, Any], parsed_html: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Gộp metadata thô và kết quả bóc tách HTML thành 1 bản ghi Silver chuẩn hóa."""
        paper_id = raw_meta.get("paper_id", "")
        title = parsed_html.get("parsed_title") or raw_meta.get("title", "")
        abstract = parsed_html.get("parsed_abstract") or raw_meta.get("abstract", "")
        abstract = re.sub(
            r"^arXiv:\S+\s+Announce Type:.*?\s+Abstract:\s*", "", abstract, flags=re.DOTALL
        )
        published_date = str(raw_meta.get("published_date", ""))
        if published_date:
            try:
                datetime.datetime.fromisoformat(published_date.replace("Z", "+00:00"))
            except ValueError:
                try:
                    published_date = parsedate_to_datetime(published_date).isoformat()
                except (TypeError, ValueError):
                    pass
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
            "doi": str(raw_meta.get("doi") or ""),
            "journal_ref": str(raw_meta.get("journal_ref") or ""),
            "title": str(title),
            "abstract": str(abstract),
            "authors": [str(a) for a in raw_meta.get("authors", [])],
            "categories": [str(c) for c in categories],
            "primary_category": str(primary_cat),
            "published_date": published_date,
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
        year: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Chuyển đổi danh sách bản ghi thành Parquet nén zstd và tải lên R2 Silver."""
        if not records:
            return {"status": "NO_RECORDS", "count": 0}

        if any(not r.get("paper_id") for r in records):
            raise ValueError("Every Silver record must have paper_id")
        if year is None:
            # Keep existing IDs in their original partition, including legacy
            # datasets written with a fixed year. Repartitioning is a separate migration.
            locations = {}
            for path in self.local_dir.glob("year=*/papers.parquet"):
                partition = path.parent.name.removeprefix("year=")
                ids = pq.ParquetFile(path).read(columns=["paper_id"]).column("paper_id").to_pylist()
                for paper_id in ids:
                    if paper_id in locations and locations[paper_id] != partition:
                        raise ValueError(
                            "Duplicate paper_id across Silver partitions; reconcile before upsert"
                        )
                    locations[paper_id] = partition
            partitions = {}
            for record in records:
                published = str(record.get("published_date", ""))[:10]
                try:
                    partition = str(datetime.date.fromisoformat(published).year)
                except ValueError:
                    partition = "unknown"
                partition = locations.get(record["paper_id"], partition)
                partitions.setdefault(partition, []).append(record)
            results = [
                self.save_and_upload_parquet(rows, year=key) for key, rows in partitions.items()
            ]
            if len(results) == 1:
                return results[0]
            return {
                "status": "SUCCESS",
                "count": sum(r["count"] for r in results),
                "partitions": results,
            }
        if year != "unknown" and (len(year) != 4 or not year.isdigit()):
            raise ValueError("year must be four digits or unknown")
        df = pd.DataFrame(records).drop_duplicates(subset=["paper_id"], keep="last")

        # Định nghĩa PyArrow Schema chuẩn
        schema = pa.schema(
            [
                ("paper_id", pa.string()),
                ("doi", pa.string()),
                ("journal_ref", pa.string()),
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
            existing_table = pq.ParquetFile(local_parquet_path).read()
            existing_df = existing_table.to_pandas()
            previous = existing_df.drop_duplicates("paper_id", keep="last").set_index("paper_id")
            extra_fields = [
                field for field in existing_table.schema if field.name not in schema.names
            ]
            schema = pa.schema(list(schema) + extra_fields)
            # Do not discard enrichment columns absent from an incoming metadata-only record.
            for field in extra_fields:
                if field.name not in df:
                    df[field.name] = df["paper_id"].map(previous[field.name])
            for field in ("doi", "journal_ref"):
                if field in previous:
                    missing = df[field].isna() | df[field].eq("")
                    df.loc[missing, field] = df.loc[missing, "paper_id"].map(previous[field])
            if "sections_json" in previous:
                metadata_only = df["sections_json"].eq("[]") & df["paper_id"].isin(previous.index)
                enriched = df["paper_id"].map(previous["sections_json"]).fillna("[]").ne("[]")
                keep_content = metadata_only & enriched
                for field in (
                    "sections_json",
                    "clean_full_text",
                    "total_sections",
                    "total_math_count",
                    "total_words",
                ):
                    df.loc[keep_content, field] = df.loc[keep_content, "paper_id"].map(
                        previous[field]
                    )
            combined_df = pd.concat([existing_df, df], ignore_index=True)
            combined_df = combined_df.drop_duplicates(subset=["paper_id"], keep="last")
            table = pa.Table.from_pandas(combined_df, schema=schema, preserve_index=False)

        temporary = year_dir / f".papers-{uuid.uuid4().hex}.tmp"
        try:
            pq.write_table(table, temporary, compression="zstd")
            os.replace(temporary, local_parquet_path)
        finally:
            temporary.unlink(missing_ok=True)

        # Tải lên Cloudflare R2 Silver Zone
        r2_key = f"silver/papers/year={year}/papers.parquet"
        res = (
            self.r2.upload_file(
                file_path=local_parquet_path,
                key=r2_key,
                content_type="application/vnd.apache.parquet",
            )
            if self.r2
            else {
                "uri": local_parquet_path.as_uri(),
                "size_bytes": local_parquet_path.stat().st_size,
                "sha256": compute_sha256(local_parquet_path),
            }
        )

        return {
            "status": "SUCCESS",
            "count": len(table),
            "local_path": str(local_parquet_path),
            "r2_uri": res["uri"],
            "size_bytes": res["size_bytes"],
            "sha256": res["sha256"],
        }
