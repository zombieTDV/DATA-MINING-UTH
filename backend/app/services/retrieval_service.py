"""
backend/app/services/retrieval_service.py
-----------------------------------------
Vector and Full-Text Retrieval Service wrapping LanceDB Gold Table.
"""

import logging
from typing import List, Optional
import lancedb
from backend.app.core.config import settings
from backend.app.schemas.search import ChunkDto, SearchRequest

logger = logging.getLogger("retrieval_service")


class RetrievalService:
    def __init__(self):
        self.db = None
        self.table = None
        self._ready = False
        self._init_db()

    def _init_db(self):
        try:
            logger.info("[RETRIEVAL] Connecting to LanceDB at: %s", settings.LANCEDB_URI)
            self.db = lancedb.connect(settings.LANCEDB_URI)
            self.table = self.db.open_table(settings.LANCEDB_TABLE)
            self._ready = True
            logger.info("[RETRIEVAL] [SUCCESS] Opened LanceDB table: %s (%d rows)", settings.LANCEDB_TABLE, len(self.table))
        except Exception as e:
            logger.error("[RETRIEVAL] [ERROR] Failed to connect to LanceDB: %s", str(e))
            self._ready = False

    def is_ready(self) -> bool:
        return self._ready and self.table is not None

    def search(self, req: SearchRequest) -> List[ChunkDto]:
        if not self.is_ready():
            logger.warning("[RETRIEVAL] LanceDB table not ready. Returning empty list.")
            return []

        try:
            k = req.top_k or 5
            mode = (req.mode or "fts").lower()

            # Execute search on LanceDB
            query_builder = self.table.search(req.query)
            if req.category:
                query_builder = query_builder.where(f"primary_category = '{req.category}'")

            rows = query_builder.limit(k).to_pandas()

            results: List[ChunkDto] = []
            for _, r in rows.iterrows():
                raw_authors = r.get("authors")
                if hasattr(raw_authors, "tolist"):
                    authors_list = [str(a) for a in raw_authors.tolist()]
                elif isinstance(raw_authors, list):
                    authors_list = [str(a) for a in raw_authors]
                else:
                    authors_list = [str(raw_authors)] if raw_authors else []

                results.append(
                    ChunkDto(
                        chunk_id=str(r.get("chunk_id", "")),
                        paper_id=str(r.get("paper_id", "")),
                        title=str(r.get("title", "")),
                        text=str(r.get("text", "")),
                        abstract=str(r.get("abstract", "")) if r.get("abstract") else None,
                        authors=authors_list,
                        year=int(r.get("year", 2026)) if r.get("year") else 2026,
                        primary_category=str(r.get("primary_category", "")) if r.get("primary_category") else None,
                        section_title=str(r.get("section_title", "")) if r.get("section_title") else None,
                        score=float(r.get("_score", 0.85)) if "_score" in r else 0.85,
                        source=f"{settings.LANCEDB_URI}/{settings.LANCEDB_TABLE}",
                    )
                )
            return results
        except Exception as e:
            logger.error("[RETRIEVAL] Search execution failed: %s", str(e))
            return []

    def get_paper(self, paper_id: str) -> List[ChunkDto]:
        if not self.is_ready():
            return []
        try:
            rows = self.table.search().where(f"paper_id = '{paper_id}'").limit(20).to_pandas()
            results = []
            for _, r in rows.iterrows():
                results.append(
                    ChunkDto(
                        chunk_id=str(r.get("chunk_id", "")),
                        paper_id=str(r.get("paper_id", "")),
                        title=str(r.get("title", "")),
                        text=str(r.get("text", "")),
                        primary_category=str(r.get("primary_category", "")),
                        section_title=str(r.get("section_title", "")),
                        source=f"{settings.LANCEDB_URI}/{settings.LANCEDB_TABLE}",
                    )
                )
            return results
        except Exception as e:
            logger.error("[RETRIEVAL] Error fetching paper %s: %s", paper_id, str(e))
            return []


retrieval_service = RetrievalService()
