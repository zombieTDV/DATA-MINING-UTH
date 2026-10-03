"""Academic Scientific RAG Prompt Templates for AI/Data Science Literature.

Designed for Qwen-2.5-7B-Instruct to enforce strict grounding,
prevent hallucination, and require rigorous paper/section citations.
"""

from typing import Any, Dict, List

SCIENTIFIC_RAG_SYSTEM_PROMPT = """You are an expert AI & Data Science Scientific Research Assistant.
Your mission is to provide accurate, rigorous, and technical answers based EXCLUSIVELY on the provided scientific literature context extracted from arXiv research papers.

Strict Guidelines:
1. Grounding & Anti-Hallucination:
   - Answer the user's question using ONLY the facts, methodologies, theorems, and data present in the Provided Context.
   - Do NOT extrapolate, speculate, or incorporate outside knowledge not supported by the context.
   - If the provided context does not contain sufficient technical details to answer the question, state explicitly:
     "Dựa trên các tài liệu khoa học được cung cấp, không có đủ thông tin để trả lời câu hỏi này." (or in English if queried in English: "Based on the provided scientific literature, there is insufficient evidence to address this question.")

2. Academic Citation Format:
   - For every factual statement, technical claim, algorithm, or result mentioned in your response, you MUST cite the exact source using this format:
     [Paper: <paper_id>, Section: <section_title>]
     For example: [Paper: 2312.17591, Section: 3 Method]
   - At the end of your response, provide a dedicated "References Cited" list summarizing the papers cited with their Title and arXiv ID.

3. Mathematical and LaTeX Preservation:
   - Preserve all mathematical equations, loss functions, dimensions, and notation in LaTeX format (e.g., $L_{distill}$, $\mathcal{O}(N \log N)$).

4. Structure and Academic Tone:
   - Maintain an objective, concise, and academic tone.
   - Organize complex explanations into structured subsections (e.g., Problem Formulation, Proposed Method, Key Findings/Ablations).
   - Never use informal language or unsupported generalizations.
"""


def format_scientific_context(chunks: List[Dict[str, Any]]) -> str:
    """Formats retrieved LanceDB chunks into structured academic context."""
    context_blocks = []
    for idx, chunk in enumerate(chunks, 1):
        paper_id = chunk.get("paper_id", "Unknown")
        title = chunk.get("title", "Untitled")
        authors = chunk.get("authors", [])
        if isinstance(authors, (list, tuple)):
            author_str = ", ".join(str(a) for a in authors[:3])
            if len(authors) > 3:
                author_str += " et al."
        else:
            author_str = str(authors)

        sec_title = chunk.get("section_title", "General")
        sec_type = chunk.get("section_type", "body")
        text = chunk.get("text", "").strip()
        distance = chunk.get("_distance", None)
        score_info = f" (Cosine Distance: {distance:.4f})" if distance is not None else ""

        block = (
            f"--- [CONTEXT DOCUMENT #{idx}]{score_info} ---\n"
            f"Paper ID: {paper_id}\n"
            f"Title: {title}\n"
            f"Authors: {author_str}\n"
            f"Section: {sec_title} (Type: {sec_type})\n"
            f"Content:\n{text}\n"
        )
        context_blocks.append(block)

    return "\n".join(context_blocks)


def build_rag_messages(query: str, retrieved_chunks: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Constructs chat messages following Qwen2.5 chat template."""
    context_text = format_scientific_context(retrieved_chunks)

    user_content = (
        f"Provided Context from Academic Literature:\n\n"
        f"{context_text}\n\n"
        f"==================================================\n"
        f"User Research Query:\n{query}\n\n"
        f"Synthesize a rigorous, technical answer grounded strictly in the context above, "
        f"with exact citations [Paper: <paper_id>, Section: <section_title>]."
    )

    return [
        {"role": "system", "content": SCIENTIFIC_RAG_SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
