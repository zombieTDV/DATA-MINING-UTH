# UTH Scientific Data Mining & Real-Time RAG API (FastAPI)

High-performance asynchronous backend powering the Scientific Data Lakehouse, Real-Time Exploratory Data Analysis (EDA), 4 Pillars of Data Mining & Modeling, and Grounded Scientific RAG.

---

## 1. Quick Start

### Khởi chạy FastAPI Server

Từ thư mục gốc dự án:

```bash
# 1. Kích hoạt môi trường ảo Python
source .venv/bin/activate

# 2. Khởi chạy Uvicorn Server tại cổng 8000
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 2. Interactive API Documentation

Truy cập tài liệu Swagger UI & ReDoc:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 3. Endpoints Overview

| Category | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Kiểm tra trạng thái hệ thống, LanceDB & Parquet |
| **Storage** | `GET` | `/api/storage/stats` | Thống kê dung lượng Cloudflare R2 & Lakehouse |
| **Search** | `POST` | `/api/search` | Tìm kiếm FTS & Vector trên 143k chunks |
| **Chat** | `POST` | `/api/chat` | RAG Answer Generation kèm trích dẫn khoa học |
| **Papers** | `GET` | `/api/papers/{paper_id}` | Lấy chi tiết bài báo và các chunks |
| **Mining: EDA** | `GET` | `/api/mining/eda` | Thống kê phân bố 10k bài, LaTeX, top tác giả |
| **Mining: P1** | `GET` | `/api/mining/pillars/association-rules` | Luật kết hợp FP-Growth (Lift > 1.2) |
| **Mining: P2** | `GET` | `/api/mining/pillars/clusters` | Phân cụm K-Means/DBSCAN + tọa độ 2D |
| **Mining: P3** | `GET` | `/api/mining/pillars/graph` | Mạng đồng tác giả 35k nodes + PageRank |
| **Mining: P4** | `GET` | `/api/mining/pillars/trends` | Phát hiện bất thường & tốc độ tăng trưởng |
| **Mining: Telemetry** | `GET` | `/api/mining/telemetry/stream` | Server-Sent Events (SSE) realtime pulse |
| **Mining: Trigger** | `POST` | `/api/mining/trigger` | Kích hoạt chạy lại Data Mining trong nền |

---

## 4. Kiểm thử tự động (Unit & Integration Tests)

```bash
pytest backend/tests/test_api.py -v
```
