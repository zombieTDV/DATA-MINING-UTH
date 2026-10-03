# Cấu hình và thực thi project

- **Motivation/Background**: Project đã chuyển từ template deep learning sang scientific lakehouse.
- **Purpose**: Chuẩn bị môi trường cho pipeline thực tế.
- **Overview Pipeline**: Cài core → kiểm tra settings → ingestion local → Silver → optional Gold/R2.
- **Detailed Plan**: Môi trường, cấu hình, chạy thử và chẩn đoán.
- **References**: [README.md](README.md), [pyproject.toml](pyproject.toml), [.env_example](.env_example), [trạng thái](docs/progress/REFACTOR_STATUS.md).
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-10-02T22:47:23+07:00

---

## Môi trường

Môi trường hiện có: `source venv/bin/activate`. Môi trường mới: Python 3.10–3.12, tạo `.venv` rồi cài `python -m pip install -e '.[dev,indexing]'`. Windows kích hoạt bằng `.venv\Scripts\activate`.

Chỉ cần core thì cài `python -m pip install -e '.[dev]'`; không bắt buộc Torch, BERTopic hay GPU cho ingestion/SQL. Không cần cài toàn bộ stack deep learning chỉ để thu thập metadata.

## Cấu hình

Sao chép `.env_example` nếu chưa có `.env`; giữ nguyên file credentials đã có. Biến môi trường ghi đè cấu hình file.

| Biến | Ý nghĩa | Mặc định |
| --- | --- | --- |
| `ARXIV_CATEGORIES` | Categories, phân cách dấu phẩy | cs.AI,cs.LG,cs.CV,cs.CL,stat.ML |
| `ARXIV_REQUEST_DELAY_SECONDS` | Nghỉ giữa các bài, tối thiểu 3 giây | 6 |
| `LOCAL_STORE_DIR` | Kho objects local | data/local |
| `MANIFEST_DIR` | Batch checkpoint | data/manifests |
| `SILVER_DIR` | Parquet local | data/silver |
| `GOLD_DIR` | LanceDB local | data/gold/lancedb |
| `EMBEDDING_MODEL_PATH` | Model Nomic đã tải đầy đủ | models/nomic-embed-text-v1.5 |
| `R2_ENDPOINT_URL` | Endpoint HTTP(S) | Chưa cấu hình |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Credentials R2 | Chưa cấu hình |
| `R2_BUCKET_NAME` | Bucket đã tạo | uth-scientific-lakehouse |

Các đường dẫn tương đối được tính từ repository root. `CLOUDFLARE_ACCOUNT_ID` có thể dùng để tạo endpoint nếu không điền `R2_ENDPOINT_URL`.

## Lệnh thực thi

```bash
python -m src.pipelines.doctor
python -m src.pipelines.run_demo
python -m src.pipelines.run_ingest --local --metadata-only --category cs.AI --limit 1
python -m src.pipelines.run_transform --local
```

Các lệnh ingestion cần mạng; demo chạy offline. Sau khi chuẩn bị model, chạy `python -m src.pipelines.run_indexing --local`. Sau khi điền credentials R2, chạy `python -m src.pipelines.doctor --online`; bỏ `--local` ở các pipeline để dùng R2.

Chạy CLI bằng `python -m src.pipelines.<module>` từ root. Không chạy file trực tiếp vì các module sử dụng package imports.

## Chẩn đoán

`r2_configured=false`: điền credentials trong `.env` trên máy. `embedding_model_present=false`: chuẩn bị model và đặt đường dẫn đúng. `silver_present=false`: chạy ingest + transform. Lỗi HTTP/DNS: kiểm tra quyền truy cập mạng. `doctor --online` exit 1 nếu dịch vụ chưa sẵn sàng; không có thao tác tạo/xóa object kiểm tra.

`python -m pytest tests -q`, `python -m ruff check src tests`, `python -m pip check` kiểm chứng môi trường. CI khai báo Python 3.10 và 3.12; việc chạy CI từ xa chưa được thực hiện trong phiên này.
