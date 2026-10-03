"""src/ingest/bulk_vault.py — Resumable, Domain-Throttled Bulk PDF Harvester."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import logging
from pathlib import Path
import sys
import threading
import time
from typing import Any, Optional
from urllib.parse import urlparse

import pandas as pd
import requests

from src.utils.logger import get_logger, log_audit_event, ensure_log_dirs

ensure_log_dirs()
logger = get_logger("BulkPDFVault", log_file="logs/ingest/bulk_vault.log")

MANIFEST_PATH = Path("data/bronze/manifest/manifest.parquet")
SILVER_PAPERS_PATH = Path("data/silver/papers.parquet")
PDF_DIR = Path("data/bronze/pdf_raw")
MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024  # 35 MB guardrail


def classify_domain(url: str, doi: str = "") -> str:
    """Classify paper source into 'arxiv', 'acl', or 'other'."""
    url_lower = (url or "").lower()
    doi_lower = (doi or "").lower()

    if "arxiv.org" in url_lower or "10.48550/arxiv" in doi_lower or "arxiv" in doi_lower:
        return "arxiv"
    if "aclanthology.org" in url_lower or "aclweb.org" in url_lower:
        return "acl"
    return "other"


def normalize_pdf_url(url: str, doi: str = "") -> str:
    """Ensure url directly points to a valid PDF stream."""
    url = url.strip()
    if not url and "arxiv" in doi.lower():
        arxiv_id = doi.split("arxiv.")[-1].strip()
        return f"https://arxiv.org/pdf/{arxiv_id}.pdf"

    if "arxiv.org/abs/" in url:
        arxiv_id = url.split("/abs/")[-1].split("v")[0]
        return f"https://arxiv.org/pdf/{arxiv_id}.pdf"

    if url.startswith("http://"):
        # Upgrade to HTTPS for standard repositories
        domain = urlparse(url).netloc
        if any(d in domain for d in ["aclweb.org", "aclanthology.org", "arxiv.org"]):
            url = "https://" + url[7:]

    return url


def compute_sha256(file_path: Path) -> str:
    """Compute cryptographic SHA-256 checksum of an existing file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


class DomainRateLimiter:
    """Thread-safe rate limiter ensuring minimum interval between requests per domain."""

    def __init__(self, min_interval_seconds: float):
        self.min_interval = min_interval_seconds
        self.last_request_time = 0.0
        self.lock = threading.Lock()

    def wait(self) -> None:
        with self.lock:
            now = time.time()
            elapsed = now - self.last_request_time
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
            self.last_request_time = time.time()


class BulkPDFVault:
    """
    Orchestrates bulk download and vaulting of PDFs from arXiv and ACL Anthology
    with domain-aware pacing, stream safety, and progress checkpointing.
    """

    def __init__(
        self,
        manifest_path: Path = MANIFEST_PATH,
        pdf_dir: Path = PDF_DIR,
        silver_papers_path: Path = SILVER_PAPERS_PATH,
        arxiv_delay: float = 3.0,
        acl_delay: float = 0.8,
        timeout: int = 30,
        checkpoint_every: int = 25,
    ):
        self.manifest_path = Path(manifest_path)
        self.pdf_dir = Path(pdf_dir)
        self.silver_papers_path = Path(silver_papers_path)
        self.pdf_dir.mkdir(parents=True, exist_ok=True)

        self.timeout = timeout
        self.checkpoint_every = checkpoint_every

        self.rate_limiters = {
            "arxiv": DomainRateLimiter(arxiv_delay),
            "acl": DomainRateLimiter(acl_delay),
            "other": DomainRateLimiter(1.0),
        }

        self.headers = {
            "User-Agent": "UTH-DataMining-Student/1.0 (academic research; contact: student@uth.edu.vn)",
            "Accept": "application/pdf,application/octet-stream,*/*",
        }

        self.lock = threading.Lock()
        self.processed_updates: dict[str, dict[str, Any]] = {}
        self.success_count = 0
        self.skip_count = 0
        self.error_count = 0

    def load_candidates(self, source_filter: str = "all") -> list[dict[str, Any]]:
        """Load eligible download candidate records from manifest.parquet."""
        if not self.manifest_path.exists():
            raise FileNotFoundError(f"Manifest not found at {self.manifest_path}")

        df_m = pd.read_parquet(self.manifest_path)
        
        # Load DOI from silver if available to catch missing arxiv URLs
        doi_map: dict[str, str] = {}
        if self.silver_papers_path.exists():
            df_s = pd.read_parquet(self.silver_papers_path, columns=["paper_id", "doi"])
            doi_map = dict(zip(df_s["paper_id"], df_s["doi"].fillna("")))

        candidates = []
        for _, row in df_m.iterrows():
            pid = str(row["paper_id"])
            s_url = str(row.get("source_url") or "")
            doi = doi_map.get(pid, "")
            domain = classify_domain(s_url, doi=doi)

            if source_filter == "arxiv" and domain != "arxiv":
                continue
            if source_filter == "acl" and domain != "acl":
                continue
            if source_filter == "all" and domain not in ["arxiv", "acl"]:
                continue

            # Idempotency check: see if file is already vaulted on disk
            safe_name = pid.replace(":", "_").replace("/", "_") + ".pdf"
            local_path = self.pdf_dir / safe_name

            already_valid = False
            if local_path.exists() and local_path.stat().st_size > 1024:
                try:
                    with open(local_path, "rb") as f:
                        if f.read(5) == b"%PDF-":
                            already_valid = True
                except Exception:
                    pass

            candidates.append({
                "paper_id": pid,
                "source_url": normalize_pdf_url(s_url, doi=doi),
                "domain": domain,
                "safe_name": safe_name,
                "local_path": local_path,
                "already_vaulted": already_valid,
                "status": row.get("status", "METADATA_ONLY"),
            })

        return candidates

    def download_paper(self, candidate: dict[str, Any]) -> dict[str, Any]:
        """Download single paper with stream safety, rate-limiting, and SHA-256 calculation."""
        pid = candidate["paper_id"]
        pdf_url = candidate["source_url"]
        domain = candidate["domain"]
        local_path = candidate["local_path"]

        # 1. Skip if already valid on disk
        if candidate["already_vaulted"]:
            sha256 = compute_sha256(local_path)
            size = local_path.stat().st_size
            return {
                "paper_id": pid,
                "status": "VAULTED",
                "local_path": str(local_path),
                "sha256_checksum": sha256,
                "byte_size": size,
                "error_detail": "Already vaulted on disk",
                "cached": True,
            }

        if not pdf_url:
            return {
                "paper_id": pid,
                "status": "METADATA_ONLY",
                "local_path": "",
                "sha256_checksum": "",
                "byte_size": 0,
                "error_detail": "No valid PDF URL",
                "cached": False,
            }

        # 2. Wait for domain rate limit
        self.rate_limiters.get(domain, self.rate_limiters["other"]).wait()

        # 3. Stream download
        temp_path = local_path.with_suffix(".tmp")
        h = hashlib.sha256()
        total_bytes = 0

        try:
            with requests.get(pdf_url, headers=self.headers, stream=True, timeout=self.timeout, allow_redirects=True) as resp:
                if resp.status_code != 200:
                    return {
                        "paper_id": pid,
                        "status": "METADATA_ONLY",
                        "local_path": "",
                        "sha256_checksum": "",
                        "byte_size": 0,
                        "error_detail": f"HTTP {resp.status_code} ({resp.reason})",
                        "cached": False,
                    }

                # Check Content-Length header if available
                content_len = resp.headers.get("Content-Length")
                if content_len and int(content_len) > MAX_FILE_SIZE_BYTES:
                    return {
                        "paper_id": pid,
                        "status": "METADATA_ONLY",
                        "local_path": "",
                        "sha256_checksum": "",
                        "byte_size": int(content_len),
                        "error_detail": f"File too large ({int(content_len)/(1024*1024):.1f} MB > 35 MB)",
                        "cached": False,
                    }

                with open(temp_path, "wb") as f:
                    first_chunk = True
                    for chunk in resp.iter_content(chunk_size=65536):
                        if not chunk:
                            continue

                        if first_chunk:
                            first_chunk = False
                            if not chunk.startswith(b"%PDF-"):
                                temp_path.unlink(missing_ok=True)
                                return {
                                    "paper_id": pid,
                                    "status": "METADATA_ONLY",
                                    "local_path": "",
                                    "sha256_checksum": "",
                                    "byte_size": len(chunk),
                                    "error_detail": f"Invalid magic bytes ({chunk[:10]!r}), HTML paywall/captcha",
                                    "cached": False,
                                }

                        total_bytes += len(chunk)
                        if total_bytes > MAX_FILE_SIZE_BYTES:
                            temp_path.unlink(missing_ok=True)
                            return {
                                "paper_id": pid,
                                "status": "METADATA_ONLY",
                                "local_path": "",
                                "sha256_checksum": "",
                                "byte_size": total_bytes,
                                "error_detail": f"Exceeded max size 35 MB during download",
                                "cached": False,
                            }

                        h.update(chunk)
                        f.write(chunk)

            if total_bytes < 1024:
                temp_path.unlink(missing_ok=True)
                return {
                    "paper_id": pid,
                    "status": "METADATA_ONLY",
                    "local_path": "",
                    "sha256_checksum": "",
                    "byte_size": total_bytes,
                    "error_detail": "File too small (< 1KB), likely error page",
                    "cached": False,
                }

            # Atomic rename to final path
            temp_path.replace(local_path)
            sha256 = h.hexdigest()
            logger.info("Vaulted [%s] %s (%d bytes, sha: %s...)", domain.upper(), local_path.name, total_bytes, sha256[:10])

            return {
                "paper_id": pid,
                "status": "VAULTED",
                "local_path": str(local_path),
                "sha256_checksum": sha256,
                "byte_size": total_bytes,
                "error_detail": "OK",
                "cached": False,
            }

        except Exception as err:
            temp_path.unlink(missing_ok=True)
            return {
                "paper_id": pid,
                "status": "METADATA_ONLY",
                "local_path": "",
                "sha256_checksum": "",
                "byte_size": 0,
                "error_detail": f"Download failed: {err}",
                "cached": False,
            }

    def flush_checkpoint(self) -> None:
        """Atomically persist accumulated download status updates into manifest and silver parquet."""
        with self.lock:
            if not self.processed_updates:
                return

            logger.info("Flushing checkpoint (%d updates) to manifest...", len(self.processed_updates))
            try:
                # 1. Update manifest.parquet
                df_m = pd.read_parquet(self.manifest_path)
                m_idx = df_m.set_index("paper_id")

                for pid, u in self.processed_updates.items():
                    if pid in m_idx.index:
                        m_idx.loc[pid, "status"] = u["status"]
                        if u["status"] == "VAULTED":
                            m_idx.loc[pid, "local_path"] = u["local_path"]
                            m_idx.loc[pid, "sha256_checksum"] = u["sha256_checksum"]
                            m_idx.loc[pid, "byte_size"] = u["byte_size"]
                            m_idx.loc[pid, "error_detail"] = u["error_detail"]
                            m_idx.loc[pid, "fetched_at_utc"] = datetime.now(timezone.utc).isoformat()

                df_m_updated = m_idx.reset_index()
                df_m_updated.to_parquet(self.manifest_path, index=False)

                # 2. Update silver papers.parquet has_pdf
                if self.silver_papers_path.exists():
                    df_s = pd.read_parquet(self.silver_papers_path)
                    s_idx = df_s.set_index("paper_id")
                    for pid, u in self.processed_updates.items():
                        if pid in s_idx.index and u["status"] == "VAULTED":
                            s_idx.loc[pid, "has_pdf"] = True
                            s_idx.loc[pid, "local_pdf_path"] = u["local_path"]
                    s_idx.reset_index().to_parquet(self.silver_papers_path, index=False)

                flushed_num = len(self.processed_updates)
                self.processed_updates.clear()
                log_audit_event("PDF_VAULT_CHECKPOINT", "BulkPDFVault", {
                    "flushed_count": flushed_num,
                    "total_vaulted": self.success_count,
                    "total_failed": self.error_count,
                })
            except Exception as e:
                logger.error("Failed to flush checkpoint: %s", e)

    def run_harvest(self, source_filter: str = "all", limit: Optional[int] = None) -> dict[str, int]:
        """Execute partitioned harvesting workflow."""
        candidates = self.load_candidates(source_filter=source_filter)
        total_candidates = len(candidates)
        
        # Partition into already vaulted vs pending
        pending = [c for c in candidates if not c["already_vaulted"]]
        cached_count = total_candidates - len(pending)

        logger.info("Found %d total '%s' candidates (%d already vaulted, %d pending download)",
                    total_candidates, source_filter, cached_count, len(pending))

        if limit is not None:
            pending = pending[:limit]
            logger.info("Applying limit: processing first %d pending candidates", len(pending))

        if not pending:
            logger.info("No pending downloads. All candidates are already vaulted!")
            return {"total": total_candidates, "downloaded": 0, "cached": cached_count, "failed": 0}

        # Separate arXiv (1 worker) from ACL (3 workers)
        arxiv_pending = [c for c in pending if c["domain"] == "arxiv"]
        acl_pending = [c for c in pending if c["domain"] == "acl"]
        other_pending = [c for c in pending if c["domain"] == "other"]

        logger.info("Queues: arXiv = %d (1 worker @ 3s), ACL = %d (3 workers @ 0.8s), Other = %d",
                    len(arxiv_pending), len(acl_pending), len(other_pending))

        completed = 0
        total_to_process = len(pending)

        def worker_task(cand: dict[str, Any]) -> dict[str, Any]:
            res = self.download_paper(cand)
            with self.lock:
                self.processed_updates[res["paper_id"]] = res
                if res["status"] == "VAULTED":
                    if res.get("cached"):
                        self.skip_count += 1
                    else:
                        self.success_count += 1
                else:
                    self.error_count += 1
            return res

        # Run with ThreadPoolExecutor (1 thread for arXiv, 3 for ACL)
        max_workers = 1 if source_filter == "arxiv" else 4
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(worker_task, cand) for cand in pending]

            for future in as_completed(futures):
                completed += 1
                if completed % self.checkpoint_every == 0 or completed == total_to_process:
                    logger.info("Progress: %d/%d processed (Vaulted: %d, Failed: %d)",
                                completed, total_to_process, self.success_count, self.error_count)
                    self.flush_checkpoint()

        self.flush_checkpoint()

        print("\n" + "=" * 65)
        print("          BULK PDF HARVESTING SUMMARY REPORT")
        print("=" * 65)
        print(f" Source Filter         : {source_filter}")
        print(f" Total Candidates      : {total_candidates}")
        print(f" Existing/Cached       : {cached_count}")
        print(f" Newly Vaulted (PDF)   : {self.success_count}")
        print(f" Failed / Paywalled    : {self.error_count}")
        print(f" Target Directory      : {self.pdf_dir}")
        print("=" * 65 + "\n")

        log_audit_event("PDF_VAULT_SUMMARY", "BulkPDFVault", {
            "source_filter": source_filter,
            "total_candidates": total_candidates,
            "cached": cached_count,
            "downloaded": self.success_count,
            "failed": self.error_count,
        })

        return {
            "total": total_candidates,
            "downloaded": self.success_count,
            "cached": cached_count,
            "failed": self.error_count,
        }


def print_status():
    """Print current harvesting progress and domain coverage."""
    if not MANIFEST_PATH.exists():
        print("Manifest not found.")
        return

    df_m = pd.read_parquet(MANIFEST_PATH)
    total = len(df_m)
    vaulted = (df_m["status"] == "VAULTED").sum()
    
    urls = df_m["source_url"].fillna("")
    arxiv_total = urls.str.contains("arxiv.org").sum()
    acl_total = (urls.str.contains("aclanthology.org") | urls.str.contains("aclweb.org")).sum()

    print("\n" + "=" * 60)
    print("             CORPUS PDF HARVESTING STATUS")
    print("=" * 60)
    print(f" Total Papers in Manifest    : {total:,}")
    print(f" Currently Vaulted PDFs      : {vaulted:,} ({vaulted/total*100:.1f}%)")
    print(f" Metadata-Only Papers        : {total - vaulted:,}")
    print("-" * 60)
    print(f" arXiv Papers Available      : {arxiv_total:,}")
    print(f" ACL Anthology Papers        : {acl_total:,}")
    print(f" Combined Core Target        : {arxiv_total + acl_total:,}")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Bulk vault open-access research PDFs from arXiv and ACL Anthology.")
    parser.add_argument("--source", type=str, default="all", choices=["all", "arxiv", "acl"], help="Target paper domain (default: all)")
    parser.add_argument("--limit", type=int, default=None, help="Max pending papers to download (useful for smoke tests)")
    parser.add_argument("--arxiv-delay", type=float, default=3.0, help="Polite delay between arXiv requests in seconds (default: 3.0)")
    parser.add_argument("--acl-delay", type=float, default=0.8, help="Polite delay between ACL requests in seconds (default: 0.8)")
    parser.add_argument("--status", action="store_true", help="Print current status and exit")

    args = parser.parse_args()

    if args.status:
        print_status()
        return

    vault = BulkPDFVault(arxiv_delay=args.arxiv_delay, acl_delay=args.acl_delay)
    vault.run_harvest(source_filter=args.source, limit=args.limit)


if __name__ == "__main__":
    main()
