"""CLI Pipeline for Phase 2: Full-Text Academic HTML Enrichment (Bronze & Silver).

Workflow:
1. Scans Silver Parquet for papers requiring full-text enrichment.
2. Fetches academic HTML5 from arXiv (https://arxiv.org/html/{paper_id}).
3. Vaults raw HTML to Cloudflare R2 Bronze Zone (bronze/arxiv/raw_html/{year}/{paper_id}.html).
4. Parses structured sections (Intro, Method, Experiments, LaTeX math) via AcademicHTMLParser.
5. Updates Silver Parquet dataset with enriched content and syncs to Cloudflare R2.

Usage:
    python -m src.pipelines.run_html_enrichment --limit 100 --delay 1.0
"""

import argparse
import sys
import time
from pathlib import Path
from typing import Any, Dict, List
import duckdb
import httpx
from tabulate import tabulate

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import settings
from src.storage.duckdb_engine import DuckDBEngine
from src.storage.r2_client import R2Client
from src.transformation.html_parser import AcademicHTMLParser
from src.transformation.silver_writer import SilverLakehouseWriter
from src.utils.hasher import compute_sha256
from src.utils.logger import setup_pipeline_logging


def main():
    parser = argparse.ArgumentParser(
        description="Phase 2: Crawl and enrich full-text HTML from arXiv into Bronze & Silver Lakehouse."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="So luong bai bao can cao HTML (mac dinh: 100 bai, 0 = tat ca bai trong Silver).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Thoi gian nghi (giay) giua cac lan tai HTML de ton trong may chu arXiv (mac dinh: 1.0s).",
    )
    parser.add_argument(
        "--batch-save",
        type=int,
        default=50,
        help="Luu Parquet va dong bo R2 sau moi N bai bao (mac dinh: 50).",
    )
    args = parser.parse_args()

    # Khoi tao log file theo timestamp tai logs/
    logger, log_file = setup_pipeline_logging(pipeline_name="html_enrichment")

    print("=" * 80)
    print("[PIPELINE] BAT DAU PHASE 2: CAO TOAN VAN HTML VA LAM GIAU TANG BRONZE & SILVER")
    print(f"[LOG_FILE] Nhat ky chi tiet: {log_file}")
    print("=" * 80)

    r2 = R2Client()
    html_parser = AcademicHTMLParser()
    silver_writer = SilverLakehouseWriter(r2_client=r2)
    engine = DuckDBEngine()

    silver_glob = str(settings.ROOT_DIR / "data" / "silver" / "**" / "*.parquet")
    try:
        # Lay danh sach bai chua duoc cao HTML (total_sections <= 1 hoac clean_full_text chua co sections)
        query = f"""
            SELECT paper_id, title, abstract, authors, categories, primary_category, published_date, pdf_url, html_url, total_sections
            FROM '{silver_glob}'
            ORDER BY published_date DESC
        """
        all_papers_df = engine.query_df(query)
    except Exception as e:
        print(f"[ERROR] Khong the doc file Silver Parquet: {e}")
        sys.exit(1)

    if all_papers_df.empty:
        print("[WARNING] Tang Silver chua co du lieu. Vui long chay Phase 1 (run_batch_ingest) truoc.")
        sys.exit(0)

    # Loc nhung bai can cao (chua co full sections)
    pending_df = all_papers_df[all_papers_df["total_sections"] <= 1]
    if args.limit > 0:
        targets_df = pending_df.head(args.limit)
    else:
        targets_df = pending_df

    total_to_process = len(targets_df)
    print(f"[CONFIG] Tong so bai bao trong Silver: {len(all_papers_df):,}")
    print(f"[CONFIG] So bai can lam giau HTML: {len(pending_df):,} | Muc tieu phien nay: {total_to_process:,}")
    print(f"[CONFIG] Delay giua cac request: {args.delay}s | Batch save: {args.batch_save} bai")
    print("-" * 80)

    if total_to_process == 0:
        print("[INFO] Tat ca bai bao deu da duoc lam giau HTML day du. San sang cho Phase 3 (Gold Indexing).")
        sys.exit(0)

    http_client = httpx.Client(
        headers={
            "User-Agent": "UTH-Scientific-DataMining-HTMLEnricher/2.0 (academic research; contact: data-mining@uth.edu.vn)"
        },
        timeout=25.0,
        follow_redirects=True,
    )

    enriched_records = []
    success_html_count = 0
    not_found_count = 0
    error_count = 0
    start_time = time.time()

    local_html_dir = settings.ROOT_DIR / "data" / "raw" / "html"
    local_html_dir.mkdir(parents=True, exist_ok=True)

    for idx, (_, row) in enumerate(targets_df.iterrows(), 1):
        paper_id = str(row["paper_id"])
        title = str(row["title"])
        pub_date = str(row.get("published_date", ""))
        year = pub_date[:4] if pub_date and pub_date[:4].isdigit() else "2026"

        html_url = f"https://arxiv.org/html/{paper_id}"
        print(f"[HTML {idx:,}/{total_to_process:,}] ID: {paper_id} | {title[:60]}...")

        parsed_html: Dict[str, Any] = {}
        has_html = False

        try:
            resp = http_client.get(html_url)
            if resp.status_code == 200 and len(resp.text) > 1000:
                html_text = resp.text
                html_hash = compute_sha256(html_text)

                # 1. Luu file HTML thô len R2 Bronze
                r2_html_key = f"bronze/arxiv/raw_html/{year}/{paper_id}.html"
                try:
                    r2.upload_text(
                        text=html_text,
                        key=r2_html_key,
                        content_type="text/html; charset=utf-8",
                        metadata={"sha256": html_hash, "paper_id": paper_id},
                    )
                except Exception as r2_err:
                    print(f"    [WARNING] Loi upload R2 Bronze HTML: {r2_err}")

                # 2. Luu ban sao cuc bo
                local_file = local_html_dir / f"{paper_id}.html"
                local_file.write_text(html_text, encoding="utf-8")

                # 3. Boc tach cau truc chuyen muc
                parsed_html = html_parser.parse(html_text)
                has_html = True
                success_html_count += 1
                sec_count = parsed_html.get("total_sections", 0)
                math_count = parsed_html.get("total_math_count", 0)
                words = parsed_html.get("total_words", 0)
                print(f"    [PARSED] Thanh cong: {sec_count} sections, {math_count} cong thuc toan, {words:,} tu.")
            elif resp.status_code == 404:
                not_found_count += 1
                print("    [NOTICE] Bai nay khong co ban HTML5 tren arXiv (404), giu nguyen abstract.")
            else:
                error_count += 1
                print(f"    [WARNING] HTTP status {resp.status_code} tu arXiv.")
        except Exception as e:
            error_count += 1
            print(f"    [ERROR] Loi tai HTML cho paper {paper_id}: {e}")

        # Chuan bi ban ghi cap nhat Silver
        raw_meta = row.to_dict()
        raw_meta["has_html"] = has_html
        silver_rec = silver_writer.prepare_record(raw_meta, parsed_html)
        enriched_records.append(silver_rec)

        # Luu Silver Parquet dinh ky
        if len(enriched_records) >= args.batch_save:
            print(f"\n[STORAGE] Cap nhat {len(enriched_records)} ban ghi vao Silver Parquet va dong bo R2...")
            silver_writer.save_and_upload_parquet(enriched_records, year="2026")
            enriched_records = []
            print("[STORAGE] Hoan tat dong bo Silver Parquet.\n")

        # Nghi nhe de tuan thu rate-limit
        if args.delay > 0 and idx < total_to_process:
            time.sleep(args.delay)

    # Luu not cac ban ghi con lai
    if enriched_records:
        print(f"\n[STORAGE] Cap nhat not {len(enriched_records)} ban ghi vao Silver Parquet...")
        silver_writer.save_and_upload_parquet(enriched_records, year="2026")

    duration = time.time() - start_time
    print("\n" + "=" * 80)
    print("[SUMMARY] TONG KET PHASE 2 (HTML ENRICHMENT):")
    print(f"   - Tong so bai da xu ly: {total_to_process:,} bai")
    print(f"   - Bóc tách HTML thành công: {success_html_count:,} bài")
    print(f"   - Không có HTML (giữ Abstract): {not_found_count:,} bài")
    print(f"   - Lỗi tải: {error_count:,} bài")
    print(f"   - Thời gian thực thi: {duration/60:.2f} phút ({duration:.1f} giây)")
    print("=" * 80)

    # Thong ke lai sau lam giau bang DuckDB
    print("\n[ANALYTICS] Thong ke phan bo Section sau khi lam giau bang DuckDB:")
    try:
        summary_df = engine.query_df(f"""
            SELECT 
                COUNT(*) as total_papers,
                SUM(CASE WHEN total_sections > 1 THEN 1 ELSE 0 END) as papers_with_full_html,
                ROUND(AVG(total_sections), 1) as avg_sections,
                ROUND(AVG(total_math_count), 1) as avg_math_equations,
                ROUND(AVG(total_words), 1) as avg_total_words
            FROM '{silver_glob}'
        """)
        print(tabulate(summary_df, headers="keys", tablefmt="pipe", showindex=False))
    except Exception as e:
        print(f"[ERROR] Khong the chay thong ke DuckDB: {e}")


if __name__ == "__main__":
    main()
