"""Offline fixture -> HTML parsing -> Silver -> chunking -> diagnostic vector search.

Vectors are deterministic token hashes, not Nomic embeddings or RAG quality evidence.
"""

import argparse
import datetime
import hashlib
import json
import math
from pathlib import Path

from src.config.settings import settings
from src.indexing.chunker import AcademicChunker
from src.storage.duckdb_engine import DuckDBEngine
from src.transformation.html_parser import AcademicHTMLParser
from src.transformation.silver_writer import SilverLakehouseWriter


def diagnostic_vector(text, dimensions=32):
    vector = [0.0] * dimensions
    for word in text.lower().split():
        index = int.from_bytes(hashlib.sha256(word.encode()).digest()[:4], "big") % dimensions
        vector[index] += 1
    norm = math.sqrt(sum(v * v for v in vector)) or 1
    return [v / norm for v in vector]


def run_demo(output_dir):
    from src.indexing.lancedb_manager import LanceDBManager

    output_dir = Path(output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    writer = SilverLakehouseWriter(local_silver_dir=output_dir / "silver", local_only=True)
    parser = AcademicHTMLParser()
    papers = []
    for index, topic in enumerate(
        ("retrieval augmented generation", "scientific citation networks")
    ):
        meta = {
            "paper_id": f"demo-{index}",
            "title": f"Synthetic {topic}",
            "abstract": f"We study {topic} using a reproducible scientific data pipeline.",
            "authors": ["Synthetic Author"],
            "categories": ["cs.AI"],
            "published_date": "2025-01-01",
        }
        html = f'<article><h1>{meta["title"]}</h1><section class="ltx_section" id="S1"><h2>Methods</h2><p>Our approach uses {topic} to analyze research papers and verify storage integrity with deterministic checks.</p></section></article>'
        papers.append(writer.prepare_record(meta, parser.parse(html)))
    saved = writer.save_and_upload_parquet(papers)
    with DuckDBEngine(silver_dir=output_dir / "silver") as engine:
        rows = engine.query_silver_local()
    chunks = [chunk for paper in papers for chunk in AcademicChunker().chunk_paper(paper)]
    for chunk in chunks:
        chunk["vector"] = diagnostic_vector(chunk["text"])
    manager = LanceDBManager(db_path=output_dir / "gold")
    manager.insert_chunks(chunks)
    manager.insert_chunks(chunks)  # Verify rerunning does not duplicate chunk IDs.
    count = manager.db.open_table(manager.DEFAULT_TABLE_NAME).count_rows()
    if count != len(chunks) or len(rows) != len(papers):
        raise RuntimeError("Demo row counts failed")
    results = manager.vector_search(diagnostic_vector("retrieval augmented generation"), limit=2)
    report = {
        "fixture": "synthetic",
        "embedding": "diagnostic token hashes; not semantic embeddings",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "paper_count": len(rows),
        "chunk_count": count,
        "silver_sha256": saved["sha256"],
        "search_results": results[["chunk_id", "paper_id", "_distance"]].to_dict(orient="records"),
    }
    report_path = output_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path)
    args = parser.parse_args()
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    output = args.output_dir or settings.ROOT_DIR / "experiments" / "runs" / f"{timestamp}_demo"
    print(f"Demo report: {run_demo(output)}")


if __name__ == "__main__":
    main()
