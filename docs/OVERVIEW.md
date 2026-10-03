# Living Project Overview & Roadmap

- **Motivation/Background**: Navigating the rapid proliferation of Large Language Model (LLM) research demands a rigorous, reproducible architecture combining graph-based data mining with modern hybrid retrieval.
- **Purpose**: Serve as the canonical engineering blueprint, phase index, technical constraints record, and operational roadmap for the project.
- **Overview Pipeline**: OpenAlex API Harvesting → Medallion Storage (Bronze/Silver/Gold with Parquet + DuckDB) → Graph Mining (NetworkX & FP-Growth) → LanceDB Vector Indexing → Dual-Path Serving (SQL/Graph Trend Analytics & Hybrid RAG).
- **Detailed Plan**: §1 Project Summary; §2 Technical Blueprint; §3 Engineering Phases (0-5); §4 Phase Specifications & Progress; §5 Technical Constraints & Operating Invariants.
- **References**: [docs/PURPOSE.md](PURPOSE.md), [docs/README.md](README.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](references/ML_PIPELINE_REFERENCE_v4.md), [DECISIONS.md](../DECISIONS.md).
- **Created**: 2026-09-06T21:05:00+07:00
- **Last Updated**: 2026-10-02T06:52:00+07:00

---

## 1. Project Summary

- **Project Name:** Graph-Based Trend Analysis of LLM Research Papers
- **Vietnamese Topic:** *Khai thác dữ liệu nghiên cứu khoa học thời gian thực hướng tới xây dựng hệ thống truy xuất tri thức nâng cao (RAG) cho miền AI/DS*
- **Course:** Data Mining (Trường Đại học Giao thông Vận tải TP.HCM — UTH)
- **Advisor / Instructor:** TS. Trần Thế Vinh
- **Target Domain:** Data Mining, Scholarly Literature Analysis, Graph Algorithms, Hybrid RAG
- **Corpus Scope:** Large Language Model (LLM) research literature from 2017 to the present (English papers only), spanning pre-training, fine-tuning/alignment (RLHF, DPO), reasoning/prompting (CoT, search), and autonomous agents.
- **Primary Goal:** Harvest structured academic records and citation graphs via OpenAlex, manage them in a local Medallion lakehouse (Parquet + DuckDB), execute unsupervised graph mining and association rule discovery (NetworkX, FP-Growth), and provide dual-path querying: empirical SQL/graph trend narration and grounded hybrid retrieval (LanceDB).

---

## 2. Technical Blueprint

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TECHNICAL BLUEPRINT                                       │
│                                                                                        │
│   [OpenAlex API]   ──►  [Parquet + DuckDB]  ──►  [NetworkX Graphs] ──►  [LanceDB RAG]  │
│    Metadata & Edges       Medallion Storage        Citation & Co-occur    Hybrid Search│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Data Ingestion:**
  - **Source:** OpenAlex API as the exclusive source for metadata, concepts, institutions, and citation edges.
  - **Protocol:** REST API client utilizing the OpenAlex polite pool (`User-Agent: mailto:...`) with exponential backoff retry.
  - **Pilot-First Rollout:** Ingest a 200-paper pilot corpus to validate schemas and pipelines before expanding to 10,000 papers.

- **Storage Topology (Medallion Architecture):**
  - **Bronze Lake (`data/bronze/`):** Immutable raw JSON responses (`metadata_raw/`), raw PDF files (`pdf_raw/`), and `manifest.parquet` tracking SHA-256 hashes, source URLs, and timestamps.
  - **Silver Lakehouse (`data/silver/`):** Cleaned, deduplicated, columnar Parquet tables (`papers.parquet`, `citations.parquet`, `sections.parquet`, `chunks.parquet`). Operates locally with zero external database server daemons.
  - **Gold Lakehouse (`data/gold/`):** Analytics-ready graph artifacts (`graphs/`), DuckDB longitudinal trend tables (`trends/`), and LanceDB vector tables (`lancedb/`).

- **Data Mining & Graph Analytics Core:**
  - **Citation Networks:** Directed graphs constructed via NetworkX; node centrality metrics (PageRank, in-degree), citation velocity, and seminal seed paper identification.
  - **Keyword Co-occurrence Graphs:** Network analysis over OpenAlex concepts and paper keywords; community detection to trace topic evolution.
  - **Association Rule Mining:** FP-Growth algorithm (`mlxtend`) on co-occurring keywords/concepts to uncover frequent itemsets and association rules without generative LLM dependency.
  - **Visualization:** Matplotlib and Seaborn for statistical trend distributions, and PyVis for interactive graph visualization.
  - **DuckDB Analytical SQL:** Embedded columnar execution for longitudinal trend queries (`year_x_concept`, `year_x_venue`, etc.) with zero-copy Parquet scanning.

- **Advanced RAG Subsystem:**
  - Structure-aware chunking with sliding windows and context prefixes (`[Title]... [Year]... [Section]...`).
  - Dense semantic embeddings co-located with BM25 full-text indexing in LanceDB.
  - Reciprocal Rank Fusion (RRF) for robust multi-modal search ranking.
  - Dual serving channels: Trend Q&A grounded in DuckDB SQL + NetworkX graph metrics, and Retrieval Q&A with programmatic inline citation verification.

---

## 3. Engineering Phases

Each phase is formally documented in `docs/phases/` according to [agents/templates/PHASE_DOC_TEMPLATE.md](../agents/templates/PHASE_DOC_TEMPLATE.md).

| Phase | Specification Document | Description | Target Deliverable | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | [00_SCOPE_AND_EVALUATION.md](phases/00_SCOPE_AND_EVALUATION.md) | Formalize LLM corpus scope (2017–present, English), OpenAlex search strategy, 20–30 benchmark evaluation questions, and evaluation harness | Scope spec, `eval/questions.jsonl`, baseline metrics | **Active** |
| **Phase 1** | [01_DATA_COLLECTION.md](phases/01_DATA_COLLECTION.md) | OpenAlex API client, metadata and citation edge harvester, PDF downloader, SHA-256 manifest; 200-paper pilot then scale to 10k | Harvest scripts, `data/bronze/`, `papers.parquet`, `citations.parquet`, `keywords.parquet` | **Active** |
| **Phase 2** | [02_PARSING_AND_CHUNKING.md](phases/02_PARSING_AND_CHUNKING.md) | PDF extraction, section segmentation, reference exclusion, sliding-window chunking with contextual prefixes | Clean `sections.parquet`, `chunks.parquet`, parse quality report | Planned |
| **Phase 3** | [03_GRAPH_ANALYSIS_AND_TRENDS.md](phases/03_GRAPH_ANALYSIS_AND_TRENDS.md) | NetworkX citation & co-occurrence graphs, FP-Growth association rules, DuckDB trend tables, PyVis & Seaborn visualizations | `data/gold/graphs/`, `data/gold/trends/`, interactive visualizations | **Active** |
| **Phase 4** | [04_RETRIEVAL_BASELINE.md](phases/04_RETRIEVAL_BASELINE.md) | LanceDB vector database setup, dense semantic embeddings, BM25 lexical indexing, hybrid reciprocal rank fusion | `data/gold/lancedb/`, retrieval evaluation benchmark (recall@k, MRR) | Planned |
| **Phase 5** | [05_LLM_SERVING_LAYER.md](phases/05_LLM_SERVING_LAYER.md) | Dual-path serving interface: DuckDB SQL/Graph trend narration + hybrid RAG with citation verification; optional LLM paper fingerprint extraction | Serving API, citation verification module, CLI demo | Planned |

---

## 4. Phase Documentation & Progress Tracking

Detailed technical specifications and active session task trackers:

### Phase Specifications (`docs/phases/`):
- [Phase 0 Specification: Scope & Evaluation Definition](phases/00_SCOPE_AND_EVALUATION.md)
- [Phase 1 Specification: OpenAlex Collection & Raw Vaulting](phases/01_DATA_COLLECTION.md)
- [Phase 2 Specification: PDF Parsing & Semantic Chunking](phases/02_PARSING_AND_CHUNKING.md) *(Placeholder)*
- [Phase 3 Specification: Graph Analysis & Trend Discovery](phases/03_GRAPH_ANALYSIS_AND_TRENDS.md)
- [Phase 4 Specification: Retrieval Baseline with LanceDB](phases/04_RETRIEVAL_BASELINE.md) *(Placeholder)*
- [Phase 5 Specification: LLM Serving Layer & Synthesis](phases/05_LLM_SERVING_LAYER.md) *(Placeholder)*

### Progress Status Trackers (`docs/progress/`):
- [Phase 0 Progress Tracker](progress/00_SCOPE_AND_EVALUATION_STATUS.md)
- [Phase 1 Progress Tracker](progress/01_OPENALEX_COLLECTION_STATUS.md)
- [Phase 2 Progress Tracker](progress/02_PARSING_AND_CHUNKING_STATUS.md)
- [Phase 3 Progress Tracker](progress/03_GRAPH_ANALYSIS_STATUS.md)
- [Phase 4 Progress Tracker](progress/04_RETRIEVAL_BASELINE_STATUS.md)
- [Phase 5 Progress Tracker](progress/05_LLM_SERVING_STATUS.md)

---

## 5. Technical Constraints & Operating Invariants

1. **Polite Crawling Compliance:** Respect OpenAlex API etiquette by identifying all client requests with a dedicated `User-Agent: mailto:...` header, adhering to rate limits, and implementing exponential backoff.
2. **Immutable Bronze Invariant:** Never modify or mutate raw API payloads or downloaded PDFs in `data/bronze/`. All file writes must be accompanied by SHA-256 verification and recorded in `manifest.parquet`.
3. **Graph Analysis Boundaries & Sampling:** Macro trend observations and graph metrics are strictly bounded by the sampled OpenAlex LLM literature (2017–present, English). All trend narratives must explicitly state total paper counts, time windows, and citation coverage denominators.
4. **Graphs First, LLM Extraction Deferred:** Core pattern discovery and trend analysis must rely exclusively on deterministic algorithms (NetworkX PageRank, community detection, FP-Growth association rules, DuckDB SQL). LLM structured extraction is optional and deferred to Phase 5+.
5. **Pilot-First Scaling:** Every pipeline stage (crawling, parsing, graph creation, indexing) must execute and pass verification on a 200-paper pilot dataset before scaling to the full 10,000-paper corpus.
6. **Grounding & Citation Integrity:** Retrieval Q&A must never hallucinate references; all assertions must link to verified chunk and paper IDs present in the retrieved context.
