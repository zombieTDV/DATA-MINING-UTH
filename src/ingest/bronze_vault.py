"""src/ingest/bronze_vault.py — Bronze Raw Data Vault & Provenance Manifest Manager."""
from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from pathlib import Path
from typing import Any, Optional

import pandas as pd

logger = logging.getLogger("BronzeVault")


class BronzeVault:
    """
    Manages Bronze-layer data assets:
    - Raw API JSON responses in `data/bronze/metadata_raw/`
    - Raw PDF binaries in `data/bronze/pdf_raw/`
    - Cryptographic provenance manifests in `data/bronze/manifest/manifest.parquet`
    """

    def __init__(self, bronze_dir: Path | str = "data/bronze"):
        self.bronze_dir = Path(bronze_dir)
        self.metadata_dir = self.bronze_dir / "metadata_raw"
        self.pdf_dir = self.bronze_dir / "pdf_raw"
        self.manifest_dir = self.bronze_dir / "manifest"

        for directory in (self.metadata_dir, self.pdf_dir, self.manifest_dir):
            directory.mkdir(parents=True, exist_ok=True)

        self.manifest_file = self.manifest_dir / "manifest.parquet"

    def save_raw_batch(self, works_data: list[dict[str, Any]], batch_id: str) -> Path:
        """Save raw JSON payload page directly to bronze metadata directory."""
        filename = f"batch_{batch_id}.json"
        target_path = self.metadata_dir / filename
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(works_data, f, ensure_ascii=False, indent=2)
        logger.info("Saved %d raw work items to %s", len(works_data), target_path)
        return target_path

    def update_manifest(self, records: list[dict[str, Any]]) -> Path:
        """
        Record or append entries to manifest.parquet.
        Schema:
            paper_id, source_url, local_path, sha256_checksum, byte_size,
            fetched_at_utc, status, error_detail
        """
        if not records:
            return self.manifest_file

        new_df = pd.DataFrame(records)
        # Ensure timestamp is set
        if "fetched_at_utc" not in new_df.columns:
            new_df["fetched_at_utc"] = datetime.now(timezone.utc).isoformat()

        if self.manifest_file.exists():
            try:
                existing_df = pd.read_parquet(self.manifest_file)
                combined = pd.concat([existing_df, new_df], ignore_index=True)
                # Deduplicate by paper_id, keeping the latest status
                combined = combined.drop_duplicates(subset=["paper_id"], keep="last")
            except Exception as err:
                logger.warning("Could not read existing manifest (%s), creating fresh manifest", err)
                combined = new_df
        else:
            combined = new_df

        combined.to_parquet(self.manifest_file, index=False)
        logger.info("Updated Bronze manifest with %d total records at %s", len(combined), self.manifest_file)
        return self.manifest_file

    def get_vaulted_paper_ids(self) -> set[str]:
        """Retrieve set of all paper_ids currently recorded in manifest."""
        if not self.manifest_file.exists():
            return set()
        try:
            df = pd.read_parquet(self.manifest_file, columns=["paper_id"])
            return set(df["paper_id"].dropna().tolist())
        except Exception:
            return set()
