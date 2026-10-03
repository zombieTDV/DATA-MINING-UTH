# 03_GRAPH_ANALYSIS_AND_TRENDS.md — Phase 3: Graph Analysis & Trend Discovery

- **Motivation/Background**: Trend analysis in scientific research cannot be solved purely through chunk-level vector retrieval. Phase 3 implements the core unsupervised Data Mining methodology (CRISP-DM / KDD) over our 220-paper LLM corpus: constructing directed citation topologies to uncover landmark papers via PageRank, mining co-occurring concepts and association rules via FP-Growth, and aggregating longitudinal trends in DuckDB.
- **Purpose**: Define technical specifications, mathematical foundations, data contracts, and verification criteria for Phase 3 (Graph Analysis & Trend Discovery).
- **Overview Pipeline**: `data/silver/` (`papers.parquet`, `citations.parquet`, `keywords.parquet`) → NetworkX Graph Analysis (PageRank, Louvain) + `mlxtend` FP-Growth + DuckDB Analytical SQL → `data/gold/` (`graphs/`, `trends/`, `plots/`).
- **Detailed Plan**: §1 Scope & Architectural Fit; §2 Citation Network Analysis; §3 Keyword Co-occurrence & Association Rule Mining; §4 DuckDB Longitudinal Trend Tables; §5 Visualization Contracts; §6 Verification & Acceptance Checklist.
- **References**: [DECISIONS.md](../../DECISIONS.md), [configs/taxonomy.yaml](../../configs/taxonomy.yaml), [docs/research-paper-rag-plan.md](../research-paper-rag-plan.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](../references/ML_PIPELINE_REFERENCE_v4.md).
- **Created**: 2026-10-02T07:35:00+07:00
- **Last Updated**: 2026-10-02T07:35:00+07:00

[STATUS: ACTIVE]

---

## 1. Scope & Architectural Fit

### 1.1 Trend Analysis vs. Retrieval Separation (DECISIONS.md #2, #5)
Phase 3 establishes the primary trend discovery channel without requiring expensive generative LLM extraction:
- **Longitudinal Trend Questions** (e.g. *"How did RLHF adoption grow 2020–2026?"*): Answered directly from DuckDB SQL aggregations and NetworkX graph metrics.
- **Topological Discovery Questions** (e.g. *"What are the seminal seed papers?"*, *"What sub-communities exist?"*): Answered via PageRank and Louvain modularity clustering.
- **Concept Association Questions** (e.g. *"Papers using LoRA also discuss what techniques?"*): Answered via FP-Growth association rules ($A \rightarrow B$) with verified Support, Confidence, and Lift.

---

## 2. Citation Network Analysis

### 2.1 Graph Construction
- **Graph Type**: Directed Graph $G = (V, E)$ via NetworkX.
- **Nodes ($V$)**: 220 papers with node attributes `(title, year, citation_count, topics, keywords)`.
- **Edges ($E$)**: Internal cross-citations where both `citing_paper_id` and `cited_paper_id` reside within the corpus (`is_internal == True`).

### 2.2 Mathematical Metrics
1. **PageRank ($d = 0.85$)**:
   $$PR(p) = \frac{1-d}{N} + d \sum_{q \in M(p)} \frac{PR(q)}{L(q)}$$
   Identifies foundational papers cited by other influential papers in the corpus.
2. **In-Degree Centrality**: Count of inbound citations within the corpus.
3. **Louvain Modularity Community Detection**:
   Maximizes modularity $Q$ on the undirected projection to identify research frontiers:
   $$Q = \frac{1}{2m} \sum_{i, j} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)$$

---

## 3. Keyword Co-occurrence & Association Rule Mining

### 3.1 Weighted Co-occurrence Graph
- Undirected graph where nodes are keywords and edge weights $w_{ij}$ equal the count of papers containing both $k_i$ and $k_j$.
- **Jaccard Similarity Index**:
  $$J(k_i, k_j) = \frac{|P_i \cap P_j|}{|P_i \cup P_j|}$$
- **Betweenness Centrality**: Pinpoints concepts that act as bridges between different sub-communities (e.g., *Fine-Tuning* bridging *Architectures* and *Safety*).

### 3.2 Frequent Pattern Mining (FP-Growth via `mlxtend`)
- **Transaction Representation**: Each paper is modeled as a basket of its extracted keywords:
  $$T_p = \{kw_{p,1}, kw_{p,2}, \dots, kw_{p,m}\}$$
- **Thresholds**:
  - Minimum Support: $\ge 0.03$ (~7 papers in pilot)
  - Minimum Confidence: $\ge 0.30$ ($P(B|A) \ge 30\%$)
  - Minimum Lift: $> 1.20$ (positive correlation only per ML_PIPELINE_REFERENCE_v4 §15.1.5)

---

## 4. DuckDB Longitudinal Trend Tables

Analytical SQL transformations over Parquet producing:
1. `data/gold/trends/year_x_topic.parquet`:
   `year, topic, paper_count, total_papers_in_year, yearly_share_pct`
2. `data/gold/trends/year_x_keyword.parquet`:
   `year, keyword, paper_count, avg_relevance, total_papers_in_year, yearly_share_pct`
3. `data/gold/trends/association_rules.parquet`:
   `antecedents_str, consequents_str, support, confidence, lift`

---

## 5. Visualizations

- **Interactive Graphs (`data/gold/graphs/`)**:
  - `citation_network.html`: PyVis interactive network with node size proportional to PageRank and color mapped to Louvain community.
  - `keyword_network.html`: Concept co-occurrence network with edge widths mapped to co-occurrence frequency.
- **Static Publication Charts (`data/gold/plots/`)**:
  - `topic_trends.png`: Longitudinal multi-line chart (2017–2026).
  - `keyword_heatmap.png`: Matrix heatmap of top keywords across years.
  - `association_rules_scatter.png`: Support vs Confidence scatter plot sized by Lift.

---

## 6. Verification Commands

```bash
# 1. Run unit test battery
python -m pytest tests/test_graph.py -v

# 2. Execute end-to-end Phase 3 pipeline
python -m src.graph.run_graph_analysis

# 3. Inspect generated Gold outputs
python -c "import pandas as pd; print(pd.read_parquet('data/gold/graphs/citation_metrics.parquet').head(5))"
```
