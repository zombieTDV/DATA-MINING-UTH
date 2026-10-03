"""src/graph/citation_network.py — NetworkX Citation Graph, PageRank & Community Detection."""
from __future__ import annotations

from collections import Counter
import logging
from pathlib import Path
from typing import Any, Tuple

import networkx as nx
import pandas as pd

logger = logging.getLogger("CitationNetwork")


class CitationNetworkAnalyzer:
    """
    Builds and analyzes directed citation networks over academic literature.
    Computes PageRank, node centrality, and Louvain research community clusters.
    """

    def __init__(
        self,
        papers_path: Path | str = "data/silver/papers.parquet",
        citations_path: Path | str = "data/silver/citations.parquet",
    ):
        self.papers_path = Path(papers_path)
        self.citations_path = Path(citations_path)
        self.graph: nx.DiGraph = nx.DiGraph()

    def build_graph(self, internal_only: bool = True) -> nx.DiGraph:
        """
        Construct directed NetworkX graph where edges point from citing to cited paper.

        Args:
            internal_only: If True, only include edges between papers within the corpus.
        """
        papers_df = pd.read_parquet(self.papers_path)
        citations_df = pd.read_parquet(self.citations_path)

        if internal_only and "is_internal" in citations_df.columns:
            citations_df = citations_df[citations_df["is_internal"] == True]

        G = nx.DiGraph()

        # Add all corpus papers as nodes with metadata
        for _, row in papers_df.iterrows():
            pid = row["paper_id"]
            G.add_node(
                pid,
                title=row.get("title", ""),
                year=int(row.get("year", 0)),
                citation_count=int(row.get("citation_count", 0)),
                topics=row.get("topics", []),
                keywords=row.get("keywords", []),
            )

        # Add citation edges: citing -> cited
        for _, row in citations_df.iterrows():
            citing = row["citing_paper_id"]
            cited = row["cited_paper_id"]
            if internal_only:
                if citing in G and cited in G:
                    G.add_edge(citing, cited)
            else:
                G.add_edge(citing, cited)

        self.graph = G
        logger.info(
            "Built citation graph: %d nodes, %d directed edges (internal_only=%s)",
            G.number_of_nodes(),
            G.number_of_edges(),
            internal_only,
        )
        return G

    def compute_metrics(self) -> Tuple[pd.DataFrame, nx.DiGraph]:
        """
        Compute PageRank, in/out-degree centrality, and Louvain communities.

        Returns:
            (metrics_df, graph)
        """
        if self.graph.number_of_nodes() == 0:
            self.build_graph()

        G = self.graph

        # 1. PageRank
        try:
            pagerank_scores = nx.pagerank(G, alpha=0.85, max_iter=200)
        except Exception as err:
            logger.warning("Standard PageRank failed (%s), falling back to uniform", err)
            pagerank_scores = {n: 1.0 / max(1, len(G)) for n in G.nodes()}

        # 2. Degree Centrality
        in_degrees = dict(G.in_degree())
        out_degrees = dict(G.out_degree())

        # 3. Community Detection (Louvain modularity on undirected projection)
        G_undir = G.to_undirected()
        community_map: dict[str, int] = {}
        community_labels: dict[int, str] = {}

        if G_undir.number_of_edges() > 0:
            try:
                communities = list(nx.community.louvain_communities(G_undir, seed=42))
                for comm_id, comm_nodes in enumerate(communities):
                    # Gather top keywords for this community to synthesize a meaningful label
                    comm_keywords: list[str] = []
                    for n in comm_nodes:
                        community_map[n] = comm_id
                        kws = G.nodes[n].get("keywords", [])
                        if isinstance(kws, list):
                            comm_keywords.extend(kws)

                    top_kw = [k for k, _ in Counter(comm_keywords).most_common(2)]
                    community_labels[comm_id] = " & ".join(top_kw).title() if top_kw else f"Cluster {comm_id}"
            except Exception as err:
                logger.warning("Louvain community detection error: %s", err)

        # Fallback for isolates
        for n in G.nodes():
            if n not in community_map:
                community_map[n] = -1
                community_labels[-1] = "Unclustered / Isolated"

        # 4. Assemble DataFrame
        rows: list[dict[str, Any]] = []
        for n in G.nodes():
            attrs = G.nodes[n]
            comm_id = community_map.get(n, -1)
            rows.append({
                "paper_id": n,
                "title": attrs.get("title", ""),
                "year": attrs.get("year", 0),
                "citation_count": attrs.get("citation_count", 0),
                "pagerank": pagerank_scores.get(n, 0.0),
                "in_degree": in_degrees.get(n, 0),
                "out_degree": out_degrees.get(n, 0),
                "community_id": comm_id,
                "community_label": community_labels.get(comm_id, "General"),
            })

        df = pd.DataFrame(rows).sort_values("pagerank", ascending=False).reset_index(drop=True)
        return df, G

    def save_metrics(self, output_path: Path | str = "data/gold/graphs/citation_metrics.parquet") -> Path:
        """Compute and persist citation network metrics table."""
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        df, _ = self.compute_metrics()
        df.to_parquet(out, index=False)
        logger.info("Saved citation metrics for %d papers to %s", len(df), out)
        return out
