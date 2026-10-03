"""src/ingest/pdf_downloader.py — PDF Stream Downloader & SHA-256 Checksum Minter."""
from __future__ import annotations

import hashlib
import logging
from pathlib import Path
import time
from typing import Optional, Tuple

import requests

logger = logging.getLogger("PDFDownloader")


def compute_sha256(content: bytes) -> str:
    """Compute cryptographic SHA-256 hash of byte payload."""
    return hashlib.sha256(content).hexdigest()


class PDFDownloader:
    """
    Downloads and cryptographically vaults academic PDFs into Bronze layer.
    Validates PDF magic bytes (%PDF-) to prevent saving paywall HTML redirects.
    """

    def __init__(self, target_dir: Path | str = "data/bronze/pdf_raw", timeout: int = 25, delay_seconds: float = 0.5):
        self.target_dir = Path(target_dir)
        self.target_dir.mkdir(parents=True, exist_ok=True)
        self.timeout = timeout
        self.delay_seconds = delay_seconds
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "UTH-DataMining-Student/1.0 (academic research; contact: student@uth.edu.vn)",
            "Accept": "application/pdf,application/octet-stream,*/*",
        })

    def download_and_vault(
        self,
        paper_id: str,
        pdf_url: str,
        overwrite: bool = False
    ) -> Tuple[bool, Optional[str], Optional[str], int, str]:
        """
        Download PDF, verify binary header, compute SHA-256, and vault into target_dir.

        Returns:
            (success: bool, local_path: Optional[str], sha256: Optional[str], byte_size: int, error_msg: str)
        """
        if not pdf_url:
            return False, None, None, 0, "No PDF URL provided"

        # Sanitize filename (e.g. "openalex:W12345" -> "openalex_W12345.pdf")
        safe_name = paper_id.replace(":", "_").replace("/", "_") + ".pdf"
        target_file = self.target_dir / safe_name

        # Idempotency check: if file already exists and valid, skip re-download
        if target_file.exists() and not overwrite:
            existing_bytes = target_file.read_bytes()
            if existing_bytes.startswith(b"%PDF-"):
                existing_sha = compute_sha256(existing_bytes)
                return True, str(target_file), existing_sha, len(existing_bytes), "Cached"

        time.sleep(self.delay_seconds)

        try:
            resp = self.session.get(pdf_url, stream=True, timeout=self.timeout, allow_redirects=True)
            if resp.status_code != 200:
                return False, None, None, 0, f"HTTP {resp.status_code} ({resp.reason})"

            content = resp.content
            byte_size = len(content)

            # Verification: Minimum size & PDF magic bytes
            if byte_size < 1024:
                return False, None, None, byte_size, "File too small (< 1KB), likely error page"

            if not content.startswith(b"%PDF-"):
                return False, None, None, byte_size, f"Invalid magic bytes ({content[:10]!r}), likely HTML paywall/captcha"

            # Compute SHA-256 and vault
            sha256_hash = compute_sha256(content)
            target_file.write_bytes(content)
            logger.info("Vaulted PDF %s (%d bytes, sha256: %s...)", safe_name, byte_size, sha256_hash[:12])

            return True, str(target_file), sha256_hash, byte_size, "OK"

        except requests.Timeout:
            return False, None, None, 0, "Connection timed out"
        except requests.RequestException as err:
            return False, None, None, 0, f"Request failed: {err}"
        except Exception as err:
            return False, None, None, 0, f"Unexpected error: {err}"
