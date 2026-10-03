"""src/rag/chunker.py — Dual-granularity semantic chunking with contextual prefix headers and graph metrics."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from src.utils.logger import get_logger, ensure_log_dirs

ensure_log_dirs()
logger = get_logger("SemanticChunker", log_file="logs/rag/chunker.log")


class SemanticChunker:
    """
    Constructs dual-granularity chunks for retrieval:
    1. Corpus-wide breadth: Abstract chunks across all 10,000 papers.
    2. Deep technical sections: Sliding-window chunks for papers with parsed full-text sections.
    Enriches every chunk with contextual prefix headers (`[Title] [Year] [Section]`)
    and attaches PageRank / Louvain community metadata from Phase 3 graphs.
    """

    def __init__(
        self,
        silver_dir: Path | str = "data/silver",
        gold_dir: Path | str = "data/gold",
        chunk_size: int = 1500,  # ~350-400 words
        chunk_overlap: int = 250, # ~50-60 words
    ):
        self.silver_dir = Path(silver_dir)
        self.gold_dir = Path(gold_dir)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> list[str]:
        """Sliding-window character chunking respecting paragraph/sentence breaks."""
        if len(text) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            if end < text_len:
                # Try to break at a newline or period
                break_point = text.rfind("\n", start, end)
                if break_point == -1 or break_point < start + (self.chunk_size // 2):
                    break_point = text.rfind(". ", start, end)
                if break_point != -1 and break_point > start + (self.chunk_size // 2):
                    end = break_point + 1

            chunk_str = text[start:end].strip()
            if len(chunk_str) >= 40:
                chunks.append(chunk_str)

            if end >= text_len:
                break
            start = max(start + 1, end - self.chunk_overlap)

        return chunks

    def build_chunks(
        self,
        papers_path: Path | str | None = None,
        sections_path: Path | str | None = None,
        metrics_path: Path | str | None = None,
        output_path: Path | str | None = None,
    ) -> pd.DataFrame:
        """
        Build dual-granularity chunks enriched with graph metrics and save to chunks.parquet.
        """
        p_path = Path(papers_path) if papers_path else self.silver_dir / "papers.parquet"
        s_path = Path(sections_path) if sections_path else self.silver_dir / "sections.parquet"
        m_path = Path(metrics_path) if metrics_path else self.gold_dir / "graphs" / "citation_metrics.parquet"
        out_path = Path(output_path) if output_path else self.silver_dir / "chunks.parquet"

        if not p_path.exists():
            logger.error("Papers parquet file not found at %s", p_path)
            return pd.DataFrame()

        papers_df = pd.read_parquet(p_path)
        metrics_lookup = {}
        if m_path.exists():
            m_df = pd.read_parquet(m_path)
            metrics_lookup = m_df.set_index("paper_id").to_dict(orient="index")
            logger.info("Loaded graph metrics for %d papers from %s", len(metrics_lookup), m_path)

        paper_meta = {}
        for _, row in papers_df.iterrows():
            pid = str(row["paper_id"])
            m = metrics_lookup.get(pid, {})
            paper_meta[pid] = {
                "title": str(row.get("title") or "Untitled"),
                "year": int(row.get("year") or 2024),
                "abstract": str(row.get("abstract") or ""),
                "citation_count": int(row.get("citation_count") or 0),
                "pagerank": float(m.get("pagerank", 0.0001)),
                "community_id": int(m.get("community_id", -1)),
                "doi": str(row.get("doi") or ""),
            }

        all_chunks: list[dict[str, Any]] = []

        # 1. Generate Abstract chunks for all papers (Corpus breadth)
        logger.info("Generating abstract-level chunks for %d papers...", len(paper_meta))
        for pid, meta in paper_meta.items():
            abstract = meta["abstract"].strip()
            if not abstract or len(abstract) < 30:
                continue

            chunk_id = f"{pid}_c000"
            context_header = f"[{meta['title']}] [{meta['year']}] [Abstract]"
            all_chunks.append({
                "chunk_id": chunk_id,
                "paper_id": pid,
                "title": meta["title"],
                "year": meta["year"],
                "section_title": "Abstract",
                "context_header": context_header,
                "text": abstract,
                "full_chunk_text": f"{context_header}\n{abstract}",
                "pagerank": meta["pagerank"],
                "citation_count": meta["citation_count"],
                "community_id": meta["community_id"],
                "doi": meta["doi"],
                "chunk_type": "abstract",
            })

        # 2. Generate Section chunks for papers with parsed full-text sections (Technical depth)
        if s_path.exists():
            sections_df = pd.read_parquet(s_path)
            logger.info("Processing %d full-text sections for sliding-window chunking...", len(sections_df))

            chunk_counters: dict[str, int] = {}
            default_meta = {
                "title": "Untitled",
                "year": 2024,
                "pagerank": 0.0001,
                "citation_count": 0,
                "community_id": -1,
                "doi": "",
            }

            for row in sections_df.itertuples(index=False):
                pid = str(row.paper_id)
                sec_title = str(getattr(row, "section_title", "") or "Section").strip()
                sec_text = str(getattr(row, "text", "") or "").strip()
                if not sec_text:
                    continue

                meta = paper_meta.get(pid, default_meta)
                c_idx = chunk_counters.get(pid, 1)

                splits = self.split_text(sec_text)
                for split in splits:
                    chunk_id = f"{pid}_c{c_idx:03d}"
                    context_header = f"[{meta['title']}] [{meta['year']}] [{sec_title}]"
                    all_chunks.append({
                        "chunk_id": chunk_id,
                        "paper_id": pid,
                        "title": meta["title"],
                        "year": meta["year"],
                        "section_title": sec_title,
                        "context_header": context_header,
                        "text": split,
                        "full_chunk_text": f"{context_header}\n{split}",
                        "pagerank": meta["pagerank"],
                        "citation_count": meta["citation_count"],
                        "community_id": meta["community_id"],
                        "doi": meta["doi"],
                        "chunk_type": "section",
                    })
                    c_idx += 1
                chunk_counters[pid] = c_idx

        chunks_df = pd.DataFrame(all_chunks)
        if not chunks_df.empty:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            chunks_df.to_parquet(out_path, index=False)
            logger.info("Successfully generated %d total chunks -> saved to %s", len(chunks_df), out_path)
        else:
            logger.warning("No chunks generated.")

        return chunks_df
