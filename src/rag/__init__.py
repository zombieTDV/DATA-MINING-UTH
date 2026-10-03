"""Scientific RAG module for research question answering."""

from src.rag.prompt_templates import (
    SCIENTIFIC_RAG_SYSTEM_PROMPT,
    build_rag_messages,
    format_scientific_context,
)
from src.rag.llm_client import QwenGGUFEngine
from src.rag.rag_engine import ScientificRAGEngine

__all__ = [
    "SCIENTIFIC_RAG_SYSTEM_PROMPT",
    "build_rag_messages",
    "format_scientific_context",
    "QwenGGUFEngine",
    "ScientificRAGEngine",
]
