"""
data_mining/src/mining/graph_mining.py
--------------------------------------
Pillar 3: Graph Mining & Scientific Network Analysis Pipeline.
Constructs a co-authorship collaboration network across 10,000 arXiv papers,
computes PageRank, Degree Centrality, and Community Detection (Greedy Modularity),
and exports graph topology for interactive frontend graph rendering.

Adheres strictly to docs/agents/rules/LOGGING_CHECKPOINT_RULES.md:
- Strictly NO emojis/icons.
- Timestamped plain-text logs: [INFO], [SUCCESS], [WARNING], [ERROR].
"""

import os
import json
import logging
from typing import Dict, Any, List
from itertools import combinations
import duckdb
import networkx as nx
from networkx.algorithms.community import greedy_modularity_communities

logger = logging.getLogger("graph_mining")


class CoauthorshipGraphMiner:
    """Mines co-authorship topologies, network centrality, and scientific communities."""

    def __init__(self, parquet_path: str):
        self.parquet_path = parquet_path

    def build_network(self, min_collaborations: int = 1) -> nx.Graph:
        """Constructs weighted collaboration graph from author co-occurrences."""
        logger.info("[PILLAR 3] Extracting authors from Silver Parquet...")
        con = duckdb.connect()
        df = con.execute(
            f"SELECT paper_id, authors FROM read_parquet('{self.parquet_path}') WHERE authors IS NOT NULL"
        ).fetchdf()

        G = nx.Graph()
        author_paper_counts: Dict[str, int] = {}

        for _, row in df.iterrows():
            raw_authors = row["authors"]
            if raw_authors is None:
                continue
            try:
                if len(raw_authors) < 1:
                    continue
            except TypeError:
                continue

            clean_authors = [str(a).strip() for a in raw_authors if str(a).strip()]
            for author in clean_authors:
                author_paper_counts[author] = author_paper_counts.get(author, 0) + 1

            if len(clean_authors) > 1:
                for a1, a2 in combinations(clean_authors, 2):
                    if a1 == a2:
                        continue
                    if G.has_edge(a1, a2):
                        G[a1][a2]["weight"] += 1
                    else:
                        G.add_edge(a1, a2, weight=1)

        # Set paper counts as node attributes
        for author, count in author_paper_counts.items():
            if author in G:
                G.nodes[author]["paper_count"] = count

        logger.info(
            "[PILLAR 3] Graph constructed: %d nodes, %d edges.",
            G.number_of_nodes(),
            G.number_of_edges(),
        )
        return G

    def analyze_network(
        self,
        top_hubs_limit: int = 40,
        max_export_nodes: int = 120,
    ) -> Dict[str, Any]:
        """Runs PageRank, Degree Centrality, and Community Detection on collaboration graph."""
        G = self.build_network()

        if G.number_of_nodes() == 0:
            logger.warning("[PILLAR 3] [WARNING] Empty graph. Returning empty topology.")
            return {"network_summary": {}, "top_influencers": [], "communities": [], "graph_export": {}}

        logger.info("[PILLAR 3] Calculating PageRank across %d nodes...", G.number_of_nodes())
        pagerank_scores = nx.pagerank(G, weight="weight", alpha=0.85)

        logger.info("[PILLAR 3] Calculating Degree Centrality...")
        degree_centrality = nx.degree_centrality(G)

        # Community detection (Greedy Modularity on largest connected component)
        logger.info("[PILLAR 3] Detecting collaboration communities...")
        communities_raw = list(greedy_modularity_communities(G))
        community_mapping = {}
        for comm_id, members in enumerate(communities_raw):
            for member in members:
                community_mapping[member] = comm_id

        # Compile top influential researchers by PageRank
        sorted_nodes = sorted(pagerank_scores.items(), key=lambda x: x[1], reverse=True)
        top_influencers = []
        for author, pr in sorted_nodes[:top_hubs_limit]:
            top_influencers.append({
                "author": author,
                "pagerank": round(float(pr), 6),
                "degree": int(G.degree(author)),
                "paper_count": int(G.nodes[author].get("paper_count", 1)),
                "community_id": int(community_mapping.get(author, -1)),
            })

        # Global Network Summary
        density = float(nx.density(G))
        num_components = int(nx.number_connected_components(G))

        # Format Graph JSON for Frontend Visualization
        # Export the subgraph of top influential nodes and their immediate links
        export_node_set = set([n for n, _ in sorted_nodes[:max_export_nodes]])
        subG = G.subgraph(export_node_set)

        export_nodes = []
        for n in subG.nodes():
            export_nodes.append({
                "id": str(n),
                "label": str(n),
                "pagerank": round(float(pagerank_scores.get(n, 0)), 5),
                "degree": int(G.degree(n)),
                "community": int(community_mapping.get(n, 0)),
                "paper_count": int(G.nodes[n].get("paper_count", 1)),
            })

        export_edges = []
        for u, v, data in subG.edges(data=True):
            export_edges.append({
                "source": str(u),
                "target": str(v),
                "weight": int(data.get("weight", 1)),
            })

        # Community summaries
        top_communities = []
        for comm_id, members in enumerate(communities_raw[:8]):
            comm_members = list(members)
            top_communities.append({
                "community_id": comm_id,
                "total_members": len(comm_members),
                "representative_authors": comm_members[:5],
            })

        results = {
            "network_summary": {
                "total_authors": G.number_of_nodes(),
                "total_collaborations": G.number_of_edges(),
                "network_density": round(density, 6),
                "connected_components": num_components,
                "total_communities_detected": len(communities_raw),
            },
            "top_influencers": top_influencers,
            "communities": top_communities,
            "graph_export": {
                "nodes": export_nodes,
                "links": export_edges,
            },
        }

        logger.info(
            "[PILLAR 3] [SUCCESS] Completed Graph Mining. Exported %d nodes and %d edges for frontend.",
            len(export_nodes),
            len(export_edges),
        )
        return results

    def save_graph(self, output_path: str) -> None:
        """Executes graph mining and serializes result to JSON."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        results = self.analyze_network()
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        logger.info("[PILLAR 3] [SUCCESS] Saved graph mining analysis to: %s", output_path)
