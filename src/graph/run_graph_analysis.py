"""src/graph/run_graph_analysis.py — Master CLI for Graph Analysis & Trend Discovery."""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from src.graph.citation_network import CitationNetworkAnalyzer
from src.graph.keyword_graph import KeywordGraphAnalyzer
from src.graph.association_rules import AssociationRuleMiner
from src.graph.visualizer import NetworkVisualizer
from src.trends.trend_tables import TrendTableEngine
from src.trends.plot_trends import TrendPlotter

from src.utils.logger import get_logger, log_audit_event, ensure_log_dirs

ensure_log_dirs()
logger = get_logger("GraphAnalysisCLI", log_file="logs/graph/citation_network.log")


def execute_pipeline(
    silver_dir: str = "data/silver",
    gold_dir: str = "data/gold",
    min_support: float = 0.015,
    min_confidence: float = 0.25,
    min_lift: float = 1.15,
) -> dict[str, Any]:
    """Execute end-to-end Phase 3 analytics pipeline."""
    gold_path = Path(gold_dir)
    graphs_dir = gold_path / "graphs"
    trends_dir = gold_path / "trends"
    plots_dir = gold_path / "plots"

    for d in (graphs_dir, trends_dir, plots_dir):
        d.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 70)
    print("      PHASE 3: GRAPH ANALYSIS & BIBLIOMETRIC TREND DISCOVERY")
    print("=" * 70)

    # 1. Citation Network & PageRank
    logger.info("--- [1/5] Building Citation Network & Computing PageRank ---")
    cit_analyzer = CitationNetworkAnalyzer(
        papers_path=Path(silver_dir) / "papers.parquet",
        citations_path=Path(silver_dir) / "citations.parquet",
    )
    cit_metrics_df, cit_graph = cit_analyzer.compute_metrics()
    cit_metrics_file = cit_analyzer.save_metrics(graphs_dir / "citation_metrics.parquet")

    # 2. Keyword Co-occurrence & Graph Centrality
    logger.info("--- [2/5] Building Keyword Co-occurrence Graph ---")
    kw_analyzer = KeywordGraphAnalyzer(keywords_path=Path(silver_dir) / "keywords.parquet")
    kw_metrics_df, kw_graph = kw_analyzer.compute_metrics()
    kw_metrics_file = kw_analyzer.save_metrics(graphs_dir / "keyword_metrics.parquet")

    # 3. Frequent Pattern & Association Rule Mining (FP-Growth)
    logger.info("--- [3/5] Mining Association Rules via FP-Growth ---")
    rule_miner = AssociationRuleMiner(
        keywords_path=Path(silver_dir) / "keywords.parquet",
        papers_path=Path(silver_dir) / "papers.parquet",
    )
    rules_df = rule_miner.mine_rules(
        min_support=min_support,
        min_confidence=min_confidence,
        min_lift=min_lift,
    )
    rules_file = rule_miner.save_rules(
        output_path=trends_dir / "association_rules.parquet",
        min_support=min_support,
        min_confidence=min_confidence,
        min_lift=min_lift,
    )

    # 4. DuckDB Columnar Trend Tables
    logger.info("--- [4/5] Computing DuckDB Longitudinal Trend Tables ---")
    trend_engine = TrendTableEngine(silver_dir=silver_dir, gold_dir=trends_dir)
    trend_tables = trend_engine.build_all_trends()

    # 5. Visualizations (PyVis Interactive HTML + Static Seaborn PNG)
    logger.info("--- [5/5] Generating Visualizations (Interactive HTML + Static PNG) ---")
    visualizer = NetworkVisualizer(output_dir=graphs_dir)
    html_cit = visualizer.export_citation_network_html(cit_graph, cit_metrics_df)
    html_kw = visualizer.export_keyword_network_html(kw_graph, kw_metrics_df)

    plotter = TrendPlotter(gold_trends_dir=trends_dir, output_dir=plots_dir)
    plots = plotter.plot_all()

    # 6. Display Analytical Summary Report
    print("\n" + "=" * 70)
    print("                     PHASE 3 ANALYTICAL SUMMARY")
    print("=" * 70)

    print("\n[+] Top 5 Foundational Landmark Papers by PageRank:")
    top_pr = cit_metrics_df.head(5)[["year", "pagerank", "citation_count", "title"]]
    for idx, row in top_pr.iterrows():
        title_snippet = row["title"][:45] + "..." if len(row["title"]) > 45 else row["title"]
        print(f"  {idx+1}. [{row['year']}] (PR: {row['pagerank']:.5f} | Cites: {row['citation_count']:,}) {title_snippet}")

    print("\n[+] Research Communities Discovered (Louvain Modularity):")
    comm_counts = cit_metrics_df["community_label"].value_counts().head(5)
    for label, count in comm_counts.items():
        print(f"  • {label}: {count} papers")

    print(f"\n[+] Frequent Itemset Association Rules Mined (Lift > {min_lift:.2f}):")
    if not rules_df.empty:
        top_rules = rules_df.head(5)[["antecedents_str", "consequents_str", "support", "confidence", "lift"]]
        for _, r in top_rules.iterrows():
            print(f"  • {{{r['antecedents_str']}}} => {{{r['consequents_str']}}} (Supp: {r['support']:.3f}, Conf: {r['confidence']:.2f}, Lift: {r['lift']:.2f})")
    else:
        print("  • No association rules found exceeding threshold.")

    print("\n[+] Output Artifacts Generated:")
    print(f"  • Citation Metrics Table : {cit_metrics_file}")
    print(f"  • Keyword Metrics Table  : {kw_metrics_file}")
    print(f"  • Association Rules Table: {rules_file}")
    print(f"  • Year x Topic Trends    : {trend_tables.get('year_x_topic')}")
    print(f"  • Year x Keyword Trends  : {trend_tables.get('year_x_keyword')}")
    print(f"  • Interactive Graph HTML : {html_cit}")
    print(f"  • Interactive Keyword HTML: {html_kw}")
    for name, path in plots.items():
        print(f"  • Plot [{name}]: {path}")
    print("=" * 70 + "\n")

    log_audit_event("GRAPH_ANALYSIS_COMPLETE", "GraphAnalysisCLI", {
        "silver_dir": silver_dir,
        "gold_dir": gold_dir,
        "citation_metrics_nodes": len(cit_metrics_df),
        "rules_mined": len(rules_df),
    })

    return {
        "cit_metrics_file": cit_metrics_file,
        "kw_metrics_file": kw_metrics_file,
        "rules_file": rules_file,
        "html_cit": html_cit,
        "html_kw": html_kw,
        "plots": plots,
    }


def main():
    parser = argparse.ArgumentParser(description="Execute Phase 3 Graph Analysis & Trend Discovery.")
    parser.add_argument("--silver-dir", type=str, default="data/silver", help="Silver storage root")
    parser.add_argument("--gold-dir", type=str, default="data/gold", help="Gold storage root")
    parser.add_argument("--min-support", type=float, default=0.015, help="FP-Growth min support")
    parser.add_argument("--min-confidence", type=float, default=0.25, help="Min rule confidence")
    parser.add_argument("--min-lift", type=float, default=1.15, help="Min rule lift")

    args = parser.parse_args()
    execute_pipeline(
        silver_dir=args.silver_dir,
        gold_dir=args.gold_dir,
        min_support=args.min_support,
        min_confidence=args.min_confidence,
        min_lift=args.min_lift,
    )


if __name__ == "__main__":
    main()
