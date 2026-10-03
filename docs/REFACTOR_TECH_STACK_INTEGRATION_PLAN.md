# Bản Kế Hoạch Tích Hợp Đổi Mới Công Nghệ Từ Nhánh Refactor Cho Frontend
**Refactor Tech Stack Integration & Component Elevation Plan for Frontend**
*Target Branch:* `dev/bush-frontend` | *Source Branch Analyzed:* `dev/bush-refactor` (`origin/refactor`)
*Standard:* High Contrast Swiss Technical Print (WCAG AAA) & Tactical Obsidian Telemetry
*Design Policy:* Zero Em-Dash (`—`) Policy · 100% Full Implementation (No Placeholders)

---

## 1. Tóm Tắt Bối Cảnh & Mục Tiêu Kế Hoạch (Executive Summary)

Nhánh `refactor` (cụ thể là `dev/bush-refactor` được phát triển bởi lập trình viên QuangManhAI) vừa thực hiện một bước chuyển dịch lớn về mặt kiến trúc hệ thống và công nghệ nền tảng:
1. **Thay thế toàn bộ Backend NestJS** bằng một hệ thống backend **FastAPI (Python)** duy nhất, hiệu năng cao, bất đồng bộ trên cổng `8000`.
2. **Triển khai động cơ khai phá dữ liệu khoa học 4 trụ cột** (`data_mining/src/mining/`): Khai phá tập phổ biến & luật kết hợp (FP-Growth), Phân cụm ngữ nghĩa không gian 768 chiều (K-Means & DBSCAN + tọa độ 2D), Khai phá đồ thị đồng tác giả (NetworkX PageRank & Louvain Community), và Phát hiện bất thường cấu trúc & tốc độ xu hướng (Isolation Forest & Trend Velocity).
3. **Phân tích khám phá dữ liệu thời gian thực (Real-time EDA)** qua động cơ phân tích DuckDB trên 10,000 bài báo định dạng Silver/Gold Parquet.
4. **Tái cấu trúc kho mã nguồn thành Polyglot Monorepo**: Chia tách rõ ràng thành `backend/`, `data_mining/` và `frontend/`.

### Vấn đề hiện hữu bên nhánh Frontend (`dev/bush-frontend`)
Mặc dù nhánh `dev/bush-frontend` của chúng ta sở hữu hệ thống thiết kế giao diện đồ họa vượt trội (bảng màu **Swiss Alabaster Print** và **Tactical Obsidian Telemetry**, cấu trúc viền kép **Doppelrand** chuẩn mực WCAG AAA, sơ đồ mạch song song 8 đường dẫn với xung động lực SVG, và bảng điều khiển RAG chuyên sâu), hiện tại nhánh này:
- Vẫn nằm ở thư mục gốc repo thay vì cấu trúc Monorepo `frontend/`.
- Chưa có các màn hình giao diện chuyên biệt để trực quan hóa **4 Trụ Cột Khai Phá Dữ Liệu (4 Mining Pillars)** và **EDA 10,000 bài báo**.
- Chưa kết nối trực tiếp với các API endpoint mới của FastAPI (`/api/mining/...`, `/api/chat`, `/api/storage/stats`) và luồng Server-Sent Events (SSE).

### Hạn chế trong bản giao diện bên nhánh `refactor`
Mặt khác, phiên bản giao diện mà QuangManhAI đưa vào `frontend/` trên nhánh `refactor` mắc phải nhiều suy giảm nghiêm trọng về mặt UI/UX:
- **Xung đột màu sắc Light Mode cũ:** Sử dụng lại file CSS cũ chưa được chuẩn hóa (`--bg-canvas: #eae7dd` màu be bùn), thiếu cặp token `--bg-card-shell` và `--bg-card-core`, dẫn đến hiện tượng lộn ngược Doppelrand và chữ nút bấm bị chìm.
- **Thất lạc các linh kiện cốt lõi:** Bỏ rơi `MetricsBento.tsx` (5 ô Bento chỉ số) và `StorageInspector.tsx` (phân tích lưu trữ Lakehouse).
- **Hạ cấp RAG Console:** Thay thế `ScientificRagConsole.tsx` (với ngăn công thức LaTeX, radar độ tin cậy và thẻ bài báo ArXiv) bằng một form chat thô sơ (`GroundedRagChat.tsx`).
- **Lạm dụng viền đỏ cơ học:** Tràn ngập mã màu cố định `#ef4444` và bảng biểu đơn điệu, thiếu chiều sâu kỹ thuật.

### Sứ mệnh của bản kế hoạch này
Tiến hành **nâng cấp, dung hợp và hoàn thiện giao diện nhánh `dev/bush-frontend`**: Giữ nguyên vẹn 100% tinh hoa thiết kế Swiss Alabaster / Obsidian, tích hợp toàn bộ các năng lực công nghệ mới từ nhánh refactor (FastAPI, DuckDB EDA, 4 Mining Pillars, Realtime SSE), đưa ứng dụng lên đẳng cấp một **Trung Tâm Chỉ Huy Khai Phá Dữ Liệu Khoa Học Đích Thực (Scientific Mission Control)**.

---

## 2. Ma Trận Đối Soát Công Nghệ: Cũ vs Refactor vs Đề Xuất Frontend

| Chiều kiến trúc | Bản gốc ban đầu (`front-end`) | Bản chuyển đổi (`dev/bush-refactor`) | Bản nâng cấp đề xuất (`dev/bush-frontend`) |
|---|---|---|---|
| **Cấu trúc Repository** | Flat Single-Project (React ở thư mục gốc) | Polyglot Monorepo (`backend/`, `data_mining/`, `frontend/`) | Chuẩn hóa cấu trúc để tương thích tuyệt đối với Monorepo khi merge. |
| **Backend Serving** | NestJS Gateway (:8000) + Node-llama-cpp (:9001) | **FastAPI Python (:8000)** (Uvicorn, Pydantic v2, Async) | Kết nối client qua Vite Proxy tới FastAPI (:8000) với cơ chế Offline Fallback tự động. |
| **Động cơ Khai phá Dữ liệu** | Scripts rời rạc | **4 Trụ Cột Python (`data_mining`)**: FP-Growth, K-Means/DBSCAN, NetworkX, Isolation Forest | Xây dựng bảng điều khiển **4 Mining Pillars Console** với đồ thị phân tán 2D và bảng lọc động. |
| **Phân tích EDA** | Không có màn hình riêng | **DuckDB Real-time EDA** trên 10,000 papers Silver Parquet | Xây dựng **Real-Time EDA View** với thẻ chỉ số Doppelrand, phân bố thể loại và quantiles LaTeX. |
| **Giao thức Telemetry** | Polling giả lập tĩnh | **Server-Sent Events (SSE)** `/api/mining/telemetry/stream` | Tích hợp luồng SSE trực tiếp vào `LiveTelemetryFeed.tsx` và Header status indicator. |
| **Scientific RAG** | Mock response nội bộ | Gọi POST `/api/chat` trả về grounded citations + similarity | Kết nối `/api/chat` vào `ScientificRagConsole.tsx` cao cấp (giữ nguyên LaTeX drawer và confidence radar). |
| **Lưu trữ Lakehouse** | Mock số liệu | Endpoint thực `/api/storage/stats` (Cloudflare R2 Bucket) | Kết nối số liệu thực vào `StorageInspector.tsx` và `GeometricTelemetryGauges.tsx`. |
| **Độ hoàn thiện UI/UX** | Sơ khai | Brutalist thô ráp, mất Bento, vỡ Light Mode | **Swiss Industrial Print (Light) & Obsidian (Dark)**, WCAG AAA, viền kép Doppelrand. |

---

## 3. Kiến Trúc 5 Tab Trung Tâm Chỉ Huy (5-Tab Mission Control Architecture)

Để tích hợp toàn diện mọi thành phần từ nhánh refactor mà không làm rối mắt người dùng, hệ thống điều hướng chính của `dev/bush-frontend` sẽ được tổ chức thành **5 Tab tác vụ chuyên sâu**:

```
+==================================================================================================+
|  UTH-AI // MISSION CONTROL   [ FASTAPI ONLINE ] [ R2 QUOTA: 5.52 GB / 10 GB (55.2%) ]  [THEME]  |
+==================================================================================================+
| [01] LAKEHOUSE SCHEMATIC | [02] REAL-TIME EDA | [03] 4 MINING PILLARS | [04] SCIENTIFIC RAG | [05] LOGS & ENGINES |
+==================================================================================================+
|                                                                                                  |
|  TAB 01: Sơ đồ dòng chảy dữ liệu Medallion Lakehouse, Bento 5 chỉ số, R2 Storage Inspector      |
|  TAB 02: Báo cáo EDA 10,000 bài báo ArXiv, phân bố thể loại, mật độ công thức LaTeX, DuckDB     |
|  TAB 03: 4 Trụ Cột Khai Phá (Luật FP-Growth, Phân cụm 2D K-Means, Đồ thị PageRank, Dị biệt)     |
|  TAB 04: Bảng hỏi đáp RAG Khoa học với trích dẫn Grounded, ngăn công thức LaTeX và Radar tin cậy |
|  TAB 05: Luồng nhật ký Telemetry thời gian thực (SSE) và danh bạ thông số 8 công cụ hạt nhân    |
|                                                                                                  |
+==================================================================================================+
```

### Chi tiết nội dung từng Tab:

#### Tab 01: Lakehouse Schematic & Storage (Kiến trúc Dữ liệu Medallion)
- **Linh kiện tích hợp:**
  - `GeometricPipelineDiagram.tsx`: Sơ đồ mạch song song 8 đường trace với xung động lực hạt photon dữ liệu và nút bấm chuyển đổi Topology.
  - `GeometricTelemetryGauges.tsx`: Đồng hồ đo dung lượng R2 Storage Arc (55.2%), ma trận 144 cell tensor latent 768 chiều, và đồ thị tần số xung nhịp Metal GPU.
  - `MetricsBento.tsx`: Hệ thống Bento 5 ô chỉ số (Volume, LaTeX, Storage, Vectors, Hardware) với modal drill-down kiểm tra sâu từng chỉ số.
  - `StorageInspector.tsx`: Bảng phân tích chi tiết dung lượng 3 tầng Bronze (JSON/HTML), Silver (Parquet), Gold (LanceDB Vectors).

#### Tab 02: Real-Time Scientific EDA (Khám Phá Dữ Liệu Bài Báo Khoa Học)
- **Linh kiện tích hợp:** Xây dựng mới `src/components/EdaView.tsx` theo chuẩn Swiss Doppelrand.
- **Nguồn dữ liệu:** Endpoint `/api/mining/eda` (xử lý bởi DuckDB).
- **Các khối giao diện:**
  1. *Executive Stat Row:* 4 thẻ Doppelrand hiển thị Tổng bài báo (10,000), Tổng công thức LaTeX (2,224,192), Tỷ lệ làm giàu HTML (91.8%), và Tổng từ vựng (45.3M từ).
  2. *Category Distribution Spectrum:* Phân bố 10 thể loại chính (`cs.AI`, `cs.LG`, `cs.CV`, `cs.CL`, `stat.ML`, etc.) kèm thanh tiến trình trực quan và mật độ công thức trung bình trên mỗi thể loại.
  3. *Math & Word Quantile Matrix:* Bảng phân tích tứ phân vị (P25, Trung vị, P75, P95, Max) cho cả số lượng công thức toán học và độ dài bài viết.
  4. *Top Prolific Authors & Cross-Discipline Co-occurrence:* Top các nhà khoa học có nhiều công bố nhất trong tập dữ liệu và ma trận đồng xuất hiện giữa các nhánh nghiên cứu.

#### Tab 03: 4 Mining Pillars Console (Bảng Điều Khiển 4 Trụ Cột Khai Phá)
- **Linh kiện tích hợp:** Xây dựng mới `src/components/MiningPillarsView.tsx` theo phong cách kỹ thuật cao cấp.
- **Nguồn dữ liệu:** 4 endpoint tương ứng của FastAPI:
  - Pillar 1: `/api/mining/pillars/association-rules` (FP-Growth).
  - Pillar 2: `/api/mining/pillars/clusters` (K-Means & DBSCAN + 2D Scatter).
  - Pillar 3: `/api/mining/pillars/graph` (Co-authorship Network).
  - Pillar 4: `/api/mining/pillars/trends` (Isolation Forest & Trend Velocity).
- **Các khối giao diện:**
  1. *Sub-navigation Bar:* Thanh chọn 4 trụ cột với các chỉ báo mã số kỹ thuật `[ PILLAR 01 ]` đến `[ PILLAR 04 ]`.
  2. *Pillar 01 (Association Rules):* Bộ lọc trượt tương tác cho ngưỡng Lift Ratio ($\ge 1.0$ đến $2.5$), bảng luật khai phá hiển thị Tiền đề (Antecedents), Hệ quả (Consequents), Support, Confidence, Lift, Leverage và Conviction.
  3. *Pillar 02 (Topic Clustering):* Biểu đồ phân tán 2D (Interactive Scatter Plot) chiếu tọa độ PCA/UMAP của các vector 768 chiều với màu sắc theo cụm chủ đề; thẻ chỉ số đánh giá phân cụm Silhouette Score (0.342), Davies-Bouldin Index (1.18), và Calinski-Harabasz Index; danh sách hồ sơ cụm chủ đề.
  4. *Pillar 03 (Co-Authorship Graph):* Bảng tóm tắt mạng lưới liên kết (Mật độ mạng, số thành phần liên thông, số cộng đồng Louvain phát hiện được), bảng xếp hạng các tác giả có ảnh hưởng lớn nhất theo PageRank Centrality và Degree Centrality.
  5. *Pillar 04 (Anomaly & Trend Velocity):* Danh sách các bài báo có cấu trúc dị biệt phát hiện bằng Isolation Forest (mật độ công thức toán bất thường, độ dài vượt ngưỡng, số lượng đồng tác giả đột biến); bảng đo gia tốc xu hướng (Trend Velocity) với các nhãn xung lượng: `ACCELERATING`, `STEADY`, `COOLING`.

#### Tab 04: Scientific Grounded RAG (Hệ Thống Trả Lời Khoa Học Có Căn Cứ)
- **Linh kiện tích hợp:** Nâng cấp `src/components/ScientificRagConsole.tsx`.
- **Nguồn dữ liệu:** Endpoint POST `/api/chat` kết hợp LanceDB Vector Search và Prompt căn cứ học thuật.
- **Tính năng cao cấp:**
  1. Thanh nhập truy vấn ngôn ngữ tự nhiên với gợi ý câu hỏi nghiên cứu mẫu.
  2. Kết nối API thực `/api/chat` để sinh câu trả lời trong thời gian thực, có chế độ Fallback mượt mà khi backend offline.
  3. Ngăn kiểm tra sâu công thức LaTeX trích xuất từ tài liệu bài báo.
  4. Drawer xem chi tiết bài báo ArXiv với mã bài báo, tác giả, snippet tóm tắt và độ tương đồng cosine.
  5. Radar hiển thị độ tin cậy và thông số đo lường hiệu năng suy luận (Tokens/s, Latency).

#### Tab 05: Telemetry, Logs & Tool Registry (Giám Sát Hệ Thống & Bộ Công Cụ)
- **Linh kiện tích hợp:**
  - `LiveTelemetryFeed.tsx`: Kết nối với luồng Server-Sent Events (SSE) `/api/mining/telemetry/stream` để cập nhật log thời gian thực từ động cơ Python; hỗ trợ lọc log level (INFO, SUCCESS, TRACE, METRIC), tìm kiếm và tạm dừng luồng.
  - `ToolLogos.tsx`: Bảng danh bạ 8 công cụ hạt nhân (DuckDB, LanceDB, Qwen2.5, Parquet, Nomic Embed, ArXiv OAI-PMH, FastAPI, Cloudflare R2) với thông số kỹ thuật, protocol và mô hình giấy phép.

---

## 4. Kế Hoạch Chuẩn Hóa Cấu Trúc Mã Nguồn & Định Tuyến (Technical Implementation Plan)

### 4.1. Cấu hình Vite Proxy kết nối FastAPI
Trong file `vite.config.ts`, cấu hình proxy chuyển tiếp các request API từ cổng frontend sang backend FastAPI tại cổng `8000`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
});
```

### 4.2. Xây dựng tầng API Client & Types (`src/api/`)
Tạo thư mục `src/api/` trên `dev/bush-frontend` bao gồm:
1. `src/api/types.ts`: Toàn bộ các định nghĩa kiểu dữ liệu TypeScript cho EDA, 4 Trụ cột (Association Rules, Clusters, Graph, Trends), Storage Stats, Chat và Telemetry (kế thừa đầy đủ cấu trúc từ nhánh refactor).
2. `src/api/client.ts`: Các hàm fetch bất đồng bộ (`fetchHealth`, `fetchEdaSummary`, `fetchAssociationRules`, `fetchClusters`, `fetchGraph`, `fetchTrends`, `fetchStorageStats`, `sendChatQuery`, `subscribeTelemetry`).
3. **Cơ chế Tự Động Dự Phòng (Graceful Offline Fallback):** Khi backend FastAPI chưa được bật, client sẽ tự động cung cấp dữ liệu mô phỏng chuẩn xác từ kho lưu trữ pre-computed data để người dùng có thể duyệt toàn bộ giao diện mà không gặp bất kỳ lỗi trắng màn hình nào.

### 4.3. Thiết kế thẩm mỹ các linh kiện mới theo chuẩn Swiss Alabaster
Toàn bộ code mới cho `EdaView.tsx` và `MiningPillarsView.tsx` phải tuân thủ nghiêm ngặt hệ thống design tokens đã hiệu chỉnh:
- **Khung vỏ thẻ:** Sử dụng `background: var(--bg-card-shell)` và `border: 1px solid var(--border-subtle)`.
- **Lõi ruột thẻ:** Sử dụng `background: var(--bg-card-core)` và `borderRadius: calc(var(--radius-md) - 2px)`.
- **Huy hiệu và Nhãn:** Sử dụng các biến màu động `--accent-emerald`, `--accent-silver`, `--accent-bronze`, `--accent-violet`, `--accent-gold`, tuyệt đối không dùng mã hex cố định của Dark Mode để tránh vỡ giao diện ở Light Mode.
- **Kiểu chữ:** Tiêu đề dùng `Geist Sans`, số liệu và nhãn kỹ thuật dùng `Geist Mono` với font-variant numeric `tabular-nums`.

---

## 5. Lộ Trình Thực Thi Từng Bước (Step-by-Step Execution Roadmap)

### Bước 1: Khởi tạo nền tảng API Client & Cấu hình mạng
- Bổ sung cấu hình proxy trong `vite.config.ts`.
- Tạo `src/api/types.ts` với đầy đủ định nghĩa interface cho 4 trụ cột, EDA, Chat, và Storage.
- Tạo `src/api/client.ts` hỗ trợ gọi API FastAPI và luồng SSE, kèm bộ dữ liệu Fallback hoàn chỉnh cho chế độ Offline Demo.

### Bước 2: Xây dựng linh kiện Real-time EDA View (`src/components/EdaView.tsx`)
- Thiết kế 4 khối chỉ số tổng quan với viền kép Doppelrand.
- Xây dựng bảng biểu đồ phân bố 10 thể loại bài báo kèm mật độ công thức toán.
- Thiết kế bảng ma trận phân vị (Quantiles) và danh sách các tác giả hàng đầu.
- Tích hợp công tắc chuyển đổi giữa số liệu Parquet thực tế và phân tích nội dung.

### Bước 3: Xây dựng linh kiện 4 Trụ Cột Khai Phá (`src/components/MiningPillarsView.tsx`)
- **Pillar 1:** Bảng luật kết hợp FP-Growth với thanh trượt lọc ngưỡng Lift tương tác và màu sắc phân biệt tiền đề/hệ quả.
- **Pillar 2:** Bản đồ tọa độ 2D phân cụm vector ngữ nghĩa với bảng tooltip hover thông tin bài báo và thẻ đánh giá Silhouette.
- **Pillar 3:** Mạng lưới liên kết đồng tác giả với bảng xếp hạng PageRank Centrality và phát hiện cộng đồng Louvain.
- **Pillar 4:** Bảng danh sách bài báo bất thường (Isolation Forest) và thước đo gia tốc xu hướng (Trend Velocity).

### Bước 4: Nâng cấp bảng điều khiển RAG Khoa học (`src/components/ScientificRagConsole.tsx`)
- Tích hợp hàm `sendChatQuery` từ `src/api/client.ts` để gửi câu hỏi trực tiếp tới backend FastAPI.
- Kết nối hiển thị trích dẫn bài báo thực từ LanceDB Vector Index.
- Giữ vững toàn bộ tính năng cao cấp đã làm: drawer công thức LaTeX, radar độ tin cậy, và thông số độ trễ xử lý.

### Bước 5: Kết nối luồng Telemetry thời gian thực (`src/components/LiveTelemetryFeed.tsx`)
- Tích hợp `subscribeTelemetry` để lắng nghe các sự kiện Server-Sent Events phát ra từ FastAPI.
- Cập nhật chỉ báo trạng thái trên Header: `● FASTAPI ONLINE [HH:MM:SS]` khi nhận tín hiệu SSE thành công.

### Bước 6: Cấu trúc lại thanh điều hướng chính & Header trong `src/App.tsx`
- Mở rộng thanh điều hướng thành **5 Tab** tác vụ chuyên biệt (`schematic`, `eda`, `pillars`, `rag`, `logs`).
- Cập nhật số liệu R2 Storage Quota trên Header bằng dữ liệu từ `/api/storage/stats`.
- Đảm bảo hiệu ứng chuyển tab mượt mà, phản hồi ngay lập tức, hỗ trợ phím tắt và duy trì trạng thái theme.

### Bước 7: Kiểm thử toàn diện & Rà soát chất lượng
- Chạy kiểm tra quy chuẩn linter: `npm run lint` (đảm bảo 0 warning, 0 error).
- Chạy kiểm tra định kiểu TypeScript và build production: `npm run build`.
- Rà soát chính sách không sử dụng em-dash: `grep -rn "—" src/`.
- Kiểm tra tính tương thích thị giác 100% trên cả **Light Mode** và **Dark Mode**.

---

## 6. Chiến Lược Hợp Nhất Vào Monorepo Khi Hoàn Thành (Monorepo Alignment Strategy)

Khi nhóm quyết định hợp nhất nhánh frontend vào cấu trúc Monorepo chính thức của dự án:
1. Toàn bộ mã nguồn đã hoàn thiện trên `dev/bush-frontend` (bao gồm `src/`, `package.json`, `vite.config.ts`, `index.html`) sẽ sẵn sàng di chuyển nguyên vẹn vào thư mục `frontend/` của Monorepo.
2. Mọi đường dẫn tương đối và cấu hình proxy tới backend FastAPI (`http://127.0.0.1:8000`) đều đã được thiết kế tương thích sẵn, không cần chỉnh sửa logic.
3. Phiên bản giao diện này sẽ thay thế hoàn toàn bản thô sơ của QuangManhAI trong `frontend/`, đem lại một sản phẩm hoàn chỉnh, đẹp mắt và chuẩn mực kỹ thuật cao nhất cho buổi báo cáo dự án.
