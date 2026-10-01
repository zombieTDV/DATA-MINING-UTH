# Project Purpose & Requirements

| Field | Value |
| :--- | :--- |
| **Document Type** | Project Brief & Strategic Requirements |
| **Status** | Canonical Specification (Active) |
| **Owner** | Project Lead / Research Team |
| **Scope** | Graph-Based LLM Trend Analysis & Advanced RAG |
| **Created** | 2026-09-06T21:05:00+07:00 |
| **Last Updated** | 2026-10-02T06:52:00+07:00 |
| **Reference** | [docs/README.md](README.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](references/ML_PIPELINE_REFERENCE_v4.md), [DECISIONS.md](../DECISIONS.md) |

---

## 1. Context & Motivation

This file serves as the canonical source of truth for *why* this project exists. Every research phase, experiment configuration, evaluation protocol, and progress update derives directly from this definition.

---

## 2. Original Brief

> **Đề tài:** *Khai thác dữ liệu nghiên cứu khoa học thời gian thực hướng tới xây dựng hệ thống truy xuất tri thức nâng cao (RAG) cho miền AI/DS.*
> **Tóm tắt ý tưởng:** Cào dữ liệu số lượng lớn từ nhiều nguồn (PDF, HTML, metadata web) → đưa vào luồng xử lý → lưu trữ trong Hồ/Kho dữ liệu (Bronze/Silver/Gold Lakehouse) → làm sạch, kiểm định chất lượng, phân đoạn ngữ nghĩa (chunking) → khai phá mẫu tri thức qua phân tích đồ thị (Citation Networks, Keyword Co-occurrence, Association Rules, Clustering) → cung cấp dữ liệu cho hệ thống Truy xuất Tri thức Nâng cao (Advanced RAG).

---

## 3. Clarifying Answers & Operational Boundaries

- **Target Domain & Scope:** Large Language Models (LLMs) — training, alignment, reasoning, agents. Time range: June 2017 ("Attention Is All You Need") to present. English-only papers. (DECISIONS.md #1, #10, #11)
- **Primary Data Source:** OpenAlex REST API — structured metadata with 4,516-topic taxonomy, ML-scored keywords, full citation graph, and author data. (DECISIONS.md #10)
- **Storage Architecture:** (DECISIONS.md #7, #9)
  - **Bronze Layer (`data/bronze/`):** Raw OpenAlex JSON responses, downloaded PDFs, and SHA-256 provenance manifests.
  - **Silver Layer (`data/silver/`):** Cleaned Parquet tables — `papers.parquet`, `citations.parquet`, `keywords.parquet`.
  - **Gold Layer (`data/gold/`):** NetworkX graph exports, DuckDB trend aggregation tables, LanceDB vector indices.
- **Primary Trend Analysis Method:** Graph-based analysis using NetworkX — citation network PageRank, keyword co-occurrence community detection, association rules (FP-Growth via `mlxtend`), and clustering (K-Means / DBSCAN). (DECISIONS.md #5, #8)
- **RAG Subsystem (Later Phases):** LanceDB for hybrid dense vector + BM25 full-text search, with citation-verified LLM answers. (DECISIONS.md #5)
- **Success Criteria:**
  - ≥10,000 LLM papers collected with verified metadata.
  - Meaningful trend analysis outputs: keyword evolution, citation communities, association rules with support/confidence/lift.
  - Evaluation set of ≥20 questions with regression testing after every pipeline change.
  - Zero fabricated citations in RAG answers.

---

## 4. Locked Objective

```text
Xây dựng pipeline khai thác dữ liệu nghiên cứu khoa học cho miền LLM: thu thập metadata từ OpenAlex (2017–nay), lưu trữ chuẩn hóa trong Data Lakehouse (Bronze/Silver/Gold, Parquet + DuckDB), phân tích xu hướng nghiên cứu qua đồ thị trích dẫn và đồng xuất hiện từ khóa (NetworkX, FP-Growth, Clustering), và cung cấp ngữ cảnh truy xuất tối ưu cho hệ thống RAG nâng cao (LanceDB).
```

---

## 5. Downstream References

- Master Documentation Index: [docs/README.md](README.md)
- Project Setup Guide: [docs/shared/HOW_TO_SETUP_AI_AGENT.md](shared/HOW_TO_SETUP_AI_AGENT.md)
- Living Project Overview: [docs/OVERVIEW.md](OVERVIEW.md)
- Canonical Project Plan: [docs/research-paper-rag-plan.md](research-paper-rag-plan.md)
- Decision Log: [DECISIONS.md](../DECISIONS.md)
