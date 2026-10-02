"""Master End-to-End Lakehouse Pipeline.

Executes the complete Medallion Architecture workflow in a single run:
- Phase 1: arXiv OAI-PMH Harvesting -> Cloudflare R2 Bronze Zone & Silver Parquet.
- Phase 2: Full-Text Academic HTML Enrichment -> R2 Bronze Zone & Silver Section Parquet.
- Phase 3: Gold Lakehouse Vector Indexing -> LanceDB (Apple Silicon MPS GPU) & R2 Gold Zone.

All activities and errors are logged to timestamped files in logs/ directory.

Usage:
    python -m src.pipelines.run_master_pipeline --target-papers 10000 --enrich-html-limit 100 --gold-limit 500
"""

import argparse
import datetime
import logging
import sys
import time
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional
import duckdb
import httpx
from tabulate import tabulate

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import settings
from src.indexing.chunker import AcademicChunker
from src.indexing.embedder import NomicEmbedder
from src.indexing.lancedb_manager import LanceDBManager
from src.ingestion.arxiv_batch_harvester import ArxivBatchHarvester
from src.storage.duckdb_engine import DuckDBEngine
from src.storage.r2_client import R2Client
from src.transformation.html_parser import AcademicHTMLParser
from src.transformation.silver_writer import SilverLakehouseWriter
from src.utils.hasher import compute_sha256
from src.utils.logger import setup_pipeline_logging


def get_silver_stats(engine: DuckDBEngine) -> Dict[str, Any]:
    """Lay thong ke hien tai cua tang Silver tu file Parquet."""
    silver_glob = str(settings.ROOT_DIR / "data" / "silver" / "**" / "*.parquet")
    try:
        df = engine.query_df(f"""
            SELECT 
                COUNT(*) as total_papers,
                SUM(CASE WHEN total_sections > 1 THEN 1 ELSE 0 END) as papers_with_html,
                ROUND(AVG(total_sections), 1) as avg_sections,
                ROUND(AVG(total_words), 1) as avg_words
            FROM '{silver_glob}'
        """)
        if not df.empty:
            row = df.iloc[0]
            return {
                "total_papers": int(row.get("total_papers") or 0),
                "papers_with_html": int(row.get("papers_with_html") or 0),
                "avg_sections": float(row.get("avg_sections") or 0.0),
                "avg_words": float(row.get("avg_words") or 0.0),
            }
    except Exception:
        pass
    return {"total_papers": 0, "papers_with_html": 0, "avg_sections": 0.0, "avg_words": 0.0}


def run_phase1_harvest(
    target_papers: int,
    delay: float,
    reset_checkpoint: bool,
    r2: R2Client,
    engine: DuckDBEngine,
    logger: logging.Logger,
) -> int:
    """Phase 1: Thu thap du lieu thô tu arXiv OAI-PMH vao Bronze & Silver."""
    print("\n" + "=" * 80)
    print("[PHASE 1] THU THAP DU LIEU ARXIV OAI-PMH (BRONZE & SILVER LAKEHOUSE)")
    print("=" * 80)

    # Kiem tra so luong hien co trong Silver
    stats = get_silver_stats(engine)
    current_count = stats["total_papers"]

    if current_count >= target_papers and not reset_checkpoint:
        print(f"[INFO] Tang Silver hien da co {current_count:,} bai bao (>= muc tieu {target_papers:,} bai).")
        print("[INFO] Bo qua thu thap moi. Chuyen truc tiep sang Phase tiep theo.")
        return current_count

    try:
        harvester = ArxivBatchHarvester(r2_client=r2, request_delay=delay)
        total_ingested = harvester.harvest_large_corpus(
            total_target=target_papers,
            reset_checkpoint=reset_checkpoint,
        )
        print(f"[SUCCESS] Phase 1 hoan tat: Tong so bai bao trong Silver dat {total_ingested:,} bai.")
        return total_ingested
    except Exception as e:
        err_msg = f"Phase 1 gap loi nghiem trong: {e}\n{traceback.format_exc()}"
        logger.error(err_msg)
        print(f"[ERROR] {err_msg}")
        return current_count


def run_phase2_html_enrichment(
    limit: int,
    delay: float,
    batch_save: int,
    r2: R2Client,
    engine: DuckDBEngine,
    logger: logging.Logger,
) -> Dict[str, int]:
    """Phase 2: Tai va boc tach HTML toan van cho cac bai bao trong Silver."""
    print("\n" + "=" * 80)
    print("[PHASE 2] CAO TOAN VAN HTML VA LAM GIAU CHUYEN MUC (BRONZE & SILVER)")
    print("=" * 80)

    silver_glob = str(settings.ROOT_DIR / "data" / "silver" / "**" / "*.parquet")
    try:
        query = f"""
            SELECT paper_id, title, abstract, authors, categories, primary_category, published_date, pdf_url, html_url, total_sections
            FROM '{silver_glob}'
            ORDER BY published_date DESC
        """
        all_papers_df = engine.query_df(query)
    except Exception as e:
        err_msg = f"Khong the doc du lieu Parquet Silver: {e}\n{traceback.format_exc()}"
        logger.error(err_msg)
        print(f"[ERROR] {err_msg}")
        return {"processed": 0, "success": 0, "skipped": 0, "errors": 1}

    pending_df = all_papers_df[all_papers_df["total_sections"] <= 1]
    if limit > 0:
        targets_df = pending_df.head(limit)
    else:
        targets_df = pending_df

    total_to_process = len(targets_df)
    print(f"[CONFIG] Tong so bai can lam giau HTML: {len(pending_df):,} | Muc tieu dot nay: {total_to_process:,}")

    if total_to_process == 0:
        print("[INFO] Tat ca bai bao da duoc lam giau HTML day du. Bo qua Phase 2.")
        return {"processed": 0, "success": 0, "skipped": 0, "errors": 0}

    html_parser = AcademicHTMLParser()
    silver_writer = SilverLakehouseWriter(r2_client=r2)
    local_html_dir = settings.ROOT_DIR / "data" / "raw" / "html"
    local_html_dir.mkdir(parents=True, exist_ok=True)

    http_client = httpx.Client(
        headers={"User-Agent": "UTH-Scientific-DataMining-HTMLEnricher/2.0 (academic research; contact: data-mining@uth.edu.vn)"},
        timeout=25.0,
        follow_redirects=True,
    )

    enriched_records = []
    success_count = 0
    not_found_count = 0
    error_count = 0

    for idx, (_, row) in enumerate(targets_df.iterrows(), 1):
        paper_id = str(row["paper_id"])
        title = str(row["title"])
        pub_date = str(row.get("published_date", ""))
        year = pub_date[:4] if pub_date and pub_date[:4].isdigit() else "2026"

        html_url = f"https://arxiv.org/html/{paper_id}"
        print(f"[HTML {idx:,}/{total_to_process:,}] ID: {paper_id} | {title[:55]}...")

        parsed_html: Dict[str, Any] = {}
        has_html = False

        try:
            resp = http_client.get(html_url)
            if resp.status_code == 200 and len(resp.text) > 1000:
                html_text = resp.text
                html_hash = compute_sha256(html_text)

                # 1. Luu Bronze len R2
                r2_html_key = f"bronze/arxiv/raw_html/{year}/{paper_id}.html"
                try:
                    r2.upload_text(
                        text=html_text,
                        key=r2_html_key,
                        content_type="text/html; charset=utf-8",
                        metadata={"sha256": html_hash, "paper_id": paper_id},
                    )
                except Exception as r2_err:
                    logger.warning(f"Loi upload R2 Bronze HTML {paper_id}: {r2_err}")

                # 2. Luu local cache
                (local_html_dir / f"{paper_id}.html").write_text(html_text, encoding="utf-8")

                # 3. Boc tach chuyen muc
                parsed_html = html_parser.parse(html_text)
                has_html = True
                success_count += 1
                sec_c = parsed_html.get("total_sections", 0)
                math_c = parsed_html.get("total_math_count", 0)
                words_c = parsed_html.get("total_words", 0)
                print(f"    [PARSED] Thanh cong: {sec_c} sections, {math_c} cong thuc toan, {words_c:,} tu.")
            elif resp.status_code == 404:
                not_found_count += 1
                print("    [NOTICE] Bai nay khong co ban HTML5 (404), giu nguyen abstract.")
            else:
                error_count += 1
                logger.warning(f"HTTP status {resp.status_code} khi lay HTML paper {paper_id}")
        except Exception as e:
            error_count += 1
            err_msg = f"Loi tai HTML paper {paper_id}: {e}"
            logger.error(err_msg)
            print(f"    [ERROR] {err_msg}")

        raw_meta = row.to_dict()
        raw_meta["has_html"] = has_html
        silver_rec = silver_writer.prepare_record(raw_meta, parsed_html)
        enriched_records.append(silver_rec)

        if len(enriched_records) >= batch_save:
            print(f"\n[STORAGE] Dong bo {len(enriched_records)} ban ghi vao Silver Parquet & R2...")
            silver_writer.save_and_upload_parquet(enriched_records, year="2026")
            enriched_records = []

        if delay > 0 and idx < total_to_process:
            time.sleep(delay)

    if enriched_records:
        print(f"\n[STORAGE] Dong bo not {len(enriched_records)} ban ghi vao Silver Parquet...")
        silver_writer.save_and_upload_parquet(enriched_records, year="2026")

    print(f"[SUCCESS] Phase 2 hoan tat: {success_count:,} bai co HTML day du, {not_found_count:,} dung abstract, {error_count} loi.")
    return {
        "processed": total_to_process,
        "success": success_count,
        "skipped": not_found_count,
        "errors": error_count,
    }


def run_phase3_gold_indexing(
    limit: int,
    batch_size: int,
    skip_r2_sync: bool,
    r2: R2Client,
    engine: DuckDBEngine,
    logger: logging.Logger,
) -> Dict[str, Any]:
    """Phase 3: Chuyen doi Silver sang Vector Embeddings va luu vao Tang Gold LanceDB."""
    print("\n" + "=" * 80)
    print("[PHASE 3] XAY DUNG TANG GOLD (LANCEDB VECTOR LAKEHOUSE & SEMANTIC SEARCH)")
    print("=" * 80)

    silver_glob = str(settings.ROOT_DIR / "data" / "silver" / "**" / "*.parquet")
    query = f"""
        SELECT * FROM '{silver_glob}'
        ORDER BY total_sections DESC, published_date DESC
    """
    if limit > 0:
        query += f" LIMIT {limit}"

    try:
        papers_df = engine.query_df(query)
        print(f"[INFO] Da chon {len(papers_df):,} bai bao tu Silver Parquet de nap vao Gold.")
    except Exception as e:
        err_msg = f"Khong the truy van Silver Parquet de xay dung Gold: {e}\n{traceback.format_exc()}"
        logger.error(err_msg)
        print(f"[ERROR] {err_msg}")
        return {"chunks": 0, "vectors": 0, "errors": 1}

    if papers_df.empty:
        print("[WARNING] Tang Silver chua co du lieu.")
        return {"chunks": 0, "vectors": 0, "errors": 0}

    # 1. Section-Aware Chunking
    chunker = AcademicChunker(max_chunk_words=450, overlap_paragraphs=1)
    all_chunks = []
    for _, row in papers_df.iterrows():
        chunks = chunker.chunk_paper(row.to_dict())
        all_chunks.extend(chunks)

    print(f"[INFO] Tao thanh cong {len(all_chunks):,} chunks ngu canh tu {len(papers_df):,} bai bao.")

    # 2. Sinh Embeddings
    try:
        print(f"[INFO] Khoi dong mo hinh Nomic-embed-text-v1.5 tren Apple Silicon GPU (MPS)...")
        embedder = NomicEmbedder()
        print(f"[DEVICE] Thiet bi tang toc tinh toan: {embedder.device}")

        chunk_texts = [c["context_text"] for c in all_chunks]
        embed_start = time.time()
        embeddings = embedder.embed_documents(chunk_texts, batch_size=batch_size)
        embed_time = time.time() - embed_start
        print(f"[INFO] Sinh {len(embeddings):,} vectors (768 chieu) trong {embed_time:.2f}s ({len(embeddings)/max(1, embed_time):.1f} chunks/s).")

        for c, vec in zip(all_chunks, embeddings):
            c["vector"] = vec
    except Exception as e:
        err_msg = f"Loi sinh embeddings Nomic v1.5: {e}\n{traceback.format_exc()}"
        logger.error(err_msg)
        print(f"[ERROR] {err_msg}")
        return {"chunks": len(all_chunks), "vectors": 0, "errors": 1}

    # 3. Ghi vao LanceDB Table
    try:
        lancedb_mgr = LanceDBManager(r2_client=r2)
        inserted = lancedb_mgr.insert_chunks(all_chunks)
        print(f"[INFO] Da nap {inserted:,} ban ghi vao LanceDB Table '{lancedb_mgr.DEFAULT_TABLE_NAME}'.")
    except Exception as e:
        err_msg = f"Loi ghi vao LanceDB: {e}\n{traceback.format_exc()}"
        logger.error(err_msg)
        print(f"[ERROR] {err_msg}")
        return {"chunks": len(all_chunks), "vectors": len(embeddings), "errors": 1}

    # 4. Dong bo R2 Gold
    if not skip_r2_sync:
        try:
            print("[STORAGE] Dong bo LanceDB Table len Cloudflare R2 Gold Zone...")
            sync_res = lancedb_mgr.sync_to_r2(r2_prefix="gold/lancedb/")
            print(f"[STORAGE] Dong bo thanh cong {sync_res['synced_files']} files len {sync_res['r2_destination']}")
        except Exception as e:
            err_msg = f"Loi dong bo LanceDB len R2: {e}"
            logger.error(err_msg)
            print(f"[ERROR] {err_msg}")

    # 5. Kiem thu Semantic Search
    print("\n[VERIFICATION] Kiem thu Semantic Vector Search tren Tang Gold:")
    sample_query = "How to improve OCR faithfulness and reduce hallucination in vision-language models?"
    print(f"[QUERY] \"{sample_query}\"")
    try:
        q_vec = embedder.embed_query(sample_query)
        results = lancedb_mgr.vector_search(query_vector=q_vec, limit=4)
        display = []
        for _, r in results.iterrows():
            sim = 1.0 - r.get("_distance", 0.0)
            display.append({
                "Score (Sim)": f"{sim:.4f}",
                "Paper ID": r["paper_id"],
                "Section": f"{r['section_title']} ({r['section_type']})",
                "Snippet": r["text"][:100] + "...",
            })
        print(tabulate(display, headers="keys", tablefmt="pipe", showindex=False))
    except Exception as e:
        logger.error(f"Loi kiem thu semantic search: {e}")

    print(f"[SUCCESS] Phase 3 hoan tat: Tang Gold da san sang cho truy xuat Advanced RAG.")
    return {"chunks": len(all_chunks), "vectors": len(embeddings), "errors": 0}


def main():
    parser = argparse.ArgumentParser(
        description="Master Pipeline: Chay toan bo quy trinh tu Bronze, Silver den Gold trong 1 lenh duy nhat."
    )
    parser.add_argument(
        "--target-papers",
        type=int,
        default=10000,
        help="Tong so bai bao can thu thap o Phase 1 (mac dinh: 10,000 bai).",
    )
    parser.add_argument(
        "--enrich-html-limit",
        type=int,
        default=100,
        help="So luong bai bao can cao va boc tach HTML toan van o Phase 2 (mac dinh: 100 bai, 0 = tat ca).",
    )
    parser.add_argument(
        "--gold-limit",
        type=int,
        default=500,
        help="So luong bai bao can index vao LanceDB Gold o Phase 3 (mac dinh: 500 bai, 0 = tat ca).",
    )
    parser.add_argument(
        "--delay-oai",
        type=float,
        default=10.0,
        help="Delay giua cac trang OAI-PMH (mac dinh: 10.0s).",
    )
    parser.add_argument(
        "--delay-html",
        type=float,
        default=1.0,
        help="Delay giua cac lan tai HTML (mac dinh: 1.0s).",
    )
    parser.add_argument(
        "--batch-size-embed",
        type=int,
        default=32,
        help="Batch size embedding Nomic v1.5 (mac dinh: 32).",
    )
    parser.add_argument(
        "--reset-checkpoint",
        action="store_true",
        help="Xoa checkpoint cu de cao moi Phase 1 tu dau.",
    )
    parser.add_argument(
        "--skip-phase1",
        action="store_true",
        help="Bo qua Phase 1 (neu da co du lieu Silver).",
    )
    parser.add_argument(
        "--skip-phase2",
        action="store_true",
        help="Bo qua Phase 2 (khong cao HTML).",
    )
    parser.add_argument(
        "--skip-phase3",
        action="store_true",
        help="Bo qua Phase 3 (khong xay dung Gold).",
    )
    parser.add_argument(
        "--skip-r2-sync",
        action="store_true",
        help="Bo qua buoc dong bo Gold len R2.",
    )
    args = parser.parse_args()

    # Khoi tao Logging tap trung theo timestamp
    logger, log_file = setup_pipeline_logging(pipeline_name="master_pipeline")

    # Bat unhandled exceptions
    def excepthook(exc_type, exc_val, exc_tb):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_val, exc_tb)
            return
        err_msg = "".join(traceback.format_exception(exc_type, exc_val, exc_tb))
        logger.critical(f"[CRITICAL_ERROR] Loi khong xac dinh trong pipeline:\n{err_msg}")
        print(f"\n[CRITICAL_ERROR] {err_msg}")

    sys.excepthook = excepthook

    pipeline_start = time.time()
    print("=" * 80)
    print("[MASTER PIPELINE] KHOI DONG TOAN BO HE THONG DATA LAKEHOUSE (BRONZE -> SILVER -> GOLD)")
    print(f"[LOG_FILE] File nhat ky: {log_file}")
    print(f"[TIMESTAMP] Bat dau luc: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    try:
        r2 = R2Client()
        engine = DuckDBEngine()
    except Exception as e:
        logger.error(f"[ERROR] Khoi tao ket noi R2/DuckDB that bai: {e}\n{traceback.format_exc()}")
        print(f"[ERROR] Khoi tao ket noi that bai: {e}")
        sys.exit(1)

    # 1. Chay Phase 1
    if not args.skip_phase1:
        run_phase1_harvest(
            target_papers=args.target_papers,
            delay=args.delay_oai,
            reset_checkpoint=args.reset_checkpoint,
            r2=r2,
            engine=engine,
            logger=logger,
        )
    else:
        print("\n[INFO] Bo qua Phase 1 theo co --skip-phase1.")

    # 2. Chay Phase 2
    if not args.skip_phase2:
        run_phase2_html_enrichment(
            limit=args.enrich_html_limit,
            delay=args.delay_html,
            batch_save=50,
            r2=r2,
            engine=engine,
            logger=logger,
        )
    else:
        print("\n[INFO] Bo qua Phase 2 theo co --skip-phase2.")

    # 3. Chay Phase 3
    if not args.skip_phase3:
        run_phase3_gold_indexing(
            limit=args.gold_limit,
            batch_size=args.batch_size_embed,
            skip_r2_sync=args.skip_r2_sync,
            r2=r2,
            engine=engine,
            logger=logger,
        )
    else:
        print("\n[INFO] Bo qua Phase 3 theo co --skip-phase3.")

    total_duration = time.time() - pipeline_start
    print("\n" + "=" * 80)
    print("[FINAL SUMMARY] TONG KET TOAN BO PIPELINE:")
    print(f"   - Thoi gian chay tong cong: {total_duration/60:.2f} phut ({total_duration:.1f} giay)")
    print(f"   - Nhat ky chi tiet luu tai: {log_file}")

    # In bang thong ke hien trang he thong bang DuckDB
    print("\n[ANALYTICS] Trang thai hien tai cua Kho Du lieu Khoa hoc:")
    try:
        stats_df = engine.query_df(f"""
            SELECT 
                COUNT(*) as total_silver_papers,
                SUM(CASE WHEN total_sections > 1 THEN 1 ELSE 0 END) as papers_with_full_html,
                SUM(total_math_count) as total_math_formulas,
                ROUND(AVG(total_words), 1) as avg_paper_words
            FROM 'data/silver/**/*.parquet'
        """)
        print(tabulate(stats_df, headers="keys", tablefmt="pipe", showindex=False))
    except Exception as e:
        logger.error(f"[ERROR] Loi in thong ke cuoi: {e}")

    print("=" * 80)
    print("[COMPLETED] HE THONG DA SAN SANG PHUC VU ADVANCED RAG.")


if __name__ == "__main__":
    main()
