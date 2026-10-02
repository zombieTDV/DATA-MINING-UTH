"""tests/test_graph.py — Unit Tests for Citation Network, Louvain Clustering, FP-Growth & Trends."""
from __future__ import annotations

import tempfile
from pathlib import Path

import pandas as pd
import pytest

from src.graph.citation_network import CitationNetworkAnalyzer
from src.graph.keyword_graph import KeywordGraphAnalyzer
from src.graph.association_rules import AssociationRuleMiner
from src.trends.trend_tables import TrendTableEngine


def test_citation_network_pagerank_and_centrality():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        papers_file = tmp_path / "papers.parquet"
        citations_file = tmp_path / "citations.parquet"

        # Synthetic papers: P_LANDMARK is cited by P_RECENT_1 and P_RECENT_2
        papers_data = [
            {"paper_id": "P_LANDMARK", "title": "Attention Is All You Need", "year": 2017, "citation_count": 100000, "topics": ["NLP"], "keywords": ["transformer"]},
            {"paper_id": "P_RECENT_1", "title": "BERT Paper", "year": 2019, "citation_count": 80000, "topics": ["NLP"], "keywords": ["transformer", "bert"]},
            {"paper_id": "P_RECENT_2", "title": "GPT-3 Paper", "year": 2020, "citation_count": 50000, "topics": ["NLP"], "keywords": ["transformer", "few-shot"]},
        ]
        pd.DataFrame(papers_data).to_parquet(papers_file, index=False)

        citations_data = [
            {"citing_paper_id": "P_RECENT_1", "cited_paper_id": "P_LANDMARK", "is_internal": True},
            {"citing_paper_id": "P_RECENT_2", "cited_paper_id": "P_LANDMARK", "is_internal": True},
        ]
        pd.DataFrame(citations_data).to_parquet(citations_file, index=False)

        analyzer = CitationNetworkAnalyzer(papers_path=papers_file, citations_path=citations_file)
        metrics_df, G = analyzer.compute_metrics()

        assert len(metrics_df) == 3
        # P_LANDMARK must have in_degree == 2 and highest PageRank
        landmark_row = metrics_df[metrics_df["paper_id"] == "P_LANDMARK"].iloc[0]
        assert landmark_row["in_degree"] == 2
        assert landmark_row["pagerank"] > metrics_df[metrics_df["paper_id"] == "P_RECENT_1"].iloc[0]["pagerank"]


def test_keyword_graph_cooccurrence():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        kw_file = tmp_path / "keywords.parquet"

        kw_data = [
            {"paper_id": "P1", "keyword": "transformer", "score": 0.99, "year": 2017},
            {"paper_id": "P1", "keyword": "attention", "score": 0.95, "year": 2017},
            {"paper_id": "P2", "keyword": "transformer", "score": 0.99, "year": 2018},
            {"paper_id": "P2", "keyword": "attention", "score": 0.90, "year": 2018},
            {"paper_id": "P2", "keyword": "bert", "score": 0.85, "year": 2018},
        ]
        pd.DataFrame(kw_data).to_parquet(kw_file, index=False)

        analyzer = KeywordGraphAnalyzer(keywords_path=kw_file)
        metrics_df, G = analyzer.compute_metrics()

        assert len(metrics_df) == 3
        # "transformer" and "attention" co-occur in 2 papers
        assert G.has_edge("transformer", "attention") or G.has_edge("attention", "transformer")
        edge_data = G.get_edge_data("transformer", "attention")
        assert edge_data["weight"] == 2


def test_association_rules_fpgrowth():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        kw_file = tmp_path / "keywords.parquet"

        # Create transactions where ("rlhf", "alignment") frequently co-occur
        kw_rows = []
        for i in range(10):
            kw_rows.append({"paper_id": f"P_{i}", "keyword": "rlhf", "score": 0.9, "year": 2023})
            kw_rows.append({"paper_id": f"P_{i}", "keyword": "alignment", "score": 0.9, "year": 2023})
            if i < 7:
                kw_rows.append({"paper_id": f"P_{i}", "keyword": "safety", "score": 0.8, "year": 2023})

        pd.DataFrame(kw_rows).to_parquet(kw_file, index=False)

        miner = AssociationRuleMiner(keywords_path=kw_file)
        rules_df = miner.mine_rules(min_support=0.3, min_confidence=0.5, min_lift=1.0)

        assert not rules_df.empty
        # Lift should be >= 1.0
        assert (rules_df["lift"] >= 1.0).all()
        # Verify columns exist
        assert "antecedents_str" in rules_df.columns
        assert "consequents_str" in rules_df.columns


def test_duckdb_trend_engine():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        silver_dir = tmp_path / "silver"
        gold_dir = tmp_path / "gold"
        silver_dir.mkdir(parents=True)
        gold_dir.mkdir(parents=True)

        papers_data = [
            {"paper_id": "P1", "year": 2020, "topics": ["NLP", "Deep Learning"]},
            {"paper_id": "P2", "year": 2020, "topics": ["NLP"]},
            {"paper_id": "P3", "year": 2021, "topics": ["NLP", "Robotics"]},
        ]
        pd.DataFrame(papers_data).to_parquet(silver_dir / "papers.parquet", index=False)

        kw_data = [
            {"paper_id": "P1", "keyword": "transformer", "score": 0.9, "year": 2020},
            {"paper_id": "P2", "keyword": "transformer", "score": 0.9, "year": 2020},
            {"paper_id": "P3", "keyword": "diffusion", "score": 0.9, "year": 2021},
        ]
        pd.DataFrame(kw_data).to_parquet(silver_dir / "keywords.parquet", index=False)

        engine = TrendTableEngine(silver_dir=silver_dir, gold_dir=gold_dir)
        tables = engine.build_all_trends()

        assert Path(tables["year_x_topic"]).exists()
        assert Path(tables["year_x_keyword"]).exists()

        topics_df = pd.read_parquet(tables["year_x_topic"])
        assert len(topics_df) > 0
        # In 2020, NLP appears in 2 of 2 papers (100% share)
        nlp_2020 = topics_df[(topics_df["year"] == 2020) & (topics_df["topic"] == "NLP")].iloc[0]
        assert nlp_2020["yearly_share_pct"] == 100.0


def test_network_visualizer_static_export(tmp_path: Path):
    import networkx as nx
    from src.graph.visualizer import NetworkVisualizer

    G = nx.DiGraph()
    G.add_node("P1", title="Attention Is All You Need", year=2017, citation_count=1000)
    G.add_node("P2", title="BERT", year=2019, citation_count=500)
    G.add_edge("P2", "P1")

    metrics_df = pd.DataFrame([
        {"paper_id": "P1", "pagerank": 0.05, "community_id": 1, "community_label": "Transformers"},
        {"paper_id": "P2", "pagerank": 0.02, "community_id": 1, "community_label": "Transformers"},
    ])

    viz = NetworkVisualizer(output_dir=tmp_path)
    target = viz.export_citation_network_html(G, metrics_df, filename="test_citation.html")

    assert target.exists()
    html_content = target.read_text(encoding="utf-8")

    # Verify static coordinates & disabled live physics
    assert '"enabled": false' in html_content
    assert '"x":' in html_content
    assert '"y":' in html_content
    assert '"rank":' in html_content
    assert 'id="graph-controls"' in html_content
    assert 'btn-fit-view' in html_content
    # Verify clean runtime without 404 utils.js or undefined nodes.get crashes
    assert "lib/bindings/utils.js" not in html_content
    assert "allNodes = nodes.get" not in html_content
    assert "window.ALL_RAW_NODES" in html_content
    assert "window.ALL_RAW_EDGES" in html_content
    assert "data = {nodes: nodes, edges: edges}" in html_content


