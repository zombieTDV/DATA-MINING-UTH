"""tests/test_ingest.py — Unit Tests for Ingestion, PDF Downloader, Vault & Silver Builder."""
from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from src.ingest.openalex_client import OpenAlexClient, reconstruct_abstract
from src.ingest.pdf_downloader import PDFDownloader, compute_sha256
from src.ingest.bronze_vault import BronzeVault
from src.ingest.silver_builder import SilverBuilder


def test_reconstruct_abstract():
    inverted = {
        "Attention": [0],
        "is": [1],
        "all": [2],
        "you": [3],
        "need": [4],
        "for": [5],
        "effective": [6],
        "translation": [7],
    }
    assert reconstruct_abstract(inverted) == "Attention is all you need for effective translation"
    assert reconstruct_abstract(None) == ""
    assert reconstruct_abstract({}) == ""


def test_openalex_work_item_parsing():
    client = OpenAlexClient()
    mock_raw = {
        "id": "https://openalex.org/W2741809807",
        "title": "Attention Is All You Need",
        "publication_year": 2017,
        "publication_date": "2017-06-12",
        "cited_by_count": 120000,
        "abstract_inverted_index": {"The": [0], "dominant": [1], "sequence": [2], "models": [3]},
        "authorships": [
            {"author": {"display_name": "Ashish Vaswani"}},
            {"author": {"display_name": "Noam Shazeer"}},
        ],
        "topics": [
            {"display_name": "Natural Language Processing"},
            {"display_name": "Deep Learning Architectures"},
        ],
        "keywords": [
            {"display_name": "transformer", "score": 0.98},
            {"display_name": "attention mechanism", "score": 0.95},
        ],
        "primary_location": {
            "source": {"display_name": "NeurIPS"},
            "pdf_url": "https://arxiv.org/pdf/1706.03762.pdf",
        },
        "ids": {
            "doi": "https://doi.org/10.48550/arxiv.1706.03762",
            "arxiv": "1706.03762",
        },
        "referenced_works": [
            "https://openalex.org/W2145558902",
            "https://openalex.org/W2116035848",
        ],
    }

    parsed = client.parse_work_item(mock_raw)
    assert parsed["paper_id"] == "openalex:W2741809807"
    assert parsed["openalex_id"] == "W2741809807"
    assert parsed["title"] == "Attention Is All You Need"
    assert parsed["abstract"] == "The dominant sequence models"
    assert parsed["authors"] == ["Ashish Vaswani", "Noam Shazeer"]
    assert parsed["year"] == 2017
    assert parsed["citation_count"] == 120000
    assert parsed["topics"] == ["Natural Language Processing", "Deep Learning Architectures"]
    assert len(parsed["keywords"]) == 2
    assert parsed["pdf_url"] == "https://arxiv.org/pdf/1706.03762.pdf"
    assert parsed["referenced_works"] == ["W2145558902", "W2116035848"]


def test_pdf_downloader_validation():
    with tempfile.TemporaryDirectory() as tmpdir:
        downloader = PDFDownloader(target_dir=tmpdir, delay_seconds=0.0)

        # 1. Missing URL
        ok, path, sha, size, msg = downloader.download_and_vault("openalex:W1", "")
        assert not ok
        assert msg == "No PDF URL provided"

        # 2. Fake HTML paywall response
        with patch.object(downloader.session, "get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.content = b"<html><title>Paywall Login</title><body>" + (b"A" * 1200) + b"</body></html>"
            mock_get.return_value = mock_resp

            ok, path, sha, size, msg = downloader.download_and_vault("openalex:W2", "https://paywall.com/paper.pdf")
            assert not ok
            assert "Invalid magic bytes" in msg

        # 3. Valid binary PDF payload
        valid_pdf_bytes = b"%PDF-1.5\n%Mock PDF header\n" + (b"0" * 2000)
        expected_sha = compute_sha256(valid_pdf_bytes)

        with patch.object(downloader.session, "get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.content = valid_pdf_bytes
            mock_get.return_value = mock_resp

            ok, path, sha, size, msg = downloader.download_and_vault("openalex:W3", "https://arxiv.org/pdf/1706.pdf")
            assert ok
            assert sha == expected_sha
            assert size == len(valid_pdf_bytes)
            assert Path(path).exists()
            assert Path(path).read_bytes() == valid_pdf_bytes


def test_bronze_vault_manifest_management():
    with tempfile.TemporaryDirectory() as tmpdir:
        vault = BronzeVault(bronze_dir=tmpdir)

        # Save raw JSON batch
        batch_path = vault.save_raw_batch([{"id": "W1", "title": "Test Paper"}], batch_id="test1")
        assert batch_path.exists()

        # Update manifest
        records = [
            {
                "paper_id": "openalex:W1",
                "source_url": "https://example.com/w1.pdf",
                "local_path": "data/bronze/pdf_raw/openalex_W1.pdf",
                "sha256_checksum": "abcdef123456",
                "byte_size": 2048,
                "status": "VAULTED",
                "error_detail": "OK",
            }
        ]
        manifest_path = vault.update_manifest(records)
        assert manifest_path.exists()

        vaulted_ids = vault.get_vaulted_paper_ids()
        assert "openalex:W1" in vaulted_ids


def test_silver_builder_tables_and_internal_citations():
    with tempfile.TemporaryDirectory() as tmpdir:
        builder = SilverBuilder(silver_dir=tmpdir)

        # 2 mock papers where Paper A cites Paper B, and Paper A also cites external Paper X
        works = [
            {
                "paper_id": "openalex:W_A",
                "openalex_id": "W_A",
                "title": "BERT: Pre-training of Deep Bidirectional Transformers",
                "abstract": "We introduce BERT...",
                "year": 2019,
                "publication_date": "2019-05-24",
                "venue": "NAACL",
                "doi": "10.18653/v1/N19-1423",
                "arxiv_id": "1810.04805",
                "authors": ["Jacob Devlin", "Ming-Wei Chang"],
                "citation_count": 85000,
                "topics": ["Natural Language Processing"],
                "keywords": [
                    {"keyword": "transformer", "score": 0.99},
                    {"keyword": "bidirectional", "score": 0.88},
                ],
                "referenced_works": ["W_B", "W_EXTERNAL_X"],
            },
            {
                "paper_id": "openalex:W_B",
                "openalex_id": "W_B",
                "title": "Attention Is All You Need",
                "abstract": "We propose the Transformer...",
                "year": 2017,
                "publication_date": "2017-06-12",
                "venue": "NeurIPS",
                "doi": "10.48550/arxiv.1706.03762",
                "arxiv_id": "1706.03762",
                "authors": ["Ashish Vaswani"],
                "citation_count": 120000,
                "topics": ["Natural Language Processing"],
                "keywords": [{"keyword": "transformer", "score": 0.95}],
                "referenced_works": ["W_ANCIENT_LSTM"],
            },
        ]

        manifest = [
            {"paper_id": "openalex:W_A", "status": "VAULTED", "local_path": "data/bronze/pdf_raw/openalex_W_A.pdf", "sha256_checksum": "hashA"},
            {"paper_id": "openalex:W_B", "status": "METADATA_ONLY", "local_path": "", "sha256_checksum": ""},
        ]

        silver_files = builder.build_silver_tables(works, manifest_records=manifest)
        assert Path(silver_files["papers"]).exists()
        assert Path(silver_files["citations"]).exists()
        assert Path(silver_files["keywords"]).exists()

        # Check papers.parquet
        papers_df = pd.read_parquet(silver_files["papers"])
        assert len(papers_df) == 2
        bert_row = papers_df[papers_df["paper_id"] == "openalex:W_A"].iloc[0]
        assert bool(bert_row["has_pdf"]) is True
        assert bert_row["raw_sha256"] == "hashA"
        transformer_row = papers_df[papers_df["paper_id"] == "openalex:W_B"].iloc[0]
        assert bool(transformer_row["has_pdf"]) is False

        # Check citations.parquet and internal edge flagging
        citations_df = pd.read_parquet(silver_files["citations"])
        assert len(citations_df) == 3  # (W_A -> W_B), (W_A -> W_EXTERNAL_X), (W_B -> W_ANCIENT_LSTM)

        # Internal citation check: W_A -> W_B MUST be True!
        internal_edges = citations_df[citations_df["is_internal"] == True]
        assert len(internal_edges) == 1
        edge = internal_edges.iloc[0]
        assert edge["citing_paper_id"] == "openalex:W_A"
        assert edge["cited_paper_id"] == "openalex:W_B"

        # External citation check: W_A -> W_EXTERNAL_X MUST be False!
        external_edges = citations_df[citations_df["is_internal"] == False]
        assert len(external_edges) == 2

        # Check keywords.parquet
        keywords_df = pd.read_parquet(silver_files["keywords"])
        assert len(keywords_df) == 3
        assert set(keywords_df["keyword"]) == {"transformer", "bidirectional"}
