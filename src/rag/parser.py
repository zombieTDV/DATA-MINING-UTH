"""src/rag/parser.py — Academic PDF section segmentation using pdfplumber with bibliography filtering."""
from __future__ import annotations

import logging
from pathlib import Path
import re
from typing import Any

import pandas as pd
import pdfplumber

logger = logging.getLogger("PDFSectionParser")

# Standard academic section title patterns
SECTION_HEADER_RE = re.compile(
    r"^(?:"
    r"(?:(?:\d+\.?)+\s+)?([A-Z][A-Za-z0-9\s,\-:]{2,60})|"
    r"(?:[I|V|X]+\.?\s+([A-Z\s]{3,60}))|"
    r"(Abstract|Introduction|Related\s+Work|Background|Methodology|Method|Model\s+Architecture|Model|Approach|Experiments|Experimental\s+Setup|Results|Discussion|Conclusion|Conclusions)"
    r")$",
    re.IGNORECASE
)

# Sections where document parsing terminates (exclude bibliographies to avoid chunk pollution)
EXCLUDE_SECTIONS = {
    "references", "bibliography", "acknowledgments", "acknowledgements",
    "appendix", "appendices", "ethical considerations"
}


class PDFSectionParser:
    """
    Parses academic PDFs into structured sections, identifying section boundaries,
    cleaning hyphenated text breaks, and excluding bibliography/reference sections.
    """

    def __init__(self, bronze_dir: Path | str = "data/bronze", silver_dir: Path | str = "data/silver"):
        self.bronze_dir = Path(bronze_dir)
        self.silver_dir = Path(silver_dir)
        self.silver_dir.mkdir(parents=True, exist_ok=True)

    def clean_text(self, text: str) -> str:
        """Clean raw extracted page text, rejoining hyphenated word breaks across line wraps."""
        if not text:
            return ""
        # Rejoin hyphenated line breaks: e.g. "atten-\ntion" -> "attention"
        text = re.sub(r"(\b\w+)-\n(\w+\b)", r"\1\2", text)
        # Normalize excessive whitespace
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def parse_pdf(
        self,
        file_path: Path | str,
        paper_id: str,
        max_pages: int = 25,
    ) -> list[dict[str, Any]]:
        """
        Extract text from an academic PDF file and segment into structured sections.
        Limits parsing to the first `max_pages` pages and uses fast stream extraction.
        """
        path = Path(file_path)
        if not path.exists():
            logger.warning("PDF file not found: %s", path)
            return []

        try:
            with pdfplumber.open(path) as pdf:
                pages_text = []
                for p in pdf.pages[:max_pages]:
                    txt = p.extract_text(layout=False)
                    if txt:
                        pages_text.append(txt)
        except Exception as e:
            logger.error("Failed to parse PDF %s: %s", path, e)
            return []

        if not pages_text:
            return []

        full_raw_text = "\n".join(pages_text)
        cleaned_text = self.clean_text(full_raw_text)

        # Segment into sections by inspecting line-by-line
        lines = cleaned_text.splitlines()
        sections: list[dict[str, Any]] = []

        current_title = "Abstract" if "abstract" in lines[0].lower() else "Introduction"
        current_lines: list[str] = []
        section_idx = 0

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Check if line matches a section header candidate
            norm_lower = re.sub(r"^\d+\.?\d*\s*", "", line_str).strip().lower()

            # If bibliography is reached, stop extracting further text
            if norm_lower in EXCLUDE_SECTIONS or line_str.lower().startswith("references"):
                if current_lines:
                    sec_text = "\n".join(current_lines).strip()
                    if len(sec_text) > 40:
                        sections.append({
                            "paper_id": paper_id,
                            "section_idx": section_idx,
                            "section_title": current_title,
                            "text": sec_text,
                            "char_count": len(sec_text),
                        })
                logger.debug("Reached %s in %s; stopping section extraction.", norm_lower, paper_id)
                break

            # Check for heading pattern match
            match = SECTION_HEADER_RE.match(line_str)
            is_heading = False
            candidate_title = ""

            if match and len(line_str) < 70 and not line_str.endswith("."):
                candidate_title = match.group(1) or match.group(2) or match.group(3) or line_str
                candidate_title = re.sub(r"^\d+\.?\d*\s*", "", candidate_title).strip()
                if len(candidate_title) >= 3 and not candidate_title.isdigit():
                    is_heading = True

            if is_heading:
                # Flush previous section
                if current_lines:
                    sec_text = "\n".join(current_lines).strip()
                    if len(sec_text) > 40:
                        sections.append({
                            "paper_id": paper_id,
                            "section_idx": section_idx,
                            "section_title": current_title,
                            "text": sec_text,
                            "char_count": len(sec_text),
                        })
                        section_idx += 1
                current_title = candidate_title.title()
                current_lines = []
            else:
                current_lines.append(line_str)

        # Flush final section if not stopped by references
        if current_lines:
            sec_text = "\n".join(current_lines).strip()
            if len(sec_text) > 40:
                sections.append({
                    "paper_id": paper_id,
                    "section_idx": section_idx,
                    "section_title": current_title,
                    "text": sec_text,
                    "char_count": len(sec_text),
                })

        return sections

    def parse_all_vaulted_pdfs(
        self,
        manifest_path: Path | str | None = None,
        output_path: Path | str | None = None,
        max_file_size_mb: float = 35.0,
        max_pages_per_pdf: int = 25,
    ) -> pd.DataFrame:
        """
        Parse all vaulted PDFs in the manifest into structured sections and save to silver/sections.parquet.
        Automatically skips multi-hundred MB conference proceeding compilation volumes.
        """
        manifest_file = Path(manifest_path) if manifest_path else self.bronze_dir / "manifest" / "manifest.parquet"
        out_file = Path(output_path) if output_path else self.silver_dir / "sections.parquet"

        if not manifest_file.exists():
            logger.warning("Manifest not found at %s", manifest_file)
            return pd.DataFrame()

        manifest_df = pd.read_parquet(manifest_file)
        vaulted_df = manifest_df[manifest_df["status"] == "VAULTED"].copy()
        logger.info("Found %d vaulted PDFs in manifest.", len(vaulted_df))

        all_sections: list[dict[str, Any]] = []
        parsed_count = 0
        total_vaulted = len(vaulted_df)

        for idx, (_, row) in enumerate(vaulted_df.iterrows()):
            paper_id = row["paper_id"]
            local_path_str = row["local_path"]
            if not local_path_str:
                continue

            local_path = Path(local_path_str)
            if not local_path.exists():
                continue

            # Skip large multi-hundred-MB conference compilation books
            size_mb = local_path.stat().st_size / (1024 * 1024)
            if size_mb > max_file_size_mb:
                logger.info(
                    "Skipping %s (%.1f MB > %.1f MB limit) — multi-paper conference proceeding book.",
                    local_path.name, size_mb, max_file_size_mb
                )
                continue

            secs = self.parse_pdf(local_path, paper_id=paper_id, max_pages=max_pages_per_pdf)
            if secs:
                all_sections.extend(secs)
                parsed_count += 1

            if (idx + 1) % 15 == 0 or (idx + 1) == total_vaulted:
                logger.info(
                    "Progress: [%d/%d] processed | %d valid papers parsed | %d sections extracted",
                    idx + 1, total_vaulted, parsed_count, len(all_sections)
                )

        sections_df = pd.DataFrame(all_sections)
        if not sections_df.empty:
            out_file.parent.mkdir(parents=True, exist_ok=True)
            sections_df.to_parquet(out_file, index=False)
            logger.info(
                "Parsed %d sections across %d papers -> saved to %s",
                len(sections_df),
                parsed_count,
                out_file
            )
        else:
            logger.warning("No sections extracted from vaulted PDFs.")

        return sections_df
