"""Bounded section-aware chunks with paper context and optional overlap."""

import json
from typing import Any, Dict, List


class AcademicChunker:
    def __init__(self, max_chunk_words: int = 500, overlap_paragraphs: int = 1):
        if max_chunk_words < 1 or overlap_paragraphs < 0:
            raise ValueError("max_chunk_words must be positive and overlap nonnegative")
        self.max_chunk_words = max_chunk_words
        self.overlap_paragraphs = overlap_paragraphs

    def chunk_paper(self, paper_record: Dict[str, Any]) -> List[Dict[str, Any]]:
        raw = paper_record.get("sections_json", "[]")
        sections = json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(sections, list):
            raise ValueError("sections_json must represent a list")
        abstract = paper_record.get("abstract", "")
        sources = []
        if abstract:
            sources.append(("abstract", "Abstract", "abstract", abstract, [abstract]))
        for index, section in enumerate(sections):
            kind = section.get("section_type", "other")
            if kind == "abstract" and abstract:
                continue
            text = section.get("content", "")
            if text.strip():
                sources.append(
                    (
                        f"sec{index}",
                        section.get("section_title", "Untitled"),
                        kind,
                        text,
                        section.get("paragraphs", []),
                    )
                )
        chunks = []
        for source_id, title, kind, text, paragraphs in sources:
            words = text.split()
            # Bound overlap so every window makes progress, even for a giant paragraph.
            overlap = min(
                sum(len(p.split()) for p in paragraphs[-self.overlap_paragraphs :])
                if self.overlap_paragraphs and len(paragraphs) > 1
                else 0,
                self.max_chunk_words // 2,
            )
            start = 0
            part = 0
            while start < len(words):
                end = min(start + self.max_chunk_words, len(words))
                chunk_text = " ".join(words[start:end])
                chunks.append(
                    {
                        "chunk_id": f"{paper_record['paper_id']}_{source_id}_{part}",
                        "paper_id": paper_record["paper_id"],
                        "title": paper_record.get("title", ""),
                        "authors": list(paper_record.get("authors", [])),
                        "primary_category": paper_record.get("primary_category", ""),
                        "section_title": title,
                        "section_type": kind,
                        "text": chunk_text,
                        "context_text": f"Paper: {paper_record.get('title', '')} | Section: {title} ({kind})\n\n{chunk_text}",
                        "word_count": end - start,
                    }
                )
                if end == len(words):
                    break
                start = end - overlap
                part += 1
        return chunks
