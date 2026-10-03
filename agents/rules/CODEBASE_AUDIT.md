# CODEBASE_AUDIT.md — Drift Audit Procedure & Acceptance Gate

- **Motivation/Background**: In multi-stage projects, documentation, configuration, and implementation rapidly diverge. Building upon outdated documentation or false assumptions causes compounding errors and expensive refactoring.
- **Purpose**: Define the mandatory pre-task codebase audit checklist to catch drift between documentation claims and physical repository state before performing non-trivial modifications.
- **Overview Pipeline**: Executed at the start of a session or prior to any multi-file refactor.
- **Detailed Plan**: §1 Audit Scope; §2 Five-Step Inspection Checklist; §3 Output Format; §4 Hard Acceptance Gate; §5 Audit Lifecycle & Logging.
- **References**: `agents/rules/CREATE_FOLDER_STRUCTURE_TEMPLATE.md`, `agents/templates/CODEBASE_AUDIT_TEMPLATE.md`.
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-10-02T22:52:40+07:00

---

## Table of Contents

- [1. Audit Scope & Trigger Points](#1-audit-scope--trigger-points)
- [2. Five-Step Inspection Checklist](#2-five-step-inspection-checklist)
- [3. Output Format](#3-output-format)
- [4. Hard Acceptance Gate](#4-hard-acceptance-gate)
- [5. Audit Lifecycle & Finding Resolution](#5-audit-lifecycle--finding-resolution)

---

## 1. Audit Scope & Trigger Points

### When to Run:
- **Session Start:** Whenever an agent begins work in an existing or resumed repository.
- **Pre-Refactoring:** Before any refactoring touching multiple files or changing package structure.
- **Pre-Merge:** Prior to merging feature branches into `main`.

### When NOT to Run:
- Trivial, localized single-file edits or documentation typo fixes.

---

## 2. Five-Step Inspection Checklist

1. **Filesystem vs CREATE_FOLDER_STRUCTURE_TEMPLATE.md:**
   - List files in `src/`, `tests/`, `configs/`, and `docs/` (or track/unit directories). Compare against [agents/rules/CREATE_FOLDER_STRUCTURE_TEMPLATE.md](CREATE_FOLDER_STRUCTURE_TEMPLATE.md).
   - Identify any unversioned, undocumented files or stale directory layouts.
2. **Import & Module Integrity:**
   - Inspect package imports across `src/` and `tests/`.
   - Ensure all internal imports resolve via the canonical package name (e.g. `from src.data...` or `from src.labX...`).
   - Flag deprecated, un-namespaced, or circular imports.
3. **Artifact Claims vs Reality:**
   - Cross-check claims in status reports (`docs/progress/*_STATUS.md` or unit status files).
   - If a status doc claims training is complete, verify that the physical checkpoint file exists in `experiments/runs/` or `experiments/results/`.
4. **Naming & Convention Compliance:**
   - Check recently modified files against [agents/rules/NAMING_CONVENTION.md](NAMING_CONVENTION.md).
5. **Git Working Tree State:**
   - Verify `git status --short`. Note any untracked or unstaged changes before starting new work.

---

## 3. Output Format

Summarize findings as a concise, structured report:

```markdown
### Codebase Drift Audit Summary
- **Branch / Revision:** `<branch_name> (HEAD: <commit_hash>)`
- **Working Tree:** `[Clean | N unstaged files]`
- **Findings:**
  - ✅ FOLDER_STRUCTURE alignment: [Verified / Discrepancies noted]
  - ✅ Package imports: [Clean / Stale imports found]
  - ✅ Claimed artifacts: [Verified on disk / Missing]
- **Verdict:** `[CLEAN - PROCEED | DRIFT DETECTED - BLOCKED]`
```

---

## 4. Hard Acceptance Gate

**HARD RULE:** Do NOT proceed with the requested engineering task if critical discrepancies or unverified claims are discovered, until:
1. The drift is rectified in code/docs, OR
2. The human engineer explicitly acknowledges the finding and approves proceeding.

---

## 5. Audit Lifecycle & Finding Resolution

### Audit Archiving
- Routine pre-task audit summaries are output directly to the conversation.
- Formal milestone or pre-merge audit reports generated from [agents/templates/CODEBASE_AUDIT_TEMPLATE.md](../templates/CODEBASE_AUDIT_TEMPLATE.md) must be saved into `docs/shared/AUDIT_<TOPIC>.md` with active ISO 8601 timestamps.

### Individual Finding Resolution Status Vocabulary
Every finding listed in an audit report's **Findings Summary** must track its own remediation status:
- **`RESOLVED`**: The specific defect/risk has been completely remediated, validated by automated tests or physical inspection, and verified on disk.
- **`PARTIALLY RESOLVED`**: An interim mitigation, partial patch, or workaround has been applied, but remaining work or pending verification is required for complete resolution.
- **`NOT RESOLVED`**: The finding has been diagnosed and documented, but no corrective engineering action has yet been taken.

> [!NOTE]
> The finding status tracks whether **that specific finding** has been addressed, independent of whether the broader audit or milestone is complete.

---

## Codex — Xác nhận đã đọc và cam kết áp dụng

- **Người ký**: Codex, agent chính `/root`.
- **Thời điểm ký**: 2026-10-02T22:52:40+07:00.
- **Tài liệu đã đọc**: [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md), toàn bộ nội dung, từng mục và checklist.
- **SHA-256 bản đã đọc trước khi thêm chữ ký và cập nhật thời gian**: `2fba482ce75f133a06057803cff1bcf891098dbcf131fc2b8f57f52bf4bff8fb`.
- **Cam kết**: Tôi đã đọc, hiểu và sẽ áp dụng các yêu cầu của tài liệu này trong các tác vụ thuộc phạm vi của nó. Tôi sẽ đối chiếu rule trước khi hành động, báo rõ xung đột hoặc điểm chưa xác định, và không tự ý bỏ qua hay sửa quy tắc. Việc áp dụng tuân theo thứ tự ưu tiên của chỉ dẫn hệ thống, developer và yêu cầu người dùng.
- **Phạm vi xác nhận**: Chữ ký văn bản ghi nhận việc đã đọc trong phiên hiện tại; không phải chữ ký số, chứng nhận mọi thay đổi trước đây đã tuân thủ, hoặc bảo đảm không bao giờ có sai sót. Việc ghi nhớ ở phiên sau dựa trên tài liệu lưu trong repository và yêu cầu đọc lại.
- **Truyền đạt**: Agent được giao việc phải đọc trực tiếp toàn bộ rule và xác nhận trước khi thực hiện; xem [hướng dẫn khởi đầu](../../AGENTS.md) và [biên bản tiếp nhận](../../docs/shared/RULES_ACKNOWLEDGMENT.md).

**Đã ký: Codex — `/root`**
