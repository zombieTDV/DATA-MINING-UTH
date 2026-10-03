# DECISIONS.md — Project Decision Log

- **Motivation/Background**: The research-paper-rag-plan.md raised 12+ open design questions that block meaningful implementation. This file records every non-trivial decision with date, choice, and rationale for traceability and course documentation.
- **Purpose**: Serve as the single source of truth for all project design decisions, ensuring teammates and future contributors understand why the architecture is shaped the way it is.
- **Overview Pipeline**: Decisions are logged chronologically during design sessions and referenced by phase specifications.
- **Detailed Plan**: Running table of decisions ordered by date.
- **References**: [docs/research-paper-rag-plan.md](docs/research-paper-rag-plan.md), [docs/OVERVIEW.md](docs/OVERVIEW.md).
- **Created**: 2026-10-02T06:52:00+07:00
- **Last Updated**: 2026-10-02T06:52:00+07:00

[STATUS: ACTIVE]

---

## Decision Log

| # | Date | Decision | Choice | Rationale |
|---|---|---|---|---|
| 1 | 2026-10-02 | Field / subfield scope | **LLMs** (training, alignment, reasoning, agents) | Hot enough for 10k+ papers since 2017; directly relevant to the project topic; produces interesting evolving trends (architectures, training methods, benchmarks) |
| 2 | 2026-10-02 | First use-case priority | **Trend analysis first** | Better fit for a Data Mining course — pattern discovery is the core deliverable; needs mostly abstracts and metadata, so PDF parsing quality matters less early on |
| 3 | 2026-10-02 | Teammate Mạnh's role | **Independent, integrate later** | Stay unblocked; his MinIO/Kafka work is a deployment/scaling concern, not a dependency for the analytical pipeline |
| 4 | 2026-10-02 | Compute / LLM budget | **Deferred** — graphs-first approach eliminates LLM cost for core trend analysis | Re-evaluate at Phase 5 when LLM extraction or answer generation is needed |
| 5 | 2026-10-02 | Primary trend analysis method | **Graphs first** (citation networks + keyword co-occurrence + association rules via FP-Growth), LLM extraction later if needed | Zero LLM cost; course-aligned (FP-Growth, clustering, PageRank are textbook data mining); more defensible than outsourcing analysis to an LLM |
| 6 | 2026-10-02 | Git branch name | `feature/graph-trend-analysis` | Reflects the new direction: graph-based trend analysis of LLM research papers |
| 7 | 2026-10-02 | Analytical storage engine | **Parquet + DuckDB** | Simple, fast columnar SQL, no server daemons, sufficient for 10k papers on a laptop; Iceberg is overengineered at this scale |
| 8 | 2026-10-02 | Graph library | **NetworkX** | Pure Python, well-documented, built-in PageRank / community detection / centrality; sufficient for 10k nodes; widely used in bibliometrics |
| 9 | 2026-10-02 | Data directory layout | **Bronze / Silver / Gold medallion** | Industry-standard lakehouse naming; clearly separates processing stages |
| 10 | 2026-10-02 | Data sources | **OpenAlex only**, time range: **2017-06-01** ("Attention Is All You Need") **to present** | Richest structured metadata (4,516 topics, ML-scored keywords, full citation graph, author data); zero dedup headaches from a single source |
| 11 | 2026-10-02 | Language filter | **English only** | 95%+ of LLM research is published in English; simplifies tokenization and keyword analysis |
| 12 | 2026-10-02 | Deliverable form | **Course / thesis project** | No public deployment needed; notebooks suffice for presentation; no licensing concerns about storing metadata locally |
| 13 | 2026-10-02 | Pilot size | **200 papers first**, then scale to 10k | Validate entire pipeline (collection → graph → trends) on a small set before scaling; catches schema issues early |
| 14 | 2026-10-02 | Phase structure | **6 phases (0–5)**, Phase 3 = graph analysis | Better sequencing than the old 4-phase plan; measurable acceptance criteria per phase; separates parsing from collection |
| 15 | 2026-10-02 | Visualization stack | **Matplotlib + Seaborn** (static charts) + **PyVis** (interactive graph visualization) | Lightweight, no server needed, PyVis exports to standalone HTML |
| 16 | 2026-10-02 | Source code layout | `src/ingest/`, `src/graph/`, `src/trends/`, `src/eval/`, etc. | One directory per pipeline stage; modular and navigable |
| 17 | 2026-10-02 | Decision tracking | **DECISIONS.md in repo root** | Plan §11 working agreement #7; traceability for course submission |
| 18 | 2026-10-02 | Pilot query calibration vs. Scale sampling | **Calibrated topic IDs for Pilot (`T10181`, `T10028`, `T11550`, `T12031`), Field-Weighted Open Sampling for Scale** | Unconstrained keyword queries caused clinical papers (40k+ citations) to crowd out landmark AI papers (5k-15k) in small samples. Pilot requires topic calibration to test NLP benchmarks; large-scale ($N \ge 1,000$) will use open-world sampling with field-weighted normalization to preserve interdisciplinary diffusion. |

---

## How to Use This File

1. **Before making a non-trivial design choice**, check if it's already recorded here.
2. **After resolving a new decision**, append a row with the date, decision description, chosen option, and brief rationale.
3. **Reference from phase docs**: Phase specifications should link back to relevant decision numbers (e.g. "per Decision #7, we use Parquet + DuckDB").
