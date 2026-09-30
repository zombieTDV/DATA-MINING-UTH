# Living Project Overview & Roadmap

| Field | Value |
| :--- | :--- |
| **Document Type** | Project Roadmap & Phase Index |
| **Status** | Canonical Living Roadmap (Active) |
| **Owner** | Research Team & AI Agent |
| **Scope** | Real-Time Scientific Data Mining & Advanced RAG System |
| **Created** | 2026-09-06T21:05:00+07:00 |
| **Last Updated** | 2026-09-30T13:01:59+07:00 |
| **Reference** | [docs/PURPOSE.md](PURPOSE.md), [docs/README.md](README.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](references/ML_PIPELINE_REFERENCE_v4.md) |

---

## 1. Project Summary

- **Project Name:** Real-Time AI/DS Scientific Paper Mining & Advanced RAG System
- **Vietnamese Topic:** Khai thác dữ liệu nghiên cứu khoa học thời gian thực hướng tới xây dựng hệ thống truy xuất tri thức nâng cao (RAG) cho miền AI/DS
- **Target Domain:** Data Mining, Scholarly Literature Ingestion, Apache Iceberg Lakehouse, Hybrid RAG
- **Primary Goal:** Automated continuous harvesting of AI/DS papers from arXiv and OpenAlex, real-time streaming buffering, Apache Iceberg Lakehouse storage, 5-dimension quality auditing, unsupervised pattern mining (topics, clusters, association rules), and context retrieval for advanced RAG.

---

## 2. Technical Blueprint

- **Data Sources:** arXiv RSS & REST API (`cs.AI`, `cs.LG`, `cs.CL`, `stat.ML`), OpenAlex API.
- **Storage Topology:**
  - Raw Data Lake (`data/raw/`): Immutable PDFs, HTML dumps, JSON payloads + SHA-256 manifests.
  - Analytical Lakehouse (`data/lakehouse/`): **Apache Iceberg** table format (PyIceberg + SQLite catalog) with **DuckDB** SQL engine.
- **Data Mining Toolkit:**
  - Unsupervised Clustering: K-Means & DBSCAN with Cluster Profiles per Chapter 4 slides.
  - Association Rules: FP-Growth on co-keywords via `mlxtend`.
  - Topic Modeling: Latent Dirichlet Allocation (LDA) & BERTopic.
- **RAG Subsystem:** Sliding-window semantic chunker, Sentence-Transformers dense vectors, Rank-BM25 sparse lexical index, cluster-aware reranking.
- **Execution Environment:** Python 3.12+ on Windows; fully reproducible locally without external server daemons.

---

## 3. Engineering Phases

Each phase is documented in `docs/phases/` according to [agents/templates/PHASE_DOC_TEMPLATE.md](../agents/templates/PHASE_DOC_TEMPLATE.md).

| Phase | Specification Document | Description | Target Deliverable | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | [01_REALTIME_COLLECTION_AND_LAKEHOUSE.md](phases/01_REALTIME_COLLECTION_AND_LAKEHOUSE.md) | Multi-source crawlers (arXiv/OpenAlex), streaming event buffer, immutable vault & Apache Iceberg Lakehouse | Live crawler, event queue, Iceberg metadata table | Active Specification |
| **Phase 2** | [02_PREPROCESSING_AND_QUALITY_AUDIT.md](phases/02_PREPROCESSING_AND_QUALITY_AUDIT.md) | 5-dimension data quality audit (Completeness, Accuracy, Consistency, Timeliness, Uniqueness), PDF parsing & semantic chunking | Quality report generator & chunked parquet tables | Planned |
| **Phase 3** | [03_DATA_MINING_PATTERNS.md](phases/03_DATA_MINING_PATTERNS.md) | Topic modeling (LDA/BERTopic), keyword association rules (FP-Growth), research frontier clustering (K-Means/DBSCAN) | Mined patterns, cluster profiles, rule sets | Planned |
| **Phase 4** | [04_HYBRID_RAG_AND_SERVING.md](phases/04_HYBRID_RAG_AND_SERVING.md) | Hybrid dense+sparse indexing (Sentence-Transformers + BM25), context assembly, and domain QA interface | Interactive RAG retrieval engine & evaluation | Planned |

---

## 4. Operational Progress Status

Active session updates and task trackers are maintained in `docs/progress/` according to [agents/templates/PROGRESS_STATUS_TEMPLATE.md](../agents/templates/PROGRESS_STATUS_TEMPLATE.md).

- [Phase 1 Progress](progress/01_REALTIME_COLLECTION_STATUS.md)
- [Phase 2 Progress](progress/02_PREPROCESSING_STATUS.md)
- [Phase 3 Progress](progress/03_DATA_MINING_STATUS.md)
- [Phase 4 Progress](progress/04_HYBRID_RAG_STATUS.md)

---

## 5. Known Constraints & Pitfalls

1. **Polite Crawling Compliance:** Respect arXiv's 3-second request pacing policy and provide custom `User-Agent` with contact email on OpenAlex calls to prevent IP rate-limiting.
2. **Two-Tier Ingestion Decoupling:** Never block metadata ingestion waiting for large PDF downloads. Ingest metadata/abstract instantly; stream full PDF extraction in background workers.
3. **Immutable Raw Invariant:** Never modify downloaded PDFs or raw JSON responses directly on disk (`data/raw/` is read-only).
4. **Leakage Boundary:** For any predictive or classification experiments downstream, all text vocabulary and scaling statistics must be fit strictly on training splits.
