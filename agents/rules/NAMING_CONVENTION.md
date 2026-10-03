# NAMING_CONVENTION.md — Naming Standards for Files, Code & Experiments

- **Motivation/Background**: Arbitrary or inconsistent naming schemes break automated test discovery, module imports, and experiment artifact tracking across sessions.
- **Purpose**: Define strict naming rules for Python files, modules, classes, functions, notebooks, configs, and experiment runs.
- **Overview Pipeline**: Applied whenever creating or refactoring files in the repository.
- **Detailed Plan**: §1 File & Directory Naming; §2 Code Identifiers; §3 Experiment & Run Identifiers; §4 Prohibited Practices.
- **References**: `agents/rules/CREATE_FOLDER_STRUCTURE_TEMPLATE.md`.
- **Created**: 2026-07-25T00:00:00+07:00
- **Last Updated**: 2026-10-02T22:52:40+07:00

---

## Table of Contents

- [1. Files & Directories](#1-files--directories)
- [2. Code Identifiers](#2-code-identifiers)
- [3. Experiments & Runs](#3-experiments--runs)
- [4. Prohibited Practices](#4-prohibited-practices)

---

## 1. Files & Directories

- **Python Scripts & Modules:** `snake_case.py` (e.g. `train_model.py`, `dataloader.py`).
- **Tests:** `test_<module_name>.py` (e.g. `test_transforms.py`, `test_loaders.py`).
- **Notebooks:** `NN_<short_purpose>.ipynb` (e.g. `01_data_exploration.ipynb`, `02_baseline_evaluation.ipynb`).
- **Documentation:** `UPPER_SNAKE_CASE.md` (e.g. `CREATE_FOLDER_STRUCTURE_TEMPLATE.md`, `DATA_PREPARATION.md`).
- **Configs:** `config.yaml` or `config_<feature_name>.yaml`.

---

## 2. Code Identifiers

- **Functions & Methods:** `snake_case`, verb-first (e.g. `load_dataset()`, `compute_metrics()`).
- **Classes:** `PascalCase` (e.g. `ResNetFeatureExtractor`, `IMDBCleanlabAuditor`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g. `IMAGENET_MEAN`, `DEFAULT_SEED`).
- **Private/Internal Helpers:** Leading underscore `_` (e.g. `_extract_features()`).

---

## 3. Experiments & Runs

- **Experiment Scripts:** `exp_<nn>_<description>.py` or `<task>_train.py`.
- **Run Directories:** `<YYYYMMDD_HHMMSS>_<run_name>` (e.g. `20260906_172000_resnet18_baseline`).
- **Checkpoint Files:** `<run_name>_best.pt` and `<run_name>_last.pt`.
- **Registry:** `registry.json` tracks `run_name -> latest_run_dir`.

---

## 4. Prohibited Practices

- Never invent ad-hoc naming conventions mid-project.
- Never rename existing public interfaces or modules without human approval.
- Never overwrite previous run directories; always mint a new timestamped directory.

---

## Codex — Xác nhận đã đọc và cam kết áp dụng

- **Người ký**: Codex, agent chính `/root`.
- **Thời điểm ký**: 2026-10-02T22:52:40+07:00.
- **Tài liệu đã đọc**: [NAMING_CONVENTION.md](NAMING_CONVENTION.md), toàn bộ nội dung, từng mục và checklist.
- **SHA-256 bản đã đọc trước khi thêm chữ ký và cập nhật thời gian**: `f3f3473be80cea517241467737aa7e57a00b5c6e67d194f3a24b1d85c8cb3bdd`.
- **Cam kết**: Tôi đã đọc, hiểu và sẽ áp dụng các yêu cầu của tài liệu này trong các tác vụ thuộc phạm vi của nó. Tôi sẽ đối chiếu rule trước khi hành động, báo rõ xung đột hoặc điểm chưa xác định, và không tự ý bỏ qua hay sửa quy tắc. Việc áp dụng tuân theo thứ tự ưu tiên của chỉ dẫn hệ thống, developer và yêu cầu người dùng.
- **Phạm vi xác nhận**: Chữ ký văn bản ghi nhận việc đã đọc trong phiên hiện tại; không phải chữ ký số, chứng nhận mọi thay đổi trước đây đã tuân thủ, hoặc bảo đảm không bao giờ có sai sót. Việc ghi nhớ ở phiên sau dựa trên tài liệu lưu trong repository và yêu cầu đọc lại.
- **Truyền đạt**: Agent được giao việc phải đọc trực tiếp toàn bộ rule và xác nhận trước khi thực hiện; xem [hướng dẫn khởi đầu](../../AGENTS.md) và [biên bản tiếp nhận](../../docs/shared/RULES_ACKNOWLEDGMENT.md).

**Đã ký: Codex — `/root`**
