"""tests/test_config.py — Unit tests for centralized pipeline configuration."""
import pytest
from pathlib import Path
from src.config import load_config, load_yaml, PipelineConfig, DEFAULT_CONFIG_PATH


def test_config_yaml_file_exists():
    """Verify that configs/config.yaml exists in the repository."""
    assert DEFAULT_CONFIG_PATH.exists(), f"Missing config file at {DEFAULT_CONFIG_PATH}"


def test_load_yaml_raw_structure():
    """Verify raw YAML content contains the required top-level configuration sections."""
    raw = load_yaml(DEFAULT_CONFIG_PATH)
    assert isinstance(raw, dict)
    for section in ["collection", "data_sources", "topics_and_tags", "storage", "graph_analytics", "rag_pipeline"]:
        assert section in raw, f"Missing section '{section}' in {DEFAULT_CONFIG_PATH}"


def test_load_config_typed_values():
    """Verify that load_config maps values accurately into strongly typed dataclasses."""
    cfg = load_config(DEFAULT_CONFIG_PATH)

    # 1. Collection
    assert cfg.collection.target_papers == 10000
    assert cfg.collection.pilot_size == 200
    assert cfg.collection.start_year == 2017
    assert cfg.collection.end_year == 2026
    assert cfg.collection.language == "en"
    assert cfg.collection.stratify_by_year is True

    # 2. Data Sources
    assert "openalex.org" in cfg.openalex.base_url
    assert cfg.openalex.rate_limit_delay_seconds >= 0.1
    assert cfg.openalex.max_retries >= 1
    assert cfg.pdf_vaulting.max_file_size_mb == 35
    assert cfg.pdf_vaulting.max_pages_per_pdf == 25

    # 3. Topics and Tags
    topic_ids = [t["id"] for t in cfg.topics.openalex_topic_ids if "id" in t]
    assert "T10181" in topic_ids
    assert "T10028" in topic_ids
    assert len(cfg.topics.target_tags) >= 5
    assert "transformer" in cfg.topics.target_tags

    # 4. Storage layout
    assert Path(cfg.storage.bronze_root) == Path("data/bronze")
    assert Path(cfg.storage.silver_root) == Path("data/silver")
    assert Path(cfg.storage.gold_root) == Path("data/gold")

    # 5. Graph Analytics
    assert 0.0 < cfg.graph.pagerank_alpha < 1.0
    assert cfg.graph.fpgrowth_min_support > 0.0

    # 6. RAG Pipeline
    assert "all-MiniLM-L6-v2" in cfg.rag.embedding_model
    assert cfg.rag.embedding_dim == 384
    assert cfg.rag.default_top_k == 5
    assert cfg.rag.default_graph_boost == 0.25


def test_load_config_fallback_defaults(tmp_path):
    """Verify load_config falls back to sensible defaults when file is missing."""
    missing_path = tmp_path / "non_existent.yaml"
    cfg = load_config(missing_path)
    assert isinstance(cfg, PipelineConfig)
    assert cfg.collection.target_papers == 10000
    assert cfg.openalex.base_url == "https://api.openalex.org/works"
