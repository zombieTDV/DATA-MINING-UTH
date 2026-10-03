"""CLI Entry point for Phase 3: Gold Lakehouse Indexing Pipeline (Silver Parquet -> LanceDB Gold Vector Table).

Workflow:
1. Reads structured papers from Silver Parquet layer via DuckDB.
2. Performs domain-aware Section Chunking (Abstract + Intro + Method + Experiments) via AcademicChunker.
3. Generates 768-dim embeddings locally using Nomic-embed-text-v1.5 on Apple Silicon GPU (MPS).
4. Stores vectors and metadata into LanceDB Gold table (scientific_papers_gold.lance).
5. Syncs the LanceDB dataset to Cloudflare R2 Gold Zone (gold/lancedb/).
6. Executes a semantic vector search verification.

Usage:
    python -m src.pipelines.run_indexing --limit 500 --batch-size 32
"""

import argparse
import sys
import time
from pathlib import Path
from tabulate import tabulate

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import settings
from src.indexing.chunker import AcademicChunker
from src.indexing.embedder import NomicEmbedder
from src.indexing.lancedb_manager import LanceDBManager
from src.storage.duckdb_engine import DuckDBEngine
from src.storage.r2_client import R2Client
from src.utils.logger import setup_pipeline_logging


def main():
    parser = argparse.ArgumentParser(
        description="Phase 3: Index Silver papers into LanceDB Gold Vector Lakehouse."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=500,
        help="So luong bai bao can index vao Gold (mac dinh: 500 bai, 0 = tat ca bai trong Silver).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size cho mo hinh embedding (mac dinh: 32).",
    )
    parser.add_argument(
        "--skip-r2-sync",
        action="store_true",
        help="Bo qua buoc dong bo LanceDB len Cloudflare R2.",
    )
    args = parser.parse_args()

    # Khoi tao log file theo timestamp tai logs/
    logger, log_file = setup_pipeline_logging(pipeline_name="gold_indexing")

    print("=" * 80)
    print("[PIPELINE] BAT DAU PHASE 3: XAY DUNG TANG GOLD (LANCEDB VECTOR LAKEHOUSE)")
    print(f"[LOG_FILE] Nhat ky chi tiet: {log_file}")
    print("=" * 80)

    start_time = time.time()

    # 1. Doc du lieu tu Tang Silver Parquet bang DuckDB
    print("\n[1/5] Doc du lieu tu Tang Silver Parquet bang DuckDB...")
    engine = DuckDBEngine()
    silver_path = str(settings.ROOT_DIR / "data" / "silver" / "**" / "*.parquet")
    
    # Uu tien index cac bai da co full sections truoc
    query = f"""
        SELECT * FROM '{silver_path}'
        ORDER BY total_sections DESC, published_date DESC
    """
    if args.limit > 0:
        query += f" LIMIT {args.limit}"

    try:
        papers_df = engine.query_df(query)
        print(f"[INFO] Da chon {len(papers_df):,} bai bao tu tang Silver de index vao Gold.")
    except Exception as e:
        print(f"[ERROR] Khong the doc file Parquet tang Silver: {e}")
        sys.exit(1)

    if papers_df.empty:
        print("[WARNING] Tang Silver chua co du lieu.")
        sys.exit(0)

    # 2. Section-Aware Chunking
    print("\n[2/5] Tien hanh Section-Aware Chunking va lam giau ngu canh (Contextual Chunking)...")
    chunker = AcademicChunker(max_chunk_words=450, overlap_paragraphs=1)
    all_chunks = []

    for _, row in papers_df.iterrows():
        paper_record = row.to_dict()
        chunks = chunker.chunk_paper(paper_record)
        all_chunks.extend(chunks)

    print(f"[INFO] Tao thanh cong {len(all_chunks):,} chunks ngu canh tu {len(papers_df):,} bai bao.")
    for idx, c in enumerate(all_chunks[:4], 1):
        print(f"  - Chunk {idx}: [{c['section_type'].upper()}] {c['section_title']} ({c['word_count']} tu)")
    if len(all_chunks) > 4:
        print(f"  ... va {len(all_chunks) - 4:,} chunks khac.")

    # 3. Sinh Vector Embeddings bang mo hinh Nomic-embed-text-v1.5
    print(f"\n[3/5] Khoi dong mo hinh Nomic-embed-text-v1.5 va sinh Vector ({len(all_chunks):,} chunks)...")
    embedder = NomicEmbedder()
    print(f"[DEVICE] Thiet bi tang toc tinh toan: {embedder.device}")

    chunk_texts = [c["context_text"] for c in all_chunks]
    embed_start = time.time()
    embeddings = embedder.embed_documents(chunk_texts, batch_size=args.batch_size)
    embed_duration = time.time() - embed_start
    print(f"[INFO] Sinh thanh cong {len(embeddings):,} vectors (768 chieu) trong {embed_duration:.2f}s ({len(embeddings)/max(1, embed_duration):.1f} chunks/giay).")

    # Gan vector vao tung chunk
    for c, vec in zip(all_chunks, embeddings):
        c["vector"] = vec

    # 4. Ghi du lieu vao LanceDB va dong bo len Cloudflare R2 Gold
    print("\n[4/5] Luu tru chi muc vao LanceDB Gold Table...")
    r2 = R2Client()
    lancedb_mgr = LanceDBManager(r2_client=r2)
    inserted_count = lancedb_mgr.insert_chunks(all_chunks)
    print(f"[INFO] Da nap {inserted_count:,} ban ghi vao LanceDB Table '{lancedb_mgr.DEFAULT_TABLE_NAME}'.")

    if not args.skip_r2_sync:
        print("[STORAGE] Dang dong bo du lieu LanceDB len Cloudflare R2 Gold Zone...")
        try:
            sync_res = lancedb_mgr.sync_to_r2(r2_prefix="gold/lancedb/")
            print(f"[STORAGE] Dong bo thanh cong {sync_res['synced_files']} files len {sync_res['r2_destination']}")
        except Exception as e:
            print(f"[WARNING] Loi dong bo LanceDB len R2: {e}")
    else:
        print("[INFO] Bo qua dong bo Cloudflare R2 theo co --skip-r2-sync.")

    # 5. Kiem thu Semantic Vector Search thuc te tren Tang Gold
    print("\n[5/5] Kiem thu Semantic Vector Search thuc te tren Tang Gold:")
    sample_query = "How to improve OCR faithfulness and reduce hallucination in vision-language models?"
    print(f"[QUERY] Cau hoi tim kiem mau: \"{sample_query}\"")

    query_vec = embedder.embed_query(sample_query)
    search_results = lancedb_mgr.vector_search(query_vector=query_vec, limit=4)

    display_results = []
    for _, res in search_results.iterrows():
        distance = res.get("_distance", 0.0)
        similarity = 1.0 - distance
        display_results.append(
            {
                "Score (Sim)": f"{similarity:.4f}",
                "Paper ID": res["paper_id"],
                "Section": f"{res['section_title']} ({res['section_type']})",
                "Snippet": res["text"][:110] + "...",
            }
        )

    print(tabulate(display_results, headers="keys", tablefmt="pipe", showindex=False))

    duration = time.time() - start_time
    print("\n" + "=" * 80)
    print(f"[HOAN TAT] TANG GOLD DA DUOC XAY DUNG HOAN TAT TRONG {duration:.2f} GIAY ({duration/60:.2f} PHUT)!")
    print("=" * 80)


if __name__ == "__main__":
    main()
