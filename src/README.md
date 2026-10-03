# Source Architecture

- **Motivation/Background**: Đồng bộ tài liệu với scientific lakehouse hiện có.
- **Purpose**: Ghi nhận kiến trúc và giới hạn implementation.
- **Overview Pipeline**: Ingestion → Bronze → Silver → SQL/chunking → optional Gold.
- **Detailed Plan**: Trạng thái, trách nhiệm module và kiểm chứng.
- **References**: [README](../README.md), [setup](../SETUP.md).
- **Created**: 2026-10-02T22:15:00+07:00
- **Last Updated**: 2026-10-02T22:47:23+07:00

---

| Package | Implementation |
| --- | --- |
| [config](config/settings.py) | Settings `.env` + environment, paths và delay validation |
| [storage](storage/) | R2 boto3, filesystem store với Bronze immutable, DuckDB lazy httpfs |
| [ingestion](ingestion/) | RSS/HTML harvester, OAI bulk harvester với checkpoint sau persistence |
| [transformation](transformation/) | HTML sections/math, metadata normalization, atomic Parquet upsert |
| [indexing](indexing/) | Bounded section chunks, optional local Nomic, LanceDB upsert/cosine search |
| [pipelines](pipelines/) | run_ingest, run_batch_ingest, run_transform, run_indexing, doctor, run_demo |
| [utils](utils/) | SHA-256 và pipeline log tee |
| [quality](quality/), [mining](mining/), [rag](rag/) | Package khung, chưa có algorithm implementation |

Module CLI chạy bằng `python -m`. Giữ `src` là namespace hiện có. Core chạy CPU; indexing là dependency tùy chọn. Không sửa dữ liệu trong `data/raw/`; local ingestion dùng `LOCAL_STORE_DIR`.
