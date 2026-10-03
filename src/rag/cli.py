"""src/rag/cli.py — Command-Line Interface for the Hybrid Graph-RAG Pipeline."""
from __future__ import annotations

import argparse
import logging
import sys

from src.rag.chunker import SemanticChunker
from src.rag.indexer import LanceDBHybridIndexer
from src.rag.parser import PDFSectionParser
from src.rag.service import RAGService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("RAGCLI")


def main() -> None:
    parser = argparse.ArgumentParser(description="Hybrid Graph-RAG Pipeline CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available pipeline commands")

    # Command: parse-sections
    p_parse = subparsers.add_parser("parse-sections", help="Parse vaulted PDFs into silver/sections.parquet")
    p_parse.add_argument("--workers", type=int, default=10, help="Number of parallel worker processes")
    p_parse.add_argument("--batch-size", type=int, default=50, help="Batch size for checkpoint flushing")
    p_parse.add_argument("--timeout", type=float, default=25.0, help="Per-PDF timeout in seconds")

    # Command: build-chunks
    p_chunk = subparsers.add_parser("build-chunks", help="Generate dual-granularity chunks into silver/chunks.parquet")
    p_chunk.add_argument("--chunk-size", type=int, default=1500, help="Max chunk size in chars")
    p_chunk.add_argument("--overlap", type=int, default=250, help="Overlap size in chars")

    # Command: build-index
    p_index = subparsers.add_parser("build-index", help="Embed chunks and build LanceDB hybrid index")
    p_index.add_argument("--batch-size", type=int, default=64, help="Embedding batch size")
    p_index.add_argument("--max-chunks", type=int, default=None, help="Optional limit on chunks to index")

    # Command: query
    p_query = subparsers.add_parser("query", help="Query the RAG system")
    p_query.add_argument("question", type=str, help="Research question to ask")
    p_query.add_argument("--top-k", type=int, default=5, help="Number of chunks to retrieve")
    p_query.add_argument("--graph-boost", type=float, default=0.25, help="PageRank score boost weight (0.0 to 1.0)")
    p_query.add_argument("--backend", type=str, default="mock", choices=["mock", "gemini"], help="LLM backend")

    # Command: run-pipeline
    p_pipe = subparsers.add_parser("run-pipeline", help="Run full RAG pipeline: parse -> chunk -> index -> benchmark query")
    p_pipe.add_argument("--workers", type=int, default=10, help="Number of parallel worker processes for PDF parsing")
    p_pipe.add_argument("--max-chunks", type=int, default=None, help="Optional chunk limit for indexing")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "parse-sections":
        logger.info("=== [Step 1] Parsing Vaulted PDFs into Sections ===")
        pdf_parser = PDFSectionParser()
        df = pdf_parser.parse_all_vaulted_pdfs(
            max_workers=args.workers,
            batch_size=args.batch_size,
            per_pdf_timeout=args.timeout,
        )
        logger.info("Parsing complete: %d sections extracted.", len(df))

    elif args.command == "build-chunks":
        logger.info("=== [Step 2] Building Dual-Granularity Chunks ===")
        chunker = SemanticChunker(chunk_size=args.chunk_size, chunk_overlap=args.overlap)
        df = chunker.build_chunks()
        logger.info("Chunking complete: %d chunks created.", len(df))

    elif args.command == "build-index":
        logger.info("=== [Step 3] Building LanceDB Hybrid Index ===")
        indexer = LanceDBHybridIndexer()
        table = indexer.build_index(batch_size=args.batch_size, max_chunks=args.max_chunks)
        logger.info("Indexing complete: table '%s' has %d rows.", indexer.TABLE_NAME, len(table))

    elif args.command == "query":
        service = RAGService()
        response = service.query(
            question=args.question,
            top_k=args.top_k,
            graph_boost=args.graph_boost,
            llm_backend=args.backend,
        )

        print("\n" + "=" * 70)
        print(f"QUESTION: {response.question}")
        print("=" * 70)
        print(f"\nANSWER ({response.llm_backend}):\n{response.answer}\n")
        print("-" * 70)
        print(f"Verified Citations   : {response.verified_citations}")
        print(f"Hallucinated Citations: {response.hallucinated_citations}")
        print(f"Grounded Status      : {'✓ GROUNDED' if response.is_fully_grounded else '⚠ CAUTION'}")
        print(f"Latency              : {response.query_time_ms} ms")
        print(f"Retrieved Chunks     : {len(response.retrieved_chunks)}")
        print("=" * 70 + "\n")

    elif args.command == "run-pipeline":
        logger.info("======================================================================")
        logger.info("             HYBRID GRAPH-RAG END-TO-END PIPELINE                    ")
        logger.info("======================================================================")

        # 1. Parse
        pdf_parser = PDFSectionParser()
        sections_df = pdf_parser.parse_all_vaulted_pdfs(max_workers=args.workers)

        # 2. Chunk
        chunker = SemanticChunker()
        chunks_df = chunker.build_chunks()

        # 3. Index
        indexer = LanceDBHybridIndexer()
        indexer.build_index(max_chunks=args.max_chunks)

        # 4. Benchmark Query
        sample_q = "How do self-attention mechanisms and Transformers improve sequence modeling?"
        logger.info("Running benchmark query: '%s'", sample_q)
        service = RAGService(indexer=indexer)
        response = service.query(sample_q, top_k=5, graph_boost=0.25)

        print("\n" + "=" * 70)
        print(f"BENCHMARK QUERY: {response.question}")
        print("=" * 70)
        print(f"\nANSWER:\n{response.answer}\n")
        print("-" * 70)
        print(f"Verified Citations: {response.verified_citations}")
        print(f"Grounded Status   : {'✓ GROUNDED' if response.is_fully_grounded else '⚠ CAUTION'}")
        print(f"Latency           : {response.query_time_ms} ms")
        print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
