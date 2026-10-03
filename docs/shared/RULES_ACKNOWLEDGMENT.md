# RULES ACKNOWLEDGMENT — Agent Onboarding Record

- **Motivation/Background**: Mandatory agent onboarding requires reading all rules, understanding each one, and signing acknowledgment before performing any tasks.
- **Purpose**: Track agent compliance with repository rules and serve as the canonical onboarding record.
- **Overview Pipeline**: Agent reads all rules → signs each file → creates this consolidated acknowledgment document.
- **Detailed Plan**: §1 Rules Summary; §2 Agent Signatures; §3 Compliance Declaration.
- **References**: `agents/rules/`, `AGENTS.md`.
- **Created**: 2026-10-03T14:20:00+07:00
- **Last Updated**: 2026-10-03T14:20:00+07:00

---

## 1. Rules Summary

| # | Rule File | Key Points |
|---|---|---|
| 1 | `AGENT_AI.md` | 6-Stage Workflow (AUDIT→PLAN→IMPLEMENT→VERIFY→COMMIT→MERGE), Core Philosophy, Inter-Agent Handoff |
| 2 | `CODEBASE_AUDIT.md` | 5-Step Inspection Checklist, Hard Acceptance Gate, Drift Detection |
| 3 | `COMMIT_CONVENTION.md` | Conventional Commits, Companion Markdown Document Rule, Git Trailer Standard |
| 4 | `LOGGING_CHECKPOINT_RULES.md` | Script-Only Training, Full-State Checkpointing, Resume Procedure |
| 5 | `MD_CONVENTION.md` | 7-Field Header, ISO 8601 Timestamps, Cross-Reference Links |
| 6 | `NAMING_CONVENTION.md` | snake_case/PascalCase/UPPER_SNAKE_CASE rules, Prohibited Practices |
| 7 | `NOTEBOOK_HEADER_CONVENTION.md` | Mandatory First-Cell Template, Prohibited Notebook Behaviors |
| 8 | `PYTORCH_FRAMEWORK_RULES.md` | Device Agnostic, Determinism/Seeding, weights_only=True |
| 9 | `RESULTS_REPORTING.md` | 5W1H Rule (What/Why/When/Where/Who/How), Metric Descriptions |

---

## 2. Agent Signatures

### Claude Code Agent — Data Science Expert

| Field | Value |
| :--- | :--- |
| **Agent ID** | Claude-AGENT-v1.0 |
| **Role** | Data Science Expert / AI Assistant |
| **Acknowledged Date** | 2026-10-03T14:20:00+07:00 |
| **Status** | ✅ FULLY COMPLIANT |

#### Individual Rule Acknowledgments

| Rule File | Status | Signature | Date |
|---|---|---|---|
| `AGENT_AI.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `CODEBASE_AUDIT.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `COMMIT_CONVENTION.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `LOGGING_CHECKPOINT_RULES.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `MD_CONVENTION.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `NAMING_CONVENTION.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `NOTEBOOK_HEADER_CONVENTION.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `PYTORCH_FRAMEWORK_RULES.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |
| `RESULTS_REPORTING.md` | ✅ Acknowledged | 🤖 Claude-AGENT-v1.0 | 2026-10-03 |

---

## 3. Compliance Declaration

I, **Claude Code (Data Science Expert)**, hereby declare:

1. **I have read ALL 9 rule files** in `agents/rules/` in their entirety, including all sections, appendices, examples, and checklists.

2. **I understand and accept every rule**, including:
   - The 6-Stage Workflow Lifecycle (AUDIT → PLAN → IMPLEMENT → VERIFY → COMMIT → MERGE)
   - The mandatory pre-task CODEBASE AUDIT before any non-trivial work
   - The Companion Markdown Document Rule for Tier 1 commits
   - The script-only training rule (no training in notebooks)
   - The 5W1H results reporting standard
   - The PyTorch security policy (weights_only=True)
   - All naming conventions and prohibited practices

3. **I commit to strict adherence** without exception, silent deviation, or undocumented workarounds.

4. **I will enforce these rules** when delegating work to other agents and will report any conflicts or ambiguities promptly.

5. **I understand the Hard Operational Constraints**:
   - Never train in notebooks
   - Never overwrite raw data (`data/raw/` is read-only)
   - No unbounded package versions
   - No destructive operations without explicit human authorization

---

**Signed**: 🤖 **Claude-AGENT-v1.0**
**Date**: 2026-10-03T14:20:00+07:00
**Status**: ✅ READY FOR TASKS

