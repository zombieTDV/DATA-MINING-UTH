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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("HarvestCLI")


def run_harvest(
    start_year: int = 2017,
    end_year: int = 2026,
    per_year_limit: int = 25,
    skip_pdf: bool = False,
    overwrite_pdf: bool = False,
    bronze_dir: str = "data/bronze",
    silver_dir: str = "data/silver",
) -> dict[str, int]:
    """Execute complete harvesting workflow."""
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    logger.info("Starting OpenAlex harvesting workflow (years: %d-%d, target/yr: %d)...", start_year, end_year, per_year_limit)

    # 1. Initialize components
    client = OpenAlexClient()
    vault = BronzeVault(bronze_dir=bronze_dir)
    downloader = PDFDownloader(target_dir=Path(bronze_dir) / "pdf_raw")
    builder = SilverBuilder(silver_dir=silver_dir)

    # 2. Query OpenAlex API
    works = client.fetch_llm_papers_stratified(
        start_year=start_year,
        end_year=end_year,
        per_year_limit=per_year_limit
    )

    if not works:
        logger.warning("No papers retrieved from OpenAlex.")
        return {"total_papers": 0, "vaulted_pdfs": 0}

    logger.info("Retrieved %d unique candidate papers across %d-%d", len(works), start_year, end_year)

    # 3. Save raw Bronze JSON
    vault.save_raw_batch(works, batch_id=f"harvest_{timestamp_str}")

    # 4. Process PDFs & Mint Manifests
    manifest_records: list[dict] = []
    vaulted_pdfs = 0
    paywalled_count = 0

    logger.info("Processing PDF vaulting (skip_pdf=%s)...", skip_pdf)
    for i, w in enumerate(works, start=1):
        paper_id = w["paper_id"]
        pdf_url = w.get("pdf_url")

        if skip_pdf:
            safe_name = paper_id.replace(":", "_").replace("/", "_") + ".pdf"
            local_file = Path(bronze_dir) / "pdf_raw" / safe_name
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
            overwrite=overwrite_pdf
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
    print(f" Target Years          : {start_year} – {end_year}")
    print(f" PDFs Vaulted (Bronze) : {vaulted_pdfs} (SHA-256 verified)")
    print(f" Metadata-Only Papers  : {paywalled_count} (graceful fallback)")
    print(f" Manifest Path         : {vault.manifest_file}")
    print(f" Silver Papers Parquet : {silver_paths.get('papers')}")
    print(f" Silver Citations      : {silver_paths.get('citations')}")
    print(f" Silver Keywords       : {silver_paths.get('keywords')}")
    print("=" * 65 + "\n")

    return {
        "total_papers": len(works),
        "vaulted_pdfs": vaulted_pdfs,
        "paywalled_count": paywalled_count,
    }


def main():
    parser = argparse.ArgumentParser(description="Harvest LLM research papers from OpenAlex into Bronze and Silver layers.")
    parser.add_argument("--pilot", action="store_true", help="Run standard 200-paper pilot (2017-2026, ~20-25 papers/year)")
    parser.add_argument("--start-year", type=int, default=2017, help="Start publication year (default: 2017)")
    parser.add_argument("--end-year", type=int, default=2026, help="End publication year (default: 2026)")
    parser.add_argument("--limit", type=int, default=None, help="Total paper limit across all queried years")
    parser.add_argument("--per-year", type=int, default=25, help="Target papers per year (default: 25)")
    parser.add_argument("--skip-pdf", action="store_true", help="Skip downloading full PDF binaries (metadata-only mode)")
    parser.add_argument("--overwrite-pdf", action="store_true", help="Force overwrite of existing vaulted PDFs")
    parser.add_argument("--bronze-dir", type=str, default="data/bronze", help="Bronze storage root")
    parser.add_argument("--silver-dir", type=str, default="data/silver", help="Silver storage root")

    args = parser.parse_args()

    if args.pilot:
        start_year = 2017
        end_year = 2026
        per_year = 22  # ~220 papers across 10 years
    elif args.limit:
        num_years = max(1, args.end_year - args.start_year + 1)
        per_year = max(1, args.limit // num_years)
        start_year = args.start_year
        end_year = args.end_year
    else:
        start_year = args.start_year
        end_year = args.end_year
        per_year = args.per_year

    run_harvest(
        start_year=start_year,
        end_year=end_year,
        per_year_limit=per_year,
        skip_pdf=args.skip_pdf,
        overwrite_pdf=args.overwrite_pdf,
        bronze_dir=args.bronze_dir,
        silver_dir=args.silver_dir,
    )


if __name__ == "__main__":
    main()
