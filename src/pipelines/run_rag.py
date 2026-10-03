"""Scientific Literature RAG Pipeline Runner.

Executes academic research Q&A using Nomic Embeddings over Gold LanceDB
and Qwen2.5-7B-Instruct GGUF inference on Apple Silicon Metal.

Usage:
    python -m src.pipelines.run_rag --query "How does self-attention mechanism work in Transformers?"
    python -m src.pipelines.run_rag --interactive
"""

import argparse
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import settings
from src.rag.rag_engine import ScientificRAGEngine
from src.utils.logger import setup_pipeline_logging


def parse_args():
    parser = argparse.ArgumentParser(description="Scientific Literature RAG Pipeline Runner")
    parser.add_argument(
        "--query",
        type=str,
        default=None,
        help="Single research question to ask.",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Launch interactive terminal Q&A mode.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of relevant chunks to retrieve from LanceDB (default: 5).",
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Optional primary_category filter (e.g., cs.AI, cs.LG, cs.CV, cs.CL).",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Decoding temperature (default: 0.2 for strict academic answers).",
    )
    parser.add_argument(
        "--stream",
        action="store_true",
        default=True,
        help="Stream tokens in real-time (default: True).",
    )
    return parser.parse_args()


def display_retrieved_chunks(chunks):
    print("\n" + "=" * 80)
    print(f"[RETRIEVED CONTEXT] Found {len(chunks)} relevant chunks in Gold Lakehouse:")
    print("=" * 80)
    for idx, c in enumerate(chunks, 1):
        dist = c.get("_distance", 0.0)
        sim = 1.0 - dist
        print(f"[{idx}] Paper ID: {c.get('paper_id')} | Category: {c.get('primary_category')}")
        print(f"    Title: {c.get('title')}")
        print(f"    Section: {c.get('section_title')} (Type: {c.get('section_type')}) | Cosine Sim: {sim:.4f}")
        preview = c.get('text', '').replace('\n', ' ')[:160]
        print(f"    Excerpt: {preview}...\n")
    print("=" * 80)


def run_single_query(engine: ScientificRAGEngine, query: str, top_k: int, category: str, temperature: float, stream: bool):
    print(f"\n[QUERY] {query}")
    if category:
        print(f"[FILTER] Category: {category}")
    print(f"[CONFIG] Top-K: {top_k} | Temp: {temperature} | Model: {settings.LLM_MODEL_PATH.name}")

    if stream:
        retrieved_chunks, token_stream = engine.answer_stream(
            query=query,
            top_k=top_k,
            category_filter=category,
            temperature=temperature,
        )
        display_retrieved_chunks(retrieved_chunks)

        print("\n[SCIENTIFIC ANSWER]\n")
        full_text = []
        t0 = time.time()
        for token in token_stream:
            sys.stdout.write(token)
            sys.stdout.flush()
            full_text.append(token)
        gen_time = time.time() - t0
        print(f"\n\n[PERFORMANCE] Generated in {gen_time:.2f}s (~{len(''.join(full_text).split()) / max(gen_time, 0.01):.1f} words/s)")
    else:
        result = engine.answer(
            query=query,
            top_k=top_k,
            category_filter=category,
            temperature=temperature,
        )
        display_retrieved_chunks(result["retrieved_chunks"])
        print("\n[SCIENTIFIC ANSWER]\n")
        print(result["answer"])
        print(f"\n[PERFORMANCE] Generated in {result['generation_time_seconds']}s")
        if result["citations"]:
            print("\n[PARSED CITATIONS]")
            for cit in result["citations"]:
                print(f"  - Paper: {cit['paper_id']} | Section: {cit['section']}")


def interactive_mode(engine: ScientificRAGEngine, top_k: int, category: str, temperature: float):
    print("\n" + "=" * 80)
    print("[INTERACTIVE RAG MODE] Enter your scientific question (or 'exit' to quit):")
    print("=" * 80)
    while True:
        try:
            query = input("\n[INPUT QUESTION] > ").strip()
            if not query:
                continue
            if query.lower() in ("exit", "quit", "q"):
                print("[INFO] Exiting interactive session.")
                break
            run_single_query(
                engine=engine,
                query=query,
                top_k=top_k,
                category=category,
                temperature=temperature,
                stream=True,
            )
        except (KeyboardInterrupt, EOFError):
            print("\n[INFO] Session interrupted by user. Exiting.")
            break


def main():
    args = parse_args()
    logger, log_path = setup_pipeline_logging(pipeline_name="rag_query")
    print(f"[SYSTEM] Log file initialized at: {log_path}")

    # Khởi tạo RAG Engine
    engine = ScientificRAGEngine()

    if args.interactive:
        interactive_mode(
            engine=engine,
            top_k=args.top_k,
            category=args.category,
            temperature=args.temperature,
        )
    elif args.query:
        run_single_query(
            engine=engine,
            query=args.query,
            top_k=args.top_k,
            category=args.category,
            temperature=args.temperature,
            stream=args.stream,
        )
    else:
        # Default demo query if nothing is passed
        default_query = "What are the common strategies to improve faithfulness in text classification explanations?"
        print(f"[INFO] No query specified. Running default benchmark question:")
        run_single_query(
            engine=engine,
            query=default_query,
            top_k=args.top_k,
            category=args.category,
            temperature=args.temperature,
            stream=args.stream,
        )


if __name__ == "__main__":
    main()
