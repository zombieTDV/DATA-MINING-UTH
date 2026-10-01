# Research Paper RAG + Trend Analysis: Project Plan

> Audience: an AI coding/research agent working with the project owner (TDV).
> Status: idea stage. Several decisions are still OPEN (see section 12). Do not silently decide them. Ask the owner, or propose a default and record it in `DECISIONS.md`.

---

## 1. Goal

Build a system over a corpus of at least 10,000 academic papers that supports two distinct capabilities:

1. **Retrieval Q&A**: answer detailed questions about papers (methods, losses, datasets, results) with verifiable citations.
2. **Trend analysis**: answer corpus-level questions ("how did approach X evolve 2018-2026?", "which datasets/metrics became common?", "what gaps remain?") using aggregated statistics, with example papers cited.

These are different problems. Retrieval over top-k chunks cannot count or aggregate across thousands of papers. Trend questions are answered from a **structured per-paper table** (SQL/pandas aggregation) that an LLM then narrates. Retrieval Q&A is answered from **chunk-level search**. Never route a trend question through chunk search alone.

**First-version priority (OPEN, ask owner):** build for ONE of the two use cases first; the other follows. Default if undecided: trend analysis first, because it needs mostly abstracts, intros, conclusions and metadata, so parsing quality matters less.

## 2. Guiding principles

- **Start small, keep the layers.** Prototype on 200-500 papers before scaling to 10k.
- **Raw data is immutable.** Re-parse and re-extract freely; never overwrite bronze files.
- **Every stage is measurable.** Maintain an evaluation set from Phase 0 and re-run it after any change to parsing, chunking, embedding, retrieval, or extraction.
- **No fabricated citations.** Any answer must cite chunk IDs/paper IDs that exist and are verified to support the claim.
- **Be honest about sampling.** Trend results are valid only relative to how the corpus was sampled. Record the sampling method and report it with trend outputs.
- **Defer infrastructure.** No orchestrator, monitoring stack, webhooks, dashboards, or multi-user personas until the core pipeline demonstrably works.

## 3. Architecture overview

```
Sources: arXiv (OAI-PMH / metadata snapshot), OpenAlex, Semantic Scholar
        |
        v
BRONZE   raw metadata JSON + PDFs (+ HTML/LaTeX when available) + manifest (SHA-256, timestamps)
        |
        v
SILVER   papers.parquet        deduplicated metadata (year, venue, citations, DOI, arXiv id)
         sections.parquet      parsed section structure (references excluded)
         references.parquet    parsed reference lists (kept separate)
         chunks.parquet        300-600 token chunks with title/year/section context
         extractions.parquet   LLM "paper fingerprint" with normalized labels
         quality_report        parse failures, missing fields, extraction confidence
        |
        v
GOLD     LanceDB: chunk index (dense + full-text) and paper-summary index
         trend tables (year x method / dataset / metric / task)
         citation edges (Parquet edge table from OpenAlex)
        |
        v
SERVING  Python module (FastAPI later, optional) with two paths:
         (a) Retrieval Q&A: hybrid search -> rerank -> group by paper -> expand +/-1 chunk -> LLM with citations
         (b) Trend queries: SQL over trend tables -> LLM narrates and cites example papers

EVALUATION SET (cross-cutting): 20-30 questions, re-run after every change.
```

### Components kept from the original draft
Bronze/silver/gold layering; Parquet + DuckDB for tables; LanceDB for vectors; provenance manifest; OpenAlex and Semantic Scholar for metadata and citations.

### Components added
1. **Structured extraction step** (`extractions.parquet`). The original draft had "analytics aggregates" but nothing that produced the data to aggregate.
2. **Evaluation set** from day one.
3. **Historical backfill + sampling strategy.** arXiv RSS feeds only return recent papers. Use OAI-PMH or a bulk metadata snapshot for history.

### Deferred (do NOT build yet)
Airflow/Prefect, Grafana/Prometheus/Loki, webhooks/event streams, "real-time" ingestion, BI dashboards, multi-persona access layers, a full citation-graph UI, an autonomous research-planner agent. Cloudflare R2 is also deferred: 10k PDFs is roughly 10-30 GB and fits on local disk. Keep the folder layout identical so migrating to object storage later is a copy.

## 4. Tech stack (defaults; benchmark where marked)

| Concern | Default | Notes |
|---|---|---|
| Language | Python 3.11+ | |
| Tables | Parquet + DuckDB | analytics and joins |
| Vector + full-text | LanceDB (embedded) | supports dense + full-text; alternative: Qdrant or pgvector |
| PDF parsing | BENCHMARK: GROBID vs Docling vs Marker | compare on 50 papers by eye; pick one |
| Embeddings | BENCHMARK 2-3 candidates | include at least one general model (e.g. bge-m3 / e5 family) and one scientific-domain model (e.g. SPECTER2 for paper-level) |
| Reranker | a cross-encoder reranker (BENCHMARK) | applied to top ~50 candidates |
| Extraction LLM | a cheap, capable model | structured JSON output; temperature 0 |
| Answer LLM | stronger model | must output citations |
| Orchestration | Makefile / CLI scripts | no scheduler yet |

## 5. Repository and data layout

```
project/
  DECISIONS.md              # running log of decisions (date, decision, reason)
  config/
    sources.yaml            # fields, date ranges, sampling params
    taxonomy.yaml           # normalized label lists (methods, tasks, datasets, metrics)
  data/
    bronze/
      metadata_raw/         # raw API JSON, one file per source/query/page
      pdf_raw/              # {paper_id}.pdf
      html_raw/ tex_raw/    # optional, when available
      manifest.parquet      # paper_id, url, sha256, fetched_at, source
    silver/
      papers.parquet
      sections.parquet
      references.parquet
      chunks.parquet
      extractions.parquet
      audit/                # quality reports
    gold/
      lancedb/              # chunk_index, paper_index tables
      trends/               # aggregate parquet tables
      citations.parquet
    eval/
      questions.jsonl       # evaluation questions + expected papers/answers
      runs/                 # timestamped evaluation results
  src/
    ingest/ parse/ chunk/ embed/ extract/ index/ serve/ eval/
  logs/
```

## 6. Data model (silver/gold schemas)

Use stable IDs. `paper_id` = canonical ID chosen at dedup time (prefer DOI, else arXiv ID, else OpenAlex ID); keep a mapping table of all known IDs per paper.

**papers.parquet**
`paper_id, title, abstract, year, venue, doi, arxiv_id, openalex_id, s2_id, authors (list), citation_count, keywords/concepts (list), source_flags, has_pdf, has_html, has_tex, dedup_group_id, version_info`

**sections.parquet**
`paper_id, section_id, section_order, heading, heading_normalized (intro | related_work | method | experiments | results | discussion | conclusion | appendix | other), text, page_start, page_end, parser_name, parser_version`

**chunks.parquet**
`chunk_id, paper_id, section_id, chunk_order, text, embed_text (with prefix), token_count, page, contains_table (bool), contains_equation (bool), chunk_type (body | caption | table | list)`

**extractions.parquet** (paper fingerprint)
`paper_id, task (list), method_families (list), methods_raw (list), datasets (list), metrics (list), claimed_contributions (list), limitations (list), is_survey (bool), confidence, evidence (map field -> chunk_id/quote), extractor_model, extractor_version, extracted_at`

**references.parquet**
`paper_id, ref_index, raw_text, matched_paper_id (nullable), doi (nullable)`

**citations.parquet** (gold)
`citing_paper_id, cited_paper_id, source` (from OpenAlex)

**trends/** (gold, generated by DuckDB): e.g. `year_x_method_family`, `year_x_dataset`, `year_x_metric`, `year_x_task`, each with counts, shares, and a list of example `paper_id`s per cell.

## 7. Pipeline stages in detail

### 7.1 Collection (Bronze)
- Pull metadata from OpenAlex (and Semantic Scholar for citations/abstract gaps). Use arXiv OAI-PMH or a bulk metadata snapshot for historical coverage, not RSS.
- Respect each API's documented rate limits and identification requirements (e.g. contact email for OpenAlex, API key for Semantic Scholar where applicable). Cache everything raw.
- Download the PDF for every selected paper. PDF is ground truth. Add HTML or LaTeX source where available and prefer them for section-aware parsing; fall back to PDF parsing otherwise.
- Write `manifest.parquet` with SHA-256, URL, fetch time, source.
- Deduplicate arXiv versus published versions and multiple arXiv versions: choose one canonical record, keep the mapping.
- **Sampling:** target at least 10,000 papers. Decide scope (section 12). If the scope is a broad field, sample stratified by year so trends are not distorted by volume growth; record sampling rules in `config/sources.yaml`. Note bias: arXiv-only corpora measure "what gets posted to arXiv"; sources like Hugging Face Daily Papers skew toward popular recent work. Prefer not to use them as primary sources for trend analysis.

### 7.2 Parsing (Silver)
- Benchmark GROBID, Docling, Marker on about 50 diverse papers. Score by eye: section boundaries, tables, equations, captions, multi-column reading order, references. Record the result in `DECISIONS.md`.
- Output sections with normalized headings, plus tables/figure captions as separate chunk types and references into `references.parquet`.
- **Exclude the references section from embeddings.**
- Log parse failures to `silver/audit/`; quarantine and retry with an alternate parser rather than dropping silently.
- Trend analysis mostly needs abstract, intro, conclusion, and metadata; do not over-invest in table/equation fidelity at this stage.

### 7.3 Chunking
- Structure-aware: section -> paragraph -> sentence boundaries; never cut mid-sentence.
- Target roughly 300-600 tokens; tune on the evaluation set.
- Embed text with a context prefix, but store the original text separately:
  ```
  [Title] <title>
  [Year] <year>
  [Section] <section heading>

  <chunk text>
  ```
- Keep neighbor links (`chunk_order`) so retrieval can expand +/-1 neighbors.
- Tables and captions are separate chunk types; do not mix them into prose chunks.

### 7.4 Embedding and indexing (Gold)
- Chunk index in LanceDB: dense vector + full-text (BM25-style) over `embed_text` or `text`; metadata columns: `paper_id, year, section heading_normalized, chunk_type`.
- Paper-level index: one vector per paper from title + abstract + generated structured summary.
- Benchmark 2-3 embedding models on the evaluation set (retrieval recall@k) before committing.
- Store `embedding_model` and `embedding_version` on every row; re-embed whole tables when the model changes (never mix models in one index).

### 7.5 Structured extraction ("paper fingerprint")
This is the most valuable component for trend analysis. Build it carefully.

- Input: title, abstract, introduction, conclusion (full text only if needed). Output: strict JSON matching `extractions.parquet`.
- Use a **normalized taxonomy** (`config/taxonomy.yaml`): the model must map free-text mentions to canonical labels (e.g. "U-Net", "encoder-decoder" -> `cnn_encoder_decoder`), while also keeping the raw mention in `methods_raw`. Allow an `other` label and periodically review `other` clusters to extend the taxonomy.
- Require evidence: each extracted field should reference supporting text (chunk ID or short quote). Verify programmatically that quotes exist in the source.
- Record confidence and extractor version; use temperature 0.
- **Validation:** hand-label about 100 papers; compute per-field precision/recall; do not publish trend charts until accuracy is known and acceptable. Re-run extraction when the taxonomy or prompt changes (version it).

Extraction prompt skeleton (refine against labeled data):
```
You are extracting structured metadata from a research paper.
Return ONLY valid JSON matching the schema. Use only information stated in the provided text.
If a field is not stated, return an empty list or null; do not guess.
Map methods/tasks/datasets/metrics to the canonical labels in <taxonomy>; if none fit, use "other"
and put the original wording in methods_raw.
For each field include "evidence": a short verbatim quote from the text.
<taxonomy>...</taxonomy>
<paper>title, abstract, introduction, conclusion</paper>
```

### 7.6 Trend tables
- Generate with DuckDB from `papers` JOIN `extractions`, grouped by year and label. Store counts, shares (normalize by papers per year), and example `paper_id`s per cell.
- Always report the denominator (papers per year) and flag low-count years.
- The LLM narrates only from these tables plus cited example papers; it must not "recall" trends from its own training data.

### 7.7 Retrieval Q&A path
1. Query expansion (optional; test whether it helps on the eval set).
2. Hybrid candidate retrieval: dense + full-text; fuse scores.
3. Rerank top ~50 with a cross-encoder.
4. Group chunks by paper; rank papers; keep top N papers.
5. Context expansion: add +/-1 neighboring chunks, ordered by paper and position.
6. Answer LLM prompt: provide numbered evidence blocks (`[paper_id:chunk_id]`); require inline citations with short supporting quotes.
7. **Citation verification:** programmatically check every cited ID exists in the retrieved context and that quoted text appears in that chunk; strip or flag unverifiable claims.

### 7.8 Trend Q&A path
1. Identify the dimension (method/dataset/metric/task) and time range.
2. Query the trend tables via DuckDB (parameterized SQL, not LLM-generated free-form SQL against raw tables unless sandboxed/read-only).
3. Pull example papers per notable cell; optionally use chunk retrieval to ground explanations.
4. LLM writes the narrative citing the numbers and example papers; include the sampling caveat and counts.

## 8. Evaluation (start in Phase 0)

- File: `data/eval/questions.jsonl`. Fields: `id, type (retrieval | trend), question, expected_paper_ids, expected_answer_points, notes`.
- Write 20-30 questions: roughly 15-20 retrieval, 5-10 trend. Source them from real questions the owner would ask.
- Metrics: retrieval recall@k and MRR on expected papers; citation validity rate (every cited ID verifiable); extraction accuracy per field vs the hand-labeled set; answer quality via rubric (manual at first).
- Every run writes to `data/eval/runs/<timestamp>/` with config hashes (parser, chunk params, embedding model, reranker, extractor version). A change is only accepted if the eval does not regress.

## 9. Phased roadmap (with acceptance criteria)

| Phase | Work | Done when |
|---|---|---|
| 0. Scope + eval | Choose field and use-case priority; write eval questions; set up repo/`DECISIONS.md` | Scope recorded; >= 20 eval questions; sampling plan written |
| 1. Collect | Metadata from OpenAlex/S2/arXiv; PDF download; manifest; dedup | >= 10k papers in `papers.parquet`; PDFs hash-verified; dedup mapping stored; start with a 200-500 paper pilot first |
| 2. Parse + chunk | Parser benchmark; sections, references, chunks | Parser chosen with evidence; parse success rate reported; chunks generated with prefixes; references excluded from embeddings |
| 3. Retrieval baseline | Embedding benchmark; LanceDB dense + full-text; reranker | Baseline recall@k/MRR recorded on eval set |
| 4. Extraction + trends | Taxonomy; fingerprint extraction; hand-label 100 papers; trend tables | Per-field accuracy measured; trend tables built; denominators shown |
| 5. LLM layer | Retrieval Q&A with citation verification; trend Q&A | Citation validity ~100% on eval; answers use only retrieved/aggregated evidence |
| 6. Optional | Citation-graph queries, planner agent, API, dashboards, R2, scheduler | Only after Phases 1-5 pass and a concrete need exists |

Time estimates are rough: Phase 0 about 1 week; Phase 1 1-2 weeks; Phase 2 1-2 weeks; Phase 3 about 1 week; Phase 4 about 2 weeks; Phase 5 1-2 weeks.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Sampling bias (arXiv-heavy, popularity-skewed sources) | Record sampling; stratify by year; state caveat in every trend answer |
| LLM extraction noise / inconsistent terminology | Normalized taxonomy, evidence quotes, hand-labeled validation, version and re-run |
| Parser failures on tables/equations/multi-column PDFs | Benchmark first; keep PDF as ground truth; quarantine and retry; do not over-invest early |
| Duplicate/versioned papers distorting counts | Dedup group IDs; count one canonical record per group |
| Hallucinated citations | Verification step; refuse to cite unverifiable chunks |
| Embedding model drift/mixing | Version columns; re-embed whole index on change |
| Scope creep (platform features) | Section 3 "Deferred" list; revisit only after Phase 5 |
| API/rate-limit or licensing issues | Respect terms/limits; cache raw responses; record source and license where available; check redistribution terms before sharing data |

## 11. Working agreements for the agent

1. Read this file and `DECISIONS.md` at the start of every session.
2. Before large downloads, API-heavy runs, or paid LLM batches, state the estimated volume/cost and get confirmation.
3. Work in the smallest verified increment: pilot on 200-500 papers, check outputs by inspecting samples, then scale.
4. After any pipeline change, re-run the evaluation set and report deltas.
5. Never overwrite bronze data; write new versions of derived tables with version metadata.
6. Never invent paper content, citations, or statistics; if evidence is missing, say so.
7. Record every non-trivial decision (parser choice, embedding model, chunk size, taxonomy changes) in `DECISIONS.md` with the reason and eval evidence.
8. Do not build anything from the "Deferred" list without the owner's explicit go-ahead.

## 12. Open decisions (ask the owner)

1. **Field/subfield scope.** 10k papers is a whole field, not a narrow topic (a topic like "QR code restoration" alone may have only hundreds of papers). Candidates: image restoration, document analysis, or another subfield. Alternatively, a stratified-by-year sample of a broad AI/DS slice.
2. **First use case**: trend analysis vs detailed paper Q&A.
3. **Compute and budget**: local GPU or CPU only; LLM API budget for extraction (about 10k papers) and answering.
4. **Stack confirmation**: LanceDB vs Qdrant/pgvector; local vs cloud storage; which LLM providers.
5. **Sources and licensing**: arXiv only, or also publisher venues; whether any data will be shared or published.
6. **Language**: papers in English only? (Assumed yes.)
7. **Deliverable form**: personal research tool, course/thesis project, or something shared with others (affects licensing and UI needs).

## 13. Suggested immediate next steps

1. Create the repo layout and `DECISIONS.md`.
2. Resolve open decisions 1 and 2 with the owner.
3. Draft 20-30 evaluation questions.
4. Run a 200-500 paper pilot through collect -> parse -> chunk -> index, then evaluate before scaling to 10k.
