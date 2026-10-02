"""CLI Entry point for Batch Ingestion of 10,000+ scientific papers.

Usage:
    python -m src.pipelines.run_batch_ingest --target 10000 --batch-size 100 --delay 6.0
"""

import argparse
import sys
import time
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import settings
from src.ingestion.arxiv_batch_harvester import ArxivBatchHarvester
from src.storage.duckdb_engine import DuckDBEngine
from src.storage.r2_client import R2Client
from src.utils.logger import setup_pipeline_logging


def main():
    parser = argparse.ArgumentParser(
        description="Phase 1: Scale up to 10,000+ arXiv preprints into Bronze & Silver Lakehouse."
    )
    parser.add_argument(
        "--target",
        type=int,
        default=10000,
        help="Tong so bai bao muc tieu can thu thap (mac dinh: 10,000 bai).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="So luong bai bao trong moi request API (mac dinh: 100).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=10.0,
        help="Thoi gian nghi (giay) giua cac trang OAI-PMH (mac dinh: 10.0s).",
    )
    parser.add_argument(
        "--from-date",
        type=str,
        default="2024-01-01",
        help="Moc thoi gian bat dau lay bai bao (mac dinh: 2024-01-01).",
    )
    parser.add_argument(
        "--reset-checkpoint",
        action="store_true",
        help="Bo qua checkpoint cu va bat dau cao moi.",
    )
    args = parser.parse_args()

    # Khoi tao log file theo timestamp dat tai logs/
    logger, log_file = setup_pipeline_logging(pipeline_name="batch_ingest")

    print("=" * 80)
    print("[PIPELINE] BAT DAU PHASE 1: THU THAP BATCH QUY MO LON (ARXIV OAI-PMH -> BRONZE & SILVER LAKEHOUSE)")
    print(f"[LOG_FILE] Nhat ky chi tiet: {log_file}")
    print("=" * 80)

    try:
        r2 = R2Client()
        harvester = ArxivBatchHarvester(r2_client=r2, request_delay=args.delay)
    except Exception as e:
        print(f"[ERROR] Loi khoi tao R2 Client: {e}")
        sys.exit(1)

    start_time = time.time()

    # Kich hoat qua trinh harvest
    total_done = harvester.harvest_large_corpus(
        total_target=args.target,
        batch_size=args.batch_size,
        reset_checkpoint=args.reset_checkpoint,
        from_date=args.from_date,
    )

    duration = time.time() - start_time
    print("\n" + "=" * 80)
    print("[SUMMARY] TONG KET PHASE 1:")
    print(f"   - Tong so bai da nap vao Silver: {total_done:,} bai")
    print(f"   - Thoi gian thuc thi: {duration/60:.2f} phut ({duration:.1f} giay)")
    print("=" * 80)

    # Hien thi thong ke nhanh bang DuckDB
    print("\n[ANALYTICS] Thong ke phan bo du lieu Tang Silver bang DuckDB:")
    try:
        engine = DuckDBEngine()
        df = engine.query_df("""
            SELECT 
                primary_category,
                count(*) as total_papers,
                min(published_date) as earliest_date,
                max(published_date) as latest_date,
                round(avg(total_words), 1) as avg_abstract_words
            FROM 'data/silver/**/*.parquet'
            GROUP BY 1
            ORDER BY total_papers DESC
        """)
        from tabulate import tabulate
        print(tabulate(df, headers="keys", tablefmt="pipe", showindex=False))
    except Exception as e:
        print(f"[ERROR] Khong the chay thong ke DuckDB: {e}")


if __name__ == "__main__":
    main()
