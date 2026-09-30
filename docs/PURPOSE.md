# Project Purpose & Requirements

| Field | Value |
| :--- | :--- |
| **Document Type** | Project Brief & Strategic Requirements |
| **Status** | Canonical Specification (Active) |
| **Owner** | Project Lead / Research Team |
| **Scope** | Real-Time Scientific Data Mining & Advanced RAG |
| **Created** | 2026-09-06T21:05:00+07:00 |
| **Last Updated** | 2026-09-30T13:01:59+07:00 |
| **Reference** | [docs/README.md](README.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](references/ML_PIPELINE_REFERENCE_v4.md) |

---

## 1. Context & Motivation

This file serves as the canonical source of truth for *why* this project exists. Every research phase, experiment configuration, evaluation protocol, and progress update derives directly from this definition.

---

## 2. Original Brief

> **Đề tài:** *Khai thác dữ liệu nghiên cứu khoa học thời gian thực hướng tới xây dựng hệ thống truy xuất tri thức nâng cao (RAG) cho miền AI/DS.*  
> **Tóm tắt ý tưởng:** Cào dữ liệu số lượng lớn từ nhiều nguồn (PDF, HTML, metadata web) theo thời gian thực (khi có báo mới trên arXiv/OpenAlex là tự động thu thập) → đưa vào luồng xử lý streaming thời gian thực → lưu trữ trong Hồ/Kho dữ liệu Lakehouse (Apache Iceberg + DuckDB) → làm sạch, kiểm định chất lượng, phân đoạn ngữ nghĩa (chunking) → khai phá mẫu tri thức (Topic Modeling, Association Rules, Clustering) và cung cấp dữ liệu cho hệ thống Truy xuất Tri thức Nâng cao (Advanced RAG).

---

## 3. Clarifying Answers & Operational Boundaries

- **Target Domains & Categories:** Artificial Intelligence, Machine Learning, Computational Linguistics, and Data Science (`cs.AI`, `cs.LG`, `cs.CL`, `stat.ML`).
- **Primary Data Sources:**
  - **arXiv RSS / REST API:** Real-time daily submission feeds and official paper PDFs.
  - **OpenAlex Scholarly API:** Open citation graphs, author profiles, and institutional metadata.
- **Ingestion & Storage Architecture:**
  - **Two-Tier Ingestion:** Sub-second metadata and abstract indexing into the Lakehouse, paired with asynchronous background streaming of raw PDFs.
  - **Data Lakehouse:** **Apache Iceberg** table format (via PyIceberg) with **DuckDB** for columnar SQL queries and ACID snapshot tracking.
  - **Raw Lake (`data/raw/`):** Strictly immutable raw PDF/HTML/JSON vault with SHA-256 provenance manifests.
- **Data Mining Core (UTH Course Syllabus):**
  - Text & Topic Mining: Topic modeling (LDA / BERTopic) tracking emerging AI frontiers.
  - Association Rules: Frequent co-keyword and methodology mining via FP-Growth (`mlxtend`).
  - Cluster Analysis: Research sub-discipline partitioning via K-Means and DBSCAN with formal Cluster Profiles.
- **RAG Subsystem:** Hybrid dense vector search (Sentence-Transformers) + sparse lexical search (BM25), enriched with cluster and topic tags.
- **Success Criteria:**
  - Zero data leakage between processing and evaluation splits.
  - 100% immutable raw write validation with verifiable SHA-256 checksums.
  - Sub-second metadata query latency across 100,000+ paper records in Apache Iceberg via DuckDB.

---

## 4. Locked Objective

```text
Xây dựng pipeline khai thác dữ liệu nghiên cứu khoa học thời gian thực cho miền AI/DS: thu thập tự động từ arXiv và OpenAlex, đệm dữ liệu qua hàng đợi streaming, lưu trữ chuẩn hóa trong Data Lakehouse sử dụng Apache Iceberg và DuckDB, tiền xử lý và kiểm định chất lượng theo 5 độ đo UTH, khai phá các cụm tri thức và luật kết hợp, và cung cấp ngữ cảnh truy xuất tối ưu cho hệ thống RAG nâng cao.
```

---

## 5. Downstream References

- Master Documentation Index: [docs/README.md](README.md)
- Project Setup Guide: [docs/shared/HOW_TO_SETUP_AI_AGENT.md](shared/HOW_TO_SETUP_AI_AGENT.md)
- Living Project Overview: [docs/OVERVIEW.md](OVERVIEW.md)
