"""tests/test_bulk_vault.py — Unit tests for bulk PDF harvesting engine."""
import time
from pathlib import Path
import pytest

from src.ingest.bulk_vault import (
    classify_domain,
    normalize_pdf_url,
    DomainRateLimiter,
    BulkPDFVault,
)


def test_classify_domain():
    """Verify domain classification for arXiv, ACL Anthology, and external domains."""
    assert classify_domain("https://arxiv.org/pdf/2106.09685.pdf") == "arxiv"
    assert classify_domain("http://arxiv.org/abs/2106.09685") == "arxiv"
    assert classify_domain("", doi="https://doi.org/10.48550/arxiv.2106.09685") == "arxiv"

    assert classify_domain("https://aclanthology.org/2020.acl-main.1.pdf") == "acl"
    assert classify_domain("https://www.aclweb.org/anthology/P17-1099.pdf") == "acl"

    assert classify_domain("https://link.springer.com/content/pdf/10.1007.pdf") == "other"
    assert classify_domain("https://ieeexplore.ieee.org/stamp/stamp.jsp") == "other"


def test_normalize_pdf_url():
    """Verify URL normalization upgrades HTTP and converts arXiv abstract URLs to direct PDF."""
    norm_abs = normalize_pdf_url("https://arxiv.org/abs/2106.09685v2")
    assert norm_abs == "https://arxiv.org/pdf/2106.09685.pdf"

    norm_http = normalize_pdf_url("http://aclanthology.org/P17-1099.pdf")
    assert norm_http == "https://aclanthology.org/P17-1099.pdf"

    norm_doi = normalize_pdf_url("", doi="https://doi.org/10.48550/arxiv.1705.03122")
    assert norm_doi == "https://arxiv.org/pdf/1705.03122.pdf"


def test_domain_rate_limiter():
    """Verify rate limiter pauses when calls occur faster than min_interval."""
    limiter = DomainRateLimiter(min_interval_seconds=0.15)
    t0 = time.perf_counter()
    limiter.wait()
    limiter.wait()
    t1 = time.perf_counter()
    elapsed = t1 - t0
    assert elapsed >= 0.14, f"Rate limiter did not throttle properly (elapsed {elapsed:.3f}s)"


def test_download_paper_cached(tmp_path):
    """Verify that download_paper skips downloading if valid PDF exists on disk."""
    pdf_dir = tmp_path / "pdf_raw"
    pdf_dir.mkdir()
    fake_pdf = pdf_dir / "openalex_Wtest123.pdf"
    fake_pdf.write_bytes(b"%PDF-1.4\n%Fake PDF binary content for testing\n%%EOF")

    vault = BulkPDFVault(
        manifest_path=tmp_path / "fake_manifest.parquet",
        pdf_dir=pdf_dir,
    )

    candidate = {
        "paper_id": "openalex:Wtest123",
        "source_url": "https://arxiv.org/pdf/test123.pdf",
        "domain": "arxiv",
        "safe_name": "openalex_Wtest123.pdf",
        "local_path": fake_pdf,
        "already_vaulted": True,
    }

    result = vault.download_paper(candidate)
    assert result["status"] == "VAULTED"
    assert result["cached"] is True
    assert result["byte_size"] > 0
    assert len(result["sha256_checksum"]) == 64
