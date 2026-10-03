# Bản Kế Hoạch Chuẩn Hóa & Khắc Phục Xung Đột Màu Sắc Light Mode
**Light Mode Color System Harmonization & Conflict Resolution Plan**
*Branch:* `dev/bush-frontend` | *Version:* `2.3.0-light-calibration` | *Date:* Tháng 10, 2026
*Standard:* High Contrast Swiss Technical Print (WCAG AAA) & Anti-Slop Strict Engineering

---

## 1. Chẩn Đoán Chi Tiết Xung Đột Màu Sắc Light Mode (Root Cause Diagnosis)

Hiện tại, khi người dùng kích hoạt **Light Mode** bằng phím `T` hoặc nút chuyển trên Header, giao diện xuất hiện tình trạng xung đột thị giác (visual conflict), suy giảm độ tương phản và thiếu sự đồng nhất giữa các linh kiện.

Qua kiểm tra mã nguồn toàn diện (`src/index.css` và toàn bộ các file trong `src/components/`), nhóm kiến trúc xác định **6 nguyên nhân cốt lõi**:

### Nguyên nhân 1: Nghịch đảo sai lệch cấu trúc vỏ kép (Doppelrand Inversion)
- **Cơ chế thiết kế ban đầu:**
  - Ở Dark Mode: Nền trang (`--bg-canvas` = `#04060a`), Khay vỏ card (`--bg-surface` = `#0e1422`), Lõi card bên trong (`--bg-canvas` = `#04060a`). Hiệu ứng này tạo ra một lòng trũng (sunken terminal) rất đẹp mắt trên nền tối.
- **Xung đột ở Light Mode:**
  - Nền trang: `--bg-canvas` = `#eae7dd` (màu be/cát ấm).
  - Khay vỏ ngoài: `--bg-surface` = `#ffffff` (trắng tinh).
  - Lõi card bên trong: `--bg-canvas` = `#eae7dd` (lại quay về màu be!).
  - **Hệ quả thị giác:** Card xuất hiện một viền ngoài màu trắng viền quanh một ruột bên trong màu be đục y hệt màu nền trang. Cảm giác như card bị "khoét thủng một lỗ" ở giữa, lộn xộn và phản trực giác. Sau đó các nút/input bên trong lại dùng `#ffffff`, tạo nên một lớp bánh kẹp 3 tầng "Be - Trắng - Be - Trắng" xung đột nặng nề.

### Nguyên nhân 2: Màu nền Canvas (`--bg-canvas`) quá tối và xỉn màu
- Giá trị hiện tại `#eae7dd` (Khaki xỉn) có độ sáng quá thấp (Luminance thấp).
- Khi kết hợp với các thẻ nền trắng `#ffffff`, màu be này làm giao diện trông cũ kỹ, ám vàng bẩn và tạo cảm giác trang bị lỗi màu (dirty wash).
- Lưới tọa độ kiến trúc `body::before` với `rgba(0, 0, 0, 0.14)` trên nền be này bị hiện rõ thành các đường sọc thô ráp, làm bẩn thị giác người đọc.

### Nguyên nhân 3: Xung đột dải màu Accent Pastel của Dark Mode trên nền sáng
- Trong `GeometricPipelineDiagram.tsx`:
  - Trạm DuckDB dùng màu vàng chanh `#fde047`.
  - Trạm LanceDB dùng màu hổ phách nhạt `#fbbf24`.
  - Trạm Parquet dùng màu xanh pastel `#60a5fa`.
  - Trạm Nomic dùng màu xanh mint `#34d399`.
- **Hệ quả thị giác:** Các màu pastel này được thiết kế để phát sáng (neon glow) trên nền đen OLED. Khi mang nguyên xi sang nền trắng/be, chữ vàng `#fde047` và chữ xanh `#60a5fa` bị **mất hoàn toàn độ tương phản (Contrast Ratio < 2:1)**, vi phạm nghiêm trọng tiêu chuẩn trợ năng WCAG và gần như tàng hình đối với mắt người.

### Nguyên nhân 4: Các mã màu cố định (Hardcoded Dark Mode Colors)
- Trong `GeometricPipelineDiagram.tsx`:
  - Mũi tên SVG: `<path fill="rgba(255,255,255,0.4)" />` (mũi tên màu trắng bán trong suốt đặt trên nền sáng trở nên vô hình).
  - Nền metric node: `background: 'rgba(255, 255, 255, 0.06)'` tạo ra các vệt mờ nhờ nhờ trên nền sáng.
  - Vòng glow: `boxShadow: 0 0 20px node.zoneColor33` trên nền sáng không tạo được quầng sáng mà trông như vết loang màu bẩn.

### Nguyên nhân 5: Phân mảnh thanh Header và Thanh Tab Navigation
- Header dùng `background: var(--bg-surface)` (`#ffffff`).
- Ngay bên dưới, thanh Navigation Tabs Bar dùng `background: var(--bg-canvas)` (`#eae7dd`).
- Điều này tạo thành một nhát cắt ngang kỳ dị: đỉnh trang trắng tinh, dải menu be sẫm, rồi thân trang lại be sẫm xen kẽ các khối card trắng.

### Nguyên nhân 6: Đảo màu nút bấm và Badge
- Nút đang chọn (Active Tab / Filter Chip):
  - `background: var(--text-primary)` (`#05070a` đen kịt).
  - `color: var(--bg-canvas)` (`#eae7dd` chữ màu be cát).
- Sự kết hợp chữ be trên nền đen đặc bên trong một khung trắng tạo cảm giác vụn vặt và mất cân đối thị giác.

---

## 2. Ma Trận Đánh Giá Từng Linh Kiện Ở Light Mode (Component Conflict Matrix)

| Linh kiện (Component) | Biểu hiện xung đột thực tế ở Light Mode | Mức độ nghiêm trọng | Giải pháp kỹ thuật |
|---|---|:---:|---|
| **`src/index.css` (Tokens)** | `--bg-canvas: #eae7dd` xỉn màu; `--bg-surface-elevated: #ded9cd` tối bẩn; lưới `body::before` quá đậm. | **Cực cao (P0)** | Thay thế bằng bảng màu **Swiss Technical Alabaster**: Canvas `#f8f7f4`, Surface `#ffffff`, Surface-Subtle `#f1f0eb`. Giảm opacity lưới xuống 0.25. |
| **`GeometricPipelineDiagram.tsx`** | Chữ DuckDB `#fde047` và LanceDB `#fbbf24` bị chìm hoàn toàn vào nền trắng. Mũi tên SVG tàng hình. Vỏ Doppelrand lộn ngược. | **Cực cao (P0)** | Tạo bảng màu Accent động cho Light Mode (dùng màu đậm tương phản cao: Amber đậm `#b45309`, Cobalt `#1d4ed8`, Emerald `#047857`, Red `#b91c1c`). Sửa màu mũi tên và bus track. |
| **`App.tsx` (Header & Tabs)** | Header trắng cắt ngang Tab bar màu be. Badge phím tắt chữ be trên nền đen. | **Cao (P1)** | Đồng bộ Header và Navigation Tabs cùng nền trắng (`--bg-surface`) liền mạch, phân tách bằng đường hairline `#e5e4de`. |
| **`MetricsBento.tsx`** | Khay ngoài trắng, lòng trong be đục. Vệt gradient radial xanh/vàng nhạt bị nhờ nhờ. | **Cao (P1)** | Chuẩn hóa Doppelrand chuẩn: Khay ngoài `#f1f0eb`, ruột trong `#ffffff`. Gradient chuyển sang dạng tinh tế nhẹ nhàng. |
| **`StorageInspector.tsx`** | Bảng partition có nền ruột be, các ô code S3 lại có nền xám dơ `#ded9cd`. | **Cao (P1)** | Ruột card màu trắng `#ffffff`, ô code partition dùng nền xám kỹ thuật sáng sạch `#f3f2ed`. |
| **`PipelineFlow.tsx`** | Dải accent 4 phase hiển thị tương phản chưa tối ưu; khung inspect cần đồng bộ vỏ kép. | **Trung bình (P2)** | Hiển thị nền trắng đồng nhất, viền thẻ active chuẩn màu zone đậm. |
| **`GeometricTelemetryGauges.tsx`** | Vòng cung track SVG dùng `var(--border-muted)` có thể quá mờ hoặc quá đậm. | **Trung bình (P2)** | Hiệu chỉnh màu track SVG Light Mode thành `rgba(0,0,0,0.08)` và kim đo màu sắc nét. |
| **`LiveTelemetryFeed.tsx`** | Nút lọc cấp độ (ALL, SUCCESS,...) chữ be trên nền đen đặc thô ráp. | **Trung bình (P2)** | Nút active dùng tông xám than thanh lịch `#0f172a` với chữ trắng sạch sẽ `#ffffff`. |
| **`ScientificRagConsole.tsx`** | Ô terminal gõ lệnh và khung trích dẫn có nền lộn xộn giữa be và trắng. | **Cao (P1)** | Lõi console màu trắng sáng tinh khiết `#ffffff`, khung input có viền tương phản sắc nét. |
| **`ToolLogos.tsx`** | Nút filter danh mục và panel inspector chi tiết có màu nền chưa tiệp với trang. | **Trung bình (P2)** | Đồng bộ bảng màu nền và chip filter cùng chuẩn palette mới. |

---

## 3. Đề Xuất Hệ Thống Màu Chuẩn Hóa Mới (The Calibrated Swiss Alabaster System)

Chúng ta sẽ nâng cấp hệ thống design tokens trong `src/index.css` cho Light Mode dựa trên triết lý **Swiss Typographic Print**: sáng trong như giấy in bản vẽ kỹ thuật cao cấp, không bị ố vàng, tương phản mực đen WCAG AAA.

### 3.1 Bảng Tokens Toàn Cục Mới (Calibrated Light Tokens)

```css
/* Light Mode: High Contrast Swiss Engineering Print (Calibrated 2026) */
[data-theme="light"] {
  /* Canvas & Surfaces: Sạch sẽ, sáng sủa, không bị xỉn màu */
  --bg-canvas: #f6f5f0;           /* Giấy in kỹ thuật Thụy Sĩ thanh nhã */
  --bg-surface: #ffffff;          /* Mặt phẳng card trắng tinh khiết */
  --bg-surface-elevated: #eceae3; /* Khay đỡ Doppelrand tinh tế */
  --bg-surface-hover: #e4e2d8;    /* Trạng thái hover có chiều sâu */
  --bg-surface-inner: #ffffff;    /* Ruột hiển thị trung tâm luôn trắng sáng */

  /* Hairline Borders: Sắc nét, chuẩn cơ khí */
  --border-subtle: rgba(0, 0, 0, 0.08);   /* Đường biên phụ siêu mảnh */
  --border-muted: rgba(0, 0, 0, 0.16);    /* Đường chia khu vực rõ ràng */
  --border-highlight: rgba(0, 0, 0, 0.38);/* Viền khi hover hoặc kích hoạt */

  /* Typography: Mực đen kỹ thuật tương phản tối đa */
  --text-primary: #090c10;        /* Mực đen đậm sắc nét (Contrast 18:1) */
  --text-secondary: #334155;      /* Chữ phụ trợ xám phiến Slate 700 */
  --text-muted: #64748b;          /* Nhãn tham số Slate 500 */

  /* Machined Card Shadows */
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.03);

  /* Calibrated High-Contrast Accents for Light Mode */
  --accent-bronze: #b45309;       /* Hổ phách đậm (thay vì vàng chanh nhạt) */
  --accent-silver: #1d4ed8;       /* Xanh Cobalt kỹ thuật (thay vì xanh pastel) */
  --accent-gold: #92400e;         /* Vàng đồng cổ điển */
  --accent-emerald: #047857;      /* Xanh ngọc lục bảo thẫm (dễ đọc trên trắng) */
  --accent-violet: #6d28d9;       /* Tím thạch anh đậm */
}
```

---

### 3.2 Chuẩn Hóa Kiến Trúc Vỏ Kép Doppelrand Cho Light Mode

Để giải quyết triệt để lỗi "lòng card bị đục", quy tắc lồng ghép thẻ được thiết lập lại đồng bộ như sau:

```
+--------------------------------------------------------------+
| NỀN TRANG (Page Canvas): var(--bg-canvas) = #f6f5f0          |
|                                                              |
|   +------------------------------------------------------+   |
|   | KHAY VỎ NGOÀI (Outer Shell):                         |   |
|   | background: var(--bg-surface-elevated) = #eceae3     |   |
|   | border: 1px solid var(--border-subtle)               |   |
|   | padding: 4px; border-radius: 10px                    |   |
|   |                                                      |   |
|   |   +----------------------------------------------+   |   |
|   |   | RUỘT HIỂN THỊ NỘI VI (Inner Core):           |   |   |
|   |   | background: var(--bg-surface) = #ffffff      |   |   |
|   |   | border: 1px solid var(--border-subtle)       |   |   |
|   |   | border-radius: 6px; padding: 20px            |   |   |
|   |   |                                              |   |   |
|   |   |   Nội dung: Văn bản mực đen, số liệu sắc nét |   |   |
|   |   |   Ô tham số: background: var(--bg-canvas)    |   |   |
|   |   +----------------------------------------------+   |   |
|   +------------------------------------------------------+   |
+--------------------------------------------------------------+
```

*Quy tắc bất di bất dịch:* Lòng card nội vi hiển thị dữ liệu chính luôn là màu trắng sáng `#ffffff`, các ô badge/code con có thể dùng màu giấy nền `#f6f5f0`. Khay bao ngoài là khay nhôm mờ `#eceae3`. Loại bỏ hoàn toàn trường hợp khay ngoài trắng mà ruột lại be đục!

---

## 4. Kế Hoạch Thực Thi Từng Bước (Step-by-Step Execution Plan)

### Giai đoạn 1: Thiết Lập Lại Bộ Token Màu Light Mode Trong CSS
- Cập nhật biến CSS trong `src/index.css` cho bộ chọn `[data-theme="light"]`.
- Giảm độ đậm của lưới tọa độ `body::before` xuống `opacity: 0.25` và đổi màu stroke của lưới sang hairline tinh xảo.
- Thêm biến `--bg-surface-inner` để phân định rõ ràng giữa khay đỡ và lòng hiển thị.

### Giai đoạn 2: Sửa Toàn Bộ Lỗi Màu Của Sơ Đồ Mạch (Circuit Diagram)
- Trong `GeometricPipelineDiagram.tsx`:
  - Thay thế màu cố định của các node: DuckDB từ `#fde047` sang `var(--accent-gold)` hoặc `#b45309`; Nomic từ `#34d399` sang `var(--accent-emerald)` hoặc `#047857`; Parquet từ `#60a5fa` sang `#1d4ed8`.
  - Sửa mũi tên SVG: `<path fill="var(--text-muted)" />` để hiển thị rõ ràng trên cả 2 theme.
  - Sửa nền badge thông số của 8 node: dùng `var(--bg-canvas)` thay cho `rgba(255, 255, 255, 0.06)`.
  - Cập nhật tuyến bus SVG và các hạt photon chuyển động để có màu sắc tương phản sắc nét trên nền sáng.

### Giai đoạn 3: Tái Cấu Trúc Khung Vỏ Doppelrand Trên Toàn Bộ Components
- Đồng bộ lại trật tự vỏ kép trên:
  1. `src/App.tsx`: Đồng bộ Header và Navigation Tab Bar cùng tông màu trắng sáng có đường kẻ phân cách tinh xảo.
  2. `src/components/MetricsBento.tsx`: Khay ngoài dùng `--bg-surface-elevated`, ruột trong dùng `--bg-surface` (`#ffffff`).
  3. `src/components/StorageInspector.tsx`: Khung hiển thị bảng partition trắng sáng, ô partition key nền giấy sạch sẽ.
  4. `src/components/PipelineFlow.tsx`: Sửa các card phase và bảng chi tiết theo đúng cấu trúc ruột trắng.
  5. `src/components/LiveTelemetryFeed.tsx`: Sửa thanh điều khiển, nút filter chip chữ trắng trên nền xám than `#0f172a`.
  6. `src/components/ScientificRagConsole.tsx`: Khung synthesis và modal citation abstract/LaTeX trắng sáng, tương phản vượt trội.

### Giai đoạn 4: Kiểm Tra Hồi Quy Trực Quan & Đảm Bảo Chuẩn WCAG AAA
- Chạy kiểm tra contrast ratio trên toàn bộ các cặp chữ/nền ở Light Mode (yêu cầu đạt tối thiểu 7:1 cho text thông thường và 4.5:1 cho text lớn).
- Đảm bảo Dark Mode vẫn giữ nguyên vẹn 100% vẻ đẹp Tactical Obsidian Telemetry không bị xáo trộn.
- Chạy `npm run build && npm run lint` đảm bảo 0 cảnh báo, 0 lỗi.

---

## 5. Kết Luận

Bản kế hoạch này giải quyết tận gốc rễ vấn đề xung đột màu sắc của Light Mode bằng việc:
1. **Loại bỏ màu cát đục `#eae7dd`**, thay thế bằng chất giấy in Thụy Sĩ sang trọng `#f6f5f0`.
2. **Chuẩn hóa lại thứ tự Doppelrand**, đưa ruột card về màu trắng sáng thuần khiết.
3. **Hiệu chỉnh các màu Accent rực rỡ sang tông đậm sâu**, triệt tiêu tình trạng chữ vàng/xanh pastel bị tàng hình.

Toàn bộ kế hoạch đã sẵn sàng để tiến hành thực thi từng bước ngay khi có yêu cầu!
