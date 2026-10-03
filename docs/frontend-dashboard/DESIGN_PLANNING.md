# UTH SCIENTIFIC LAKEHOUSE & RAG PIPELINE: UI/UX DESIGN PLANNING & SPECIFICATION

> **System Identifier:** `UTH-DATA-MINING-RAG-UI-SPEC-V1`  
> **Aesthetic Family:** Tactical Obsidian (Dark) / Swiss Industrial Print (Light)  
> **Target Audience:** AI/DS Researchers, Lakehouse Engineers, Scientific Evaluators  
> **Compliance:** Strict Anti-Slop Directive, Zero Em-Dash Policy, Full-Output Standard

---

## 1. DESIGN READ & STRATEGIC FOUNDATION

### 1.1 One-Line Design Read
Reading this as: **Mission-Control Telemetry & Scientific Lakehouse Dashboard for AI/DS research teams, with a Tactical Brutalist / Swiss Industrial engineering language, leaning toward high-contrast monochrome, modular grid topology, and hardware-accelerated precision.**

### 1.2 The Three Dials Configuration
Every layout, motion, and density decision across the platform is locked to these exact dials:

* **`DESIGN_VARIANCE: 7` (Offset Asymmetrical Grid):**  
  Tách biệt khỏi mô hình dashboard thương mại 3 cột nhàm chán. Sử dụng bố cục sơ đồ mạch hình học (Circuit Schematic), lưới Bento bất đối xứng, và các khối telemetry lệch trục có chủ đích.
* **`MOTION_INTENSITY: 5` (Tactical Spring Physics & Telemetry Flux):**  
  Chuyển động có động cơ rõ ràng (Motivated Motion). Không lạm dụng hiệu ứng cuộn trang vô nghĩa. Tập trung vào: phản hồi xúc giác `:active:scale-[0.98]`, xung nhịp cảm biến (Pulse indicators), hiệu ứng quét luồng dữ liệu (Data packet streaming trên SVG wires), và chuyển đổi theme mượt mà.
* **`VISUAL_DENSITY: 8` (Cockpit / High Data-Ink Ratio):**  
  Tối đa hóa mật độ thông tin hữu ích mà không gây rối mắt. Sử dụng kiểu chữ Monospace cho toàn bộ thông số định lượng, đường phân cách hairline 1px, thẻ thông số không bo tròn quá mức, và nhãn kỹ thuật ngắn gọn.

---

## 2. DESIGN TOKENS & SYSTEM PALETTE

### 2.1 Dual-Theme Substrate Architecture
Hệ thống khóa theme toàn trang (Page Theme Lock). Không cho phép đảo màu cục bộ giữa các section gây đứt gãy trải nghiệm.

| Token | Dark Mode (Tactical Obsidian) | Light Mode (Swiss Industrial) | Chức năng |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#04060a` (Deep Void) | `#eae7dd` (Unbleached Paper) | Nền gốc toàn hệ thống |
| `--bg-surface` | `#0e1422` (Machined Hull) | `#ffffff` (Pure Sheet) | Nền các thẻ, thanh điều hướng |
| `--bg-surface-elevated` | `#162035` (Active Well) | `#ded9cd` (Matte Board) | Nền dropdown, modal, hover state |
| `--border-subtle` | `rgba(255, 255, 255, 0.12)` | `rgba(0, 0, 0, 0.14)` | Đường viền ngăn cách cấu trúc 1px |
| `--border-muted` | `rgba(255, 255, 255, 0.22)` | `rgba(0, 0, 0, 0.24)` | Đường viền thẻ và container |
| `--border-highlight` | `rgba(255, 255, 255, 0.40)` | `rgba(0, 0, 0, 0.45)` | Trạng thái active hoặc focus |
| `--text-primary` | `#ffffff` | `#05070a` | Tiêu đề chính, số liệu trọng tâm |
| `--text-secondary` | `#e2e8f0` | `#1e293b` | Văn bản giải thích, nhãn dữ liệu |
| `--text-muted` | `#a6b4c9` | `#475569` | Meta-data, mã định danh, unit tags |

### 2.2 Functional Accents (Strict Medallion Roles)
Cấm tuyệt đối dải màu tím AI Gradient vô nghĩa. Mỗi màu chỉ gán cho một vai trò thực thi duy nhất:

* **Harvest & Ingestion Red (`#ef4444` / `#dc2626`):** Chỉ báo luồng arXiv OAI-PMH và rate-limiter cảnh báo.
* **Bronze Lake Amber (`#f59e0b` / `#d97706`):** Lưu trữ thô Cloudflare R2, dung lượng bucket, tệp HTML5 gốc.
* **Compute Yellow (`#fde047` / `#ca8a04`):** Động cơ OLAP DuckDB và bộ bóc tách công thức LaTeX.
* **Silver Curation Blue (`#60a5fa` / `#2563eb`):** Apache Parquet Snappy, dữ liệu khoa học đã chuẩn hóa.
* **Gold Vector Gold (`#fbbf24` / `#b45309`):** LanceDB Contextual Vector Lakehouse và Nomic Embeddings.
* **Inference Emerald (`#10b981` / `#059669`):** Trạng thái Apple Metal GPU Online, điểm tương đồng Cosine Similarity > 0.80.

### 2.3 Typography Architecture
* **Font Display / UI:** `Geist Sans` (trọng số 500, 600, 700). Tuyệt đối không dùng `Inter` mặc định.
* **Font Telemetry / Code / Data:** `Geist Mono` và `JetBrains Mono`. Kích hoạt `font-variant-numeric: tabular-nums` cho mọi bảng số liệu.
* **Kỷ luật Typographic:**
  - Tiêu đề Hero tối đa 2 dòng trên màn hình desktop.
  - Subtext không vượt quá 20 từ.
  - Tối đa 1 nhãn eyebrow trên mỗi 3 section.
  - Loại bỏ hoàn toàn ký tự em-dash (`—`) trong toàn bộ giao diện và trích dẫn.

---

## 3. COMPONENT MASTERY & HAPTIC MICRO-AESTHETICS

### 3.1 Cấu trúc Lồng Ghép Double-Bezel (Doppelrand Architecture)
Toàn bộ các thẻ module (Card, Gauge, Terminal) phải tuân theo cấu trúc máy móc công nghiệp 2 lớp:
1. **Outer Shell (Vỏ gia công ngoài):** Thẻ wrapper ngoài cùng sở hữu nền mờ `bg-surface`, viền hairline `border-subtle`, và góc bo chuẩn `rounded-[6px]`.
2. **Inner Core (Lõi dữ liệu):** Khối nội dung bên trong thụt lề 6px–8px, nền `bg-canvas` hoặc `bg-surface-elevated`, bo góc nhỏ hơn (`rounded-[3px]`), tạo chiều sâu quang học mà không cần đổ bóng drop-shadow đen ngòm.

### 3.2 Kiến trúc Nút Bấm Xúc Giác & Island Button
* Nút chuyển tab và action CTA: Bo góc nhẹ (`rounded-[4px]`), viền sắc nét, hiệu ứng nhấn `:active:scale-[0.98]`.
* Nút CTA chính (Run Query / Export): Bố cục chữ tương phản cao, kèm khối icon phụ nằm trong khung tròn riêng biệt (Button-in-Button).

### 3.3 Ngăn Chặn Vực Thẳm Lưới (Gapless Bento Grid)
* Mọi cấu trúc Bento phải áp dụng `grid-auto-flow: dense`.
* Tỷ lệ phân chia cột rõ ràng: 12-column grid (`col-span-3`, `col-span-4`, `col-span-6`, `col-span-8`), triệt tiêu 100% các ô trống ở góc lưới.

---

## 4. BẢN ĐẶC TẢ CHI TIẾT 4 PHÂN HỆ CHÍNH

### Phân hệ 1: Architectural Top Banner & Tactical Navigation
* **Mục tiêu:** Cung cấp thông tin nhận diện hệ thống cấp cao và chuyển mạch theme tức thời.
* **Thành phần:**
  1. *Brand Identity Anchor:* Badge định danh `UTH-AI` bằng font mono tương phản, kèm dòng trạng thái `[MPS/METAL ONLINE]` nhấp nháy tần số 2.5s.
  2. *Quick Metrics Strip:* Cập nhật dung lượng Cloudflare R2 (5.52 GB) và số vector LanceDB (143,523) với chấm màu trạng thái thực tế.
  3. *Precision Theme Toggle:* Nút chuyển đổi Light/Dark tức thì với SVG icon tùy biến và nhãn mono in hoa rõ ràng.
  4. *Tab Controller Ribbon:* Thanh điều hướng 4 tab phẳng với viền dưới 2px trượt theo tab active.

### Phân hệ 2: Tab 1 - Interactive Geometric Circuit Schematic
* **Mục tiêu:** Trực quan hóa toàn bộ đường ống dẫn dữ liệu theo sơ đồ mạch điện tử công nghiệp.
* **Thành phần & Trải nghiệm:**
  1. *Tầng Gauges Ribbon:* 3 đồng hồ đo hình học (Storage Capacity, Vector Indexing, Compute Engine) định vị ngay phía trên sơ đồ.
  2. *Topology Node Graph:* 8 trạm xử lý liên hoàn từ Ingest đến Client:
     - `01/INGEST`: arXiv OAI-PMH & ar5iv Crawler.
     - `02/LAKE`: Cloudflare R2 Bronze Lake.
     - `03/TRANSFORM`: DuckDB OLAP & LaTeX Formula Engine.
     - `04/CURATE`: Apache Parquet Canonical Silver Store.
     - `05/EMBED`: Nomic Embed v1.5 Hardware Worker.
     - `06/VECTOR`: LanceDB Gold Semantic Store.
     - `07/INFERENCE`: Qwen2.5-7B Local GGUF Engine.
     - `08/INTERFACE`: Scientific Synthesis & Verification Terminal.
  3. *Node Inspector Drawer:* Khi nhấp chuột vào bất kỳ trạm nào, hiển thị bảng thông số chi tiết (tốc độ đọc ghi, định dạng tệp, đường dẫn bucket, và các bài kiểm tra checksum).

### Phân hệ 3: Tab 2 - Telemetry Gauges & Live Stream Execution Feed
* **Mục tiêu:** Theo dõi thời gian thực phần cứng và nhật ký dòng chảy dữ liệu.
* **Thành phần & Trải nghiệm:**
  1. *Hardware Gauge Cluster:* Đồng hồ đo dạng góc quét (Sweep Angle Gauge) 240 độ hiển thị thông số RAM, GPU Utilization và Bus Bandwidth.
  2. *Live Telemetry Terminal:* Hộp ghi nhận log dạng dòng lệnh thời gian thực:
     - Phân loại cấp độ: `INFO`, `INGEST`, `TRANSFORM`, `EMBED`, `SUCCESS`.
     - Phân luồng màu tương ứng theo chuẩn Medallion.
     - Tự động cuộn theo log mới nhất kèm tính năng Pause Stream để nghiên cứu.

### Phân hệ 4: Tab 3 - Platform Engines & Ecosystem Matrix
* **Mục tiêu:** Minh bạch hóa toàn bộ công nghệ lõi phục vụ đồ án và kiểm thử.
* **Thành phần & Trải nghiệm:**
  1. *Engine Grid:* 8 khối card công nghệ đồng nhất (R2, DuckDB, LanceDB, Parquet, Qwen, Nomic, Apple Metal, React 19).
  2. *Spec Matrix:* Phiên bản công cụ, vai trò kiến trúc, giao thức kết nối, và độ trễ phản hồi danh định.

### Phân hệ 5: Tab 4 - Grounded Scientific RAG Playground
* **Mục tiêu:** Môi trường thử nghiệm truy vấn tài liệu khoa học thời gian thực, có trích dẫn bài báo và cơ chế chống ảo giác (Anti-Hallucination Gate).
* **Thành phần & Trải nghiệm:**
  1. *Benchmark Preset Bar:* Các nút truy vấn mẫu kích hoạt tức thì (CoDi Diffusion 2310.01407, Gated OCR Distillation).
  2. *Command Query Bar:* Ô nhập lệnh tối giản, viền highlight khi focus, nút bấm `RUN QUERY` tương phản cao.
  3. *Synthesis Result Console:*
     - Khối thông báo nguồn trích dẫn: Huy hiệu `[GROUNDED SCIENTIFIC SYNTHESIS]`.
     - Chỉ số tương quan: Điểm Cosine Similarity và độ trễ phản hồi (Latency tính bằng giây).
     - Khối trích dẫn xác minh (`[VERIFIED CITATIONS]`): Ghi rõ Paper ID, Section trích xuất, ngăn chặn hoàn toàn việc viện dẫn nguồn giả.
  4. *Active Pipeline Inspector (Sidebar 340px):* Bảng hiển thị thông số tĩnh của mô hình đang chạy ngầm (Embedding Dimension 768d, Q4_K_M GGUF, Nhiệt độ Temperature = 0.2).

---

## 5. KẾ HOẠCH HỢP NHẤT LINH KIỆN CÒN THIẾU (INTEGRATION ROADMAP)

Hiện tại trong mã nguồn còn 2 thành phần xuất sắc chưa được hiển thị đầy đủ trên giao diện chính:
1. **`StorageInspector` (Thanh tra Medallion 3 lớp):** Cần tích hợp trực tiếp vào Tab 1 hoặc bổ sung làm một Drawer trượt để người dùng kiểm tra dung lượng từng phân tầng (Bronze: 2.84 GB, Silver: 231 MB, Gold: 2.45 GB).
2. **`MetricsBento` (Bento Tổng quan quy mô):** Tích hợp vào chế độ xem mở rộng để trình diễn ngay quy mô 10,000 bài báo khoa học và 2.22 triệu công thức toán học LaTeX.

---

## 6. DANH MỤC KIỂM TRA CHẤT LƯỢNG CUỐI CÙNG (PRE-FLIGHT CRITERIA)

Trước khi nghiệm thu hoặc xuất bản bất kỳ thay đổi giao diện nào, hệ thống phải vượt qua bảng kiểm soát 10 điểm:
- [x] **Zero Em-Dash:** Không xuất hiện bất kỳ ký tự `—` hoặc `–` nào trên UI, thay thế hoàn toàn bằng `-` hoặc dấu hai chấm.
- [x] **Theme Lock:** Toàn bộ thành phần chuyển đổi mượt mà giữa Dark và Light mode mà không có vùng nào bị đảo ngược tông màu lạc quẻ.
- [x] **No Placeholder Code:** Mọi file code được bổ sung phải chạy được 100%, không để sót `// TODO` hay `// ...`.
- [x] **High Contrast Accessibility:** Chữ trắng trên nền tối (tỷ lệ tương phản > 7:1), nhãn nút bấm đọc rõ ràng, không có chữ trắng trên nền trắng.
- [x] **No Viewport Jumping:** Khung nhìn Hero và Header sử dụng `min-h-[100dvh]`, không dùng `h-screen` gây lỗi trên mobile.
- [x] **Responsive Single-Column Collapse:** Mọi sơ đồ và cột lưới Bento tự động dồn thành 1 cột mượt mà khi chiều rộng màn hình dưới 768px.
- [x] **Motivated Micro-Motion:** Mọi hiệu ứng lướt và hover đều dùng cubic-bezier và spring physics, không dùng hiệu ứng tuyến tính generic.
- [x] **Monospace Numbers:** Toàn bộ số đo, dung lượng, số lượng vector đều dùng `Geist Mono` với `tabular-nums`.
- [x] **Hardware Acceleration Safety:** Chỉ biến đổi `transform` và `opacity`, không can thiệp vào `width`, `height`, `top`, `left` khi animate.
- [x] **Production Integrity:** Toàn bộ thuật ngữ chuyên ngành (arXiv, OAI-PMH, LanceDB, Snappy Parquet, Metal MPS) hiển thị chính xác theo quy chuẩn học thuật.
