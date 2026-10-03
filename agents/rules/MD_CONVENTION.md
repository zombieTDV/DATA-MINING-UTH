# MD_CONVENTION.md — Markdown Formatting & Metadata Standard

- **Motivation/Background**: Project documentation across audits, phase specifications, bug reports, and experiment records requires consistent structure and strict temporal traceability to avoid confusion between current, stale, and superseded artifacts.
- **Purpose**: Define the mandatory 7-field header (including metadata and update timestamps), anchor/TOC rules, clickable cross-reference standards, and lifecycle conventions for all `.md` files.
- **Overview Pipeline**: Formulated during project consolidation refactoring and applied universally across all project documentation.
- **Detailed Plan**: §1 Required Header Specification; §2 Markdown Update-Timestamp Standard; §3 Document Lifecycle Statuses; §4 Mandatory Cross-Reference Links; §5 Conventions Table; §6 Self-Review Checklist.
- **References**: `agents/rules/CREATE_FOLDER_STRUCTURE_TEMPLATE.md`, `agents/rules/MD_CONVENTION.md`.
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-10-02T22:52:40+07:00

---

## Table of Contents

- [1. Required Header Specification (7 Fields)](#1-required-header-specification-7-fields)
- [2. Markdown Update-Timestamp Standard](#2-markdown-update-timestamp-standard)
- [3. Document Lifecycle Statuses](#3-document-lifecycle-statuses)
- [4. Mandatory Cross-Reference Links](#4-mandatory-cross-reference-links)
- [5. Conventions](#5-conventions)
- [6. Self-Review Before Finalizing](#6-self-review-before-finalizing)

---

## 1. Required Header Specification (7 Fields)

Every Markdown file created or updated in this repository MUST start with the standard 7-field header block in exact order:

```markdown
# <Title>

- **Motivation/Background**: 1–3 sentences — why this doc exists.
- **Purpose**: one sentence — what this doc achieves.
- **Overview Pipeline**: 1–2 sentences — the process that produced this content.
- **Detailed Plan**: compact list of sections/subsections and what each covers.
- **References**: comma-separated libraries/tools/frameworks/rules used.
- **Created**: YYYY-MM-DDTHH:MM:SS±HH:MM (ISO 8601 with explicit timezone offset)
- **Last Updated**: YYYY-MM-DDTHH:MM:SS±HH:MM (ISO 8601 with explicit timezone offset)

---
```

---

## 2. Markdown Update-Timestamp Standard

### Exact Rules

1. **Format:** Standard ISO 8601 extended format with explicit timezone offset: `YYYY-MM-DDTHH:MM:SS±HH:MM` (e.g. `2026-09-06T20:55:00+07:00`).
2. **Timezone Convention:** Use the local project timezone offset (e.g. `+07:00` or UTC `Z`). Never omit the timezone designator.
3. **Creation Timestamp (`Created`):** Set once when the file is created. Never modified afterwards.
4. **Update Timestamp (`Last Updated`):**
   - Must be updated **every time** the file is edited or touched by an agent or human.
   - Any agent performing modifications to a `.md` file is strictly required to refresh `Last Updated` to the current execution time.
5. **Handling Existing Markdown Files Without Timestamps:**
   - When an agent encounters an older `.md` file lacking timestamp fields, the agent **must not** blindly overwrite the file just to add timestamps.
   - However, when the agent is legitimately modifying or updating an existing `.md` file as part of a task, it **must backfill** both `Created` (estimated from git history or set to current timestamp) and `Last Updated` (current execution time).

---

## 3. Document Lifecycle Statuses

For documents that track plans, audits, bug fixes, or phase specifications, include a lifecycle badge or status line directly beneath the header:

- `[STATUS: DRAFT]` — Initial proposal under active creation.
- `[STATUS: ACTIVE]` — Current authoritative source of truth for implementation.
- `[STATUS: COMPLETED]` — Milestone, experiment, or task successfully completed and verified.
- `[STATUS: SUPERSEDED by <relative_link>]` — Retained for historical provenance, but replaced by a newer specification.
- `[STATUS: ARCHIVED]` — Preserved historical record, no longer maintained.

---

## 4. Mandatory Cross-Reference Links

- **Whenever a file, module, notebook, rule, or artifact path is mentioned in AI-generated Markdown, it MUST be a working cross-reference link** — never bare text. This prevents silent path rot and documentation drift.
- **Link Formats:**
  - Same tree / relative link: `src/training/train_model.py`, `notebooks/01_eda.ipynb`.
  - Section jumps: `agents/rules/LOGGING_CHECKPOINT_RULES.md#5-resume-procedure`.
  - External documentation: canonical URLs (`https://pytorch.org/docs/...`).
  - Canonical Model/Dataset Hubs: Direct markdown links to model repositories (e.g. Hugging Face [`distilbert-base-uncased`](https://huggingface.co/distilbert-base-uncased)) or official dataset sites.

---

## 5. Conventions

| Rule | Requirement |
| :--- | :--- |
| **Header Timestamps** | Mandatory `Created` and `Last Updated` in ISO 8601 (`YYYY-MM-DDTHH:MM:SS±HH:MM`). |
| **Single-variable principle** | One changed factor per experiment; explicitly state what is held constant. |
| **Cross-reference links** | Mandatory relative markdown links for all code, notebook, config, and doc paths. |
| **Output dirs** | `experiments/runs/<ts>_<run>/` (run state), `experiments/results/<experiment>/` (consolidated outputs). |
| **Notebook headers** | Follow `NOTEBOOK_HEADER_CONVENTION.md` including `## References` and timestamp. |
| **Results (5W1H)** | Every reported metric carries full 5W1H context per `RESULTS_REPORTING.md`. |
| **Separators** | `---` after header and between major sections. |

---

## 6. Self-Review Before Finalizing

- [ ] All 7 required header fields present (including `Created` and `Last Updated`).
- [ ] `Last Updated` timestamp refreshed to current time.
- [ ] Table of Contents anchors resolve cleanly.
- [ ] Every file, notebook, script, and directory mention is an active, working relative link.
- [ ] Document lifecycle status indicated if applicable (e.g. active vs superseded).
- [ ] No stale, hardcoded paths copied from other projects.

---

## Codex — Xác nhận đã đọc và cam kết áp dụng

- **Người ký**: Codex, agent chính `/root`.
- **Thời điểm ký**: 2026-10-02T22:52:40+07:00.
- **Tài liệu đã đọc**: [MD_CONVENTION.md](MD_CONVENTION.md), toàn bộ nội dung, từng mục và checklist.
- **SHA-256 bản đã đọc trước khi thêm chữ ký và cập nhật thời gian**: `570868d001235fcd244cf382b0f65678ef1843980c9b33e4b909a77b95dca83d`.
- **Cam kết**: Tôi đã đọc, hiểu và sẽ áp dụng các yêu cầu của tài liệu này trong các tác vụ thuộc phạm vi của nó. Tôi sẽ đối chiếu rule trước khi hành động, báo rõ xung đột hoặc điểm chưa xác định, và không tự ý bỏ qua hay sửa quy tắc. Việc áp dụng tuân theo thứ tự ưu tiên của chỉ dẫn hệ thống, developer và yêu cầu người dùng.
- **Phạm vi xác nhận**: Chữ ký văn bản ghi nhận việc đã đọc trong phiên hiện tại; không phải chữ ký số, chứng nhận mọi thay đổi trước đây đã tuân thủ, hoặc bảo đảm không bao giờ có sai sót. Việc ghi nhớ ở phiên sau dựa trên tài liệu lưu trong repository và yêu cầu đọc lại.
- **Truyền đạt**: Agent được giao việc phải đọc trực tiếp toàn bộ rule và xác nhận trước khi thực hiện; xem [hướng dẫn khởi đầu](../../AGENTS.md) và [biên bản tiếp nhận](../../docs/shared/RULES_ACKNOWLEDGMENT.md).

**Đã ký: Codex — `/root`**
