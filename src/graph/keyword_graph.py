"""src/graph/keyword_graph.py — Keyword Co-occurrence Network & Thematic Community Clustering."""
from __future__ import annotations

import itertools
import logging
from pathlib import Path
from typing import Any, Tuple

import networkx as nx
import pandas as pd

logger = logging.getLogger("KeywordGraph")


class KeywordGraphAnalyzer:
    """
    Constructs and analyzes concept co-occurrence networks from paper keywords.
    Computes betweenness centrality for bridging concepts and Louvain modularity clusters.
    """

    def __init__(self, keywords_path: Path | str = "data/silver/keywords.parquet"):
        self.keywords_path = Path(keywords_path)
        self.graph: nx.Graph = nx.Graph()

    def build_graph(self, min_edge_weight: int = 1) -> nx.Graph:
        """
        Build weighted undirected co-occurrence graph.
        An edge exists between two keywords if they appear together in at least min_edge_weight papers.
        """
        df = pd.read_parquet(self.keywords_path)
        if df.empty:
            return nx.Graph()

        # Group keywords per paper
        paper_keywords = df.groupby("paper_id")["keyword"].apply(lambda s: sorted(list(set(s.dropna())))).to_dict()

        cooccurrence_counts: dict[tuple[str, str], int] = {}
        node_frequencies: dict[str, int] = {}

        for pid, kw_set in paper_keywords.items():
            for kw in kw_set:
                node_frequencies[kw] = node_frequencies.get(kw, 0) + 1

            for kw1, kw2 in itertools.combinations(kw_set, 2):
                pair = (min(kw1, kw2), max(kw1, kw2))
                cooccurrence_counts[pair] = cooccurrence_counts.get(pair, 0) + 1

        G = nx.Graph()

        # Add nodes with occurrence counts
        for kw, freq in node_frequencies.items():
            G.add_node(kw, frequency=freq)

        # Add edges with co-occurrence weights & Jaccard index
        for (kw1, kw2), count in cooccurrence_counts.items():
            if count >= min_edge_weight:
                f1 = node_frequencies[kw1]
                f2 = node_frequencies[kw2]
                jaccard = count / (f1 + f2 - count)
                G.add_edge(kw1, kw2, weight=count, jaccard=round(jaccard, 4))

        self.graph = G
        logger.info(
            "Built keyword co-occurrence graph: %d keywords, %d co-occurrence edges (min_weight=%d)",
            G.number_of_nodes(),
            G.number_of_edges(),
            min_edge_weight,
        )
        return G

    def compute_metrics(self) -> Tuple[pd.DataFrame, nx.Graph]:
        """
        Compute node centrality metrics (degree, betweenness) and Louvain modularity clusters.

        Returns:
            (metrics_df, graph)
        """
        if self.graph.number_of_nodes() == 0:
            self.build_graph()

        G = self.graph
        if G.number_of_nodes() == 0:
            return pd.DataFrame(), G

        # Centrality
        degree_dict = dict(G.degree(weight="weight"))
        unweighted_degree = dict(G.degree())

        try:
            sample_k = min(100, len(G)) if len(G) > 100 else None
            betweenness_dict = nx.betweenness_centrality(G, k=sample_k, seed=42, normalized=True)
        except Exception:
            betweenness_dict = {n: 0.0 for n in G.nodes()}

        # Louvain Modularity Community Detection
        community_map: dict[str, int] = {}
        if G.number_of_edges() > 0:
            try:
                communities = list(nx.community.louvain_communities(G, weight="weight", seed=42))
                for c_id, c_nodes in enumerate(communities):
                    for n in c_nodes:
                        community_map[n] = c_id
            except Exception as err:
                logger.warning("Louvain keyword clustering error: %s", err)

        rows: list[dict[str, Any]] = []
        for n in G.nodes():
            freq = G.nodes[n].get("frequency", 1)
            rows.append({
                "keyword": n,
                "frequency": freq,
                "weighted_degree": degree_dict.get(n, 0),
                "unweighted_degree": unweighted_degree.get(n, 0),
                "betweenness_centrality": betweenness_dict.get(n, 0.0),
                "community_id": community_map.get(n, -1),
            })

        df = pd.DataFrame(rows).sort_values("weighted_degree", ascending=False).reset_index(drop=True)
        return df, G

    def save_metrics(self, output_path: Path | str = "data/gold/graphs/keyword_metrics.parquet") -> Path:
        """Compute and persist keyword metrics table."""
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        df, _ = self.compute_metrics()
        df.to_parquet(out, index=False)
        logger.info("Saved keyword metrics for %d terms to %s", len(df), out)
        return out
