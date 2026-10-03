"""src/rag/parser.py — Resilient Academic PDF section segmentation with batch checkpointing and per-task timeouts."""
from __future__ import annotations

import concurrent.futures
from concurrent.futures import ProcessPoolExecutor
from concurrent.futures.process import BrokenProcessPool
import logging
import os
from pathlib import Path
import re
from typing import Any

import pandas as pd
import pdfplumber

import multiprocessing as mp

from src.utils.logger import get_logger, ensure_log_dirs, log_audit_event

if mp.current_process().name == "MainProcess":
    ensure_log_dirs()
    logger = get_logger("PDFSectionParser", log_file="logs/rag/pdf_parser.log")
else:
    logger = logging.getLogger("PDFSectionParser")
    logger.addHandler(logging.NullHandler())
    logger.propagate = False

# Standard academic section title patterns (strictly linear, non-backtracking)
SECTION_HEADER_RE = re.compile(
    r"^(?:"
    r"(?:[\d\.]+\s+)?([A-Z][A-Za-z0-9\s,\-:]{2,60})|"
    r"(?:[IVXLCDM]+\.?\s+([A-Z\s]{3,60}))|"
    r"(Abstract|Introduction|Related\s+Work|Background|Methodology|Method|Model\s+Architecture|Model|Approach|Experiments|Experimental\s+Setup|Results|Discussion|Conclusion|Conclusions)"
    r")$",
    re.IGNORECASE
)

# Early-break pattern to avoid parsing 10+ pages of bibliography & appendix
REF_EARLY_BREAK_RE = re.compile(
    r"(\n|^)(?:[0-9IVX\.]+\s+)?(?:references|bibliography)\s*(\n|$)",
    re.IGNORECASE
)

# Sections where document parsing terminates (exclude bibliographies to avoid chunk pollution)
EXCLUDE_SECTIONS = {
    "references", "bibliography", "acknowledgments", "acknowledgements",
    "appendix", "appendices", "ethical considerations"
}


def _parse_single_pdf_task(task_args: tuple[str, str, int, float]) -> list[dict[str, Any]]:
    """
    Top-level worker function for ProcessPoolExecutor:
    Unpacks task arguments, validates file size, and parses PDF into sections.
    """
    local_path_str, paper_id, max_pages, max_file_size_mb = task_args
    path = Path(local_path_str)
    if not path.exists():
        return []

    try:
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > max_file_size_mb:
            return []

        parser = PDFSectionParser()
        return parser.parse_pdf(path, paper_id=paper_id, max_pages=max_pages)
    except Exception:
        return []


class PDFSectionParser:
    """
    Parses academic PDFs into structured sections, identifying section boundaries,
    cleaning hyphenated text breaks, and excluding bibliography/reference sections.
    Includes batch checkpointing to parquet on disk and per-file timeouts.
    """

    def __init__(self, bronze_dir: Path | str = "data/bronze", silver_dir: Path | str = "data/silver"):
        self.bronze_dir = Path(bronze_dir)
        self.silver_dir = Path(silver_dir)
        self.silver_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_dir = self.silver_dir / "sections_checkpoints"
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

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
        Stops early if bibliography/references section is encountered.
        """
        path = Path(file_path)
        if not path.exists():
            logger.warning("PDF file not found: %s", path)
            return []

        pages_text = []
        try:
            with pdfplumber.open(path) as pdf:
                for p in pdf.pages[:max_pages]:
                    txt = p.extract_text(layout=False)
                    if txt:
                        pages_text.append(txt)
                        # Early exit if references section begins on this page
                        if REF_EARLY_BREAK_RE.search(txt):
                            break
        except Exception as e:
            logger.error("Failed to parse PDF %s: %s", path, e)
            return []

        if not pages_text:
            return []

        full_raw_text = "\n".join(pages_text)
        # Guardrail against pathological stream dumps (> 300k chars)
        if len(full_raw_text) > 300_000:
            full_raw_text = full_raw_text[:300_000]

        cleaned_text = self.clean_text(full_raw_text)

        # Segment into sections by inspecting line-by-line
        lines = cleaned_text.splitlines()
        sections: list[dict[str, Any]] = []

        current_title = "Abstract" if lines and "abstract" in lines[0].lower() else "Introduction"
        current_lines: list[str] = []
        section_idx = 0

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Quick length guardrail: headers are never > 100 characters or < 3
            if len(line_str) > 100 or len(line_str) < 3:
                current_lines.append(line_str)
                continue

            # Check if line matches a section header candidate
            norm_lower = re.sub(r"^[\d\.]+\s*", "", line_str).strip().lower()

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

            if match and not line_str.endswith("."):
                candidate_title = match.group(1) or match.group(2) or match.group(3) or line_str
                candidate_title = re.sub(r"^[\d\.]+\s*", "", candidate_title).strip()
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
        max_workers: int | None = None,
        batch_size: int = 100,
        per_pdf_timeout: float = 25.0,
    ) -> pd.DataFrame:
        """
        Parse all vaulted PDFs in the manifest into structured sections and save to silver/sections.parquet.
        Features:
        - Resumable incremental checkpointing (flushes to parquet every `batch_size` papers).
        - Strict non-blocking batch timeouts via concurrent.futures.wait.
        - Consolidated final Parquet write.
        """
        manifest_file = Path(manifest_path) if manifest_path else self.bronze_dir / "manifest" / "manifest.parquet"
        out_file = Path(output_path) if output_path else self.silver_dir / "sections.parquet"

        if not manifest_file.exists():
            logger.warning("Manifest not found at %s", manifest_file)
            return pd.DataFrame()

        manifest_df = pd.read_parquet(manifest_file)
        vaulted_df = manifest_df[manifest_df["status"] == "VAULTED"].copy()
        logger.info("Found %d vaulted PDFs in manifest.", len(vaulted_df))

        # Check existing checkpoints to support resuming without re-parsing
        already_done_pids = set()
        for cp_file in self.checkpoint_dir.glob("part_*.parquet"):
            try:
                cp_df = pd.read_parquet(cp_file, columns=["paper_id"])
                already_done_pids.update(cp_df["paper_id"].dropna().unique())
            except Exception:
                pass

        skipped_file = self.checkpoint_dir / "skipped_papers.parquet"
        if skipped_file.exists():
            try:
                sk_df = pd.read_parquet(skipped_file, columns=["paper_id"])
                already_done_pids.update(sk_df["paper_id"].dropna().unique())
            except Exception:
                pass

        if already_done_pids:
            logger.info("Found %d papers already parsed/skipped in checkpoints. Resuming...", len(already_done_pids))

        # Filter valid remaining tasks
        all_tasks: list[tuple[str, str, int, float]] = []
        for _, row in vaulted_df.iterrows():
            local_path_str = row.get("local_path")
            paper_id = row.get("paper_id")
            if local_path_str and paper_id and paper_id not in already_done_pids:
                all_tasks.append((str(local_path_str), str(paper_id), max_pages_per_pdf, max_file_size_mb))

        remaining_count = len(all_tasks)
        total_vaulted = len(vaulted_df)
        logger.info(
            "Status: %d already completed | %d remaining to parse out of %d total vaulted.",
            len(already_done_pids), remaining_count, total_vaulted
        )

        if max_workers is None:
            max_workers = min(10, max(1, (os.cpu_count() or 4) - 2))

        log_audit_event(
            event_type="PDF_SECTION_PARSING_START",
            component="PDFSectionParser",
            details={
                "total_vaulted": total_vaulted,
                "already_completed": len(already_done_pids),
                "remaining_tasks": remaining_count,
                "max_workers": max_workers,
                "batch_size": batch_size,
                "per_pdf_timeout": per_pdf_timeout,
            }
        )

        # Process in batches with incremental parquet checkpointing
        if remaining_count > 0:
            total_batches = (remaining_count + batch_size - 1) // batch_size
            for b_idx in range(total_batches):
                start_i = b_idx * batch_size
                end_i = min(start_i + batch_size, remaining_count)
                batch_tasks = all_tasks[start_i:end_i]

                batch_sections: list[dict[str, Any]] = []
                batch_parsed_pids = set()
                batch_failed_pids = set()

                try:
                    with ProcessPoolExecutor(max_workers=max_workers) as executor:
                        future_to_task = {
                            executor.submit(_parse_single_pdf_task, t): t
                            for t in batch_tasks
                        }

                        # Generous batch timeout based on items per worker
                        batch_timeout = max(120.0, (len(batch_tasks) / max_workers + 2.0) * per_pdf_timeout)
                        done, not_done = concurrent.futures.wait(
                            future_to_task.keys(),
                            timeout=batch_timeout,
                            return_when=concurrent.futures.ALL_COMPLETED,
                        )

                        for future in done:
                            task_item = future_to_task[future]
                            pid = task_item[1]
                            try:
                                res = future.result()
                                if res:
                                    batch_sections.extend(res)
                                    batch_parsed_pids.add(pid)
                                else:
                                    batch_failed_pids.add(pid)
                            except Exception as exc:
                                logger.error("Error processing paper %s: %s", pid, exc)
                                batch_failed_pids.add(pid)

                        if not_done:
                            for future in not_done:
                                task_item = future_to_task[future]
                                pid = task_item[1]
                                future.cancel()
                                batch_failed_pids.add(pid)
                                logger.warning("Paper %s timed out (> %.1fs) — marked skipped.", pid, batch_timeout)
                except BrokenProcessPool as bpe:
                    logger.error("Process pool broken during batch [%d/%d]: %s. Marking remaining batch tasks as skipped.", b_idx + 1, total_batches, bpe)
                    for t in batch_tasks:
                        pid = t[1]
                        if pid not in batch_parsed_pids:
                            batch_failed_pids.add(pid)
                except Exception as b_exc:
                    logger.error("Unexpected error in batch [%d/%d]: %s", b_idx + 1, total_batches, b_exc)
                    for t in batch_tasks:
                        pid = t[1]
                        if pid not in batch_parsed_pids:
                            batch_failed_pids.add(pid)

                # Write batch checkpoint to disk immediately
                if batch_sections:
                    batch_file = self.checkpoint_dir / f"part_resumed_{b_idx + 1:04d}_{len(already_done_pids) + end_i:05d}.parquet"
                    pd.DataFrame(batch_sections).to_parquet(batch_file, index=False)

                # Persist any newly skipped/empty papers
                if batch_failed_pids:
                    new_sk_df = pd.DataFrame({"paper_id": list(batch_failed_pids), "reason": ["empty_or_crash"] * len(batch_failed_pids)})
                    if skipped_file.exists():
                        try:
                            existing_sk = pd.read_parquet(skipped_file)
                            new_sk_df = pd.concat([existing_sk, new_sk_df], ignore_index=True).drop_duplicates(subset=["paper_id"])
                        except Exception:
                            pass
                    new_sk_df.to_parquet(skipped_file, index=False)

                already_done_pids.update(batch_parsed_pids)
                already_done_pids.update(batch_failed_pids)
                logger.info(
                    "Batch [%d/%d] complete: %d sections extracted | Total progress: %d / %d papers (%.1f%%)",
                    b_idx + 1, total_batches, len(batch_sections),
                    len(already_done_pids), total_vaulted,
                    (len(already_done_pids) / total_vaulted) * 100
                )

        # Consolidate all checkpoint files into single master silver/sections.parquet
        logger.info("Consolidating all checkpoint files from %s...", self.checkpoint_dir)
        checkpoint_files = sorted(self.checkpoint_dir.glob("part_*.parquet"))
        if not checkpoint_files:
            logger.warning("No checkpoint files found to consolidate.")
            return pd.DataFrame()

        dfs = []
        for f in checkpoint_files:
            try:
                dfs.append(pd.read_parquet(f))
            except Exception as e:
                logger.error("Failed reading checkpoint file %s: %s", f, e)

        if dfs:
            master_sections_df = pd.concat(dfs, ignore_index=True)
            out_file.parent.mkdir(parents=True, exist_ok=True)
            master_sections_df.to_parquet(out_file, index=False)
            logger.info(
                "Successfully consolidated %d sections across %d unique papers -> %s",
                len(master_sections_df),
                master_sections_df["paper_id"].nunique(),
                out_file
            )

            log_audit_event(
                event_type="PDF_SECTION_PARSING_COMPLETE",
                component="PDFSectionParser",
                details={
                    "total_vaulted": total_vaulted,
                    "unique_papers_parsed": int(master_sections_df["paper_id"].nunique()),
                    "extracted_sections": len(master_sections_df),
                    "output_path": str(out_file),
                }
            )
            return master_sections_df
        else:
            logger.warning("No sections could be consolidated.")
            return pd.DataFrame()
