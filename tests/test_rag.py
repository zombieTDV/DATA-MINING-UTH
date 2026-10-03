"""tests/test_rag.py — Unit and integration tests for the Hybrid Graph-RAG pipeline."""
from __future__ import annotations

from pathlib import Path
import pytest
import pandas as pd

from src.rag.parser import PDFSectionParser
from src.rag.chunker import SemanticChunker
from src.rag.indexer import LanceDBHybridIndexer
from src.rag.service import RAGService


def test_pdf_parser_clean_text():
    parser = PDFSectionParser()
    raw = "The atten-\ntion mechanism was introduced in trans-\nformers.\n\n\n\nFinal."
    cleaned = parser.clean_text(raw)
    assert "attention" in cleaned
    assert "transformers" in cleaned
    assert "\n\n\n" not in cleaned


def test_pdf_parser_sample_vaulted_pdf():
    parser = PDFSectionParser()
    sample_pdf = Path("data/bronze/pdf_raw/openalex_W2468328197.pdf")
    if not sample_pdf.exists():
        pytest.skip("Sample PDF not found in data/bronze/pdf_raw/")

    sections = parser.parse_pdf(sample_pdf, paper_id="openalex:W2468328197")
    assert len(sections) > 0
    # Verify section fields
    s0 = sections[0]
    assert s0["paper_id"] == "openalex:W2468328197"
    assert "section_title" in s0
    assert "text" in s0
    assert len(s0["text"]) > 40
    # References should not be included as a content section
    titles = [s["section_title"].lower() for s in sections]
    assert "references" not in titles
    assert "bibliography" not in titles


def test_semantic_chunker(tmp_path: Path):
    silver_dir = tmp_path / "silver"
    gold_dir = tmp_path / "gold"
    silver_dir.mkdir(parents=True)
    gold_dir.mkdir(parents=True)

    # 1. Mock papers.parquet
    papers_data = [
        {
            "paper_id": "P1",
            "title": "Attention Is All You Need",
            "year": 2017,
            "abstract": "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
            "citation_count": 26000,
            "doi": "https://doi.org/10.48550/arXiv.1706.03762",
        },
        {
            "paper_id": "P2",
            "title": "BERT: Pre-training of Deep Bidirectional Transformers",
            "year": 2019,
            "abstract": "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations.",
            "citation_count": 12000,
            "doi": "https://doi.org/10.48550/arXiv.1810.04805",
        }
    ]
    pd.DataFrame(papers_data).to_parquet(silver_dir / "papers.parquet", index=False)

    # 2. Mock sections.parquet
    sections_data = [
        {
            "paper_id": "P1",
            "section_idx": 1,
            "section_title": "Model Architecture",
            "text": "The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers.",
            "char_count": 120,
        }
    ]
    pd.DataFrame(sections_data).to_parquet(silver_dir / "sections.parquet", index=False)

    # 3. Mock citation_metrics.parquet
    graphs_dir = gold_dir / "graphs"
    graphs_dir.mkdir(parents=True)
    metrics_data = [
        {"paper_id": "P1", "pagerank": 0.012, "community_id": 1},
        {"paper_id": "P2", "pagerank": 0.008, "community_id": 1},
    ]
    pd.DataFrame(metrics_data).to_parquet(graphs_dir / "citation_metrics.parquet", index=False)

    # 4. Run chunker
    chunker = SemanticChunker(silver_dir=silver_dir, gold_dir=gold_dir, chunk_size=300, chunk_overlap=50)
    out_file = silver_dir / "chunks.parquet"
    chunks_df = chunker.build_chunks(output_path=out_file)

    assert out_file.exists()
    assert len(chunks_df) == 3  # 2 abstracts + 1 section chunk
    # Check abstract chunk
    p1_abs = chunks_df[chunks_df["chunk_id"] == "P1_c000"].iloc[0]
    assert p1_abs["chunk_type"] == "abstract"
    assert p1_abs["pagerank"] == 0.012
    assert "[Attention Is All You Need] [2017] [Abstract]" in p1_abs["context_header"]

    # Check section chunk
    p1_sec = chunks_df[chunks_df["chunk_id"] == "P1_c001"].iloc[0]
    assert p1_sec["chunk_type"] == "section"
    assert p1_sec["section_title"] == "Model Architecture"


def test_lancedb_indexing_and_hybrid_search(tmp_path: Path):
    db_dir = tmp_path / "lancedb"
    indexer = LanceDBHybridIndexer(db_path=db_dir)

    # Mock chunk records in parquet
    chunks_file = tmp_path / "test_chunks.parquet"
    sample_data = [
        {
            "chunk_id": "P1_c000",
            "paper_id": "P1",
            "title": "Attention Is All You Need",
            "year": 2017,
            "section_title": "Abstract",
            "context_header": "[Attention Is All You Need] [2017] [Abstract]",
            "text": "The Transformer network architecture relies entirely on an attention mechanism to draw global dependencies between input and output.",
            "full_chunk_text": "[Attention Is All You Need] [2017] [Abstract]\nThe Transformer network architecture relies entirely on an attention mechanism.",
            "pagerank": 0.0120,
            "citation_count": 26000,
            "community_id": 1,
            "doi": "10.48550/arXiv.1706.03762",
            "chunk_type": "abstract",
        },
        {
            "chunk_id": "P2_c000",
            "paper_id": "P2",
            "title": "BERT: Pre-training of Deep Bidirectional Transformers",
            "year": 2019,
            "section_title": "Abstract",
            "context_header": "[BERT] [2019] [Abstract]",
            "text": "BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context.",
            "full_chunk_text": "[BERT] [2019] [Abstract]\nBERT is designed to pre-train deep bidirectional representations.",
            "pagerank": 0.0080,
            "citation_count": 12000,
            "community_id": 1,
            "doi": "10.48550/arXiv.1810.04805",
            "chunk_type": "abstract",
        }
    ]
    pd.DataFrame(sample_data).to_parquet(chunks_file, index=False)

    # Build index
    table = indexer.build_index(chunks_path=chunks_file, batch_size=2)
    assert len(table) == 2

    # Hybrid search
    results = indexer.hybrid_search("transformer attention mechanism", top_k=2, graph_boost_weight=0.30)
    assert len(results) == 2
    # Attention Is All You Need should rank #1 due to both textual similarity and highest PageRank
    assert results[0]["id"] == "P1_c000"
    assert "score" in results[0]
    assert "pagerank_norm" in results[0]


def test_rag_service_citation_verification(tmp_path: Path):
    db_dir = tmp_path / "lancedb"
    indexer = LanceDBHybridIndexer(db_path=db_dir)

    chunks_file = tmp_path / "test_chunks.parquet"
    sample_data = [
        {
            "chunk_id": "openalex:W2468328197_c000",
            "paper_id": "openalex:W2468328197",
            "title": "Bag of Tricks for Efficient Text Classification",
            "year": 2017,
            "section_title": "Abstract",
            "context_header": "[Bag of Tricks] [2017] [Abstract]",
            "text": "Linear models with rank constraints and fast loss approximation can train fast.",
            "full_chunk_text": "[Bag of Tricks] [2017] [Abstract]\nLinear models with rank constraints can train fast.",
            "pagerank": 0.005,
            "citation_count": 5000,
            "community_id": 1,
            "doi": "",
            "chunk_type": "abstract",
        }
    ]
    pd.DataFrame(sample_data).to_parquet(chunks_file, index=False)
    indexer.build_index(chunks_path=chunks_file)

    service = RAGService(indexer=indexer)

    # 1. Test citation verifier on valid citation
    valid_text = "Linear models achieve high efficiency [openalex:W2468328197_c000]."
    retrieved_ids = {"openalex:W2468328197_c000"}
    verified, hallucinated = service.verify_citations(valid_text, retrieved_ids)
    assert verified == ["openalex:W2468328197_c000"]
    assert hallucinated == []

    # 2. Test citation verifier on hallucinated citation
    invalid_text = "Transformers are fast [openalex:W9999999999_c000]."
    verified, hallucinated = service.verify_citations(invalid_text, retrieved_ids)
    assert verified == []
    assert hallucinated == ["openalex:W9999999999_c000"]

    # 3. Test end-to-end query with mock generator
    response = service.query("linear models text classification", top_k=1)
    assert response.is_fully_grounded
    assert "openalex:W2468328197_c000" in response.verified_citations
    assert len(response.retrieved_chunks) == 1
