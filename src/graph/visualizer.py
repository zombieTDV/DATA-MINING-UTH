"""src/graph/visualizer.py — Interactive PyVis HTML Graph Visualizations."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import networkx as nx
import pandas as pd

logger = logging.getLogger("GraphVisualizer")

COMMUNITY_COLORS = [
    "#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f",
    "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"
]


class NetworkVisualizer:
    """
    Exports interactive NetworkX graphs into standalone HTML files via PyVis.
    Nodes can be dragged, zoomed, and hovered over to inspect bibliometric metrics.
    """

    def __init__(self, output_dir: Path | str = "data/gold/graphs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export_citation_network_html(
        self,
        G: nx.DiGraph,
        metrics_df: pd.DataFrame,
        filename: str = "citation_network.html"
    ) -> Path:
        """
        Export citation network with node sizing by PageRank and coloring by Louvain cluster.
        """
        target = self.output_dir / filename

        try:
            from pyvis.network import Network
        except ImportError:
            logger.warning("pyvis is not installed. Skipping HTML export for citation network.")
            return target

        net = Network(height="800px", width="100%", bgcolor="#ffffff", font_color="#333333", directed=True)
        net.barnes_hut(gravity=-3000, central_gravity=0.3, spring_length=120, spring_strength=0.04)

        # Build lookup for metrics by paper_id
        metrics_lookup = metrics_df.set_index("paper_id").to_dict(orient="index") if not metrics_df.empty else {}

        for n in G.nodes():
            m = metrics_lookup.get(n, {})
            title_text = m.get("title") or G.nodes[n].get("title", n)
            year = m.get("year", G.nodes[n].get("year", ""))
            cites = m.get("citation_count", G.nodes[n].get("citation_count", 0))
            pr = m.get("pagerank", 0.0)
            comm_id = m.get("community_id", 0)
            comm_label = m.get("community_label", "Cluster")

            color = COMMUNITY_COLORS[comm_id % len(COMMUNITY_COLORS)] if comm_id >= 0 else "#aaaaaa"
            node_size = max(10, min(50, 10 + (pr * 500)))

            tooltip = (
                f"<b>{title_text}</b><br>"
                f"Year: {year} | Citations: {cites:,}<br>"
                f"PageRank: {pr:.5f}<br>"
                f"Community: {comm_label} (ID: {comm_id})"
            )

            label = f"{title_text[:28]}..." if len(title_text) > 28 else title_text

            net.add_node(
                n,
                label=label,
                title=tooltip,
                color=color,
                size=node_size,
                shape="dot",
            )

        for u, v in G.edges():
            net.add_edge(u, v, color="#cccccc", arrows="to")

        net.save_graph(str(target))
        logger.info("Saved interactive citation network HTML to %s (%d nodes)", target, G.number_of_nodes())
        return target

    def export_keyword_network_html(
        self,
        G: nx.Graph,
        metrics_df: pd.DataFrame,
        filename: str = "keyword_network.html",
        top_k: int = 60
    ) -> Path:
        """
        Export top-k keyword co-occurrence network with edge widths proportional to co-occurrence.
        """
        target = self.output_dir / filename

        try:
            from pyvis.network import Network
        except ImportError:
            logger.warning("pyvis is not installed. Skipping HTML export for keyword network.")
            return target

        if metrics_df.empty:
            return target

        # Select top-k keywords by weighted degree
        top_keywords = set(metrics_df.head(top_k)["keyword"].tolist())
        subgraph = G.subgraph(top_keywords).copy()

        net = Network(height="800px", width="100%", bgcolor="#ffffff", font_color="#333333", directed=False)
        net.barnes_hut(gravity=-2000, central_gravity=0.4, spring_length=100)

        metrics_lookup = metrics_df.set_index("keyword").to_dict(orient="index")

        for n in subgraph.nodes():
            m = metrics_lookup.get(n, {})
            freq = m.get("frequency", 1)
            deg = m.get("weighted_degree", 1)
            comm_id = m.get("community_id", 0)

            color = COMMUNITY_COLORS[comm_id % len(COMMUNITY_COLORS)] if comm_id >= 0 else "#aaaaaa"
            node_size = max(10, min(45, 10 + (freq * 1.5)))

            tooltip = f"<b>Keyword: {n}</b><br>Frequency: {freq}<br>Co-occurrence Degree: {deg}<br>Cluster: {comm_id}"

            net.add_node(
                n,
                label=n,
                title=tooltip,
                color=color,
                size=node_size,
                shape="dot",
            )

        for u, v, data in subgraph.edges(data=True):
            weight = data.get("weight", 1)
            net.add_edge(u, v, value=weight, color="#dddddd")

        net.save_graph(str(target))
        logger.info("Saved interactive keyword network HTML to %s (%d nodes)", target, subgraph.number_of_nodes())
        return target
