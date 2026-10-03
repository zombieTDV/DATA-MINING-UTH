"""src/rag/indexer.py — Embedded LanceDB hybrid indexer (sentence-transformers dense embeddings + BM25 FTS) with Graph-RAG score blending."""
from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

import lancedb
import pandas as pd
from sentence_transformers import SentenceTransformer

from src.utils.logger import get_logger, ensure_log_dirs

ensure_log_dirs()
logger = get_logger("LanceDBHybridIndexer", log_file="logs/rag/indexer.log")


class LanceDBHybridIndexer:
    """
    Manages LanceDB vector and full-text (BM25) hybrid indexing:
    - Dense vector embeddings via SentenceTransformer ('all-MiniLM-L6-v2', 384 dimensions).
    - Lexical search via Tantivy-powered LanceDB FTS index.
    - Reciprocal Rank Fusion (RRF) for hybrid retrieval.
    - Graph-Augmented Reranking blending RRF score with Phase 3 PageRank.
    """

    DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"
    TABLE_NAME = "academic_chunks"

    def __init__(
        self,
        db_path: Path | str = "data/gold/lancedb",
        model_name: str = DEFAULT_MODEL_NAME,
        device: str | None = None,
    ):
        self.db_path = Path(db_path)
        self.db_path.mkdir(parents=True, exist_ok=True)
        self.db = lancedb.connect(str(self.db_path))
        self.model_name = model_name
        self._model: SentenceTransformer | None = None
        self._device = device

    @property
    def model(self) -> SentenceTransformer:
        """Lazy load SentenceTransformer model."""
        if self._model is None:
            logger.info("Loading SentenceTransformer model '%s'...", self.model_name)
            self._model = SentenceTransformer(self.model_name, device=self._device)
        return self._model

    def build_index(
        self,
        chunks_path: Path | str = "data/silver/chunks.parquet",
        batch_size: int = 64,
        max_chunks: int | None = None,
    ) -> Any:
        """
        Embed chunks from chunks.parquet and store in LanceDB with a Tantivy full-text index.
        """
        path = Path(chunks_path)
        if not path.exists():
            raise FileNotFoundError(f"Chunks file not found at {path}")

        chunks_df = pd.read_parquet(path)
        if max_chunks and len(chunks_df) > max_chunks:
            logger.info("Subsetting chunks from %d to %d for indexing...", len(chunks_df), max_chunks)
            abstracts = chunks_df[chunks_df["chunk_type"] == "abstract"]
            sections = chunks_df[chunks_df["chunk_type"] == "section"]

            # Prioritize landmark papers' sections by PageRank & citation count
            sections_sorted = sections.sort_values(by=["pagerank", "citation_count"], ascending=False)
            remaining_quota = max(0, max_chunks - len(abstracts))
            selected_sections = sections_sorted.head(remaining_quota)
            chunks_df = pd.concat([abstracts, selected_sections], ignore_index=True)
            logger.info("Selected %d abstracts + %d top-ranked technical sections.", len(abstracts), len(selected_sections))

        total_chunks = len(chunks_df)
        logger.info("Embedding and indexing %d chunks into LanceDB...", total_chunks)

        # Prepare texts to embed: context header + chunk text
        texts_to_embed = chunks_df["full_chunk_text"].tolist()

        logger.info("Computing dense vectors with %s (batch_size=%d)...", self.model_name, batch_size)
        embeddings = self.model.encode(
            texts_to_embed,
            batch_size=batch_size,
            show_progress_bar=True,
            normalize_embeddings=True,
        )

        # Prepare records for LanceDB using direct DataFrame assignment (10x faster)
        chunks_df = chunks_df.copy()
        chunks_df["vector"] = list(embeddings)
        chunks_df["id"] = chunks_df["chunk_id"].astype(str)

        # Overwrite or create LanceDB table
        table = self.db.create_table(self.TABLE_NAME, data=chunks_df, mode="overwrite")
        logger.info("Created table '%s' with %d records.", self.TABLE_NAME, len(chunks_df))

        # Create Tantivy Full-Text Index (BM25)
        try:
            table.create_fts_index("text", replace=True)
            logger.info("Built Tantivy BM25 Full-Text Search index on column 'text'.")
        except Exception as e:
            logger.warning("FTS index build warning: %s", e)

        return table

    def get_table(self) -> Any:
        """Retrieve the LanceDB academic chunks table."""
        try:
            return self.db.open_table(self.TABLE_NAME)
        except Exception:
            raise ValueError(f"Table '{self.TABLE_NAME}' not found in {self.db_path}. Build index first.")

    def hybrid_search(
        self,
        query: str,
        top_k: int = 10,
        candidate_pool: int = 40,
        graph_boost_weight: float = 0.25,
    ) -> list[dict[str, Any]]:
        """
        Execute Hybrid Search (Dense Vector + BM25 Lexical) with Reciprocal Rank Fusion (RRF)
        and Graph-RAG PageRank score augmentation.
        """
        table = self.get_table()

        # 1. Dense Vector Search
        query_vec = self.model.encode(query, normalize_embeddings=True).tolist()
        dense_results = table.search(query_vec).limit(candidate_pool).to_list()

        # 2. BM25 Lexical Search (FTS)
        try:
            fts_results = table.search(query, query_type="fts").limit(candidate_pool).to_list()
        except Exception as e:
            logger.warning("FTS search unavailable or failed (%s); falling back to dense-only.", e)
            fts_results = []

        # 3. Reciprocal Rank Fusion (RRF)
        # RRF_Score = 1 / (60 + rank_dense) + 1 / (60 + rank_bm25)
        k_const = 60.0
        doc_scores: dict[str, float] = {}
        doc_records: dict[str, dict[str, Any]] = {}

        for rank, item in enumerate(dense_results):
            cid = item["id"]
            doc_scores[cid] = doc_scores.get(cid, 0.0) + (1.0 / (k_const + rank + 1))
            doc_records[cid] = item

        for rank, item in enumerate(fts_results):
            cid = item["id"]
            doc_scores[cid] = doc_scores.get(cid, 0.0) + (1.0 / (k_const + rank + 1))
            if cid not in doc_records:
                doc_records[cid] = item

        if not doc_scores:
            return []

        # Normalize RRF scores
        max_rrf = max(doc_scores.values()) or 1.0
        for cid in doc_scores:
            doc_scores[cid] = doc_scores[cid] / max_rrf

        # 4. Graph-RAG: Blend RRF score with PageRank
        # Apply logarithmic PageRank scale so massive papers don't completely drown out specific technical matches
        final_candidates: list[dict[str, Any]] = []
        for cid, rrf_norm in doc_scores.items():
            record = doc_records[cid]
            pr = float(record.get("pagerank", 0.0001))
            pr_scaled = math.log1p(pr * 1000.0)

            final_candidates.append({
                "record": record,
                "rrf_score": rrf_norm,
                "pr_scaled": pr_scaled,
            })

        max_pr = max(c["pr_scaled"] for c in final_candidates) or 1.0

        scored_results: list[dict[str, Any]] = []
        for c in final_candidates:
            record = c["record"]
            norm_pr = c["pr_scaled"] / max_pr
            final_score = (1.0 - graph_boost_weight) * c["rrf_score"] + (graph_boost_weight * norm_pr)

            scored_item = dict(record)
            scored_item["score"] = round(final_score, 4)
            scored_item["rrf_score"] = round(c["rrf_score"], 4)
            scored_item["pagerank_norm"] = round(norm_pr, 4)
            # Remove raw vector from returned payload to keep responses lightweight
            scored_item.pop("vector", None)
            scored_results.append(scored_item)

        # Sort by final score descending
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:top_k]
