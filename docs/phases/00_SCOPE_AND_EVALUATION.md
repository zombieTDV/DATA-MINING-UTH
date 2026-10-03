# 00_SCOPE_AND_EVALUATION.md — Phase 0 Specification

- **Motivation/Background**: Before building any pipeline code, the project scope, evaluation criteria, and decision log must be established. Phase 0 ensures the team has a shared understanding of what is being built, how success is measured, and what architectural decisions have been locked.
- **Purpose**: Define the project scope (LLM papers, 2017–present, OpenAlex), create the evaluation question set, record all design decisions, and restructure the repository for the graph-based trend analysis pipeline.
- **Overview Pipeline**: Resolve open design questions → create DECISIONS.md → write ≥20 evaluation questions → restructure repo (bronze/silver/gold, new src modules) → update all documentation.
- **Detailed Plan**: §1 Scope Definition; §2 Evaluation Question Set Design; §3 Repository Restructure; §4 Acceptance Criteria.
- **References**: [DECISIONS.md](../../DECISIONS.md), [docs/research-paper-rag-plan.md](../research-paper-rag-plan.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](../references/ML_PIPELINE_REFERENCE_v4.md).
- **Created**: 2026-10-02T06:52:00+07:00
- **Last Updated**: 2026-10-02T06:52:00+07:00

[STATUS: ACTIVE]

---

## 1. Scope Definition

### 1.1 Research Domain
- **Topic**: Large Language Models (LLMs) — training, alignment, reasoning, agents
- **Time Range**: June 2017 (publication of "Attention Is All You Need") to present
- **Language**: English-only papers
- **Target Corpus Size**: ≥10,000 papers (200-paper pilot first)

### 1.2 Data Source
- **Primary**: OpenAlex REST API (`https://api.openalex.org/works`)
- **Metadata Available**: Topics (4,516 taxonomy), keywords (top 5 per paper, ML-scored), citation edges (`referenced_works`), author data, abstracts, publication dates, venues
- **Configuration**: See [configs/sources.yaml](../../configs/sources.yaml)

### 1.3 Analysis Methodology (DECISIONS.md #5)
- **Primary**: Graph-based trend analysis
  - Citation network analysis (PageRank, community detection, co-citation)
  - Keyword co-occurrence networks (temporal evolution, emerging concept pairs)
  - Association rule mining (FP-Growth on keyword sets per paper)
  - Clustering (K-Means / DBSCAN on paper feature vectors)
- **Secondary (Phase 5+)**: LLM-based structured extraction ("paper fingerprints") — deferred

### 1.4 Explicit Non-Goals (Phase 0)
- No code implementation beyond repository structure and configuration
- No data collection or API calls
- No model training, embedding, or indexing

---

## 2. Evaluation Question Set

File: `data/eval/questions.jsonl`

### 2.1 Design Guidelines
- Write ≥20 questions: ~10-15 trend questions, ~5-10 retrieval questions
- Source questions from real research curiosity about LLM evolution
- Each question specifies: `id`, `type` (trend | retrieval), `question`, `expected_paper_ids` (if known), `expected_answer_points`, `notes`

### 2.2 Example Questions

**Trend questions** (answered from aggregated statistics + graph analysis):
1. "How did the proportion of papers using RLHF change from 2020 to 2026?"
2. "Which LLM benchmarks became most commonly referenced after 2022?"
3. "What are the main research communities in LLM research as of 2025?"
4. "How did the attention mechanism literature evolve from 2017 to 2026?"
5. "Which method families show the strongest growth trend in the last 2 years?"

**Retrieval questions** (answered from chunk-level search with citations):
1. "What loss function does DPO use and how does it differ from RLHF?"
2. "What are the key contributions of the Llama 2 paper?"
3. "How does mixture-of-experts scaling work in the Switch Transformer?"

---

## 3. Repository Restructure

### 3.1 Data Layout (Bronze/Silver/Gold)
```
data/
├── bronze/           # Raw API responses + PDFs + manifests
│   ├── metadata_raw/ # OpenAlex JSON
│   ├── pdf_raw/      # Downloaded PDFs
│   └── manifest/     # SHA-256 provenance records
├── silver/           # Cleaned parquet tables
│   └── audit/        # Quality reports
├── gold/             # Analysis outputs
│   ├── graphs/       # NetworkX graph exports
│   └── trends/       # Aggregated trend tables
└── eval/             # Evaluation framework
    ├── questions.jsonl
    └── runs/          # Timestamped results
```

### 3.2 Source Code Layout
```
src/
├── ingest/   # OpenAlex collection (Phase 1)
├── parse/    # PDF/text parsing (Phase 2)
├── chunk/    # Semantic chunking (Phase 2)
├── graph/    # NetworkX graph analysis (Phase 3)
├── trends/   # DuckDB trend aggregation (Phase 3)
├── embed/    # Embedding + indexing (Phase 4)
├── serve/    # Q&A serving (Phase 5)
├── eval/     # Evaluation runner (cross-cutting)
└── utils/    # Shared utilities
```

---

## 4. Acceptance Criteria

- [x] All 17 design decisions resolved and recorded in `DECISIONS.md`
- [x] Repository restructured: bronze/silver/gold data layout + new src modules
- [x] Documentation updated: README, PURPOSE, OVERVIEW reflect new architecture
- [x] Smoke tests pass with new directory structure
- [ ] ≥20 evaluation questions written in `data/eval/questions.jsonl`
- [x] `configs/sources.yaml` and `configs/taxonomy.yaml` created
- [x] `docs/research-paper-rag-plan.md` committed as canonical plan
