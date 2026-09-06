# CODEBASE_AUDIT.md — Drift Audit Procedure & Acceptance Gate

- **Motivation/Background**: In multi-stage projects, documentation, configuration, and implementation rapidly diverge. Building upon outdated documentation or false assumptions causes compounding errors and expensive refactoring.
- **Purpose**: Define the mandatory pre-task codebase audit checklist to catch drift between documentation claims and physical repository state before performing non-trivial modifications.
- **Overview Pipeline**: Executed at the start of a session or prior to any multi-file refactor.
- **Detailed Plan**: §1 Audit Scope; §2 Five-Step Inspection Checklist; §3 Output Format; §4 Hard Acceptance Gate; §5 Audit Lifecycle & Logging.
- **References**: `agents/rules/FOLDER_STRUCTURE.md`, `agents/templates/CODEBASE_AUDIT_TEMPLATE.md`.
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-09-06T20:55:00+07:00

---

## Table of Contents

- [1. Audit Scope & Trigger Points](#1-audit-scope--trigger-points)
- [2. Five-Step Inspection Checklist](#2-five-step-inspection-checklist)
- [3. Output Format](#3-output-format)
- [4. Hard Acceptance Gate](#4-hard-acceptance-gate)
- [5. Audit Lifecycle & Archiving](#5-audit-lifecycle--archiving)

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

1. **Filesystem vs FOLDER_STRUCTURE.md:**
   - List files in `src/`, `tests/`, `configs/`, and `docs/`. Compare against [agents/rules/FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md).
   - Identify any unversioned, undocumented files or stale directory layouts.
2. **Import & Module Integrity:**
   - Inspect package imports across `src/` and `tests/`.
   - Ensure all internal imports resolve via the canonical package name (e.g. `from src.data...` or `from src.labX...`).
   - Flag deprecated, un-namespaced, or circular imports.
3. **Artifact Claims vs Reality:**
   - Cross-check claims in status reports (`docs/progress/*_STATUS.md`).
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

## 5. Audit Lifecycle & Archiving

- Routine pre-task audit summaries are output directly to the conversation.
- Formal milestone or pre-merge audit reports generated from [agents/templates/CODEBASE_AUDIT_TEMPLATE.md](../templates/CODEBASE_AUDIT_TEMPLATE.md) must be saved into `docs/shared/AUDIT_<TOPIC>.md` with active ISO 8601 timestamps.
