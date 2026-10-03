# Scientific Lakehouse Roadmap

- **Motivation/Background**: Đồng bộ tài liệu với scientific lakehouse hiện có.
- **Purpose**: Ghi nhận kiến trúc và giới hạn implementation.
- **Overview Pipeline**: Ingestion → Bronze → Silver → SQL/chunking → optional Gold.
- **Detailed Plan**: Trạng thái, trách nhiệm module và kiểm chứng.
- **References**: [README](../README.md), [setup](../SETUP.md).
- **Created**: 2026-10-02T22:15:00+07:00
- **Last Updated**: 2026-10-02T22:47:23+07:00

---

| Phase | Hiện trạng | Bước tiếp theo |
| --- | --- | --- |
| Ingestion | RSS và OAI, Bronze nguyên bản, SHA-256, local/R2 | Đánh giá vận hành corpus lớn và token expiry |
| Transformation | Parse HTML/metadata, Silver Parquet theo năm, upsert | Chuẩn hóa authors, schema quality và audit 6 chiều |
| Analytics | DuckDB SQL local; remote httpfs lazy | EDA, dữ liệu thiếu, trùng lặp và temporal trends |
| Indexing | Bounded section chunks, Nomic local, LanceDB | Cung cấp model và đánh giá retrieval với benchmark |
| Mining/RAG | Package khung | Topic/graph mining; hybrid retrieval, reranker, generation |

Dữ liệu thật đã kiểm chứng ở quy mô một bài; demo Gold dùng fixture/vector hash. Không có kết quả benchmark RAG hoặc nghiên cứu data mining để báo cáo. Xem [biên bản thực thi](progress/REFACTOR_STATUS.md).
