"""Domain-Aware Section Chunking with Contextual Enrichment for Scientific Papers.

Preserves academic section boundaries and prepends paper-level metadata
to prevent context loss during vector retrieval.
"""

import json
from typing import Any, Dict, List, Optional


class AcademicChunker:
    """Chunks academic papers respecting section boundaries with contextual enrichment."""

    def __init__(self, max_chunk_words: int = 500, overlap_paragraphs: int = 1):
        self.max_chunk_words = max_chunk_words
        self.overlap_paragraphs = overlap_paragraphs

    def chunk_paper(self, paper_record: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Chia nhỏ 1 bài báo thành danh sách các chunks có giàu ngữ cảnh (Contextual Chunks)."""
        paper_id = paper_record.get("paper_id", "")
        title = paper_record.get("title", "")
        abstract = paper_record.get("abstract", "")
        authors = paper_record.get("authors", [])
        primary_category = paper_record.get("primary_category", "")

        sections = []
        raw_sections = paper_record.get("sections_json", "[]")
        if isinstance(raw_sections, str):
            try:
                sections = json.loads(raw_sections)
            except Exception:
                sections = []
        elif isinstance(raw_sections, list):
            sections = raw_sections

        chunks = []
        chunk_counter = 0

        # 1. Chunk riêng cho Abstract (luôn giữ làm 1 chunk độc lập)
        if abstract:
            chunk_id = f"{paper_id}_abstract_{chunk_counter}"
            context_text = f"Paper: \"{title}\" | Section: Abstract\n\n{abstract}"
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "paper_id": paper_id,
                    "title": title,
                    "authors": authors,
                    "primary_category": primary_category,
                    "section_title": "Abstract",
                    "section_type": "abstract",
                    "text": abstract,
                    "context_text": context_text,
                    "word_count": len(abstract.split()),
                }
            )
            chunk_counter += 1

        # 2. Chunk cho từng section
        for s_idx, sec in enumerate(sections):
            sec_title = sec.get("section_title", f"Section {s_idx + 1}")
            sec_type = sec.get("section_type", "other")
            paragraphs = sec.get("paragraphs", [])
            sec_content = sec.get("content", "")

            # Nếu section ngắn vừa phải, giữ nguyên toàn bộ section làm 1 chunk
            if len(sec_content.split()) <= self.max_chunk_words or not paragraphs:
                if len(sec_content.split()) < 15:  # Bỏ qua các section quá ngắn vô nghĩa
                    continue

                chunk_id = f"{paper_id}_sec{s_idx}_{chunk_counter}"
                context_text = f"Paper: \"{title}\" | Section: {sec_title} ({sec_type.upper()})\n\n{sec_content}"
                chunks.append(
                    {
                        "chunk_id": chunk_id,
                        "paper_id": paper_id,
                        "title": title,
                        "authors": authors,
                        "primary_category": primary_category,
                        "section_title": sec_title,
                        "section_type": sec_type,
                        "text": sec_content,
                        "context_text": context_text,
                        "word_count": len(sec_content.split()),
                    }
                )
                chunk_counter += 1
            else:
                # Nếu section dài, chia theo từng cụm đoạn văn (paragraphs) kèm overlap
                cur_paragraphs = []
                cur_word_count = 0
                sub_idx = 0

                for p_idx, p in enumerate(paragraphs):
                    p_words = len(p.split())
                    cur_paragraphs.append(p)
                    cur_word_count += p_words

                    if cur_word_count >= self.max_chunk_words or p_idx == len(paragraphs) - 1:
                        chunk_text = "\n\n".join(cur_paragraphs)
                        chunk_id = f"{paper_id}_sec{s_idx}_p{sub_idx}_{chunk_counter}"
                        context_text = f"Paper: \"{title}\" | Section: {sec_title} ({sec_type.upper()}) [Part {sub_idx + 1}]\n\n{chunk_text}"

                        chunks.append(
                            {
                                "chunk_id": chunk_id,
                                "paper_id": paper_id,
                                "title": title,
                                "authors": authors,
                                "primary_category": primary_category,
                                "section_title": sec_title,
                                "section_type": sec_type,
                                "text": chunk_text,
                                "context_text": context_text,
                                "word_count": len(chunk_text.split()),
                            }
                        )
                        chunk_counter += 1
                        sub_idx += 1

                        # Trượt đoạn văn để giữ ngữ cảnh tiếp nối (overlap)
                        if self.overlap_paragraphs > 0 and len(cur_paragraphs) > self.overlap_paragraphs:
                            cur_paragraphs = cur_paragraphs[-self.overlap_paragraphs:]
                            cur_word_count = sum(len(p.split()) for p in cur_paragraphs)
                        else:
                            cur_paragraphs = []
                            cur_word_count = 0

        return chunks
