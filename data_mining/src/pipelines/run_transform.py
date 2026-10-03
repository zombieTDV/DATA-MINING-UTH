"""CLI Entry point for Silver Transformation Pipeline (Bronze -> Silver Parquet).

Reads raw JSON metadata and HTML from Cloudflare R2 Bronze layer,
extracts academic sections and LaTeX math, generates Parquet files,
and uploads them to the R2 Silver Lakehouse layer.

Usage:
    python -m src.pipelines.run_transform
"""

import sys
import time
from pathlib import Path
from tabulate import tabulate

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import settings
from src.storage.duckdb_engine import DuckDBEngine
from src.storage.r2_client import R2Client
from src.transformation.html_parser import AcademicHTMLParser
from src.transformation.silver_writer import SilverLakehouseWriter


def main():
    print("=" * 75)
    print("⚙️  BẮT ĐẦU PIPELINE CHUYỂN ĐỔI TẦNG SILVER (BRONZE -> SILVER PARQUET)")
    print("=" * 75)

    r2 = R2Client()
    parser = AcademicHTMLParser()
    writer = SilverLakehouseWriter(r2_client=r2)

    # 1. Quét danh sách các file metadata trong R2 Bronze
    print("\n[1/4] Đang quét danh sách bài báo trong R2 Bronze...")
    meta_objects = r2.list_objects(prefix="bronze/arxiv/raw_metadata/")
    print(f"      Tìm thấy {len(meta_objects)} bài báo trong tầng Bronze.")

    if not meta_objects:
        print("⚠️ Chưa có bài báo nào trong Bronze. Hãy chạy: python -m src.pipelines.run_ingest trước.")
        sys.exit(0)

    # 2. Bóc tách từng bài báo
    print("\n[2/4] Đang đọc và bóc tách cấu trúc HTML...")
    records = []
    start_time = time.time()

    for item in meta_objects:
        meta_key = item["key"]
        raw_meta = r2.get_json(meta_key)
        paper_id = raw_meta.get("paper_id", "")
        year = meta_key.split("/")[3] if len(meta_key.split("/")) > 3 else "2026"

        print(f"      📄 Đang bóc tách Paper ID: {paper_id} ({raw_meta.get('title', '')[:50]}...)")

        parsed_html = {}
        # Kiểm tra xem có bản HTML trong Bronze không
        html_key = f"bronze/arxiv/raw_html/{year}/{paper_id}.html"
        if r2.object_exists(html_key):
            try:
                html_text = r2.get_text(html_key)
                parsed_html = parser.parse(html_text)
                print(f"         ✅ Đã bóc tách {parsed_html['total_sections']} sections, {parsed_html['total_math_count']} công thức toán.")
            except Exception as e:
                print(f"         ⚠️ Lỗi bóc tách HTML: {e}")
        else:
            print("         ℹ️ Bài này không có bản HTML, chỉ dùng metadata abstract.")

        record = writer.prepare_record(raw_meta, parsed_html)
        records.append(record)

    # 3. Xuất Parquet và upload lên R2 Silver
    print(f"\n[3/4] Đang xuất {len(records)} bản ghi ra Parquet nén zstd và đẩy lên R2 Silver...")
    upload_res = writer.save_and_upload_parquet(records, year="2026")
    print("      ✅ Hoàn tất lưu trữ Silver Layer:")
    print(f"         - File local: {upload_res['local_path']}")
    print(f"         - URI R2: {upload_res['r2_uri']}")
    print(f"         - Dung lượng Parquet: {upload_res['size_bytes']:,} bytes")
    print(f"         - SHA-256: {upload_res['sha256'][:16]}...")

    # 4. Kiểm tra truy vấn SQL bằng DuckDB
    print("\n[4/4] Kiểm tra truy vấn SQL với DuckDB trên tập dữ liệu Silver:")
    try:
        engine = DuckDBEngine()
        df = engine.query_silver_local(limit=5)
        # Bỏ bớt cột dài để in bảng đẹp
        display_df = df[["paper_id", "title", "primary_category", "total_sections", "total_math_count", "total_words"]]
        print(tabulate(display_df, headers="keys", tablefmt="fancy_grid", showindex=False))
    except Exception as e:
        print(f"      ⚠️ Lỗi chạy DuckDB: {e}")

    duration = time.time() - start_time
    print("\n" + "=" * 75)
    print(f"🎉 TẦNG SILVER ĐÃ ĐƯỢC XÂY DỰNG THÀNH CÔNG trong {duration:.2f} giây!")
    print("=" * 75)


if __name__ == "__main__":
    main()
