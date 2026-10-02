"""CLI Entry point for Batch Ingestion of 10,000+ scientific papers.

Usage:
    # Bắt đầu cào hoặc tiếp tục từ checkpoint:
    python -m src.pipelines.run_batch_ingest --target 10000 --batch-size 100

    # Chạy thử 300 bài đầu tiên:
    python -m src.pipelines.run_batch_ingest --target 300 --batch-size 100

    # Bỏ qua checkpoint cũ và chạy lại từ đầu:
    python -m src.pipelines.run_batch_ingest --target 10000 --reset-checkpoint
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


def main():
    parser = argparse.ArgumentParser(
        description="Phase 1: Scale up to 10,000+ arXiv preprints (Metadata + Abstract) into Bronze & Silver Lakehouse."
    )
    parser.add_argument(
        "--target",
        type=int,
        default=10000,
        help="Tổng số bài báo mục tiêu cần thu thập (mặc định: 10,000 bài).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Số lượng bài báo trong mỗi request API (mặc định: 100, tối đa an toàn của arXiv).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=settings.ARXIV_REQUEST_DELAY_SECONDS,
        help=f"Thời gian nghỉ (giây) giữa các request API để tuân thủ rate limit (mặc định: {settings.ARXIV_REQUEST_DELAY_SECONDS}s).",
    )
    parser.add_argument(
        "--reset-checkpoint",
        action="store_true",
        help="Bỏ qua checkpoint cũ và bắt đầu cào mới từ offset 0.",
    )
    args = parser.parse_args()

    print("=" * 80)
    print("🚀 BẮT ĐẦU PHASE 1: THU THẬP BATCH QUY MÔ LỚN (ARXIV -> BRONZE & SILVER LAKEHOUSE)")
    print("=" * 80)

    try:
        r2 = R2Client()
        harvester = ArxivBatchHarvester(r2_client=r2, request_delay=args.delay)
    except Exception as e:
        print(f"❌ Lỗi khởi tạo R2 Client: {e}")
        sys.exit(1)

    start_time = time.time()

    # Kích hoạt quá trình harvest
    total_done = harvester.harvest_large_corpus(
        total_target=args.target,
        batch_size=args.batch_size,
        reset_checkpoint=args.reset_checkpoint,
        sync_silver_every_n_batches=5,  # Cứ 500 bài thì cập nhật Silver Parquet 1 lần
    )

    duration = time.time() - start_time
    print("\n" + "=" * 80)
    print("📊 TỔNG KẾT PHASE 1:")
    print(f"   - Tổng số bài đã có trong Silver: {total_done:,} bài")
    print(f"   - Thời gian thực thi: {duration/60:.2f} phút ({duration:.1f} giây)")
    print("=" * 80)

    # Hiển thị thống kê nhanh bằng DuckDB
    print("\n🔍 Thống kê nhanh dữ liệu Tầng Silver bằng DuckDB:")
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
        print(tabulate(df, headers="keys", tablefmt="fancy_grid", showindex=False))
    except Exception as e:
        print(f"⚠️ Không thể chạy thống kê DuckDB: {e}")


if __name__ == "__main__":
    main()
