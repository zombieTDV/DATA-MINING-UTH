# Refactor & Execution Status

- **Motivation/Background**: Template deep learning và tests không còn phù hợp code scientific lakehouse.
- **Purpose**: Ghi nhận thay đổi đã kiểm chứng và phần cần cấu hình tiếp.
- **Overview Pipeline**: Audit → refactor core → unit tests → demo → RSS/OAI live → Silver SQL.
- **Detailed Plan**: Audit, kết quả thực thi, giới hạn và lệnh tiếp theo.
- **References**: [README](../../README.md), [SETUP](../../SETUP.md), [verification artifact](../../experiments/runs/20261002_refactor_verification/verification.json).
- **Created**: 2026-10-02T22:47:23+07:00
- **Last Updated**: 2026-10-02T22:47:23+07:00

---

## Audit & remediation

Bắt đầu ở branch `main`, HEAD `27c32a4`, working tree sạch. Kết thúc với thay đổi local chưa commit.

| Finding | Remediation | Status |
| --- | --- | --- |
| README, roadmap và smoke tests trỏ template deep learning | Đồng bộ sang modules hiện có, tách implemented/planned | RESOLVED |
| Python metadata yêu cầu 3.11 nhưng máy chỉ có 3.10.11 | Khai báo hỗ trợ 3.10–3.12 và kiểm chứng 3.10; CI matrix 3.10/3.12 | RESOLVED locally; CI chưa chạy từ xa |
| Dependencies gộp stack rất nặng, editable install thiếu dependency metadata | Core + optional indexing/mining/dev trong pyproject; requirements proxy | RESOLVED |
| DuckDB tải extension kể cả query local và nuốt lỗi remote | Khởi tạo httpfs lazy, query parameters, context manager | RESOLVED locally; remote chưa kiểm chứng |
| Checkpoint trước persistence, bỏ dở trang mất bài, nuốt lỗi Bronze | Checkpoint atomic sau persistence, page offset/signature, fail rõ ràng | RESOLVED |
| Hardcoded năm 2026, đọc Parquet có nguy cơ thêm cột partition | Phân vùng năm từ ngày chuẩn hóa, ParquetFile, atomic replacement/upsert | RESOLVED |
| Parser dùng lxml chưa khai báo, chunks vượt giới hạn và trùng abstract | Built-in HTML parser, bounded chunks, abstract dedup | RESOLVED |
| Tests default yêu cầu credentials và ghi/xóa objects thật | Unit fixture offline; live probes opt-in/read-only | RESOLVED |
| Không chạy ingestion khi chưa có R2 | LocalObjectStore, immutable Bronze và hash manifests | RESOLVED |
| RSS ngày RFC, abstract chứa announcement prefix | Chuẩn hóa ở Silver; giữ Bronze gốc | RESOLVED |
| OAI endpoint đã cũ | Cập nhật theo [arXiv official OAI](https://info.arxiv.org/help/oa/index.html) | RESOLVED |
| Chưa có R2 credentials/model | doctor báo trạng thái; hướng dẫn cấu hình | NOT RESOLVED |

## 5W1H — verification

- **What**: 26 unit/local integration tests pass, 1 live-service test skip mặc định; Ruff/pip check/import/CLI help pass. Hai bài thật nằm trong Silver (một RSS, một OAI). Demo fixture có hai bài và bốn chunks; upsert lặp không nhân đôi bản ghi.
- **Why**: Kiểm tra persistence, partition, dedup, resume và khả năng chạy lại; không đo retrieval/RAG quality.
- **When**: 2026-10-02T22:47:23+07:00, phiên refactor tại HEAD gốc `27c32a4` với working tree đã thay đổi.
- **Where**: macOS, Python 3.10.11, CPU cho storage/SQL; [verification.json](../../experiments/runs/20261002_refactor_verification/verification.json), [batch log](../../logs/batch_ingest_20261002_224531.log), [Silver Parquet](../../data/silver/year=2026/papers.parquet).
- **Who**: Codex thực thi cho người phụ trách project UTH Data Mining.
- **How**: Unit tests fixture với failure injection; live RSS metadata-only/category cs.AI/limit 1; OAI target 1/from-date 2026-10-01/delay 10; truy vấn DuckDB local; LanceDB demo dùng vector hash từ vựng xác định.

Lệnh đã chạy:

```bash
venv/bin/python -m pip install --no-deps --no-build-isolation -e .
venv/bin/python -m pytest tests -q
venv/bin/python -m ruff check src tests
venv/bin/python -m pip check
venv/bin/python -c 'import src'
venv/bin/python -m src.pipelines.doctor
venv/bin/python -m src.pipelines.doctor --online
venv/bin/python -m src.pipelines.run_demo
venv/bin/python -m src.pipelines.run_ingest --local --metadata-only --category cs.AI --limit 1
venv/bin/python -m src.pipelines.run_transform --local
venv/bin/python -u -m src.pipelines.run_batch_ingest --local --target 1 --batch-size 1 --from-date 2026-10-01 --delay 10
```

Online doctor xác nhận arXiv reachable; exit 1 vì R2 chưa cấu hình. Network execution đã được cấp quyền ngoài sandbox. Không sửa `.env`. Dữ liệu và runtime logs nằm trong các thư mục gitignored. Parquet đầu tiên bị phân vùng `unknown` do ngày RFC đã được di chuyển để lưu bằng chứng tại [archive](../../experiments/runs/20261002_refactor_archive/), sau đó transform lại vào năm đúng.

## Limits & next step

- Chưa chạy cloud R2 read/write, remote DuckDB, embedding Nomic thật, sync Gold hoặc corpus 10,000 bài. Model directory chưa có.
- Không có benchmark RAG, reranking, LLM generation hay implementation quality/mining hoàn chỉnh.
- OAI token hết hạn hằng ngày; from-date là metadata modification date. Chỉ hỗ trợ một writer; dependencies có giới hạn phiên bản nhưng chưa lock hoàn toàn.
- Silver upsert theo paper ID trong partition, không có cơ chế migration khi publication year đổi; Gold chưa dọn chunks cũ nếu segmentation của một paper thay đổi.
- Chỉ dùng RSS announcement date cho bản ghi RSS; phân tích publication trends chính xác cần corpus OAI.

Chạy lại local: `source venv/bin/activate` rồi `python -m src.pipelines.doctor` và `python -m src.pipelines.run_demo`. Để semantic Gold: chuẩn bị model local, đặt `EMBEDDING_MODEL_PATH`, chạy `python -m src.pipelines.run_indexing --local`. Để dùng R2: điền credentials trực tiếp trong `.env`, chạy `python -m src.pipelines.doctor --online`.
