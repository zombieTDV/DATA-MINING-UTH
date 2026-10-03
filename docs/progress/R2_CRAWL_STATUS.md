# R2 Crawl Setup & Execution

- **Motivation/Background**: Người dùng đã điền credentials và yêu cầu cấu hình/thực thi phần còn lại để crawl vào R2.
- **Purpose**: Ghi nhận cấu hình đã kiểm chứng, việc bảo vệ corpus cũ và lệnh chạy tiếp.
- **Overview Pipeline**: Đọc rules → audit môi trường → online doctor → hydrate Silver → sửa upsert → tests → crawl nhỏ → read-back SHA-256.
- **Detailed Plan**: Cấu hình, thay đổi, bằng chứng thực thi, handoff và hướng dẫn chạy.
- **References**: [launcher](../../scripts/crawl_r2.sh), [Silver writer](../../src/transformation/silver_writer.py), [OAI harvester](../../src/ingestion/arxiv_batch_harvester.py), [verification](../../experiments/runs/20261003_132430_r2_setup/verification.json), [checks](../../experiments/runs/20261003_132430_r2_setup/checks.json).
- **Created**: 2026-10-03T13:30:56+07:00
- **Last Updated**: 2026-10-03T13:30:56+07:00

---

[STATUS: COMPLETED]

## Cấu hình đã thực hiện

[.env](../../.env) đã có đủ các trường R2. Giữ nguyên credentials; đặt `SILVER_DIR=data/silver/r2` vì giá trị trước dùng chung với dữ liệu thử local. Giữ `MANIFEST_DIR=data/manifests` và delay 6 giây theo cấu hình hiện có. Batch chạy delay 10 giây.

Online doctor đã xác nhận `r2_configured=true`, `r2_reachable=true`, `arxiv_reachable=true`. Môi trường hiện có Python 3.10.11, đủ core dependencies và không có dependency conflict. Model embedding chưa có nhưng không cần cho metadata crawl.

Tạo [scripts/crawl_r2.sh](../../scripts/crawl_r2.sh), tự chọn Python từ virtualenv của project và chuyển vào repository root. Đã kiểm tra cú pháp shell và `--help` từ thư mục bên ngoài project. Launcher không tự reset checkpoint hay cài lại dependencies.

## Bảo vệ dữ liệu hiện có

Bucket đã có một Silver Parquet: 10.000 rows/10.000 unique paper IDs, 242,986,612 bytes. Đã tải bản đó về [Silver local](../../data/silver/r2/year=2026/papers.parquet), xác minh SHA-256 trước crawl để upsert không dùng bản local rỗng.

Schema hiện có `doi`/`journal_ref`, và phân vùng legacy ghi `year=2026` dù publication dates từ 2005 đến 2024. Đã sửa writer:

- Lưu DOI/journal-ref từ OAI và chuẩn hóa vào Silver.
- Giữ các cột enrichment ngoài schema core khi hợp nhất, giữ DOI/journal-ref cũ nếu metadata mới thiếu.
- Giữ parsed sections/full text và các số đếm nếu chỉ cập nhật metadata mà bản cũ đã có sections.
- Định tuyến paper ID hiện có vào partition cũ; từ chối duplicate IDs giữa nhiều partition. Paper mới được phân vùng theo publication year.

Không tự repartition hay xóa dữ liệu legacy. Các trường metadata như title/abstract/authors/categories có thể được cập nhật bởi OAI.

## 5W1H — kết quả thực thi

- **What**: 28 tests pass/1 live-service test skip; Ruff, pip check, package import, shell syntax và launcher help pass. Crawl xử lý 3 bản ghi; Silver sau upsert vẫn 10.000 rows và 10.000 unique paper IDs. Đây là cập nhật 3 bài hiện có, không phải 3 bài mới.
- **Why**: Xác nhận cấu hình R2, quyền đọc/ghi, bảo toàn enrichment/full text và không nhân đôi corpus cũ.
- **When**: 2026-10-03T13:29:22.920174+07:00; kết quả checks lưu lúc 2026-10-03T13:30:56+07:00.
- **Where**: macOS/Python 3.10.11; [batch log](../../logs/batch_ingest_20261003_132826.log), [preflight](../../experiments/runs/20261003_132430_r2_setup/preflight.json), [read-back report](../../experiments/runs/20261003_132430_r2_setup/verification.json), [unit/check outputs](../../experiments/runs/20261003_132430_r2_setup/checks.json).
- **Who**: Codex agent chính, thực thi theo yêu cầu người phụ trách project.
- **How**: Crawl OAI metadata từ 2024-01-01, target 3, batch-size 1, delay 10; đọc lại toàn bộ Silver từ R2 và so sánh SHA-256 với local/object metadata; kiểm tra Bronze sample; DuckDB đếm row/unique ID.

Lệnh crawl đã thực thi:

```bash
./scripts/crawl_r2.sh --target 3 --batch-size 1 --from-date 2024-01-01 --delay 10
```

SHA-256 Silver sau crawl: `e57296bc3c06e4203459d8243ba36a48ca7fa175ab32a5f9c709fc82d44e8913`. Remote và local khớp. Corpus không tăng số bài vì cả 3 ID đã tồn tại.

## Chạy tiếp

```bash
./scripts/crawl_r2.sh --target 10000 --batch-size 100 --from-date 2024-01-01 --delay 10
```

Checkpoint hiện ghi total_ingested=3 và page_offset=3; `--target` là số bản ghi xử lý của lần harvest hiện tại, không phải số paper mới hay kích thước toàn bộ bucket. Chạy lại cùng lệnh để resume; giữ nguyên ngày/categories/bucket và Silver local. Không dùng `--local` khi cần lưu vào R2. Chỉ chạy một writer tại một thời điểm.

`--from-date` là metadata modification date. Token OAI có thể hết hạn hoặc trang đầu thay đổi; pipeline sẽ dừng rõ ràng thay vì tự bỏ qua. Không reset checkpoint tự động. Corpus cũ nhiều full text nên mỗi lần ghi partition có thể upload lại file khoảng 243 MB; batch-size 100 hiện gom tối đa 500 records trước khi flush, giúp giảm số lượt upload so với smoke test.

## Handoff — 5 anchors

- **Branch / HEAD**: `main`, `27c32a45c6327f1b5f67a2a4fae6fd2b91383a60`.
- **Working tree**: Có thay đổi từ các lượt trước; lượt này bổ sung launcher/tests/bug fixes và tài liệu. Chưa commit/merge.
- **Verification**: 28 passed, 1 skipped; local quality checks và live R2 read-back đã đạt. [Checks](../../experiments/runs/20261003_132430_r2_setup/checks.json) lưu exact commands/output.
- **Open items**: Chưa thực thi target 10.000 trong phiên này; chưa đánh giá throughput dài hạn; year partition legacy giữ nguyên; embedding/RAG ngoài phạm vi cấu hình crawl.
- **Next command**: `./scripts/crawl_r2.sh --target 10000 --batch-size 100 --from-date 2024-01-01 --delay 10`.
