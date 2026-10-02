"""src/graph/visualizer.py — Interactive PyVis HTML Graph Visualizations with Deterministic Static Layout, Highlighting & Filtering."""
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
    - Pre-computes deterministic (x, y) coordinates using NetworkX spring layout in Python
      with increased spacing (k=3.2/sqrt(N)) across an expanded canvas to eliminate center-clustering.
    - Disables browser physics simulation (physics: false) for instantaneous rendering and static stability.
    - Interactive click-to-highlight with neighborhood focus (1-hop direct or 2-hop indirect)
      while fading unconnected elements into low opacity.
    - Dynamic top-N slider filter to adjust visible nodes in real time.
    """

    def __init__(self, output_dir: Path | str = "data/gold/graphs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _post_process_html(self, target_path: Path, title: str, total_nodes: int, entity_label: str) -> None:
        """
        Enhance generated PyVis HTML with interactive neighborhood highlighting,
        connection depth toggle (1-hop vs 2-hop), node count slider, and fit-view controls.
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

        min_nodes = min(15, total_nodes)
        initial_count = min(300, total_nodes)

        # Inject modern floating toolbar with interactive slider & depth toggle
        toolbar_html = f"""
    <div id="graph-controls" style="
        position: fixed;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.97);
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 14px 16px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 250px;
    ">
        <div style="font-weight: 700; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            {title}
        </div>

        <!-- Node Count Slider -->
        <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 3px;">
                <span>Display Top {entity_label}:</span>
                <span id="slider-count-label" style="color: #2563eb;">{initial_count} / {total_nodes}</span>
            </div>
            <input type="range" id="node-slider" min="{min_nodes}" max="{total_nodes}" value="{initial_count}" step="5" style="width: 100%; cursor: pointer;">
        </div>

        <!-- Action Buttons: Depth Toggle & Fit View -->
        <div style="display: flex; gap: 6px;">
            <button id="btn-depth" style="
                flex: 1.2;
                background: #f1f5f9;
                color: #1e293b;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 6px 8px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
            ">Depth: Direct (1-hop)</button>
            <button id="btn-fit-view" style="
                flex: 0.8;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 8px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
            ">Fit View</button>
        </div>

        <!-- Optional Physics Relax Toggle -->
        <button id="btn-toggle-physics" style="
            background: #f8fafc;
            color: #475569;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
            padding: 5px 8px;
            cursor: pointer;
            font-size: 11px;
        ">Relax Graph (Physics)</button>

        <!-- Selection / Status Hint -->
        <div id="selection-status" style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px; color: #64748b; line-height: 1.4;">
            • <b>Click any node</b> to highlight connections & fade others<br>
            • Click empty canvas to reset selection<br>
            • Drag slider to filter top nodes
        </div>
    </div>
    <script>
    (function() {{
        var highlightDepth = 1; // 1 = Direct (1-hop), 2 = Indirect (2-hop)
        var selectedNodeId = null;
        var maxRank = {initial_count};
        var totalNodesCount = {total_nodes};

        var slider = document.getElementById('node-slider');
        var sliderLabel = document.getElementById('slider-count-label');
        var btnDepth = document.getElementById('btn-depth');
        var btnFit = document.getElementById('btn-fit-view');
        var btnPhysics = document.getElementById('btn-toggle-physics');
        var statusText = document.getElementById('selection-status');

        var originalNodes = {{}};
        var originalEdges = {{}};

        function initCache() {{
            if (!window.nodes || !window.edges) {{
                setTimeout(initCache, 50);
                return;
            }}
            window.nodes.forEach(function(n) {{
                originalNodes[n.id] = {{
                    color: n.color,
                    font: n.font ? JSON.parse(JSON.stringify(n.font)) : {{ size: 11, color: '#1e293b' }},
                    borderWidth: n.borderWidth || 1,
                    rank: n.rank !== undefined ? n.rank : 999
                }};
            }});
            window.edges.forEach(function(e) {{
                originalEdges[e.id] = {{
                    color: e.color ? JSON.parse(JSON.stringify(e.color)) : {{ color: '#cbd5e1', opacity: 0.45 }},
                    width: e.width || 1
                }};
            }});
            setupEvents();
            applyFilterAndHighlight();
        }}

        function setupEvents() {{
            // Slider filter
            slider.addEventListener('input', function() {{
                maxRank = parseInt(this.value, 10);
                sliderLabel.textContent = maxRank + " / " + totalNodesCount;
                applyFilterAndHighlight();
            }});

            // Depth toggle
            btnDepth.addEventListener('click', function() {{
                highlightDepth = (highlightDepth === 1) ? 2 : 1;
                btnDepth.textContent = (highlightDepth === 1) ? "Depth: Direct (1-hop)" : "Depth: Indirect (2-hop)";
                btnDepth.style.background = (highlightDepth === 2) ? "#e2e8f0" : "#f1f5f9";
                btnDepth.style.color = "#0f172a";
                applyFilterAndHighlight();
            }});

            // Fit view
            btnFit.addEventListener('click', function() {{
                if (window.network) {{
                    window.network.fit({{ animation: {{ duration: 500, easingFunction: 'easeInOutQuad' }} }});
                }}
            }});

            // Physics relax toggle
            var physicsActive = false;
            btnPhysics.addEventListener('click', function() {{
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
                btnPhysics.textContent = physicsActive ? "Freeze Layout" : "Relax Graph (Physics)";
                btnPhysics.style.background = physicsActive ? "#fee2e2" : "#f8fafc";
                btnPhysics.style.color = physicsActive ? "#b91c1c" : "#475569";
            }});

            // Network click for highlight / fade
            window.network.on("click", function(params) {{
                if (params.nodes && params.nodes.length > 0) {{
                    selectedNodeId = params.nodes[0];
                }} else {{
                    selectedNodeId = null;
                }}
                window.network.unselectAll();
                applyFilterAndHighlight();
            }});
        }}

        function applyFilterAndHighlight() {{
            var visibleNodeIds = new Set();
            var nodeUpdates = [];
            var edgeUpdates = [];

            // 1. Identify which nodes pass the rank slider filter
            window.nodes.forEach(function(n) {{
                var orig = originalNodes[n.id];
                if (orig && orig.rank <= maxRank) {{
                    visibleNodeIds.add(n.id);
                }}
            }});

            // 2. If a node is selected, compute connected set
            var highlightedNodeIds = new Set();
            var highlightedEdgeIds = new Set();

            if (selectedNodeId && visibleNodeIds.has(selectedNodeId)) {{
                highlightedNodeIds.add(selectedNodeId);

                // 1st-hop connections
                var hop1Nodes = window.network.getConnectedNodes(selectedNodeId);
                var hop1Edges = window.network.getConnectedEdges(selectedNodeId);

                hop1Nodes.forEach(function(nid) {{
                    if (visibleNodeIds.has(nid)) highlightedNodeIds.add(nid);
                }});
                hop1Edges.forEach(function(eid) {{
                    highlightedEdgeIds.add(eid);
                }});

                // 2nd-hop (indirect connections) if depth === 2
                if (highlightDepth === 2) {{
                    hop1Nodes.forEach(function(hop1Id) {{
                        if (visibleNodeIds.has(hop1Id)) {{
                            var hop2Nodes = window.network.getConnectedNodes(hop1Id);
                            var hop2Edges = window.network.getConnectedEdges(hop1Id);
                            hop2Nodes.forEach(function(nid) {{
                                if (visibleNodeIds.has(nid)) highlightedNodeIds.add(nid);
                            }});
                            hop2Edges.forEach(function(eid) {{
                                highlightedEdgeIds.add(eid);
                            }});
                        }}
                    }});
                }}

                var connCount = highlightedNodeIds.size - 1;
                statusText.innerHTML = "<b>Focus:</b> Selected + " + connCount + " connection(s) (" + (highlightDepth === 1 ? "1-hop" : "2-hop") + ")<br>Click background to reset selection.";
            }} else {{
                selectedNodeId = null;
                statusText.innerHTML = "• <b>Click any node</b> to highlight connections & fade others<br>• Use slider to filter top nodes";
            }}

            // 3. Apply updates to nodes
            window.nodes.forEach(function(n) {{
                var isVisible = visibleNodeIds.has(n.id);
                var orig = originalNodes[n.id] || {{}};

                if (!isVisible) {{
                    nodeUpdates.push({{ id: n.id, hidden: true }});
                }} else if (selectedNodeId) {{
                    // Highlighting active: check if in highlight set
                    if (highlightedNodeIds.has(n.id)) {{
                        var isCenter = (n.id === selectedNodeId);
                        nodeUpdates.push({{
                            id: n.id,
                            hidden: false,
                            color: orig.color,
                            font: {{ color: isCenter ? '#0f172a' : '#334155', size: isCenter ? 13 : 11 }},
                            borderWidth: isCenter ? 4 : 2,
                            opacity: 1.0
                        }});
                    }} else {{
                        // Fade out non-connected nodes!
                        nodeUpdates.push({{
                            id: n.id,
                            hidden: false,
                            color: {{
                                background: 'rgba(203, 213, 225, 0.22)',
                                border: 'rgba(148, 163, 184, 0.25)'
                            }},
                            font: {{ color: 'rgba(148, 163, 184, 0.25)' }},
                            borderWidth: 1,
                            opacity: 0.15
                        }});
                    }}
                }} else {{
                    // Normal state: full visibility
                    nodeUpdates.push({{
                        id: n.id,
                        hidden: false,
                        color: orig.color,
                        font: orig.font,
                        borderWidth: orig.borderWidth || 1,
                        opacity: 1.0
                    }});
                }}
            }});

            // 4. Apply updates to edges
            window.edges.forEach(function(e) {{
                var fromVisible = visibleNodeIds.has(e.from);
                var toVisible = visibleNodeIds.has(e.to);
                var orig = originalEdges[e.id] || {{}};

                if (!fromVisible || !toVisible) {{
                    edgeUpdates.push({{ id: e.id, hidden: true }});
                }} else if (selectedNodeId) {{
                    if (highlightedEdgeIds.has(e.id)) {{
                        var origEdgeColor = (orig.color && orig.color.color) ? orig.color.color : '#94a3b8';
                        edgeUpdates.push({{
                            id: e.id,
                            hidden: false,
                            color: {{ color: origEdgeColor, opacity: 0.85 }},
                            width: 1.8
                        }});
                    }} else {{
                        // Fade out non-connected edges!
                        edgeUpdates.push({{
                            id: e.id,
                            hidden: false,
                            color: {{ color: 'rgba(226, 232, 240, 0.08)', opacity: 0.08 }},
                            width: 0.5
                        }});
                    }}
                }} else {{
                    edgeUpdates.push({{
                        id: e.id,
                        hidden: false,
                        color: orig.color,
                        width: orig.width || 1
                    }});
                }}
            }});

            window.nodes.update(nodeUpdates);
            window.edges.update(edgeUpdates);
        }}

        initCache();
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
        - Clean paper title hover tooltips (name only)
        - Pre-computed deterministic (x, y) coordinates via NetworkX spring layout
        - Expanded canvas (2200x1700, k=3.2/sqrt(N)) for wide, non-clumping node separation
        - Disabled browser physics (physics: false) for a static, jitter-free view
        - Interactive click-to-highlight (1-hop / 2-hop) with background fading
        - Dynamic top-N slider filter
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

        # 1. Rank papers by PageRank (1 = highest) for slider filter
        ranked_df = metrics_df.sort_values(by="pagerank", ascending=False).reset_index(drop=True) if not metrics_df.empty else pd.DataFrame()
        rank_lookup = {row["paper_id"]: i + 1 for i, row in ranked_df.iterrows()} if not ranked_df.empty else {}

        k_dist = 4.0 / math.sqrt(max(1, G.number_of_nodes()))
        SCALE_X = max(2400, int(G.number_of_nodes() * 3.5))
        SCALE_Y = max(1800, int(G.number_of_nodes() * 2.8))
        pos = nx.spring_layout(G, k=k_dist, iterations=80, seed=42)

        net = Network(height="850px", width="100%", bgcolor="#ffffff", font_color="#333333", directed=True)

        metrics_lookup = metrics_df.set_index("paper_id").to_dict(orient="index") if not metrics_df.empty else {}

        for n in G.nodes():
            m = metrics_lookup.get(n, {})
            title_text = m.get("title") or G.nodes[n].get("title", str(n))
            pr = m.get("pagerank", 0.0)
            comm_id = m.get("community_id", 0)
            rank = rank_lookup.get(n, 999)

            color = COMMUNITY_COLORS[comm_id % len(COMMUNITY_COLORS)] if comm_id >= 0 else "#aaaaaa"
            node_size = max(12, min(50, 12 + (pr * 500)))

            x = float(pos[n][0] * SCALE_X)
            y = float(pos[n][1] * SCALE_Y)

            label = f"{title_text[:25]}..." if len(title_text) > 25 else title_text

            net.add_node(
                n,
                label=label,
                title=str(title_text),
                color=color,
                size=node_size,
                shape="dot",
                x=x,
                y=y,
                rank=rank,
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
    "selectConnectedEdges": false,
    "tooltipDelay": 100,
    "navigationButtons": true,
    "keyboard": true,
    "zoomView": true
  },
  "nodes": {
    "borderWidth": 1,
    "borderWidthSelected": 3,
    "chosen": false
  },
  "edges": {
    "chosen": false,
    "smooth": {
      "type": "continuous",
      "roundness": 0.2
    }
  }
}
"""
        net.set_options(options_js)
        net.save_graph(str(target))

        self._post_process_html(target, "Citation Network", G.number_of_nodes(), "Papers")

        logger.info("Saved static interactive citation network HTML to %s (%d nodes)", target, G.number_of_nodes())
        return target

    def export_keyword_network_html(
        self,
        G: nx.Graph,
        metrics_df: pd.DataFrame,
        filename: str = "keyword_network.html",
        top_k: int = 100
    ) -> Path:
        """
        Export top-k keyword co-occurrence network with:
        - Node sizing proportional to keyword occurrence frequency
        - Edge widths proportional to co-occurrence frequency
        - Clean keyword name hover tooltips
        - Pre-computed deterministic (x, y) coordinates via NetworkX spring layout
        - Expanded canvas (1800x1400, k=3.5/sqrt(N)) for wide separation
        - Disabled browser physics (physics: false) for a static, jitter-free view
        - Interactive click-to-highlight (1-hop / 2-hop) with background fading
        - Dynamic top-N slider filter
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

        # 1. Rank keywords by weighted degree (1 = highest) for slider filter
        ranked_kw = metrics_df.head(top_k).sort_values(by="weighted_degree", ascending=False).reset_index(drop=True)
        rank_lookup = {row["keyword"]: i + 1 for i, row in ranked_kw.iterrows()}

        # 2. Pre-compute deterministic spring layout with expanded spacing (k=3.5/sqrt(N), 1800x1400)
        k_dist = 3.5 / math.sqrt(max(1, subgraph.number_of_nodes()))
        pos = nx.spring_layout(subgraph, k=k_dist, iterations=150, seed=42)
        SCALE_X, SCALE_Y = 1800, 1400

        net = Network(height="850px", width="100%", bgcolor="#ffffff", font_color="#333333", directed=False)
        metrics_lookup = metrics_df.set_index("keyword").to_dict(orient="index")

        for n in subgraph.nodes():
            m = metrics_lookup.get(n, {})
            freq = m.get("frequency", 1)
            comm_id = m.get("community_id", 0)
            rank = rank_lookup.get(n, 999)

            color = COMMUNITY_COLORS[comm_id % len(COMMUNITY_COLORS)] if comm_id >= 0 else "#aaaaaa"
            node_size = max(12, min(45, 12 + (freq * 1.5)))

            x = float(pos[n][0] * SCALE_X)
            y = float(pos[n][1] * SCALE_Y)

            net.add_node(
                n,
                label=n,
                title=str(n),
                color=color,
                size=node_size,
                shape="dot",
                x=x,
                y=y,
                rank=rank,
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
    "selectConnectedEdges": false,
    "tooltipDelay": 100,
    "navigationButtons": true,
    "keyboard": true,
    "zoomView": true
  },
  "nodes": {
    "borderWidth": 1,
    "borderWidthSelected": 3,
    "chosen": false
  },
  "edges": {
    "chosen": false,
    "smooth": {
      "type": "continuous",
      "roundness": 0.2
    }
  }
}
"""
        net.set_options(options_js)
        net.save_graph(str(target))

        self._post_process_html(target, "Keyword Co-occurrence Network", subgraph.number_of_nodes(), "Keywords")

        logger.info("Saved static interactive keyword network HTML to %s (%d nodes)", target, subgraph.number_of_nodes())
        return target
