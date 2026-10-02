"""Academic HTML Parser for arXiv HTML5 / LaTeXML documents.

Extracts structured sections, abstracts, equations, and paragraphs
ready for the Silver Lakehouse layer and Advanced RAG chunking.
"""

import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup


class AcademicHTMLParser:
    """Parser specialized in academic research paper HTML5 structures."""

    # Phân loại section types phổ biến trong bài báo khoa học
    SECTION_TYPE_PATTERNS = {
        "abstract": re.compile(r"abstract", re.IGNORECASE),
        "introduction": re.compile(r"^\s*(\d+(\.\d+)*\s+)?(intro|introduction)", re.IGNORECASE),
        "related_work": re.compile(r"^\s*(\d+(\.\d+)*\s+)?(related|background|prior)", re.IGNORECASE),
        "methodology": re.compile(r"^\s*(\d+(\.\d+)*\s+)?(method|approach|proposed|architecture|model|formulation|algorithm)", re.IGNORECASE),
        "experiments": re.compile(r"^\s*(\d+(\.\d+)*\s+)?(experiment|eval|evaluation|result|ablation|benchmark)", re.IGNORECASE),
        "discussion": re.compile(r"^\s*(\d+(\.\d+)*\s+)?(discussion|analysis|limitation)", re.IGNORECASE),
        "conclusion": re.compile(r"^\s*(\d+(\.\d+)*\s+)?(conclu|future work|summary)", re.IGNORECASE),
        "references": re.compile(r"^\s*(reference|bibliography)", re.IGNORECASE),
        "appendix": re.compile(r"^\s*(appendix|supplementary)", re.IGNORECASE),
    }

    def __init__(self):
        pass

    def classify_section_type(self, title: str) -> str:
        """Phân loại section dựa vào tiêu đề."""
        for sec_type, pattern in self.SECTION_TYPE_PATTERNS.items():
            if pattern.search(title):
                return sec_type
        return "other"

    def clean_text(self, text: str) -> str:
        """Làm sạch khoảng trắng thừa và dòng trống."""
        return re.sub(r"\s+", " ", text).strip()

    def parse(self, html_content: str) -> Dict[str, Any]:
        """Bóc tách toàn bộ tài liệu HTML thành đối tượng có cấu trúc."""
        soup = BeautifulSoup(html_content, "lxml")

        # 1. Tiêu đề bài báo
        title = ""
        title_tag = soup.find("h1", class_="ltx_title") or soup.find("h1") or soup.title
        if title_tag:
            title = self.clean_text(title_tag.get_text())

        # 2. Tóm tắt (Abstract)
        abstract = ""
        abstract_sec = soup.find("div", class_="ltx_abstract") or soup.find("section", class_="ltx_abstract")
        if abstract_sec:
            abstract_p = abstract_sec.find_all("p")
            if abstract_p:
                abstract = " ".join(self.clean_text(p.get_text()) for p in abstract_p)
            else:
                abstract = self.clean_text(abstract_sec.get_text())
            abstract = re.sub(r"^(Abstract[:\.\s]*)", "", abstract, flags=re.IGNORECASE).strip()

        # 3. Trích xuất các công thức toán LaTeX
        math_elements = soup.find_all(class_="ltx_Math")
        math_equations = []
        for m in math_elements:
            math_text = self.clean_text(m.get_text())
            if math_text and math_text not in math_equations:
                math_equations.append(math_text)

        # 4. Trích xuất các Section cấu trúc
        sections = []
        section_tags = soup.find_all("section", class_="ltx_section")
        
        # Nếu không có thẻ section chuyên dụng, fallback sang các heading h2
        if not section_tags:
            section_tags = soup.find_all(["section", "article"])

        for sec in section_tags:
            sec_id = sec.get("id", "")
            
            # Bỏ qua section abstract nếu nó bị lặp lại ở đây
            if "abstract" in sec_id.lower() or "ltx_abstract" in sec.get("class", []):
                continue

            heading = sec.find(["h2", "h3", "h4", "h5"])
            sec_title = self.clean_text(heading.get_text()) if heading else "Untitled Section"

            # Bóc tách các đoạn văn (paragraphs)
            paragraphs = []
            for p in sec.find_all("p"):
                p_text = self.clean_text(p.get_text())
                if len(p_text) > 20:  # Lọc các đoạn quá ngắn hoặc rác
                    paragraphs.append(p_text)

            full_section_text = " ".join(paragraphs)
            if not full_section_text:
                continue

            sec_math_count = len(sec.find_all(class_="ltx_Math"))

            sections.append(
                {
                    "section_id": sec_id,
                    "section_title": sec_title,
                    "section_type": self.classify_section_type(sec_title),
                    "content": full_section_text,
                    "paragraphs": paragraphs,
                    "paragraph_count": len(paragraphs),
                    "math_count": sec_math_count,
                    "word_count": len(full_section_text.split()),
                }
            )

        # 5. Tính toán các chỉ số tổng hợp
        total_words = sum(s["word_count"] for s in sections)
        if abstract:
            total_words += len(abstract.split())

        return {
            "parsed_title": title,
            "parsed_abstract": abstract,
            "sections": sections,
            "total_sections": len(sections),
            "math_equations": math_equations[:100],  # Lưu tối đa 100 công thức tiêu biểu
            "total_math_count": len(math_elements),
            "total_words": total_words,
        }
