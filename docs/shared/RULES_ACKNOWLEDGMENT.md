# Rules Acknowledgment & Agent Handoff

- **Motivation/Background**: Người dùng yêu cầu mọi agent đọc kỹ và tuân thủ bộ quy tắc trước khi làm việc.
- **Purpose**: Lưu yêu cầu tiếp nhận quy tắc để agent ở các phiên sau đọc lại.
- **Overview Pipeline**: Đọc rule gốc → xác nhận → audit → thực hiện nhiệm vụ được giao.
- **Detailed Plan**: Nguồn quy tắc, yêu cầu xác nhận và xử lý xung đột.
- **References**: [quy tắc](../../agents/rules/), [biên bản tiếp nhận](RULES_ACKNOWLEDGMENT.md).
- **Created**: 2026-10-02T22:52:40+07:00
- **Last Updated**: 2026-10-02T22:53:13+07:00

---

[STATUS: ACTIVE]

## Nội dung đã tiếp nhận

| Rule | Yêu cầu ghi nhớ |
| --- | --- |
| [AGENT_AI.md](../../agents/rules/AGENT_AI.md) | Đọc trước khi sửa; audit/plan/implement/verify/commit/merge; handoff đủ 5 anchors; không sửa raw, không train notebook, không destructive khi chưa cho phép. |
| [CODEBASE_AUDIT.md](../../agents/rules/CODEBASE_AUDIT.md) | Đối chiếu filesystem/import/artifact/naming/Git; xử lý critical drift trước công việc phụ thuộc; ghi đúng RESOLVED/PARTIALLY RESOLVED/NOT RESOLVED. |
| [COMMIT_CONVENTION.md](../../agents/rules/COMMIT_CONVENTION.md) | Conventional Commit, imperative subject ≤72 ký tự; atomic scope; Tier 1 có companion docs cùng commit và trailer Companion-Doc; checklist trước commit. |
| [LOGGING_CHECKPOINT_RULES.md](../../agents/rules/LOGGING_CHECKPOINT_RULES.md) | Script-only; tự lưu đủ outputs/config/history/log/checkpoints; full-state model/optimizer/scheduler/RNG; last checkpoint để resume; xử lý early-stop/force-resume; naming/registry/rotation/compression. |
| [MD_CONVENTION.md](../../agents/rules/MD_CONVENTION.md) | Header 7 trường đúng thứ tự; giữ Created, cập nhật Last Updated ISO timezone; lifecycle status khi áp dụng; working links; một biến thay đổi mỗi experiment; báo cáo 5W1H. |
| [NAMING_CONVENTION.md](../../agents/rules/NAMING_CONVENTION.md) | snake_case Python, PascalCase class, UPPER_SNAKE_CASE docs/constants, notebook đánh số; run/checkpoint naming; không rename public interface thiếu chấp thuận, không overwrite run cũ. |
| [NOTEBOOK_HEADER_CONVENTION.md](../../agents/rules/NOTEBOOK_HEADER_CONVENTION.md) | Cell đầu Markdown đủ context/timestamps/author/objective; link modules, config, checkpoints và consumed artifacts; không training loop; outputs báo cáo do scripts export. |
| [PYTORCH_FRAMEWORK_RULES.md](../../agents/rules/PYTORCH_FRAMEWORK_RULES.md) | Device động, CPU-compatible, VRAM/mixed precision/accumulation phù hợp; seed đủ nguồn; weights_only=True; full-state; eval()+no_grad và telemetry. |
| [RESULTS_REPORTING.md](../../agents/rules/RESULTS_REPORTING.md) | Mỗi metric có What/Why/When/Where/Who/How; mô tả cách tính, split/seed/checkpoint/protocol; không công bố số chưa có bằng chứng/context. |

## Chữ ký và kiểm chứng

Agent chính Codex `/root` đã đọc toàn bộ nội dung của cả 9 file, bổ sung chữ ký văn bản ở cuối từng file và cập nhật `Last Updated`; giữ nguyên phần nội dung rule và `Created`. Mỗi chữ ký ghi SHA-256 của bản được đọc trước lần sửa này. Yêu cầu đọc lại ở các phiên sau được lưu trong [AGENTS.md](../../AGENTS.md).

Agent `/root/rules_acknowledgment` đã hoàn tất việc đọc trực tiếp toàn bộ 9 file/940 dòng bản trước chữ ký, gồm từng mục, ví dụ và checklist; đã gửi xác nhận từng file cho agent chính. Agent này chỉ đọc, không sửa file hoặc ký thay. Agent xác nhận sẽ áp dụng rule trong tác vụ được giao, báo rõ xung đột và yêu cầu agent mới đọc lại. Bảng tiếp nhận ở trên bao quát cả xác nhận của agent chính và agent đối chiếu.

Chữ ký lần này được người dùng yêu cầu rõ ràng; nội dung “immutable governance” trong rule không bị thay thế. Chữ ký không chứng nhận những thay đổi code trước khi đọc hết rule. Không có khả năng bảo đảm memory vĩnh viễn hoặc tuân thủ không sai sót; tài liệu persistent là cơ chế nhắc đọc và kiểm chứng.

## Tham chiếu thiếu và điểm cần phân biệt

- Một số file dẫn đến `agents/rules/CREATE_FOLDER_STRUCTURE_TEMPLATE.md`, nhưng đường dẫn đó không tồn tại; bản có thật là [CREATE_FOLDER_STRUCTURE_TEMPLATE.md](../../agents/templates/CREATE_FOLDER_STRUCTURE_TEMPLATE.md). Không tự sửa đường dẫn trong rule ở tác vụ ký này.
- Các đường dẫn `src/utils/run_logger.py`, `src/utils/checkpoint_utils.py`, `src/training/train_model.py`, `agents/experiments/README.md` và `experiments/results/README.md` chưa tồn tại. Không coi ví dụ template là module đang có; dừng công việc phụ thuộc nếu thiếu đặc tả cần thiết.
- [RESULTS_REPORTING.md](../../agents/rules/RESULTS_REPORTING.md) còn chỉ đến project reports trong `agents/experiments/`, khác nguyên tắc governance/project-memory của các rule khác; ghi nhận xung đột, không tự sửa trong tác vụ này.
- Ví dụ merge trong commit convention dùng `merge:` nhưng danh sách types không liệt kê type đó; các tên key full-state giữa hai rule cũng có khác biệt. Khi nhiệm vụ chạm phần này, đối chiếu schema thực tế và giải quyết rõ ràng trước khi thực thi.
- PyTorch/training rules áp dụng khi có PyTorch/training; không suy diễn rằng mọi checkpoint ingestion phải là torch checkpoint.

## Handoff — 5 anchors

- **Branch / HEAD**: `main`, `27c32a45c6327f1b5f67a2a4fae6fd2b91383a60`.
- **Working tree**: Có thay đổi chưa commit từ lượt refactor trước và chữ ký/onboarding mới; không stage, commit hoặc sửa các thay đổi trước trong tác vụ này.
- **Verification**: Tác vụ hiện tại chỉ sửa Markdown. Kiểm chứng nội dung rule trước/sau, đủ chữ ký, timestamp/hash và diff whitespace. Kết quả test code của lượt trước được ghi ở [REFACTOR_STATUS.md](../progress/REFACTOR_STATUS.md), không chạy lại hoặc diễn giải thành chứng nhận tuân thủ rule.
- **Open items**: Các tham chiếu thiếu ở trên; chưa có nhiệm vụ chính mới. Việc ký/đọc đã được người dùng cho phép; không tự mở rộng sang refactor.
- **Next step**: Đọc [AGENTS.md](../../AGENTS.md) và toàn bộ [rules](../../agents/rules/), xác nhận rồi tiếp nhận nhiệm vụ chính từ người dùng.
