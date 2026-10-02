# 01_DATA_COLLECTION.md — Phase 1: OpenAlex Data Collection & Raw Vaulting

- **Motivation/Background**: Building a graph-based trend analysis and RAG system over LLM research requires a representative, clean, and chronologically balanced corpus. Phase 1 establishes the production data foundation: harvesting stratified LLM publications from OpenAlex (2017–present), securing immutable raw files in the Bronze layer with cryptographic SHA-256 manifests, and generating normalized Silver Parquet tables for graph and trend mining.
- **Purpose**: Define the technical specifications, data contracts, API query protocols, error handling policies, and acceptance criteria for Phase 1 (Data Collection & Raw Vaulting).
- **Overview Pipeline**: OpenAlex REST API → Bronze Raw Storage (`metadata_raw/`, `pdf_raw/`, `manifest.parquet`) → Silver Table Builders (`papers.parquet`, `citations.parquet`, `keywords.parquet`) → NetworkX Graph Analysis (Phase 3).
- **Detailed Plan**: §1 Scope & Strategy; §2 Data Contracts (Bronze & Silver); §3 Harvester Architecture & CLI; §4 Edge Cases & Paywall Fallback; §5 Acceptance Criteria & Verification Commands.
- **References**: [DECISIONS.md](../../DECISIONS.md), [configs/sources.yaml](../../configs/sources.yaml), [docs/research-paper-rag-plan.md](../research-paper-rag-plan.md), [docs/OVERVIEW.md](../OVERVIEW.md).
- **Created**: 2026-10-02T07:12:00+07:00
- **Last Updated**: 2026-10-02T07:12:00+07:00

[STATUS: ACTIVE]

---

## 1. Scope & Strategy

### 1.1 Ingestion Boundaries (DECISIONS.md #1, #10, #11)
- **Domain**: Large Language Models (LLMs) — architectures, self-attention, pre-training, fine-tuning, RLHF/DPO alignment, reasoning, and agents.
- **Time Range**: June 2017 ("Attention Is All You Need" publication) to present.
- **Source**: OpenAlex REST API (`https://api.openalex.org/works`).
- **Language**: English (`language:en`).
- **Corpus Volume**:
  - **Pilot Run**: ~200–250 papers (stratified ~20–25 top-cited papers per year from 2017 to 2026).
  - **Full Scale**: ≥10,000 papers.

### 1.2 Stratified Sampling Rationale (DECISIONS.md #13)
Sorting solely by citation count would excessively bias the corpus towards older papers (2017–2020), while sorting solely by publication date would yield sparse, disconnected citation graphs. Stratifying by publication year and taking the top-cited papers per year guarantees:
1. **Temporal Coverage**: High-signal papers across every stage of the LLM era (Transformer → BERT/GPT-2 → Scaling Laws/GPT-3 → InstructGPT/RLHF → LLaMA/Open Weights → Reasoning/Agents).
2. **Dense Citation Graph**: Seminal papers in each year heavily reference prior landmark works, creating high-density internal citation edges for NetworkX graph mining.

---

## 2. Data Contracts

### 2.1 Bronze Layer (Immutable Raw Assets)

```
data/bronze/
├── metadata_raw/
│   └── batch_harvest_<timestamp>.json   # Full raw OpenAlex JSON responses
├── pdf_raw/
│   └── openalex_<id>.pdf                # Validated binary PDFs (%PDF- header)
└── manifest/
    └── manifest.parquet                 # Cryptographic provenance log
```

#### Manifest Schema (`manifest.parquet`)
| Column | Type | Description |
|---|---|---|
| `paper_id` | `string` | Canonical ID (e.g. `openalex:W2741809807`) |
| `source_url` | `string` | URL from which PDF was downloaded |
| `local_path` | `string` | Relative path to local PDF under `data/bronze/pdf_raw/` |
| `sha256_checksum` | `string` | Hex-encoded SHA-256 hash (empty if paywalled) |
| `byte_size` | `int64` | Byte count of vaulted PDF file |
| `fetched_at_utc` | `string` | ISO 8601 UTC timestamp |
| `status` | `string` | `VAULTED` \| `METADATA_ONLY` |
| `error_detail` | `string` | Status explanation or download failure reason |

---

### 2.2 Silver Layer (Normalized Analytical Tables)

```
data/silver/
├── papers.parquet       # Core paper metadata, authors, reconstructed abstracts
├── citations.parquet    # Directed citation edges (citing -> cited)
└── keywords.parquet     # Exploded keyword and topic associations
```

#### `papers.parquet`
| Field | Type | Description |
|---|---|---|
| `paper_id` | `string` | Primary key (`openalex:<id>`) |
| `openalex_id` | `string` | OpenAlex work identifier |
| `title` | `string` | Paper title |
| `abstract` | `string` | Reconstructed prose from inverted index |
| `year` | `int64` | Publication year |
| `publication_date`| `string` | ISO 8601 date string |
| `venue` | `string` | Host journal or conference |
| `doi` | `string` | Digital Object Identifier |
| `arxiv_id` | `string` | arXiv identifier (if available) |
| `authors` | `list[string]` | Ordered author display names |
| `citation_count` | `int64` | OpenAlex `cited_by_count` |
| `topics` | `list[string]` | Primary and secondary OpenAlex topics |
| `keywords` | `list[string]` | Extracted keyword strings |
| `has_pdf` | `bool` | True if vaulted in Bronze layer |
| `local_pdf_path` | `string` | Path to PDF file |
| `raw_sha256` | `string` | SHA-256 checksum |
| `ingested_at_utc` | `string` | Ingestion timestamp |

#### `citations.parquet`
| Field | Type | Description |
|---|---|---|
| `citing_paper_id` | `string` | Originating paper ID in corpus |
| `cited_paper_id` | `string` | Target paper ID (`openalex:<id>`) |
| `is_internal` | `bool` | `True` if target paper is within our corpus; `False` if external |

#### `keywords.parquet`
| Field | Type | Description |
|---|---|---|
| `paper_id` | `string` | Foreign key to `papers.parquet` |
| `keyword` | `string` | Normalized keyword term |
| `score` | `float64` | OpenAlex ML relevance score |
| `year` | `int64` | Publication year |

---

## 3. Harvester Architecture & CLI

### CLI Usage Pattern
```bash
# 1. Run standard 200-paper stratified pilot with PDFs (2017-2026)
python -m src.ingest.harvest --pilot

# 2. Fast dry-run (metadata-only without downloading PDFs)
python -m src.ingest.harvest --limit 10 --skip-pdf

# 3. Custom date window or volume
python -m src.ingest.harvest --start-year 2022 --end-year 2025 --per-year 50
```

---

## 4. Edge Cases & Paywall Fallback

1. **Paywalled Publications**:
   - Commercial publishers (IEEE, Springer, Elsevier) frequently block automated PDF retrieval.
   - When a PDF URL returns HTTP 401/403/404, or returns an HTML redirect/captcha instead of `%PDF-` binary bytes, the harvester does not crash.
   - It marks `status: "METADATA_ONLY"`, `has_pdf: False`, logs the failure detail in `manifest.parquet`, and retains the paper's metadata and citation links in Silver tables.
2. **OpenAlex Polite Pool Compliance**:
   - All outgoing requests provide `User-Agent: UTH-DataMining-Student/1.0 (mailto:student@uth.edu.vn)`.
   - Pacing delay of 0.5s is enforced between requests.
   - Exponential backoff with jitter is executed on HTTP 429/503.
3. **Idempotency**:
   - Re-running `python -m src.ingest.harvest --pilot` detects existing vaulted files and skips redundant PDF downloads.

---

## 5. Acceptance Criteria & Verification Commands

- [x] OpenAlex REST client with inverted index abstract reconstruction (`src/ingest/openalex_client.py`).
- [x] PDF downloader with binary magic bytes check and SHA-256 calculation (`src/ingest/pdf_downloader.py`).
- [x] Bronze vault with raw JSON page storage and manifest manager (`src/ingest/bronze_vault.py`).
- [x] Silver Parquet transformer computing `papers.parquet`, `citations.parquet` (with `is_internal` flag), and `keywords.parquet` (`src/ingest/silver_builder.py`).
- [x] Parameterized CLI runner (`src/ingest/harvest.py`).
- [x] Unit test suite passing 100% offline (`tests/test_ingest.py`).
