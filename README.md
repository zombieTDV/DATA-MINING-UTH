# UTH Data Mining: AI/ML/Data Science Paper Mining & Analysis

- **Motivation/Background**: This repository hosts the coursework and research pipeline for the UTH Data Mining curriculum, ported from deep learning and machine learning engineering templates into an end-to-end data mining architecture.
- **Purpose**: Serve as the central entry point, architecture map, collection strategy, and execution manual for crawling, preparing, and analyzing scientific literature in AI, Machine Learning, and Data Science.
- **Overview Pipeline**: Adheres to CRISP-DM and KDD methodologies spanning automated paper harvesting/crawling, immutable raw storage, 6-dimension data quality audits, feature engineering, and exploratory data mining.
- **Detailed Plan**: §1 Project Topic & Scope; §2 Architecture Overview; §3 Repository Structure; §4 Installation & Setup; §5 Testing; §6 Governance & Rules.
- **References**: [agents/rules/AGENT_AI.md](agents/rules/AGENT_AI.md), [agents/rules/MD_CONVENTION.md](agents/rules/MD_CONVENTION.md), [docs/references/ML_PIPELINE_REFERENCE_v4.md](docs/references/ML_PIPELINE_REFERENCE_v4.md).
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-09-30T12:10:47+07:00

---

## 🎯 Project Topic & Scope: AI/ML/Data Science Paper Mining

This project focuses on **crawling, harvesting, and mining scientific paper data** across the domains of Artificial Intelligence (AI), Machine Learning (ML), and Data Science:

- **Data Acquisition & Harvesting:**
  - Automated crawling and ingestion of academic paper metadata, titles, abstracts, author networks, publication timestamps, and category tags from open scientific preprint archives and scholarly APIs (e.g. arXiv, OpenAlex, Semantic Scholar).
  - Enforcing the **Immutable Raw Invariant**: All crawled payloads are vaulted directly into `data/raw/` with cryptographic SHA-256 provenance manifests before any processing.
- **Downstream Data Mining & Analysis (In Progress / Open Scope):**
  - Following the [Data Mining Pipeline Reference (v4.0)](docs/references/ML_PIPELINE_REFERENCE_v4.md), collected literature will be audited for quality, preprocessed, and analyzed.
  - The precise downstream analytic tasks remain open and flexible—ranging from topic modeling (LDA/BERTopic), keyword co-occurrence and association rule mining, author/citation network graph mining, to temporal research trend discovery.
  - Detailed task formulations and experiment specifications will be formalized incrementally in `docs/phases/` and `docs/experiments/`.

## 🏗️ Architecture Overview

Layered deep learning pipeline; each layer is a maintained `src/` package:

```mermaid
flowchart LR
    subgraph DATA["Data Layer (src/data)"]
        A1["transforms.py"] --> A2["dataloader.py"]
    end

    subgraph MODEL["Model Layer (src/models)"]
        B1["build_model.py"]
    end

    subgraph TRAIN["Training Layer (src/training) — scripts only"]
        C1["<task>_train.py (CLI entry point)"]
        C2["train_model.py (loop, full-state checkpoints, resume)"]
        C3["run_logger.py (real-time progress, logs, JSONL)"]
    end

    subgraph EVAL["Evaluation Layer (src/eval)"]
        D1["evaluate_model.py"]
    end

    subgraph EXP["Experiment Layer (src/experiments)"]
        E1["experiment runners + analysis"]
    end

    subgraph OUT["Artifacts (experiments/)"]
        F1["runs/<ts>_<run>/ checkpoints + logs + metrics"]
        F2["results/ (JSON, NPZ) + plots/"]
    end

    subgraph NB["Analysis (notebooks/) — demos & viz only"]
        G1["<analysis>.ipynb"]
    end

    A2 --> B1 --> C1 --> C2 --> C3
    C1 -->|"best/last checkpoints"| F1
    C2 -->|"history JSONL + config"| F1
    E1 -->|"loads checkpoints"| F1
    E1 -->|"artifacts"| F2
    D1 -->|"test metrics"| F2
    NB -->|"reads artifacts"| F1
    NB -->|"reads artifacts"| F2
    NB -->|"references"| GOV["agents/ (constitutional rules)"]
```

Key engineering guarantees:
- **Script-Only Training:** All training loops live in `src/training/*.py` or `src/experiments/*.py`. Notebooks never train.
- **Full-State Resumability:** Runs persist model, optimizer, scheduler, RNG state, config, and metrics per [agents/rules/LOGGING_CHECKPOINT_RULES.md](agents/rules/LOGGING_CHECKPOINT_RULES.md).
- **5W1H Empirical Context:** Every reported metric carries full 5W1H context per [agents/rules/RESULTS_REPORTING.md](agents/rules/RESULTS_REPORTING.md).
- **Strict Separation of Governance vs Memory:** Immutable constitutional rules live in [`agents/`](agents/), while evolving research notes, phase specifications, and experiment logs live in [`docs/`](docs/).

---

## 📁 Repository Structure

The template supports both **Single-Track** (default monolithic layout shown below) and **Multi-Track / Feature-Modular** layouts (for multi-lab coursework or modular research tracks). See [agents/rules/CREATE_FOLDER_STRUCTURE_TEMPLATE.md](agents/rules/CREATE_FOLDER_STRUCTURE_TEMPLATE.md) for full principles and placement rules.

```text
Uth-Data-Mining/
├── agents/                    # Constitutional AI Governance (Immutable rules & templates)
│   ├── README.md              # Governance navigation guide
│   ├── rules/                 # Binding standards (AGENT_AI, FOLDER_STRUCTURE, MD, etc.)
│   └── templates/             # Reusable skeletons (BUG, AUDIT, EXP, PHASE, PROGRESS)
│
├── docs/                      # Evolving Project Research & Memory (Global)
│   ├── README.md              # Master research index
│   ├── PURPOSE.md             # Project brief & locked success criteria
│   ├── OVERVIEW.md            # Living roadmap indexing all tracks/phases
│   ├── shared/                # Universal SOPs (HOW_TO_SETUP_AI_AGENT, HANDOFF_TEMPLATE)
│   ├── phases/                # Pipeline phase technical specifications
│   ├── progress/              # Live phase status tracking (*_STATUS.md)
│   ├── experiments/           # Experiment plans and comparative writeups
│   ├── bugs/                  # Resolved and active bug reports
│   └── references/            # Reusable technical guides (Git, Optuna, etc.)
│
├── configs/                   # Configuration files (YAML)
│   └── config.yaml.example    # Configuration skeleton
│
├── data/                      # Dataset assets (ignored in git)
│   ├── raw/                   # Immutable raw inputs (never written by scripts)
│   └── processed/             # Cleaned splits and extracted features
│
├── src/                       # Maintained Python packages (or partitioned into tracks/)
│   ├── data/                  # Loading, transforms, dataloaders
│   ├── models/                # Neural network architectures
│   ├── training/              # Script-only training entry points
│   ├── eval/                  # Evaluation metrics & benchmark tables
│   ├── experiments/           # One-shot experiment runners
│   └── utils/                 # Logging, checkpoints, telemetry
│
├── notebooks/                 # Exploratory analysis & demo notebooks (NEVER train)
│
├── experiments/               # Experiment runtime outputs (runs/ & results/ gitignored)
│   ├── runs/<ts>_<run>/       # checkpoints/ logs/ metrics/ tensorboard/
│   └── results/               # Consolidated metrics & export plots
│
├── requirements/              # Multi-tier dependency specs (base.txt, dev.txt)
├── requirements.txt           # Unified dependency proxy (-r requirements/dev.txt)
├── pyproject.toml             # Build system & package discovery config
└── tests/                     # Unit and integration test suite
```

> [!TIP]
> **Multi-Track / Feature-Modular Projects:** When work naturally divides into distinct labs, features, or research questions, code, tests, configs, and experiment specs can be **colocated** within that unit (e.g. `tracks/<name>/` or `labs/<name>/`), while keeping `/agents`, global roadmap (`docs/OVERVIEW.md`), and base dependencies centralized.


---

## ⚙️ Installation & Setup

### 1. Environment Creation

```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Dependency Installation

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Standard / CPU Installation
pip install -r requirements.txt
pip install -e .

# Optional: NVIDIA GPU Workstations (CUDA 13.0 wheels)
# pip install torch torchvision --index-url https://download.pytorch.org/whl/cu130
# pip install -r requirements.txt
# pip install -e .
```

---

## 🧪 Testing & Verification

Run the test battery:
```bash
pytest tests/ -v -m "not gpu"
ruff check src tests
python -c "import src; print('Package import verified!')"
```

---

## 📜 Governance & Workflow

- AI agents adhere to the 6-stage lifecycle: `AUDIT → PLAN → IMPLEMENT → VERIFY → COMMIT → MERGE` ([agents/rules/AGENT_AI.md](agents/rules/AGENT_AI.md)).
- Setup procedures are codified in [docs/shared/HOW_TO_SETUP_AI_AGENT.md](docs/shared/HOW_TO_SETUP_AI_AGENT.md).
- Inter-agent checkpoints follow [docs/shared/HANDOFF_TEMPLATE.md](docs/shared/HANDOFF_TEMPLATE.md).
