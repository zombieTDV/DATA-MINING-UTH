"""src/rag/service.py — Retrieval-Augmented Generation service with strict inline citation verification."""
from __future__ import annotations

from dataclasses import dataclass, field
import logging
import os
from pathlib import Path
import re
import time
from typing import Any

from src.rag.indexer import LanceDBHybridIndexer
from src.utils.logger import get_logger, log_audit_event, ensure_log_dirs

ensure_log_dirs()
logger = get_logger("RAGService", log_file="logs/rag/query_service.log")


@dataclass
class RAGResponse:
    """Encapsulates a completed RAG query result and citation verification report."""
    question: str
    answer: str
    retrieved_chunks: list[dict[str, Any]]
    verified_citations: list[str] = field(default_factory=list)
    hallucinated_citations: list[str] = field(default_factory=list)
    query_time_ms: float = 0.0
    llm_backend: str = "mock"

    @property
    def is_fully_grounded(self) -> bool:
        """True if all cited chunks exist in the retrieved context and at least one citation was made."""
        return len(self.verified_citations) > 0 and len(self.hallucinated_citations) == 0


class RAGService:
    """
    Orchestrates the complete RAG loop:
    1. Hybrid retrieval (Dense vector + BM25 + Graph-RAG PageRank boost).
    2. Context assembly with structured chunk IDs.
    3. LLM generation with inline citations.
    4. Programmatic citation verification to detect and prevent hallucinated references.
    """

    CITATION_PATTERN = re.compile(r"\[(openalex:W\d+_c\d+)\]")

    def __init__(
        self,
        indexer: LanceDBHybridIndexer | None = None,
        db_path: Path | str = "data/gold/lancedb",
    ):
        self.indexer = indexer or LanceDBHybridIndexer(db_path=db_path)

    def assemble_context(self, retrieved_chunks: list[dict[str, Any]]) -> str:
        """Assemble structured context blocks containing explicit chunk IDs and headers."""
        context_blocks = []
        for i, chunk in enumerate(retrieved_chunks, start=1):
            cid = chunk["id"]
            title = chunk.get("title", "Untitled")
            year = chunk.get("year", "N/A")
            sec = chunk.get("section_title", "Section")
            text = chunk.get("text", "")
            pr = chunk.get("pagerank", 0.0)

            block = (
                f"--- SOURCE [{cid}] ---\n"
                f"Paper: {title} ({year}) | Section: {sec} | Centrality PR: {pr:.5f}\n"
                f"Content:\n{text}\n"
            )
            context_blocks.append(block)

        return "\n".join(context_blocks)

    def build_prompt(self, question: str, context: str) -> str:
        """Construct the grounded prompt with explicit citation rules."""
        return (
            "You are a rigorous scientific research assistant in Data Mining and Large Language Models.\n"
            "Answer the user's question using ONLY the provided academic literature sources below.\n\n"
            "STRICT CITATION RULES:\n"
            "1. Every factual statement, methodology, metric, or finding must be directly followed by its inline citation "
            "using the exact chunk ID format: [openalex:W..._c...].\n"
            "2. Never cite paper titles or external sources that are not in the provided sources list.\n"
            "3. If the context does not contain sufficient technical details to answer the question, explicitly state what is missing.\n\n"
            f"SOURCES:\n{context}\n\n"
            f"QUESTION:\n{question}\n\n"
            "ANSWER:"
        )

    def verify_citations(self, answer_text: str, retrieved_chunk_ids: set[str]) -> tuple[list[str], list[str]]:
        """
        Scan generated answer for bracketed chunk citations and verify whether they
        exist in the retrieved candidate pool.
        """
        cited_ids = self.CITATION_PATTERN.findall(answer_text)
        unique_cited = list(dict.fromkeys(cited_ids))

        verified = []
        hallucinated = []
        for cid in unique_cited:
            if cid in retrieved_chunk_ids:
                verified.append(cid)
            else:
                hallucinated.append(cid)

        return verified, hallucinated

    def _generate_mock_answer(self, question: str, retrieved_chunks: list[dict[str, Any]]) -> str:
        """
        Deterministic mock generator for local testing and offline execution.
        Synthesizes a grounded answer referencing the top retrieved chunks.
        """
        if not retrieved_chunks:
            return "No relevant literature could be retrieved from the index for this query."

        top_chunk = retrieved_chunks[0]
        c1_id = top_chunk["id"]
        c1_title = top_chunk.get("title", "Literature source")
        c1_sec = top_chunk.get("section_title", "Abstract")
        snippet1 = top_chunk.get("text", "")[:180].replace("\n", " ").strip()

        second_part = ""
        if len(retrieved_chunks) > 1:
            c2 = retrieved_chunks[1]
            c2_id = c2["id"]
            c2_title = c2.get("title", "")
            snippet2 = c2.get("text", "")[:140].replace("\n", " ").strip()
            second_part = f" Furthermore, complementary findings in '{c2_title}' indicate that {snippet2}... [{c2_id}]."

        answer = (
            f"Based on the retrieved academic corpus, '{c1_title}' ({c1_sec}) demonstrates that {snippet1}... [{c1_id}]."
            f"{second_part} All conclusions are verified against the cited literature chunks."
        )
        return answer

    def _generate_gemini_answer(self, prompt: str) -> str:
        """Generate answer via Google Gemini API if GEMINI_API_KEY is configured."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")

        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            return response.text or ""
        except ImportError:
            raise ImportError("google-genai is not installed. Run 'pip install google-genai'.")

    def query(
        self,
        question: str,
        top_k: int = 5,
        graph_boost: float = 0.25,
        llm_backend: str = "mock",
    ) -> RAGResponse:
        """
        Execute full RAG query lifecycle: retrieval -> prompt -> generation -> citation verification.
        """
        t0 = time.perf_counter()

        # 1. Hybrid Retrieval with Graph-RAG
        retrieved_chunks = self.indexer.hybrid_search(
            query=question,
            top_k=top_k,
            graph_boost_weight=graph_boost,
        )

        retrieved_ids = {c["id"] for c in retrieved_chunks}
        context = self.assemble_context(retrieved_chunks)
        prompt = self.build_prompt(question, context)

        # 2. Generation
        if llm_backend.lower() == "gemini":
            try:
                answer = self._generate_gemini_answer(prompt)
            except Exception as e:
                logger.warning("Gemini generation failed (%s); falling back to mock generator.", e)
                answer = self._generate_mock_answer(question, retrieved_chunks)
                llm_backend = "mock_fallback"
        else:
            answer = self._generate_mock_answer(question, retrieved_chunks)

        # 3. Verification
        verified, hallucinated = self.verify_citations(answer, retrieved_ids)

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        log_audit_event("RAG_QUERY", "RAGService", {
            "question": question,
            "backend": llm_backend,
            "retrieved_count": len(retrieved_chunks),
            "verified_citations": verified,
            "hallucinated_citations": hallucinated,
            "is_grounded": (len(hallucinated) == 0 and len(verified) > 0),
            "query_time_ms": round(elapsed_ms, 2),
        })

        return RAGResponse(
            question=question,
            answer=answer,
            retrieved_chunks=retrieved_chunks,
            verified_citations=verified,
            hallucinated_citations=hallucinated,
            query_time_ms=round(elapsed_ms, 2),
            llm_backend=llm_backend,
        )
