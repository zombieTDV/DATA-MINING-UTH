"""CLI Entry point for arXiv Data Ingestion into Cloudflare R2 Bronze Lakehouse.

Usage:
    python -m src.pipelines.run_ingest --limit 3
    python -m src.pipelines.run_ingest --category cs.AI --limit 5
"""

import argparse
import sys
import time

from src.config.settings import settings
from src.ingestion.arxiv_harvester import ArxivHarvester
from src.storage.r2_client import R2Client
from src.storage.local_client import LocalObjectStore


def main():
    parser = argparse.ArgumentParser(
        description="Ingest arXiv AI/DS preprints (Metadata + HTML) into Cloudflare R2 Bronze Lakehouse."
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Chuyên mục arXiv cụ thể (ví dụ: cs.AI, cs.LG). Mặc định cào tất cả categories trong .env.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=3,
        help="Số lượng bài báo tối đa cần cào cho mỗi chuyên mục (mặc định: 3).",
    )
    parser.add_argument("--local", action="store_true", help="Store Bronze on disk instead of R2")
    parser.add_argument(
        "--metadata-only", action="store_true", help="Skip full-text HTML downloads"
    )
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit must be positive")

    print("=" * 75)
    print("🚀 BẮT ĐẦU PIPELINE THU THẬP BÀI BÁO (ARXIV -> BRONZE LAKEHOUSE)")
    print("=" * 75)

    categories = [args.category] if args.category else settings.ARXIV_CATEGORIES
    print(f"📌 Chuyên mục theo dõi: {', '.join(categories)}")
    print(f"📌 Giới hạn mỗi chuyên mục: {args.limit} bài")
    print(f"📌 Kho đích: {settings.LOCAL_STORE_DIR if args.local else settings.R2_BUCKET_NAME}")

    try:
        r2 = LocalObjectStore(settings.LOCAL_STORE_DIR) if args.local else R2Client()
        harvester = ArxivHarvester(r2_client=r2, categories=categories)
    except Exception as e:
        print(f"❌ Lỗi khởi tạo Object Store: {e}")
        sys.exit(1)

    total_ingested = 0
    total_skipped = 0
    total_html_saved = 0
    failed_categories = 0
    start_time = time.time()

    for cat in categories:
        print(f"\n📡 Đang quét RSS feed chuyên mục: {cat}...")
        try:
            papers = harvester.fetch_rss_feed(cat)
            print(f"   Tìm thấy {len(papers)} bài mới trong feed.")
        except Exception as e:
            print(f"   ⚠️ Lỗi tải feed {cat}: {e}")
            failed_categories += 1
            continue

        selected = papers[: args.limit]
        for idx, paper in enumerate(selected, 1):
            pid = paper["paper_id"]
            title = paper["title"][:60] + "..." if len(paper["title"]) > 60 else paper["title"]
            print(f"   [{idx}/{len(selected)}] Đang xử lý: {pid} - {title}")

            res = harvester.ingest_paper(paper, download_html=not args.metadata_only)
            status = res["status"]

            if status == "INGESTED":
                total_ingested += 1
                if res.get("has_html"):
                    total_html_saved += 1
                    print(
                        f"       ✅ Đã lưu Metadata & HTML vào Bronze (SHA-256: {res['sha256'][:10]}...)"
                    )
                else:
                    print("       ℹ️ Đã lưu Metadata; không thu thập HTML cho bài này")
            elif status == "SKIPPED_EXISTING":
                total_skipped += 1
                print("       ⏭️ Đã tồn tại trong Bronze, bỏ qua để tránh trùng lặp.")

            # Nghỉ lịch sự giữa các request
            time.sleep(settings.ARXIV_REQUEST_DELAY_SECONDS)

    harvester.close()
    duration = time.time() - start_time
    print("\n" + "=" * 75)
    print("📊 TỔNG KẾT PIPELINE THU THẬP DỮ LIỆU:")
    print(f"   - Thời gian thực thi: {duration:.2f} giây")
    print(f"   - Bài báo mới được nạp vào Bronze: {total_ingested}")
    print(f"   - Bản Full-text HTML thu thập thành công: {total_html_saved}")
    print(f"   - Bài báo đã có sẵn (bỏ qua): {total_skipped}")
    print("=" * 75)
    return 1 if failed_categories else 0


if __name__ == "__main__":
    sys.exit(main())
