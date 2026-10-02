"""src/graph/visualizer.py — Interactive PyVis HTML Graph Visualizations with Deterministic Static Layout."""
from __future__ import annotations

import logging
import math
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
    Pre-computes deterministic (x, y) coordinates using NetworkX spring layout in Python
    and disables browser physics simulation (physics: {enabled: false}) to ensure
    the graph renders instantly, stays 100% static, and eliminates center-clustering jitter.
    """

    def __init__(self, output_dir: Path | str = "data/gold/graphs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _post_process_html(self, target_path: Path, title: str, stats_subtitle: str) -> None:
        """
        Enhance generated PyVis HTML:
        1. Expose `window.network = network;` for console and UI interaction.
        2. Inject a floating UI control toolbar with Fit View, Physics Toggle, and instructions.
        """
        if not target_path.exists():
            return

        html = target_path.read_text(encoding="utf-8")

        # Expose network object globally
        target_needle = "network = new vis.Network(container, data, options);"
        replacement = """network = new vis.Network(container, data, options);
                  window.network = network;"""
        if target_needle in html:
            html = html.replace(target_needle, replacement, 1)

        # Inject modern floating toolbar
        toolbar_html = f"""
    <div id="graph-controls" style="
        position: fixed;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 230px;
    ">
        <div style="font-weight: 700; color: #1e293b; font-size: 14px;">{title}</div>
        <div style="font-size: 11px; color: #64748b;">{stats_subtitle}</div>
        <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button id="btn-fit-view" style="
                flex: 1;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 7px 10px;
                cursor: pointer;
                font-weight: 500;
                font-size: 12px;
            ">Fit View</button>
            <button id="btn-toggle-physics" style="
                flex: 1;
                background: #f1f5f9;
                color: #334155;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 7px 10px;
                cursor: pointer;
                font-weight: 500;
                font-size: 12px;
            ">Relax Graph</button>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px; color: #64748b; line-height: 1.4;">
            • <b>Static by default</b> (zero jitter/bounce)<br>
            • Drag any node freely to reposition<br>
            • Hover for bibliometric metadata<br>
            • Scroll mousewheel to zoom
        </div>
    </div>
    <script>
    (function() {{
        var physicsActive = false;
        var btnToggle = document.getElementById('btn-toggle-physics');
        var btnFit = document.getElementById('btn-fit-view');

        btnToggle.addEventListener('click', function() {{
            physicsActive = !physicsActive;
            if (window.network) {{
                window.network.setOptions({{
                    physics: {{
                        enabled: physicsActive,
                        solver: "forceAtlas2Based",
                        forceAtlas2Based: {{
                            gravitationalConstant: -60,
                            centralGravity: 0.008,
                            springLength: 100,
                            damping: 0.85,
                            avoidOverlap: 0.8
                        }}
                    }}
                }});
            }}
            btnToggle.textContent = physicsActive ? "Freeze Layout" : "Relax Graph";
            btnToggle.style.background = physicsActive ? "#ef4444" : "#f1f5f9";
            btnToggle.style.color = physicsActive ? "#ffffff" : "#334155";
        }});

        btnFit.addEventListener('click', function() {{
            if (window.network) {{
                window.network.fit({{ animation: {{ duration: 600, easingFunction: 'easeInOutQuad' }} }});
            }}
        }});
    }})();
    </script>
    """
        html = html.replace("</body>", toolbar_html + "\n</body>")
        target_path.write_text(html, encoding="utf-8")

    def export_citation_network_html(
        self,
        G: nx.DiGraph,
        metrics_df: pd.DataFrame,
        filename: str = "citation_network.html"
    ) -> Path:
        """
        Export citation network with:
        - Node sizing proportional to PageRank
        - Node coloring by Louvain community cluster
        - Pre-computed deterministic (x, y) coordinates via NetworkX spring layout
        - Disabled browser physics (physics: false) for a static, jitter-free view
        """
        target = self.output_dir / filename

        try:
            from pyvis.network import Network
        except ImportError:
            logger.warning("pyvis is not installed. Skipping HTML export for citation network.")
            return target

        if G.number_of_nodes() == 0:
            logger.warning("Citation graph is empty. Skipping HTML export.")
            return target

        # 1. Pre-compute deterministic spring layout in Python
        k_dist = 1.8 / math.sqrt(max(1, G.number_of_nodes()))
        pos = nx.spring_layout(G, k=k_dist, iterations=150, seed=42)
        SCALE_X, SCALE_Y = 1400, 1100

        net = Network(height="850px", width="100%", bgcolor="#ffffff", font_color="#333333", directed=True)

        # Build lookup for metrics by paper_id
        metrics_lookup = metrics_df.set_index("paper_id").to_dict(orient="index") if not metrics_df.empty else {}

        for n in G.nodes():
            m = metrics_lookup.get(n, {})
            title_text = m.get("title") or G.nodes[n].get("title", str(n))
            year = m.get("year", G.nodes[n].get("year", ""))
            cites = m.get("citation_count", G.nodes[n].get("citation_count", 0))
            pr = m.get("pagerank", 0.0)
            comm_id = m.get("community_id", 0)
            comm_label = m.get("community_label", "Cluster")

            color = COMMUNITY_COLORS[comm_id % len(COMMUNITY_COLORS)] if comm_id >= 0 else "#aaaaaa"
            node_size = max(12, min(50, 12 + (pr * 500)))

            x = float(pos[n][0] * SCALE_X)
            y = float(pos[n][1] * SCALE_Y)

            tooltip = (
                f"<div style='font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;'>"
                f"<b>{title_text}</b><br>"
                f"Year: {year} | Citations: {cites:,}<br>"
                f"PageRank: {pr:.5f}<br>"
                f"Community: {comm_label} (ID: {comm_id})"
                f"</div>"
            )

            label = f"{title_text[:25]}..." if len(title_text) > 25 else title_text

            net.add_node(
                n,
                label=label,
                title=tooltip,
                color=color,
                size=node_size,
                shape="dot",
                x=x,
                y=y,
                font={"size": 11, "face": "Arial", "color": "#1e293b"}
            )

        for u, v in G.edges():
            net.add_edge(u, v, color={"color": "#cbd5e1", "opacity": 0.45}, arrows="to")

        # Static options: completely disable live physics simulation
        options_js = """
var options = {
  "physics": {
    "enabled": false
  },
  "interaction": {
    "dragNodes": true,
    "dragView": true,
    "hover": true,
    "tooltipDelay": 100,
    "navigationButtons": true,
    "keyboard": true,
    "zoomView": true
  },
  "nodes": {
    "borderWidth": 1,
    "borderWidthSelected": 3
  },
  "edges": {
    "smooth": {
      "type": "continuous",
      "roundness": 0.2
    }
  }
}
"""
        net.set_options(options_js)
        net.save_graph(str(target))

        stats_sub = f"{G.number_of_nodes()} Papers • {G.number_of_edges()} Citations"
        self._post_process_html(target, "Citation Network", stats_sub)

        logger.info("Saved static interactive citation network HTML to %s (%d nodes)", target, G.number_of_nodes())
        return target

    def export_keyword_network_html(
        self,
        G: nx.Graph,
        metrics_df: pd.DataFrame,
        filename: str = "keyword_network.html",
        top_k: int = 60
    ) -> Path:
        """
        Export top-k keyword co-occurrence network with:
        - Node sizing proportional to keyword occurrence frequency
        - Edge widths proportional to co-occurrence frequency
        - Pre-computed deterministic (x, y) coordinates via NetworkX spring layout
        - Disabled browser physics (physics: false) for a static, jitter-free view
        """
        target = self.output_dir / filename

        try:
            from pyvis.network import Network
        except ImportError:
            logger.warning("pyvis is not installed. Skipping HTML export for keyword network.")
            return target

        if metrics_df.empty or G.number_of_nodes() == 0:
            return target

        # Select top-k keywords by weighted degree
        top_keywords = set(metrics_df.head(top_k)["keyword"].tolist())
        subgraph = G.subgraph(top_keywords).copy()

        if subgraph.number_of_nodes() == 0:
            return target

        # 1. Pre-compute deterministic spring layout in Python
        k_dist = 2.0 / math.sqrt(max(1, subgraph.number_of_nodes()))
        pos = nx.spring_layout(subgraph, k=k_dist, iterations=150, seed=42)
        SCALE_X, SCALE_Y = 1200, 900

        net = Network(height="850px", width="100%", bgcolor="#ffffff", font_color="#333333", directed=False)
        metrics_lookup = metrics_df.set_index("keyword").to_dict(orient="index")

        for n in subgraph.nodes():
            m = metrics_lookup.get(n, {})
            freq = m.get("frequency", 1)
            deg = m.get("weighted_degree", 1)
            comm_id = m.get("community_id", 0)

            color = COMMUNITY_COLORS[comm_id % len(COMMUNITY_COLORS)] if comm_id >= 0 else "#aaaaaa"
            node_size = max(12, min(45, 12 + (freq * 1.5)))

            x = float(pos[n][0] * SCALE_X)
            y = float(pos[n][1] * SCALE_Y)

            tooltip = (
                f"<div style='font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;'>"
                f"<b>Keyword: {n}</b><br>"
                f"Frequency: {freq}<br>"
                f"Co-occurrence Degree: {deg}<br>"
                f"Cluster: {comm_id}"
                f"</div>"
            )

            net.add_node(
                n,
                label=n,
                title=tooltip,
                color=color,
                size=node_size,
                shape="dot",
                x=x,
                y=y,
                font={"size": 11, "face": "Arial", "color": "#1e293b"}
            )

        for u, v, data in subgraph.edges(data=True):
            weight = data.get("weight", 1)
            net.add_edge(u, v, value=weight, color={"color": "#e2e8f0", "opacity": 0.6})

        options_js = """
var options = {
  "physics": {
    "enabled": false
  },
  "interaction": {
    "dragNodes": true,
    "dragView": true,
    "hover": true,
    "tooltipDelay": 100,
    "navigationButtons": true,
    "keyboard": true,
    "zoomView": true
  },
  "nodes": {
    "borderWidth": 1,
    "borderWidthSelected": 3
  },
  "edges": {
    "smooth": {
      "type": "continuous",
      "roundness": 0.2
    }
  }
}
"""
        net.set_options(options_js)
        net.save_graph(str(target))

        stats_sub = f"Top {subgraph.number_of_nodes()} Terms • {subgraph.number_of_edges()} Co-occurrences"
        self._post_process_html(target, "Keyword Co-occurrence Network", stats_sub)

        logger.info("Saved static interactive keyword network HTML to %s (%d nodes)", target, subgraph.number_of_nodes())
        return target
