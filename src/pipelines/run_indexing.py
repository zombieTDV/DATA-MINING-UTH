"""CLI Entry point for Gold Indexing Pipeline (Silver Parquet -> LanceDB Gold Vector Lakehouse).

Reads structured papers from the Silver layer, splits into domain-aware section chunks,
generates 768-dim embeddings via local Nomic-embed-text-v1.5, stores in LanceDB,
and syncs to Cloudflare R2 Gold Zone.

Usage:
    python -m src.pipelines.run_indexing
"""

import sys
import argparse
import time
from tabulate import tabulate

from src.config.settings import settings
from src.indexing.chunker import AcademicChunker
from src.indexing.lancedb_manager import LanceDBManager
from src.storage.duckdb_engine import DuckDBEngine
from src.storage.r2_client import R2Client


def main():
    print("=" * 75)
    print("🏆 BẮT ĐẦU PIPELINE XÂY DỰNG TẦNG GOLD (LANCEDB VECTOR LAKEHOUSE)")
    print("=" * 75)

    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--local", action="store_true", help="Keep Gold on disk without syncing to R2")
    cli.add_argument("--batch-size", type=int, default=16)
    args = cli.parse_args()
    if args.batch_size < 1:
        cli.error("batch size must be positive")
    if not settings.EMBEDDING_MODEL_PATH.is_dir():
        cli.error(
            "Embedding model missing; configure EMBEDDING_MODEL_PATH. Use run_demo for storage diagnostics."
        )
    from src.indexing.embedder import NomicEmbedder

    start_time = time.time()

    # 1. Đọc dữ liệu từ Tầng Silver Parquet bằng DuckDB
    print("\n[1/5] Đọc dữ liệu đã chuẩn hóa từ Tầng Silver Parquet...")
    engine = DuckDBEngine()
    silver_path = str(settings.SILVER_DIR / "**" / "*.parquet")
    try:
        papers_df = engine.query_df(f"SELECT * FROM '{silver_path}'")
        print(f"      Đã đọc {len(papers_df)} bài báo từ tầng Silver.")
    except Exception as e:
        print(f"❌ Không thể đọc file Parquet tầng Silver: {e}")
        print("💡 Hãy chạy 'python -m src.pipelines.run_transform' trước để tạo tầng Silver.")
        sys.exit(1)

    if papers_df.empty:
        print("⚠️ Tầng Silver chưa có dữ liệu.")
        sys.exit(0)

    # 2. Section-Aware Chunking
    print(
        "\n[2/5] Đang chia đoạn theo Section bài báo và làm giàu ngữ cảnh (Contextual Chunking)..."
    )
    chunker = AcademicChunker(max_chunk_words=450, overlap_paragraphs=1)
    all_chunks = []

    for _, row in papers_df.iterrows():
        paper_record = row.to_dict()
        chunks = chunker.chunk_paper(paper_record)
        all_chunks.extend(chunks)

    print(f"      Tạo thành công {len(all_chunks)} chunks ngữ cảnh từ {len(papers_df)} bài báo.")
    for idx, c in enumerate(all_chunks[:5], 1):
        print(
            f"      - Chunk {idx}: [{c['section_type'].upper()}] {c['section_title']} ({c['word_count']} words)"
        )
    if len(all_chunks) > 5:
        print(f"      ... và {len(all_chunks) - 5} chunks khác.")

    # 3. Sinh Vector Embeddings bằng mô hình Nomic-embed-text-v1.5 cục bộ
    print(
        f"\n[3/5] Khởi động mô hình Nomic-embed-text-v1.5 và sinh Vector ({len(all_chunks)} chunks)..."
    )
    embedder = NomicEmbedder()
    print(f"      Thiết bị tăng tốc tính toán: {embedder.device}")

    chunk_texts = [c["context_text"] for c in all_chunks]
    embeddings = embedder.embed_documents(chunk_texts, batch_size=args.batch_size)

    # Gắn vector 768 chiều vào từng chunk
    for c, vec in zip(all_chunks, embeddings, strict=True):
        c["vector"] = vec

    print(f"      ✅ Đã sinh thành công {len(embeddings)} vectors 768 chiều.")

    # 4. Ghi dữ liệu vào LanceDB và đồng bộ lên Cloudflare R2 Gold
    print("\n[4/5] Lưu trữ chỉ mục vào LanceDB và đồng bộ lên R2 Gold Zone...")
    r2 = None if args.local else R2Client()
    lancedb_mgr = LanceDBManager(r2_client=r2)
    inserted_count = lancedb_mgr.insert_chunks(all_chunks)
    print(
        f"      ✅ Đã nạp {inserted_count} bản ghi vào LanceDB Table '{lancedb_mgr.DEFAULT_TABLE_NAME}'."
    )

    if not args.local:
        sync_res = lancedb_mgr.sync_to_r2(r2_prefix="gold/lancedb/")
        print(f"Synced {sync_res['synced_files']} files to {sync_res['r2_destination']}")

    # 5. Kiểm thử tìm kiếm Semantic Vector Search thực tế
    print("\n[5/5] Kiểm thử Semantic Vector Search thực tế trên Tầng Gold:")
    sample_query = (
        "How to improve OCR faithfulness and reduce hallucination in vision-language models?"
    )
    print(f'      🔍 Câu hỏi mẫu: "{sample_query}"')

    query_vec = embedder.embed_query(sample_query)
    search_results = lancedb_mgr.vector_search(query_vector=query_vec, limit=3)

    display_results = []
    for _, res in search_results.iterrows():
        # Cosine distance (càng nhỏ càng tương đồng, 0 là giống hệt)
        distance = res.get("_distance", 0.0)
        similarity = 1.0 - distance
        display_results.append(
            {
                "Score (Sim)": f"{similarity:.4f}",
                "Paper ID": res["paper_id"],
                "Section": f"{res['section_title']} ({res['section_type']})",
                "Snippet": res["text"][:120] + "...",
            }
        )

    print(tabulate(display_results, headers="keys", tablefmt="fancy_grid", showindex=False))

    duration = time.time() - start_time
    print("\n" + "=" * 75)
    print(f"🎉 TẦNG GOLD ĐÃ ĐƯỢC XÂY DỰNG HOÀN TẤT TRONG {duration:.2f} GIÂY!")
    print("=" * 75)


if __name__ == "__main__":
    main()
