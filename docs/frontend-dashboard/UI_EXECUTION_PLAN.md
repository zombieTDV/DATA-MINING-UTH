# UTH SCIENTIFIC LAKEHOUSE & RAG PIPELINE: UI/UX DETAILED EXECUTION PLAN

> **Document Identifier:** `UTH-UI-EXECUTION-PLAN-V1`  
> **Scope:** 100% Focused on Frontend UI/UX Engineering  
> **Branch:** `dev/bush-frontend`  
> **Target Standard:** $150k+ Agency Tier / Swiss Industrial & Tactical Telemetry  
> **Compliance:** Zero Em-Dash Policy (`—` is banned), Full-Output Standard, Strict Anti-Slop

---

## TỔNG QUAN CHIẾN LƯỢC (EXECUTIVE SUMMARY)

Nhánh `dev/bush-frontend` được định vị độc lập để hoàn thiện 100% trải nghiệm người dùng và giao diện thị giác của hệ thống **UTH Real-Time Scientific Data Mining & Advanced RAG System for AI/DS**. 

Kế hoạch này vạch ra lộ trình thực thi theo 5 giai đoạn liên hoàn, tập trung vào tính toàn vẹn của dữ liệu Medallion Lakehouse, ngôn ngữ thiết kế công nghiệp Thụy Sĩ (Swiss Engineering), kiến trúc vật lý số Double-Bezel, và trải nghiệm thẩm định khoa học chuẩn mực.

---

## SƠ ĐỒ LỘ TRÌNH 5 GIAI ĐOẠN

```
[GIAI ĐOẠN 1]                     [GIAI ĐOẠN 2]                     [GIAI ĐOẠN 3]
Tích hợp Bố cục                   Nâng cấp Thẩm mỹ Haptic           Đại tu RAG Playground
- MetricsBento                    - Cấu trúc Double-Bezel           - Scientific Verification
- StorageInspector                - Island Button Architecture      - Interactive Citations
- Thanh điều hướng Tabs           - Xử lý số liệu Tabular           - Similarity Radar Gauge
       │                                 │                                 │
       ▼                                 ▼                                 ▼
[GIAI ĐOẠN 4] ─────────────────────────────────────────────────────────────► [GIAI ĐOẠN 5]
Nâng cấp Telemetry & Tools                                          Tối ưu Responsive & Pre-Flight
- Bộ lọc Live Logs                                                  - Mobile Collapse (< 768px)
- Điều khiển luồng dữ liệu                                          - Khóa tương phản WCAG AAA
- Ma trận thông số công cụ                                          - Kiểm định 10 tiêu chí
```

---

## GIAI ĐOẠN 1: TÍCH HỢP BỐ CỤC & DỮ LIỆU MEDALLION LAKEHOUSE

### 1.1 Mục tiêu chiến lược
Giải quyết triệt để vấn đề "dữ liệu bị ẩn": Hiện tại hai linh kiện rất quan trọng là `MetricsBento.tsx` và `StorageInspector.tsx` đã được viết hoàn chỉnh nhưng chưa được kết nối vào giao diện chính. Giai đoạn này đưa chúng vào các vị trí chiến lược để phô diễn toàn bộ quy mô 10,000 bài báo khoa học và 5.52 GB dữ liệu Cloudflare R2.

### 1.2 Chi tiết thực thi

#### A. Tích hợp `MetricsBento` vào Tab 1 (Pipeline Circuit Schematic)
* **Vị trí:** Đặt ngay phía trên hoặc phía dưới Sơ đồ mạch hình học trong Tab 1.
* **Cấu trúc Lưới:** Lưới Bento 12 cột không góc chết (`grid-auto-flow: dense`).
* **5 Khối Dữ liệu Chiến lược:**
  1. *Khối 1 (Span 4):* Quy mô bài báo (10,000 bài báo AI/DS, trạng thái 100% Ingested).
  2. *Khối 2 (Span 4):* Bóc tách công thức toán (2,224,198 công thức LaTeX qua DuckDB).
  3. *Khối 3 (Span 4):* Không gian Vector (143,523 vector 768 chiều Nomic v1.5).
  4. *Khối 4 (Span 6):* Phân bổ 3 tầng lưu trữ Medallion (Bronze: 2.84 GB, Silver: 231 MB, Gold: 2.45 GB).
  5. *Khối 5 (Span 6):* Tăng tốc phần cứng (Apple Silicon M-Series Metal GPU, độ trễ trung bình 18.5s).

#### B. Tích hợp `StorageInspector` làm Phân vùng Tra cứu Medallion
* **Vị trí:** Tích hợp trực tiếp vào Tab 1 dạng bảng điều khiển chuyên sâu (Deep-Dive Panel) hoặc Drawer có thể thu gọn.
* **4 Tầng Lưu trữ Hiển thị:**
  1. *Bronze HTML:* 9,022 tệp HTML5 thô từ ar5iv (2.821 GB), đường dẫn bucket R2 `s3://.../bronze/html/year=2026/`.
  2. *Bronze Batches:* 12 gói thu hoạch OAI-PMH metadata (20.83 MB).
  3. *Silver Parquet:* 10,000 bài báo khoa học chuẩn hóa Snappy Parquet (231.73 MB).
  4. *Gold Vector:* 143,523 đoạn ngữ cảnh LanceDB (2.456 GB).
* **Tính năng:** Nút sao chép đường dẫn S3 bucket, nhãn định dạng tệp chuẩn công nghiệp.

#### C. Tinh chỉnh Thanh Tabs Điều Hướng
* Thêm số thứ tự phím tắt dạng monospace `[1]`, `[2]`, `[3]`, `[4]` trước tên từng tab.
* Thêm chấm trạng thái nhịp đập (Pulsing dot) cho Tab 2 báo hiệu luồng ghi nhận log đang hoạt động.

---

## GIAI ĐOẠN 2: NÂNG CẤP THẨM MỸ HAPTIC & KIẾN TRÚC DOUBLE-BEZEL

### 2.1 Mục tiêu chiến lược
Nâng tầm toàn bộ giao diện từ web thông thường lên đẳng cấp bảng điều khiển khí tài quân sự / phòng thí nghiệm Thụy Sĩ (Swiss Tactical Mission Control). Triệt tiêu việc lạm dụng đổ bóng drop-shadow rẻ tiền, thay thế bằng chiều sâu vật lý số (Haptic Digital Materiality).

### 2.2 Chi tiết thực thi

#### A. Cấu trúc Lồng Ghép Double-Bezel (Doppelrand Architecture)
Áp dụng cho toàn bộ Card trong `GeometricPipelineDiagram`, `GeometricTelemetryGauges`, `MetricsBento`, và `StorageInspector`:
1. **Outer Shell (Vỏ gia công ngoài):**
   - Nền mờ kính kỹ thuật `var(--bg-surface)` với `backdrop-filter: blur(12px)`.
   - Viền ngoài hairline siêu mỏng `border: 1px solid var(--border-subtle)`.
   - Đệm lề cố định `p-2` hoặc `p-3`.
   - Bo góc công nghiệp `rounded-[6px]`.
2. **Inner Core (Lõi dữ liệu bên trong):**
   - Nền lún sâu `var(--bg-canvas)` hoặc `var(--bg-surface-elevated)`.
   - Bo góc thụt lề chuẩn hình học `rounded-[3px]`.
   - Viền bên trong phản quang `shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]`.

#### B. Kiến trúc Island Button & Trailing Icon
* Các nút bấm hành động (`RUN QUERY`, `PAUSE STREAM`, `LIGHT/DARK`, các nút Preset):
  - Bo góc nhẹ dạng phím bấm cơ học `rounded-[4px]`.
  - Icon điều hướng được bọc trong khung tròn riêng biệt (Button-in-Button).
  - Phản hồi xúc giác khi nhấp chuột: `:active:scale-[0.98]` và dịch chuyển vi mô icon `:group-hover:translate-x-0.5`.

#### C. Chuẩn hóa Typographic & Dữ liệu Bảng
* Kích hoạt `font-variant-numeric: tabular-nums` cho toàn bộ số đo telemetry và dung lượng.
* Đảm bảo không bị giật layout khi số liệu thời gian thực thay đổi.
* Quét sạch toàn bộ dấu gạch ngang em-dash (`—`), thay thế bằng `-` hoặc `:`.

---

## GIAI ĐOẠN 3: ĐẠI TU TAB 4 THÀNH "SCIENTIFIC VERIFICATION STUDIO"

### 3.1 Mục tiêu chiến lược
Biến Tab 4 từ một form hỏi đáp đơn giản thành một không gian làm việc thẩm định nghiên cứu khoa học chuyên sâu (Academic Research Verification Console).

### 3.2 Bố cục Giao diện Dự kiến

```
+-----------------------------------------------------------+-----------------------+
|  BENCHMARK PRESETS (CoDi Diffusion, Gated OCR, ...)       | ACTIVE PIPELINE SPECS |
+-----------------------------------------------------------+-----------------------+
|  [ COMMAND QUERY INPUT BAR                      ] [RUN]   | - LanceDB (143k Vec)  |
+-----------------------------------------------------------+ - Nomic 768d (Cosine) |
|  VERIFICATION CONSOLE:                                    | - Qwen2.5-7B (GGUF)   |
|  - Trạng thái: [GROUNDED] vs [ANTI-HALLUCINATION GATE]    | - Apple Metal GPU     |
|  - Radar Gauge: Similarity Score (0.8510) & Latency       | - Temperature: 0.2    |
|  - Answer Box: Hiệu ứng Typewriter streaming chữ mượt mà  |                       |
|  - Interactive Citations: Bấm xem Abstract, Math, arXiv   | [GPU MEMORY: 6.2 GB]  |
+-----------------------------------------------------------+-----------------------+
```

### 3.3 Chi tiết thực thi

1. **Hiệu ứng Typewriter Streaming:**
   - Khi chạy truy vấn, câu trả lời khoa học được bung ra theo nhịp gõ chữ phân đoạn mượt mà, kèm con trỏ nhấp nháy tạo cảm giác mô hình LLM đang trực tiếp suy luận.
2. **Thẻ Trích dẫn Tương tác (Interactive Verified Citations):**
   - Mỗi trích dẫn `[Paper: 2310.01407, Section 5]` được tạo thành thẻ có thể click.
   - Khi click, hiển thị Popover chứa: Tên bài báo đầy đủ, Tác giả, Abstract tóm tắt, Thể loại (`cs.AI / cs.LG`), và công thức toán học liên quan.
3. **Đồng hồ đo Tương quan (Visual Similarity & Confidence Gauge):**
   - Thiết kế thanh tiến trình hình học với vạch chia độ chính xác (Precision Ticks) thể hiện trực quan ngưỡng tin cậy Cosine Similarity:
     - Xanh lá nếu > 0.80.
     - Vàng nếu 0.70 - 0.80.
     - Đỏ cảnh báo nếu < 0.70.
4. **Phân biệt Rõ rệt Cổng Chống Ảo Giác (Anti-Hallucination Gate):**
   - Khi truy vấn vào chủ đề không có trong corpus (như preset OCR), giao diện chuyển sang trạng thái cảnh báo Tactical Red/Amber, giải thích rõ nguyên nhân "Insufficient Evidence in Gold Lakehouse".

---

## GIAI ĐOẠN 4: NÂNG CẤP TAB 2 (LIVE TELEMETRY) & TAB 3 (ECOSYSTEM)

### 4.1 Mục tiêu chiến lược
Tăng cường tính trực quan và khả năng kiểm soát luồng dữ liệu thời gian thực, đồng thời làm nổi bật hệ thống công nghệ nền tảng.

### 4.2 Chi tiết thực thi

#### A. Bộ Điều khiển Luồng Log Nâng cao (Tab 2)
* Bổ sung thanh công cụ phía trên Live Feed:
  - Nút **Pause / Resume Stream** để dừng màn hình khi cần đọc kỹ log.
  - Bộ nút lọc theo cấp độ: `[ALL]` · `[INGEST]` · `[TRANSFORM]` · `[EMBED]` · `[SUCCESS]`.
  - Nút **Clear Log** và **Copy Log buffer**.
* Bổ sung hiệu ứng quét dòng sáng nhẹ (CRT Scanline hint) tạo cảm giác telemetry phòng thí nghiệm.

#### B. Thẻ Công Nghệ Tương tác (Tab 3)
* Mở rộng từng khối công nghệ (R2, DuckDB, LanceDB, Parquet, Qwen, Nomic, Metal):
  - Hiển thị thông số driver, phiên bản, dung lượng cache, và độ trễ đọc/ghi trung bình.
  - Hiệu ứng hover làm sáng viền kim loại và nâng nhẹ thẻ.

---

## GIAI ĐOẠN 5: TỐI ƯU RESPONSIVE MOBILE & BẢNG KIỂM ĐỊNH PRE-FLIGHT

### 5.1 Mục tiêu chiến lược
Đảm bảo giao diện co giãn hoàn hảo trên màn hình laptop nhỏ và thiết bị di động, vượt qua toàn bộ 10 tiêu chuẩn kiểm định chất lượng nghiêm ngặt trước khi xuất bản.

### 5.2 Kỷ luật Co giãn Di động (Mobile Collapse dưới 768px)
* Sử dụng `min-h-[100dvh]` để tránh lỗi nhảy khung nhìn do thanh địa chỉ Safari trên iOS.
* Sơ đồ mạch ngang tự động chuyển thành danh sách trạm dọc liên hoàn.
* Lưới Bento 12 cột tự động chuyển thành 1 cột `w-full` với khoảng đệm `px-4`.
* Tab 4 đổi từ bố cục 2 cột (1fr + 340px) thành 1 cột xếp chồng logic.

### 5.3 Bảng Kiểm tra Pre-Flight 10 Điểm Bắt Buộc

- [ ] **1. Zero Em-Dash:** Không xuất hiện bất kỳ ký tự `—` hoặc `–` nào trên UI, thay thế hoàn toàn bằng `-` hoặc dấu hai chấm.
- [ ] **2. Theme Lock:** Toàn bộ thành phần chuyển đổi mượt mà giữa Dark và Light mode mà không có vùng nào bị đảo ngược tông màu lạc quẻ.
- [ ] **3. No Placeholder Code:** Mọi file code được bổ sung phải chạy được 100%, không để sót `// TODO` hay `// ...`.
- [ ] **4. High Contrast Accessibility:** Chữ trắng trên nền tối (tỷ lệ tương phản > 7:1), nhãn nút bấm đọc rõ ràng, không có chữ trắng trên nền trắng.
- [ ] **5. No Viewport Jumping:** Khung nhìn Hero và Header sử dụng `min-h-[100dvh]`, không dùng `h-screen` gây lỗi trên mobile.
- [ ] **6. Responsive Single-Column Collapse:** Mọi sơ đồ và cột lưới Bento tự động dồn thành 1 cột mượt mà khi chiều rộng màn hình dưới 768px.
- [ ] **7. Motivated Micro-Motion:** Mọi hiệu ứng lướt và hover đều dùng cubic-bezier và spring physics, không dùng hiệu ứng tuyến tính generic.
- [ ] **8. Monospace Numbers:** Toàn bộ số đo, dung lượng, số lượng vector đều dùng `Geist Mono` với `tabular-nums`.
- [ ] **9. Hardware Acceleration Safety:** Chỉ biến đổi `transform` và `opacity`, không can thiệp vào `width`, `height`, `top`, `left` khi animate.
- [ ] **10. Production Integrity:** Toàn bộ thuật ngữ chuyên ngành (arXiv, OAI-PMH, LanceDB, Snappy Parquet, Metal MPS) hiển thị chính xác theo quy chuẩn học thuật.

---

## KẾT LUẬN & BƯỚC KHỞI ĐỘNG TIẾP THEO

Bản kế hoạch trên đảm bảo định hướng thiết kế của nhánh `dev/bush-frontend` đạt độ sắc nét tối đa, kết hợp hoàn hảo giữa kỹ thuật dữ liệu lớn (Lakehouse) và trải nghiệm thẩm mỹ Thụy Sĩ đỉnh cao.

**Bước khởi động tức thì:** Triển khai **Giai đoạn 1** (Tích hợp `MetricsBento` và `StorageInspector` vào Tab 1 trong `src/App.tsx`).
