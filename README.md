# UTH Scientific Data Mining & Advanced RAG System for AI/DS

Hệ thống Khai phá Dữ liệu Khoa học Thời gian thực và RAG Nâng cao (Real-Time Scientific Data Mining & Advanced RAG System) phục vụ nghiên cứu và tổng quan tài liệu trong miền Trí tuệ Nhân tạo & Khoa học Dữ liệu (AI/DS).

---

## 1. Cấu trúc Dự án (Polyglot Monorepo Architecture)

Dự án được chuẩn hóa thành kiến trúc Monorepo phân tách rõ ràng giữa phân hệ **Khai phá Dữ liệu (Python)** và **Ứng dụng Phục vụ Backend API (TypeScript / NestJS)**:

```text
UTH-Data-Mining-Real-Time-Scientific-Data-Mining-Advanced-RAG-System-for-AI-DS/
│
├── backend/                       # [1] Phân hệ Backend API & Serving (NestJS / TypeScript)
│   ├── apps/
│   │   ├── api-gateway/          # Cổng API cho Frontend (Port 8000)
│   │   └── llm-service/          # Dịch vụ suy luận AI Qwen2.5 GGUF (Port 9001)
│   ├── libs/
│   │   └── shared/               # DTO, Schema Zod, Config dùng chung
│   ├── package.json
│   ├── nest-cli.json
│   └── tsconfig.json
│
├── data_mining/                   # [2] Phân hệ Data Mining & Lakehouse (Python)
│   ├── src/
│   │   ├── config/               # Cấu hình hệ thống & môi trường
│   │   ├── ingestion/            # Thu thập arXiv OAI-PMH & cào HTML5
│   │   ├── transformation/       # Parser HTML & Silver Parquet Writer
│   │   ├── indexing/             # Nomic Embedder (MPS GPU) & LanceDB
│   │   ├── storage/              # Cloudflare R2 & DuckDB SQL Engine
│   │   ├── rag/                  # Scientific RAG Engine & Prompt Templates
│   │   └── pipelines/            # Master Pipeline (Bronze -> Silver -> Gold)
│   ├── tests/                    # Integration & connection tests
│   ├── tools/                    # Công cụ kiểm tra storage (check_storage.py)
│   ├── main.py                   # Điểm kích hoạt Master Pipeline
│   └── requirements.txt
│
├── data/                          # [3] Bộ nhớ đệm dữ liệu cục bộ (.gitignore)
│   ├── raw/html/                 # 9,000+ HTML học thuật thô
│   ├── silver/year=2026/         # Parquet (10,000 bài, 2.22M công thức toán)
│   └── gold/lancedb/             # LanceDB Vector Table (143,523 vectors 768-dim)
│
├── models/                        # [4] Trọng số mô hình AI nặng (.gitignore)
│   ├── nomic-embed-text-v1.5/    # Mô hình nhúng học thuật chạy GPU MPS
│   └── qwen2.5-7b-instruct-...   # Mô hình LLM suy luận
│
├── logs/                          # [5] Nhật ký thực thi theo timestamp (.gitignore)
├── docs/                          # [6] Toàn bộ tài liệu kiến trúc & báo cáo
│   └── agents/                   # Quy chuẩn phát triển & template prompts
│
└── .env                           # Biến môi trường và khóa Cloudflare R2
```

---

## 2. Hướng dẫn Khởi chạy Từng Phân hệ

### A. Phân hệ Data Mining & Lakehouse (`data_mining/`)

Sử dụng môi trường ảo Python 3.9+:

```bash
# 1. Kích hoạt môi trường
source .venv/bin/activate

# 2. Kiểm tra kết nối tới Cloudflare R2 và arXiv
python data_mining/tests/test_connection.py

# 3. Kiểm tra dung lượng và số lượng tài liệu trên R2
python data_mining/tools/check_storage.py

# 4. Chạy Master Pipeline (Thu thập -> Bóc tách HTML -> Nạp Gold LanceDB)
python data_mining/main.py --target-papers 10000 --enrich-html-limit 100 --gold-limit 500
```

---

### B. Phân hệ Backend API & Serving (`backend/`)

Sử dụng Node.js >= 22.0.0:

```bash
# 1. Chuyển vào thư mục backend
cd backend

# 2. Cài đặt thư viện
npm install

# 3. Chạy kiểm thử
npm test

# 4. Khởi chạy đồng thời API Gateway (:8000) và LLM Service (:9001)
npm run dev

# 5. Xem Swagger API Documentation:
# - API Gateway: http://localhost:8000/api/docs
# - LLM Service: http://localhost:9001/docs
```

---

## 3. Kiến trúc Dữ liệu Medallion Lakehouse

- **Bronze Zone (`s3://uth-scientific-lakehouse/bronze/`)**: Lưu trữ 9,022 file HTML học thuật thô và 12 bundle JSON thu thập từ arXiv OAI-PMH.
- **Silver Zone (`s3://uth-scientific-lakehouse/silver/`)**: Lưu trữ 10,000 bài báo dạng bảng cột Apache Parquet nén `zstd`, chứa đầy đủ các phần cấu trúc (`Introduction`, `Methodology`, `Experiments`, `Analysis`) và trích xuất hơn 2.22 triệu công thức toán LaTeX.
- **Gold Zone (`s3://uth-scientific-lakehouse/gold/`)**: Bảng vector LanceDB chứa 143,523 vector nhúng ngữ cảnh 768 chiều sinh từ mô hình `Nomic-embed-text-v1.5` trên Apple Silicon GPU, phục vụ tìm kiếm ngữ nghĩa và RAG thời gian thực.
