# Mandatory Agent Onboarding

- **Motivation/Background**: Người dùng yêu cầu mọi agent đọc kỹ và tuân thủ bộ quy tắc trước khi làm việc.
- **Purpose**: Lưu yêu cầu tiếp nhận quy tắc để agent ở các phiên sau đọc lại.
- **Overview Pipeline**: Đọc rule gốc → xác nhận → audit → thực hiện nhiệm vụ được giao.
- **Detailed Plan**: Nguồn quy tắc, yêu cầu xác nhận và xử lý xung đột.
- **References**: [quy tắc](agents/rules/), [biên bản tiếp nhận](docs/shared/RULES_ACKNOWLEDGMENT.md).
- **Created**: 2026-10-02T22:52:40+07:00
- **Last Updated**: 2026-10-02T22:52:40+07:00

---

## Trước khi thực hiện bất kỳ nhiệm vụ nào

Đọc đầy đủ từng file trong [agents/rules](agents/rules/), gồm tất cả mục, ví dụ, appendix và checklist. Nếu output bị cắt, đọc tiếp các phần bị thiếu. Bản tóm tắt hoặc chữ ký của agent khác không thay thế việc tự đọc.

1. [AGENT_AI.md](agents/rules/AGENT_AI.md)
2. [CODEBASE_AUDIT.md](agents/rules/CODEBASE_AUDIT.md)
3. [COMMIT_CONVENTION.md](agents/rules/COMMIT_CONVENTION.md)
4. [LOGGING_CHECKPOINT_RULES.md](agents/rules/LOGGING_CHECKPOINT_RULES.md)
5. [MD_CONVENTION.md](agents/rules/MD_CONVENTION.md)
6. [NAMING_CONVENTION.md](agents/rules/NAMING_CONVENTION.md)
7. [NOTEBOOK_HEADER_CONVENTION.md](agents/rules/NOTEBOOK_HEADER_CONVENTION.md)
8. [PYTORCH_FRAMEWORK_RULES.md](agents/rules/PYTORCH_FRAMEWORK_RULES.md)
9. [RESULTS_REPORTING.md](agents/rules/RESULTS_REPORTING.md)

Sau khi đọc, xác nhận với người dùng hoặc agent giao việc các rule đã tiếp nhận và các xung đột, thiếu tài liệu hoặc điểm chưa rõ. Đọc trạng thái hiện tại trong [docs](docs/) và kiểm tra working tree; không coi thay đổi có sẵn là được chứng nhận tuân thủ chỉ vì rule đã có chữ ký.

## Áp dụng và truyền đạt

Áp dụng rule trong phạm vi tương ứng; tuân theo thứ tự ưu tiên chỉ dẫn hệ thống, developer và người dùng. Nếu yêu cầu xung đột hoặc không thực hiện được, nêu rõ nguồn và lý do; không âm thầm suy diễn ngoại lệ hoặc hứa tuân thủ tuyệt đối.

Khi giao việc cho agent khác theo phạm vi được cho phép, truyền đạt yêu cầu đọc trực tiếp toàn bộ rule và chờ xác nhận trước khi cho agent thực hiện tác vụ phụ thuộc. Không tự tạo agent chỉ để lặp lại việc xác nhận nếu chưa được cho phép.

Giữ nguyên rule gốc. Chỉ thêm hoặc sửa chữ ký khi người dùng yêu cầu. Chữ ký xác nhận tiếp nhận; không thay thế audit, kiểm chứng hoặc việc đọc lại ở phiên mới.

Một số rule đang dẫn đến tài liệu không có ở đường dẫn được ghi. Xem [biên bản tiếp nhận](docs/shared/RULES_ACKNOWLEDGMENT.md); không tự tạo nội dung rule còn thiếu hoặc coi ví dụ template là implementation có thật.
