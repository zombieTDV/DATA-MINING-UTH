# 01_COLLECTION_HANDOFF_GUIDE.md — Data Ingestion & Lakehouse Developer Handbook

- **Motivation/Background**: The data collection phase forms the foundation of the scientific paper mining and RAG pipeline. To facilitate clean teamwork and prevent API blocks or schema inconsistencies, this guide provides the implementing developer with complete query recipes, rate-limiting rules, data schemas, and step-by-step tasks.
- **Purpose**: Serve as a comprehensive implementation handbook and technical handoff for the team member developing the real-time paper collection, raw vaulting, and Lakehouse indexing modules.
- **Overview Pipeline**: Outlines ingestion architecture, exact HTTP specifications for arXiv and OpenAlex, SHA-256 file vaulting rules, Lakehouse table contracts, and an actionable implementation checklist.
- **Detailed Plan**: §1 Architecture & Ingestion Flow; §2 Data Sources & Query Specifications; §3 Rule #0 & Raw Storage Vault; §4 Lakehouse Schema & Contract; §5 Step-by-Step Implementation Checklist; §6 Testing & Verification Strategy.
- **References**: [01_REALTIME_COLLECTION_AND_LAKEHOUSE.md](file:///C:/document/Study%20documents/Uth-Data-Mining/docs/phases/01_REALTIME_COLLECTION_AND_LAKEHOUSE.md), [ML_PIPELINE_REFERENCE_v4.md](file:///C:/document/Study%20documents/Uth-Data-Mining/docs/references/ML_PIPELINE_REFERENCE_v4.md), [Chapter1.pdf](file:///C:/document/Study%20documents/Uth-Data-Mining/docs/references/Chapter1.pdf), [Chapter2.pdf](file:///C:/document/Study%20documents/Uth-Data-Mining/docs/references/Chapter2.pdf).
- **Created**: 2026-09-30T13:14:00+07:00
- **Last Updated**: 2026-09-30T13:14:00+07:00

[STATUS: ACTIVE]

---

## Table of Contents

- [1. Architecture & Ingestion Flow](#1-architecture--ingestion-flow)
- [2. Data Sources & Query Specifications](#2-data-sources--query-specifications)
  - [2.1 arXiv API & RSS Feed](#21-arxiv-api--rss-feed)
  - [2.2 OpenAlex REST API](#22-openalex-rest-api)
- [3. Rule #0: Immutable Raw Data Vault](#3-rule-0-immutable-raw-data-vault)
- [4. Lakehouse Storage Contract (`papers_metadata`)](#4-lakehouse-storage-contract-papers_metadata)
- [5. Step-by-Step Implementation Checklist](#5-step-by-step-implementation-checklist)
- [6. Testing & Verification Strategy](#6-testing--verification-strategy)

---

## 1. Architecture & Ingestion Flow

The ingestion subsystem operates under a **Two-Tier Architecture** to guarantee instant search availability while safely streaming heavy PDF downloads in the background:

```
[arXiv RSS / API]     [OpenAlex API]
        │                   │
        ▼                   ▼
 ┌──────────────────────────────────┐
 │    Crawler Ingestion Workers     │
 └─────────────────┬────────────────┘
                   │ Emits PaperRecord Event
                   ▼
 ┌──────────────────────────────────┐
 │   Streaming Event Buffer (WAL)   │
 └─────────┬────────────────────────┘
           │
     ┌─────┴─────────────────────────┐
     ▼                               ▼
[Tier 1: Fast Path]           [Tier 2: Async Background]
Store metadata & abstract     Download PDF stream
into Lakehouse (SQLite/Parquet) Compute SHA-256 checksum
Sub-second availability       Vault into data/raw/papers/
                              Mint data/raw/manifests/*.json
```

### Core Design Principles
1. **Polite Crawling:** Strict rate limits ($\ge 3.0$s for arXiv) and explicit contact headers (`mailto:`) for OpenAlex to avoid IP throttling or blacklisting.
2. **Idempotent Ingestion:** Re-running a harvester on existing papers updates mutable attributes (e.g. citation count, revisions) without creating duplicate records.
3. **Immutable Raw Files (Rule #0):** Once a PDF is stored in `data/raw/papers/`, it is never modified or overwritten.

---

## 2. Data Sources & Query Specifications

### 2.1 arXiv API & RSS Feed

#### Endpoints
- **Atom Query API:**
  ```http
  GET http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:stat.ML&sortBy=lastUpdatedDate&sortOrder=descending&max_results=50
  ```
- **RSS Feed (Latest announcements):**
  ```http
  GET https://rss.arxiv.org/rss/cs.AI+cs.LG+cs.CL+stat.ML
  ```

#### Crawling Etiquette & Rate Limiting
- **Pacing:** Minimum **3.0 seconds** pause between consecutive requests.
- **User-Agent:** Include a descriptive user-agent:
  ```python
  headers = {"User-Agent": "UTH-DataMining-Ingester/1.0 (contact: student@uth.edu.vn)"}
  ```
- **Error Handling:** On HTTP `429` (Too Many Requests) or `503` (Service Unavailable), implement exponential backoff:
  $t_{\text{wait}} = 2^{\text{attempt}} + \text{uniform}(0, 1)$ seconds.

#### Atom XML Parsing Mapping
| arXiv XML Tag | Extraction Target | Destination Field |
| :--- | :--- | :--- |
| `<entry>/<id>` | String after `/abs/` (e.g. `2401.12345v1` -> `arxiv:2401.12345`) | `paper_id` |
| `<entry>/<title>` | Text content (strip leading/trailing whitespace and newlines) | `title` |
| `<entry>/<summary>`| Text content (abstract prose) | `abstract` |
| `<entry>/<author>/<name>` | List of names | `authors` (`list[str]`) |
| `<entry>/<published>` | ISO 8601 string | `published_date` |
| `<entry>/<updated>` | ISO 8601 string | `updated_date` |
| `<entry>/<category term="...">` | Category terms (e.g. `cs.AI`, `cs.LG`) | `categories` (`list[str]`) |
| `<entry>/<link title="pdf">` | `href` attribute | `pdf_url` |

---

### 2.2 OpenAlex REST API

OpenAlex provides structured bibliometrics, citation counts, and concept classifications for AI and Data Science literature.

#### Endpoint
```http
GET https://api.openalex.org/works?filter=concepts.id:C41008148,from_publication_date:2026-01-01&sort=publication_date:desc&per-page=50
```
*(Concept `C41008148` corresponds to Computer Science / Artificial Intelligence).*

#### Polite Pool
OpenAlex grants fast, high-rate throughput if you provide a contact email in the headers:
```python
headers = {
    "User-Agent": "UTH-DataMining-Student/1.0 (mailto:your_email@uth.edu.vn)"
}
```

#### Inverted Index Abstract Reconstruction
OpenAlex stores paper abstracts as an **inverted index** dictionary to save space:
```json
{
  "abstract_inverted_index": {
    "Deep": [0],
    "residual": [1],
    "networks": [2],
    "improve": [3],
    "accuracy": [4]
  }
}
```
**Reconstruction algorithm in Python:**
```python
def reconstruct_abstract(inverted_index: dict[str, list[int]] | None) -> str:
    """Reconstruct abstract prose from OpenAlex inverted index dictionary."""
    if not inverted_index:
        return ""
    word_positions: list[tuple[int, str]] = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    word_positions.sort(key=lambda x: x[0])
    return " ".join(w for _, w in word_positions)
```

---

## 3. Rule #0: Immutable Raw Data Vault

All raw PDF documents downloaded from academic repositories must be treated as **strictly immutable**:

```
data/
├── raw/
│   ├── papers/
│   │   ├── arxiv_2401.12345.pdf
│   │   └── openalex_W123456.pdf
│   └── manifests/
│       ├── arxiv_2401.12345.json
│       └── openalex_W123456.json
└── lakehouse/
    ├── catalog.db
    └── papers_metadata.parquet
```

### Manifest Specification (`data/raw/manifests/<id>.json`)
Each downloaded PDF must have a companion manifest file detailing cryptographic provenance:
```json
{
  "paper_id": "arxiv:2401.12345",
  "source_url": "https://arxiv.org/pdf/2401.12345.pdf",
  "local_path": "data/raw/papers/arxiv_2401.12345.pdf",
  "sha256_checksum": "a3f5b7...",
  "byte_size": 1428570,
  "ingested_at_utc": "2026-09-30T13:15:00Z",
  "status": "VAULTED"
}
```

### Computing SHA-256 in Python:
```python
import hashlib

def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
```

---

## 4. Lakehouse Storage Contract (`papers_metadata`)

The Lakehouse maintains indexed metadata accessible via analytical SQL queries.

### Table Schema
```sql
CREATE TABLE IF NOT EXISTS papers_metadata (
    paper_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT,
    authors TEXT,                 -- JSON array of strings
    published_date TEXT NOT NULL, -- UTC ISO 8601 string
    updated_date TEXT,            -- UTC ISO 8601 string
    categories TEXT,              -- JSON array of strings
    primary_category TEXT,
    doi TEXT,
    pdf_url TEXT,
    local_pdf_path TEXT,          -- Relative path in data/raw/papers/
    raw_sha256 TEXT,              -- SHA-256 hash
    citation_count INTEGER,
    source TEXT NOT NULL,         -- 'arxiv' | 'openalex'
    ingested_at_utc TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_published ON papers_metadata(published_date);
CREATE INDEX IF NOT EXISTS idx_category ON papers_metadata(primary_category);
```

### Idempotent Upsert Query (SQLite / DuckDB)
```sql
INSERT INTO papers_metadata (
    paper_id, title, abstract, authors, published_date,
    updated_date, categories, primary_category, doi,
    pdf_url, local_pdf_path, raw_sha256, citation_count,
    source, ingested_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(paper_id) DO UPDATE SET
    title=excluded.title,
    abstract=COALESCE(excluded.abstract, papers_metadata.abstract),
    authors=excluded.authors,
    updated_date=excluded.updated_date,
    categories=excluded.categories,
    primary_category=excluded.primary_category,
    doi=COALESCE(excluded.doi, papers_metadata.doi),
    pdf_url=COALESCE(excluded.pdf_url, papers_metadata.pdf_url),
    local_pdf_path=COALESCE(excluded.local_pdf_path, papers_metadata.local_pdf_path),
    raw_sha256=COALESCE(excluded.raw_sha256, papers_metadata.raw_sha256),
    citation_count=excluded.citation_count;
```

---

## 5. Step-by-Step Implementation Checklist

Here is the exact task breakdown for the data engineering team member:

- [ ] **Task 1: Project Scaffolding & Dependencies**
  - Verify Python 3.11+ environment.
  - Install dependencies: `pip install requests beautifulsoup4 pandas pyarrow duckdb`.
- [ ] **Task 2: Implement Base Crawler Utilities (`src/crawlers/base_crawler.py`)**
  - Implement request pacing / sleep logic (`time.sleep(min_delay)`).
  - Add retry decorator with exponential backoff and jitter for handling 429/503 errors.
  - Define standard headers including polite user agent and email.
- [ ] **Task 3: Implement arXiv Harvester (`src/crawlers/arxiv_crawler.py`)**
  - Implement `fetch_latest(max_results=50)`.
  - Implement Atom XML parser extracting all fields listed in §2.1.
  - Test with mock XML response to verify zero schema breaks.
- [ ] **Task 4: Implement OpenAlex Harvester (`src/crawlers/openalex_crawler.py`)**
  - Implement `fetch_latest(per_page=50)`.
  - Implement inverted index abstract reconstructor.
  - Map response fields to `PaperRecord`.
- [ ] **Task 5: Implement Raw File Vault (`src/storage/lake_vault.py`)**
  - Implement `RawLakeVault.store_pdf(paper_id, content, source_url)`.
  - Ensure existing files are never overwritten (`overwrite=False` by default).
  - Compute SHA-256 and write manifest JSON to `data/raw/manifests/`.
- [ ] **Task 6: Implement Lakehouse Engine (`src/storage/lakehouse_db.py`)**
  - Initialize SQLite database at `data/lakehouse/catalog.db`.
  - Implement `upsert_paper(record)` and `upsert_papers_batch(records)`.
  - Implement optional Parquet snapshot export (`papers_metadata.parquet`).
  - Provide DuckDB SQL query execution interface.
- [ ] **Task 7: Build Streaming Ingestion Runner (`src/streaming/`)**
  - In-memory or WAL file-backed queue to buffer incoming paper events.
  - Two-tier consumer executing Tier 1 (Lakehouse commit) and Tier 2 (PDF vaulting).
- [ ] **Task 8: Unit Tests with Mocks (`tests/`)**
  - Write unit tests mocking HTTP responses so tests run fast and offline.
  - Verify manifest generation, idempotency, and SQL query execution.

---

## 6. Testing & Verification Strategy

The developer should test their code without triggering rate limits:

```bash
# 1. Run unit test suite (offline mock tests)
python -m pytest tests/ -v

# 2. Dry run with a small batch (e.g. 5 papers)
python -m src.crawlers.arxiv_crawler --limit 5

# 3. Inspect Lakehouse contents using SQLite or DuckDB
python -c "import sqlite3; conn = sqlite3.connect('data/lakehouse/catalog.db'); print(conn.execute('SELECT count(*), primary_category FROM papers_metadata GROUP BY primary_category').fetchall())"

# 4. Verify Raw Vault immutability & manifests
ls -l data/raw/papers/
ls -l data/raw/manifests/
```

Following this guide guarantees that the collected data directly supports Phase 2 (Text Preprocessing & PDF Extraction) and Phase 4 (Advanced RAG Knowledge Retrieval).
