"""End-to-End Scientific RAG Engine.

Coordinates Nomic Embeddings retrieval from Gold LanceDB and
contextual response generation via Qwen2.5-7B-Instruct GGUF.
"""

import logging
import re
import time
from typing import Any, Dict, Iterator, List, Optional, Tuple, Union

from src.indexing.embedder import NomicEmbedder
from src.indexing.lancedb_manager import LanceDBManager
from src.rag.llm_client import QwenGGUFEngine
from src.rag.prompt_templates import build_rag_messages

logger = logging.getLogger(__name__)


class ScientificRAGEngine:
    """Scientific Research Question-Answering RAG Engine."""

    def __init__(
        self,
        embedder: Optional[NomicEmbedder] = None,
        db_manager: Optional[LanceDBManager] = None,
        llm_engine: Optional[QwenGGUFEngine] = None,
    ):
        """Initializes components of the scientific RAG pipeline."""
        logger.info("[RAG] Initializing Scientific RAG Engine...")
        self.embedder = embedder or NomicEmbedder()
        self.db = db_manager or LanceDBManager()
        self.llm = llm_engine or QwenGGUFEngine()
        logger.info("[RAG] Scientific RAG Engine ready.")

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves most relevant scientific chunks from LanceDB."""
        t0 = time.time()
        query_vector = self.embedder.embed_query(query)

        filter_expr = None
        if category_filter:
            filter_expr = f"primary_category = '{category_filter}'"

        df = self.db.vector_search(
            query_vector=query_vector,
            limit=top_k,
            filter_expr=filter_expr,
        )

        results = df.to_dict(orient="records")
        elapsed = time.time() - t0
        logger.info(f"[RETRIEVE] Retrieved {len(results)} chunks in {elapsed:.3f}s for query: '{query}'")
        return results

    def answer(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
        max_tokens: int = 1536,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """Runs the full RAG pipeline: retrieval + reasoning + grounded answer."""
        retrieved_chunks = self.retrieve(query=query, top_k=top_k, category_filter=category_filter)

        if not retrieved_chunks:
            return {
                "query": query,
                "answer": "Dựa trên các tài liệu khoa học được cung cấp, không tìm thấy tài liệu phù hợp trong cơ sở dữ liệu.",
                "retrieved_chunks": [],
                "citations": [],
            }

        messages = build_rag_messages(query=query, retrieved_chunks=retrieved_chunks)

        t0 = time.time()
        answer_text = self.llm.generate(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        gen_time = time.time() - t0
        logger.info(f"[GENERATE] Answer generated in {gen_time:.2f}s ({len(answer_text)} chars)")

        # Trích xuất danh sách trích dẫn từ text
        citations = list(set(re.findall(r"\[Paper:\s*([^,\]]+),\s*Section:\s*([^\]]+)\]", answer_text)))

        return {
            "query": query,
            "answer": answer_text,
            "retrieved_chunks": retrieved_chunks,
            "citations": [{"paper_id": c[0].strip(), "section": c[1].strip()} for c in citations],
            "generation_time_seconds": round(gen_time, 2),
        }

    def answer_stream(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
        max_tokens: int = 1536,
        temperature: float = 0.2,
    ) -> Tuple[List[Dict[str, Any]], Iterator[str]]:
        """Streaming version of RAG answer generation."""
        retrieved_chunks = self.retrieve(query=query, top_k=top_k, category_filter=category_filter)
        messages = build_rag_messages(query=query, retrieved_chunks=retrieved_chunks)
        stream_iter = self.llm.generate_stream(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return retrieved_chunks, stream_iter
