# PYTORCH_FRAMEWORK_RULES.md — PyTorch Architecture & Device Governance

- **Motivation/Background**: Deep learning codebases fail across heterogeneous team hardware when device placement is hardcoded, seeds are omitted, VRAM ceilings are ignored, or checkpoints are loaded insecurely.
- **Purpose**: Define universal PyTorch engineering standards, device-agnostic execution rules, seeding protocols, and security practices.
- **Overview Pipeline**: Enforced across all model definitions (`src/models/`), dataloaders (`src/data/`), training loops (`src/training/`), and evaluations (`src/eval/`).
- **Detailed Plan**: §1 Device Agnostic Execution & VRAM Targets; §2 Determinism & Seeding; §3 Safe Checkpoint Serialization (`weights_only=True`); §4 Compliance Checklist.
- **References**: `torch`, `torch.utils.data`, `agents/rules/LOGGING_CHECKPOINT_RULES.md`.
- **Created**: 2026-08-01T00:00:00+07:00
- **Last Updated**: 2026-10-02T22:52:40+07:00

---

## Table of Contents

- [1. Device Agnostic Execution & VRAM Targets](#1-device-agnostic-execution--vram-targets)
- [2. Determinism & Seeding Protocol](#2-determinism--seeding-protocol)
- [3. Safe Checkpoint Serialization](#3-safe-checkpoint-serialization)
- [4. Training Telemetry & Monitoring](#4-training-telemetry--monitoring)
- [5. PyTorch Compliance Checklist](#5-pytorch-compliance-checklist)

---

## 1. Device Agnostic Execution & VRAM Targets

1. **Dynamic Device Selection:**
   Never hardcode `"cuda"` or `"cuda:0"`. Always select the device dynamically:
   ```python
   device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
   ```
2. **Headless & CI Execution:**
   All models, dataloaders, and tests must be fully capable of executing on CPU without CUDA available.
3. **VRAM Ceilings & Mixed Precision:**
   - Design default configurations for modest GPU budgets (e.g. ≤4GB VRAM ceiling).
   - Use mixed precision (`torch.cuda.amp.autocast()` or `torch.amp.autocast('cuda')`) where applicable.
   - Use gradient accumulation when large effective batch sizes are required.

---

## 2. Determinism & Seeding Protocol

All training entry points and deterministic experiments must invoke a canonical seeding function:

```python
import random
import numpy as np
import torch

def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
```

---

## 3. Safe Checkpoint Serialization

1. **Security Policy:**
   Always load model weights with `weights_only=True` to prevent arbitrary code execution vulnerabilities:
   ```python
   checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
   ```
2. **Full-State Serialization:**
   Checkpoints must save complete training state (`model_state_dict`, `optimizer_state_dict`, `scheduler_state_dict`, `epoch`, `global_step`, `rng_state`, `config`) per [agents/rules/LOGGING_CHECKPOINT_RULES.md](LOGGING_CHECKPOINT_RULES.md).

---

## 4. Training Telemetry & Monitoring

- Training loops should integrate real-time logging (e.g. TensorBoard or structured JSONL history).
- Log directories must be nested under `experiments/runs/<ts>_<run_name>/`.
- Evaluation must explicitly disable gradient computation (`@torch.no_grad()` or `with torch.no_grad():`) and set models to `.eval()`.

---

## 5. PyTorch Compliance Checklist

- [ ] Device selected dynamically via `torch.device`.
- [ ] Seeds initialized using `set_seed()`.
- [ ] All `torch.load` calls explicitly enforce `weights_only=True`.
- [ ] No CUDA assumption in test suites or base utility modules.
- [ ] Evaluation passes use `model.eval()` and `torch.no_grad()`.

---

## Codex — Xác nhận đã đọc và cam kết áp dụng

- **Người ký**: Codex, agent chính `/root`.
- **Thời điểm ký**: 2026-10-02T22:52:40+07:00.
- **Tài liệu đã đọc**: [PYTORCH_FRAMEWORK_RULES.md](PYTORCH_FRAMEWORK_RULES.md), toàn bộ nội dung, từng mục và checklist.
- **SHA-256 bản đã đọc trước khi thêm chữ ký và cập nhật thời gian**: `cffd8ee05a4a057b344cf1d17224b8c1388b8c8ef250783cb5aa8e1d930d763a`.
- **Cam kết**: Tôi đã đọc, hiểu và sẽ áp dụng các yêu cầu của tài liệu này trong các tác vụ thuộc phạm vi của nó. Tôi sẽ đối chiếu rule trước khi hành động, báo rõ xung đột hoặc điểm chưa xác định, và không tự ý bỏ qua hay sửa quy tắc. Việc áp dụng tuân theo thứ tự ưu tiên của chỉ dẫn hệ thống, developer và yêu cầu người dùng.
- **Phạm vi xác nhận**: Chữ ký văn bản ghi nhận việc đã đọc trong phiên hiện tại; không phải chữ ký số, chứng nhận mọi thay đổi trước đây đã tuân thủ, hoặc bảo đảm không bao giờ có sai sót. Việc ghi nhớ ở phiên sau dựa trên tài liệu lưu trong repository và yêu cầu đọc lại.
- **Truyền đạt**: Agent được giao việc phải đọc trực tiếp toàn bộ rule và xác nhận trước khi thực hiện; xem [hướng dẫn khởi đầu](../../AGENTS.md) và [biên bản tiếp nhận](../../docs/shared/RULES_ACKNOWLEDGMENT.md).

**Đã ký: Codex — `/root`**
