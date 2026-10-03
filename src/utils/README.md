# Shared Utilities

- **Motivation/Background**: Đồng bộ tài liệu với scientific lakehouse hiện có.
- **Purpose**: Ghi nhận kiến trúc và giới hạn implementation.
- **Overview Pipeline**: Ingestion → Bronze → Silver → SQL/chunking → optional Gold.
- **Detailed Plan**: Trạng thái, trách nhiệm module và kiểm chứng.
- **References**: [README](../../README.md), [setup](../../SETUP.md).
- **Created**: 2026-10-02T22:15:00+07:00
- **Last Updated**: 2026-10-02T22:47:23+07:00

---

- [hasher.py](hasher.py): SHA-256 cho bytes hoặc file.
- [logger.py](logger.py): ghi pipeline log và tee stdout/stderr vào file timestamp.

Domain logic đặt trong package ingestion, transformation hoặc indexing tương ứng.
