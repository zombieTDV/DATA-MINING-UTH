# src — Scientific Data Mining & Real-Time Lakehouse Architecture

- **Motivation/Background**: Tái cấu trúc từ template Deep Learning chung sang kiến trúc Data Mining Pipeline & Advanced RAG chuyên dụng, phân tách rõ ràng trách nhiệm theo mô hình ELT và Medallion Data Lakehouse (Bronze -> Silver -> Gold).
- **Purpose**: Đóng vai trò là bản đồ kiến trúc mã nguồn (Codebase Architecture Map) hướng dẫn vai trò, trách nhiệm và luồng dữ liệu của các package trong `src/`.
- **Overview Pipeline**: `src/ingestion` (Extract -> Bronze R2) -> `src/transformation` & `src/quality` (Clean & Parse -> Silver Parquet) -> `src/indexing` & `src/mining` (LanceDB Gold, Graph, Topic Modeling) -> `src/rag` (Hybrid Retrieval & Generation) -> `src/pipelines` (CLI Orchestration).
- **Detailed Plan**: §1 Cấu trúc Thư mục Tổng quan; §2 Trách nhiệm từng Package (SoC); §3 Nguyên tắc Kỹ thuật (Engineering Invariants); §4 Hướng dẫn Sử dụng.
- **References**: [docs/data_mining.md](../docs/data_mining.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](../docs/references/ML_PIPELINE_REFERENCE_v4.md), [agents/rules/MD_CONVENTION.md](../agents/rules/MD_CONVENTION.md), [agents/rules/LOGGING_CHECKPOINT_RULES.md](../agents/rules/LOGGING_CHECKPOINT_RULES.md).
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-10-02T09:07:00+07:00

---

## 1. Cấu trúc Thư mục Tổng quan

```text
src/
├── config/                  # Quản lý cấu hình tập trung (Pydantic Settings, .env)
├── storage/                 # Tầng lưu trữ Lakehouse (Cloudflare R2 Client, DuckDB Engine, Manifests)
├── ingestion/               # Trích xuất dữ liệu & Tải vào Bronze (arXiv RSS, API, HTML Downloader)
├── transformation/          # Làm sạch, bóc tách cấu trúc HTML & Lưu Silver Parquet
├── quality/                 # Kiểm định chất lượng dữ liệu 6 chiều (Data Audit & Profiling)
├── indexing/                # Xây dựng chỉ mục tầng Gold: Chunking, BGE-M3 Embeddings, LanceDB
├── mining/                  # Thuật toán Khai phá dữ liệu (BERTopic, Trend Analysis, Citation Graph)
├── rag/                     # Động cơ Advanced RAG: Hybrid Search (Dense+BM25), Reranker, LLM
├── pipelines/               # CLI Entry points điều phối pipeline (Orchestration & Jobs)
└── utils/                   # Tiện ích dùng chung (Logger, Hashing SHA-256, Time helpers)
```

---

## 2. Trách nhiệm Từng Package (Separation of Concerns)

| Package | Tầng Lakehouse | Trách nhiệm chính | File dự kiến |
| :--- | :--- | :--- | :--- |
| **`src/config/`** | Toàn hệ thống | Quản lý biến môi trường, xác thực schema cấu hình bằng Pydantic. | `settings.py` |
| **`src/storage/`** | Bronze / Silver / Gold | Giao tiếp Cloudflare R2 (Boto3/S3), khởi tạo DuckDB SQL Engine, quản lý Data Manifests & Lineage. | `r2_client.py`, `duckdb_engine.py`, `manifest.py` |
| **`src/ingestion/`** | **Extract $\rightarrow$ Bronze** | Thu thập bài báo mới từ arXiv RSS/API, tải bản Full-text HTML/PDF, lưu nguyên bản vào R2 kèm SHA-256. | `arxiv_rss.py`, `arxiv_api.py`, `html_downloader.py` |
| **`src/transformation/`** | **Bronze $\rightarrow$ Silver** | Bóc tách HTML (BeautifulSoup/lxml) ra cấu trúc sections/math, chuẩn hóa tác giả/DOI, ghi ra Parquet. | `html_parser.py`, `normalizer.py`, `silver_writer.py` |
| **`src/quality/`** | **Silver Audit** | Kiểm định chất lượng 6 chiều: Đầy đủ (Completeness), Duy nhất (Uniqueness), Kịp thời (Timeliness), v.v. | `data_audit.py`, `profiler.py` |
| **`src/indexing/`** | **Silver $\rightarrow$ Gold** | Cắt đoạn Section-aware Chunking, sinh Vector Embeddings (BGE-M3), lập chỉ mục LanceDB + BM25. | `chunker.py`, `embedder.py`, `lancedb_manager.py` |
| **`src/mining/`** | **Gold Mining** | Phân cụm chủ đề (BERTopic/LDA), phân tích xu hướng tăng trưởng, xây dựng đồ thị trích dẫn (NetworkX). | `topic_modeling.py`, `trend_mining.py`, `citation_graph.py` |
| **`src/rag/`** | **Gold Serving** | Mở rộng truy vấn (HyDE), tìm kiếm lai (Hybrid Search), xếp hạng lại (Cross-Encoder), sinh câu trả lời có trích dẫn. | `hybrid_search.py`, `reranker.py`, `generator.py` |
| **`src/pipelines/`** | **Orchestration** | CLI Runner chạy các luồng: `run_ingest.py`, `run_transform.py`, `run_daily_sync.py`. | Các script thực thi dòng lệnh |
| **`src/utils/`** | Shared Utilities | Ghi log chuẩn 5W1H, tính toán mã băm SHA-256, format dữ liệu. | `logging.py`, `hasher.py` |

---

## 3. Nguyên tắc Kỹ thuật Cốt lõi (Engineering Invariants)

1. **Immutable Raw Invariant (Quy tắc Bất biến Tầng Bronze):**
   Mọi dữ liệu kéo về từ arXiv (JSON/HTML/PDF) bắt buộc phải lưu nguyên bản vào `bronze/` trên Cloudflare R2 kèm mã băm SHA-256 trước khi bất kỳ thao tác transform nào được diễn ra.
2. **Columnar & Lakehouse Standard (Tầng Silver):**
   Dữ liệu đã làm sạch bắt buộc lưu dưới định dạng **Apache Parquet** nén `zstd`. Mọi phân tích hoặc truy vấn trung gian đều thông qua **DuckDB**.
3. **Domain-Aware RAG (Tầng Gold):**
   Không chia chunk văn bản một cách ngẫu nhiên/cố định token. Phải chunk theo cấu trúc Section bài báo (Abstract, Methodology, Experiments) và bảo toàn công thức toán LaTeX.
4. **Script-Only Orchestration:**
   Mọi pipeline cào, chuyển đổi, sinh embedding phải chạy qua script dòng lệnh trong `src/pipelines/`. Notebooks chỉ dùng để vẽ đồ thị và phân tích khám phá (EDA).
