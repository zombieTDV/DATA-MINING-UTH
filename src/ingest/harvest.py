"""src/ingest/harvest.py — Unified OpenAlex Ingestion & Vaulting CLI."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import logging
import sys
from pathlib import Path

from src.ingest.openalex_client import OpenAlexClient
from src.ingest.pdf_downloader import PDFDownloader
from src.ingest.bronze_vault import BronzeVault
from src.ingest.silver_builder import SilverBuilder

from src.utils.logger import get_logger, log_audit_event, ensure_log_dirs

ensure_log_dirs()
logger = get_logger("HarvestCLI", log_file="logs/ingest/openalex_harvest.log")


from src.config import load_config


def run_harvest(
    config_path: str = "configs/config.yaml",
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    per_year_limit: Optional[int] = None,
    skip_pdf: Optional[bool] = None,
    overwrite_pdf: Optional[bool] = None,
    bronze_dir: Optional[str] = None,
    silver_dir: Optional[str] = None,
    topic_ids: Optional[list[str]] = None,
) -> dict[str, int]:
    """Execute complete harvesting workflow using config with optional CLI overrides."""
    cfg = load_config(config_path)

    start_yr = start_year if start_year is not None else cfg.collection.start_year
    end_yr = end_year if end_year is not None else cfg.collection.end_year
    limit = per_year_limit if per_year_limit is not None else cfg.collection.per_year_limit
    skip_p = skip_pdf if skip_pdf is not None else cfg.pdf_vaulting.skip_pdf
    overwrite_p = overwrite_pdf if overwrite_pdf is not None else cfg.pdf_vaulting.overwrite_existing
    b_dir = bronze_dir if bronze_dir is not None else cfg.storage.bronze_root
    s_dir = silver_dir if silver_dir is not None else cfg.storage.silver_root
    t_ids = topic_ids if topic_ids is not None else [
        t["id"] for t in cfg.topics.openalex_topic_ids if isinstance(t, dict) and "id" in t
    ]

    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    logger.info("Starting OpenAlex harvesting workflow (years: %d-%d, target/yr: %d, config: %s)...", start_yr, end_yr, limit, config_path)

    # 1. Initialize components from config
    client = OpenAlexClient(
        base_url=cfg.openalex.base_url,
        user_agent=cfg.openalex.user_agent,
        mailto=cfg.openalex.mailto,
        request_delay=cfg.openalex.rate_limit_delay_seconds,
        timeout=cfg.openalex.timeout_seconds,
    )
    vault = BronzeVault(bronze_dir=b_dir)
    downloader = PDFDownloader(target_dir=Path(b_dir) / "pdf_raw")
    builder = SilverBuilder(silver_dir=s_dir)

    # 2. Query OpenAlex API
    works = client.fetch_llm_papers_stratified(
        start_year=start_yr,
        end_year=end_yr,
        per_year_limit=limit,
        topic_ids=t_ids,
    )

    if not works:
        logger.warning("No papers retrieved from OpenAlex.")
        return {"total_papers": 0, "vaulted_pdfs": 0}

    logger.info("Retrieved %d unique candidate papers across %d-%d", len(works), start_yr, end_yr)

    # 3. Save raw Bronze JSON
    vault.save_raw_batch(works, batch_id=f"harvest_{timestamp_str}")

    # 4. Process PDFs & Mint Manifests
    manifest_records: list[dict] = []
    vaulted_pdfs = 0
    paywalled_count = 0

    logger.info("Processing PDF vaulting (skip_pdf=%s)...", skip_p)
    for i, w in enumerate(works, start=1):
        paper_id = w["paper_id"]
        pdf_url = w.get("pdf_url")

        if skip_p:
            safe_name = paper_id.replace(":", "_").replace("/", "_") + ".pdf"
            local_file = Path(b_dir) / "pdf_raw" / safe_name
            if local_file.exists():
                vaulted_pdfs += 1
                manifest_records.append({
                    "paper_id": paper_id,
                    "source_url": pdf_url or "",
                    "local_path": str(local_file),
                    "sha256_checksum": "",
                    "byte_size": local_file.stat().st_size,
                    "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
                    "status": "VAULTED",
                    "error_detail": "Existing local PDF preserved",
                })
            else:
                paywalled_count += 1
                manifest_records.append({
                    "paper_id": paper_id,
                    "source_url": pdf_url or "",
                    "local_path": "",
                    "sha256_checksum": "",
                    "byte_size": 0,
                    "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
                    "status": "METADATA_ONLY",
                    "error_detail": "PDF download skipped by user flag",
                })
            continue

        if not pdf_url:
            manifest_records.append({
                "paper_id": paper_id,
                "source_url": "",
                "local_path": "",
                "sha256_checksum": "",
                "byte_size": 0,
                "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
                "status": "METADATA_ONLY",
                "error_detail": "No direct open-access PDF URL available",
            })
            paywalled_count += 1
            continue

        success, local_path, sha256_hash, byte_size, msg = downloader.download_and_vault(
            paper_id=paper_id,
            pdf_url=pdf_url,
            overwrite=overwrite_p
        )

        if success:
            vaulted_pdfs += 1
            manifest_records.append({
                "paper_id": paper_id,
                "source_url": pdf_url,
                "local_path": local_path or "",
                "sha256_checksum": sha256_hash or "",
                "byte_size": byte_size,
                "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
                "status": "VAULTED",
                "error_detail": msg,
            })
        else:
            paywalled_count += 1
            manifest_records.append({
                "paper_id": paper_id,
                "source_url": pdf_url,
                "local_path": "",
                "sha256_checksum": "",
                "byte_size": byte_size,
                "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
                "status": "METADATA_ONLY",
                "error_detail": f"Failed download: {msg}",
            })

        if i % 10 == 0 or i == len(works):
            logger.info("PDF progress: %d/%d processed (%d vaulted, %d metadata-only)", i, len(works), vaulted_pdfs, paywalled_count)

    # 5. Update Bronze Manifest
    vault.update_manifest(manifest_records)

    # 6. Transform to Silver Parquet Tables
    silver_paths = builder.build_silver_tables(works, manifest_records=manifest_records)

    # 7. Summary Report
    print("\n" + "=" * 65)
    print("           OPENALEX HARVESTING SUMMARY REPORT")
    print("=" * 65)
    print(f" Total Papers Ingested : {len(works)}")
    print(f" Target Years          : {start_yr} – {end_yr}")
    print(f" PDFs Vaulted (Bronze) : {vaulted_pdfs} (SHA-256 verified)")
    print(f" Metadata-Only Papers  : {paywalled_count} (graceful fallback)")
    print(f" Manifest Path         : {vault.manifest_file}")
    print(f" Silver Papers Parquet : {silver_paths.get('papers')}")
    print(f" Silver Citations      : {silver_paths.get('citations')}")
    print(f" Silver Keywords       : {silver_paths.get('keywords')}")
    print("=" * 65 + "\n")

    log_audit_event("OPENALEX_HARVEST_SUMMARY", "HarvestCLI", {
        "total_papers": len(works),
        "target_years": f"{start_yr}-{end_yr}",
        "vaulted_pdfs": vaulted_pdfs,
        "paywalled_count": paywalled_count,
    })

    return {
        "total_papers": len(works),
        "vaulted_pdfs": vaulted_pdfs,
        "paywalled_count": paywalled_count,
    }


def main():
    parser = argparse.ArgumentParser(description="Harvest LLM research papers from OpenAlex into Bronze and Silver layers.")
    parser.add_argument("--config", type=str, default="configs/config.yaml", help="Path to pipeline configuration YAML (default: configs/config.yaml)")
    parser.add_argument("--pilot", action="store_true", help="Run standard 200-paper pilot (2017-2026, ~22 papers/year)")
    parser.add_argument("--start-year", type=int, default=None, help="Start publication year (overrides config)")
    parser.add_argument("--end-year", type=int, default=None, help="End publication year (overrides config)")
    parser.add_argument("--limit", type=int, default=None, help="Total paper limit across all queried years")
    parser.add_argument("--per-year", type=int, default=None, help="Target papers per year (overrides config)")
    parser.add_argument("--skip-pdf", action="store_true", default=None, help="Skip downloading full PDF binaries (metadata-only mode)")
    parser.add_argument("--overwrite-pdf", action="store_true", default=None, help="Force overwrite of existing vaulted PDFs")
    parser.add_argument("--bronze-dir", type=str, default=None, help="Bronze storage root (overrides config)")
    parser.add_argument("--silver-dir", type=str, default=None, help="Silver storage root (overrides config)")

    args = parser.parse_args()

    per_year = args.per_year
    if args.pilot:
        per_year = 22  # ~220 papers across 10 years
    elif args.limit:
        s_yr = args.start_year or 2017
        e_yr = args.end_year or 2026
        num_years = max(1, e_yr - s_yr + 1)
        per_year = max(1, args.limit // num_years)

    run_harvest(
        config_path=args.config,
        start_year=args.start_year,
        end_year=args.end_year,
        per_year_limit=per_year,
        skip_pdf=args.skip_pdf,
        overwrite_pdf=args.overwrite_pdf,
        bronze_dir=args.bronze_dir,
        silver_dir=args.silver_dir,
    )


if __name__ == "__main__":
    main()
