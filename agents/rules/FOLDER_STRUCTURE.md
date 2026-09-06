# FOLDER_STRUCTURE.md — Canonical Repository Directory Layout

- **Motivation/Background**: Unclear directory boundaries between universal governance, stage-specific research notes, runtime outputs, and modular packages cause severe architectural drift and expensive consolidation rework.
- **Purpose**: Serve as the immutable single source of truth for repository directory layout, file ownership, runtime artifact segregation, and the strict boundary between `/agents` (universal governance) and `/docs` (evolving research memory).
- **Overview Pipeline**: Derived from project consolidation lessons learned and codified as a permanent governance rule.
- **Detailed Plan**: §1 Canonical Directory Architecture; §2 Strict Layer Ownership & Rules; §3 Runtime Directory Namespacing; §4 Audit & Enforcement Protocol.
- **References**: `agents/rules/CODEBASE_AUDIT.md`, `agents/rules/LOGGING_CHECKPOINT_RULES.md`.
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-09-06T20:55:00+07:00

---

## Table of Contents

- [1. Canonical Directory Architecture](#1-canonical-directory-architecture)
- [2. Strict Layer Ownership & Rules](#2-strict-layer-ownership--rules)
- [3. Runtime Directory Namespacing & Git-Keep Sentinel Rules](#3-runtime-directory-namespacing--git-keep-sentinel-rules)
- [4. Audit & Enforcement Protocol](#4-audit--enforcement-protocol)

---

## 1. Canonical Directory Architecture

```text
project_root/
├── agents/                                # CONSTITUTIONAL AI GOVERNANCE (Immutable across phases)
│   ├── README.md                          # Guide to repository agent constitution
│   ├── rules/                             # Binding standards the AI agent MUST consistently follow
│   │   ├── AGENT_AI.md                    # Core behavior layer, prompting rules & workflow
│   │   ├── CODEBASE_AUDIT.md              # Drift audit procedure & gate
│   │   ├── FOLDER_STRUCTURE.md            # Canonical repository directory layout (this file)
│   │   ├── LOGGING_CHECKPOINT_RULES.md    # Script-only training & full-state checkpoint rules
│   │   ├── MD_CONVENTION.md               # Markdown formatting, timestamps & clickable link rules
│   │   ├── NAMING_CONVENTION.md           # File, code, and experiment naming rules
│   │   ├── NOTEBOOK_HEADER_CONVENTION.md  # Standardized notebook first-cell headers
│   │   ├── PYTORCH_FRAMEWORK_RULES.md     # PyTorch device/seed/VRAM/eval rules
│   │   └── RESULTS_REPORTING.md           # 5W1H empirical reporting protocol
│   └── templates/                         # Standardized document skeletons
│       ├── BUG_TEMPLATE.md                # Bug report skeleton
│       ├── CODEBASE_AUDIT_TEMPLATE.md     # Audit report skeleton
│       ├── EXPERIMENT_TEMPLATE.md         # Experiment report skeleton
│       ├── PHASE_DOC_TEMPLATE.md          # Pipeline phase specification skeleton
│       ├── PROGRESS_STATUS_TEMPLATE.md    # Phase progress tracking skeleton
│       ├── PROJECT_ROADMAP_TEMPLATE.md    # Milestone & execution roadmap skeleton
│       └── SMOKE_TEST_CHECKLIST.md        # Pre-execution verification checklist
│
├── docs/                                  # EVOLVING PROJECT RESEARCH & STAGE DOCUMENTATION
│   ├── README.md                          # Master index of project research documentation
│   ├── shared/                            # Universal reference manuals, SOPs, and handoffs
│   │   ├── HOW_TO_SETUP_AI_AGENT.md       # Step-by-step agent workflow setup SOP
│   │   ├── ML_PIPELINE_REFERENCE_v3.md    # 18-step ML engineering reference guide
│   │   ├── OPTUNA_DB_GUIDE.md             # Optuna SQLite analysis and export guide
│   │   ├── GIT_AND_RELEASE_BEST_PRACTICES.md # Git commits, CI, and release management SOP
│   │   └── HANDOFF_TEMPLATE.md            # Inter-agent task handoff specification
│   ├── phases/                            # Active & completed pipeline phase specifications
│   ├── progress/                          # Live task & phase progress status files (*_STATUS.md)
│   ├── experiments/                       # Experiment plans, hypothesis notes & empirical reports
│   └── bugs/                              # Resolved & active bug reports
│
├── src/                                   # MAINTAINED PYTHON PACKAGE SOURCE CODE
│   ├── __init__.py                        # Root package definition (importable as `src.*`)
│   ├── data/                              # Data loading, cleaning, transforms, dataset definitions
│   ├── models/                            # Model architectures & neural network definitions
│   ├── training/                          # Script-only training entry points & CLI loops
│   ├── eval/                              # Evaluation scripts, metrics computation, benchmark tables
│   ├── experiments/                       # One-shot experiment runners & analysis scripts
│   └── utils/                             # Common utilities (logging, checkpoints, resource monitors)
│
├── notebooks/                             # INTERACTIVE ANALYSIS & PEDAGOGICAL NOTEBOOKS
│   └── *.ipynb                            # Verification, demos, visualizations (NEVER runs training)
│
├── configs/                               # EXPERIMENT & DATA PIPELINE CONFIGURATIONS
│   └── *.yaml                             # Hyperparameters, split configs, paths
│
├── data/                                  # DATA ASSETS (strictly ignored in git, except .gitkeep)
│   ├── raw/                               # Raw immutable source data (never modified by scripts)
│   └── processed/                         # Generated features, cached tokens, processed splits
│
├── experiments/                           # RUNTIME ARTIFACTS & EXPERIMENT OUTPUTS
│   ├── runs/                              # Runtime outputs (<ts>_<run_name>/{checkpoints,logs,metrics})
│   └── results/                           # Consolidated reports, exported JSONs, high-res plots
│
├── requirements/                          # MULTI-TIER DEPENDENCY ARCHITECTURE
│   ├── base.txt                           # Core scientific & PyTorch foundation (CPU/universal)
│   ├── feature.txt                        # Task-specific dependencies (e.g. transformers, cleanlab)
│   └── dev.txt                            # Complete developer environment (pytest, ruff, mypy)
├── requirements.txt                       # Root convenience proxy (-r requirements/dev.txt)
├── pyproject.toml                         # Canonical PEP 517/518 build & tool configuration
└── tests/                                 # UNIT & INTEGRATION TEST BATTERY
    ├── conftest.py                        # Global pytest fixtures, synthetic mocks, CPU guards
    └── test_*.py                          # Lightweight unit & integration tests
```

---

## 2. Strict Layer Ownership & Rules

### A. The Separation of `/agents` vs `/docs`
1. **`/agents` is Constitutional:** Contains **only universal rules and document templates**. It does NOT change between project phases or experiments. Never store experiment results, bug reports, or phase progress in `/agents`.
2. **`/docs` is the Evolving Research Memory:** All project-specific documents belong in `/docs`:
   - `/docs/phases/`: Technical phase specifications.
   - `/docs/progress/`: Dynamic progress tracking (`<PHASE>_STATUS.md`).
   - `/docs/experiments/`: Empirical logs and hypothesis test writeups.
   - `/docs/bugs/`: Bug diagnoses and post-mortems.
   - `/docs/shared/`: Shared SOP manuals and handoff documents.

### B. Code and Notebook Rules
1. **No Training in Notebooks:** Notebooks are strictly for exploration, visualization, and demonstration. Training must execute from CLI scripts under `src/training/` or `src/experiments/`.
2. **Package Namespacing:** Code under `src/` must be importable as a standard package (`import src.data...`).
3. **Immutability of Raw Data:** Scripts must never write into `data/raw/`.

---

## 3. Runtime Directory Namespacing & Git-Keep Sentinel Rules

1. **Clean Root Protection:**
   - Generated model weights, training checkpoints, logs, and metrics must NEVER be saved to the repository root or flat inside `src/`.
   - All runtime execution outputs MUST resolve to `experiments/runs/<ts>_<run_name>/` or `experiments/results/`.
2. **Version Control Protection (`.gitignore`):**
   - All runtime runs (`experiments/runs/*`), checkpoints (`*.pt`, `*.bin`), processed data, and caches must be ignored.
   - Sentinel `.gitkeep` files must be committed to keep runtime directories present across fresh checkouts.

---

## 4. Audit & Enforcement Protocol

- Before beginning work, agents must execute the procedure in [agents/rules/CODEBASE_AUDIT.md](CODEBASE_AUDIT.md) to ensure the current tree matches this layout.
- Any discrepancy between the filesystem and this document represents an actionable finding that must be resolved before proceeding with development.
