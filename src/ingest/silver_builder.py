"""src/ingest/silver_builder.py — Silver Parquet Layer Transformer."""
from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger("SilverBuilder")


class SilverBuilder:
    """
    Transforms Bronze-layer paper records and manifest into structured,
    normalized, and columnar Silver Parquet tables.
    """

    def __init__(self, silver_dir: Path | str = "data/silver"):
        self.silver_dir = Path(silver_dir)
        self.silver_dir.mkdir(parents=True, exist_ok=True)
        self.papers_file = self.silver_dir / "papers.parquet"
        self.citations_file = self.silver_dir / "citations.parquet"
        self.keywords_file = self.silver_dir / "keywords.parquet"

    def build_silver_tables(
        self,
        works: list[dict[str, Any]],
        manifest_records: list[dict[str, Any]] | None = None
    ) -> dict[str, Path]:
        """
        Build and save papers.parquet, citations.parquet, and keywords.parquet.

        Args:
            works: Normalized work items from OpenAlexClient.
            manifest_records: Optional list of manifest dicts from BronzeVault.
        """
        if not works:
            logger.warning("No works provided to build Silver tables.")
            return {}

        now_utc = datetime.now(timezone.utc).isoformat()

        # Build lookup for manifest info by paper_id
        manifest_lookup: dict[str, dict[str, Any]] = {}
        if manifest_records:
            for rec in manifest_records:
                pid = rec.get("paper_id")
                if pid:
                    manifest_lookup[pid] = rec

        # Collect corpus IDs for determining internal vs external citation edges
        corpus_paper_ids = {w["paper_id"] for w in works}
        corpus_openalex_ids = {w["openalex_id"] for w in works if w.get("openalex_id")}

        papers_rows: list[dict[str, Any]] = []
        citations_rows: list[dict[str, Any]] = []
        keywords_rows: list[dict[str, Any]] = []

        for w in works:
            paper_id = w["paper_id"]
            man_info = manifest_lookup.get(paper_id, {})

            has_pdf = (man_info.get("status") == "VAULTED") or bool(man_info.get("sha256_checksum"))
            local_pdf_path = man_info.get("local_path") or ""
            raw_sha256 = man_info.get("sha256_checksum") or ""

            # Extract simplified keyword strings
            kw_list = [k["keyword"] if isinstance(k, dict) else str(k) for k in w.get("keywords", [])]

            papers_rows.append({
                "paper_id": paper_id,
                "openalex_id": w.get("openalex_id", ""),
                "title": w.get("title", ""),
                "abstract": w.get("abstract", ""),
                "year": int(w.get("year") or 0),
                "publication_date": w.get("publication_date", ""),
                "venue": w.get("venue", ""),
                "doi": w.get("doi", ""),
                "arxiv_id": w.get("arxiv_id", ""),
                "authors": w.get("authors", []),
                "citation_count": int(w.get("citation_count") or 0),
                "topics": w.get("topics", []),
                "keywords": kw_list,
                "has_pdf": has_pdf,
                "local_pdf_path": local_pdf_path,
                "raw_sha256": raw_sha256,
                "ingested_at_utc": now_utc,
            })

            # Citations: outgoing referenced works
            for ref_id in w.get("referenced_works", []):
                clean_ref = ref_id.split("/")[-1]
                target_paper_id = f"openalex:{clean_ref}"
                is_internal = (target_paper_id in corpus_paper_ids) or (clean_ref in corpus_openalex_ids)
                citations_rows.append({
                    "citing_paper_id": paper_id,
                    "cited_paper_id": target_paper_id,
                    "is_internal": is_internal,
                })

            # Keywords: exploded table
            for kw in w.get("keywords", []):
                if isinstance(kw, dict):
                    name = kw.get("keyword")
                    score = float(kw.get("score", 1.0))
                else:
                    name = str(kw)
                    score = 1.0

                if name:
                    keywords_rows.append({
                        "paper_id": paper_id,
                        "keyword": name,
                        "score": score,
                        "year": int(w.get("year") or 0),
                    })

        # Convert to DataFrames and save
        papers_df = pd.DataFrame(papers_rows)
        # Deduplicate papers by paper_id
        papers_df = papers_df.drop_duplicates(subset=["paper_id"], keep="last")
        papers_df.to_parquet(self.papers_file, index=False)
        logger.info("Saved %d papers to %s", len(papers_df), self.papers_file)

        citations_df = pd.DataFrame(citations_rows) if citations_rows else pd.DataFrame(columns=["citing_paper_id", "cited_paper_id", "is_internal"])
        citations_df.to_parquet(self.citations_file, index=False)
        internal_count = citations_df["is_internal"].sum() if not citations_df.empty else 0
        logger.info("Saved %d citation edges (%d internal) to %s", len(citations_df), internal_count, self.citations_file)

        keywords_df = pd.DataFrame(keywords_rows) if keywords_rows else pd.DataFrame(columns=["paper_id", "keyword", "score", "year"])
        keywords_df.to_parquet(self.keywords_file, index=False)
        logger.info("Saved %d keyword associations to %s", len(keywords_df), self.keywords_file)

        return {
            "papers": self.papers_file,
            "citations": self.citations_file,
            "keywords": self.keywords_file,
        }
