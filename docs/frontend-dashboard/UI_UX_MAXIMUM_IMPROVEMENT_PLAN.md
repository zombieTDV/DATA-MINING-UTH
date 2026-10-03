# UI/UX MAXIMUM IMPROVEMENT PLAN

## UTH Scientific Data Mining - Mission Control Dashboard

**Version:** 2.0  
**Created:** October 3, 2026  
**Branch:** `dev/bush-frontend`  
**Status:** READY FOR EXECUTION  

> This plan is the result of a full-codebase audit across all 12 components, the design system,
> API layer, and type definitions. Every item maps to a concrete file, line range, and measurable
> acceptance criterion. No placeholders, no vague objectives.

---

## TABLE OF CONTENTS

1. [Current State Assessment](#1-current-state-assessment)
2. [Component Inventory & Gap Analysis](#2-component-inventory--gap-analysis)
3. [Execution Phases](#3-execution-phases)
   - [Phase 1: Accessibility & Global UX Infrastructure](#phase-1-accessibility--global-ux-infrastructure)
   - [Phase 2: Responsive Design & Mobile Experience](#phase-2-responsive-design--mobile-experience)
   - [Phase 3: Scientific Data Visualization Upgrades](#phase-3-scientific-data-visualization-upgrades)
   - [Phase 4: Researcher Experience & Interaction Polish](#phase-4-researcher-experience--interaction-polish)
   - [Phase 5: Performance Optimization & Production Hardening](#phase-5-performance-optimization--production-hardening)
4. [Priority Matrix](#4-priority-matrix)
5. [Success Criteria & Quality Gates](#5-success-criteria--quality-gates)
6. [Files Modified Per Phase](#6-files-modified-per-phase)

---

## 1. CURRENT STATE ASSESSMENT

### What Is Already Strong

| Area | Status | Evidence |
|------|--------|----------|
| Color System (Dark Mode) | Excellent | Tactical Obsidian `#05070c` with 4-layer depth hierarchy. Contrast up to 20:1. |
| Color System (Light Mode) | Good | Nordic Lab White `#f8fafc`. Clean and clinical. |
| Typography Pairing | Excellent | Geist + Geist Mono. Tabular numbers applied correctly. |
| Offline Resilience | Excellent | 100% demo fallback datasets in `api/client.ts`. Zero blank screens. |
| KaTeX Math Rendering | Excellent | Local offline font bundling. Regex Unicode fallback. Zero CDN latency. |
| Keyboard Shortcuts | Good | `[1]-[5]` tab switching, `[T]` theme toggle, `Ctrl+Enter` query submit. |
| Double-Bezel Card Architecture | Excellent | Shell/Core layering creates authentic hardware instrument depth. |
| Circuit Schematic Animation | Excellent | Kinetic SVG electron packets with speed controls. |
| Data Mining Interactivity | Good | Lift slider, cluster isolation, category search, anomaly search all functional. |

### What Needs Improvement (Audit Findings)

| # | Area | Severity | Current Gap |
|---|------|----------|-------------|
| 01 | **Accessibility (WCAG)** | HIGH | No ARIA tab semantics, no focus rings, no skip-to-content link, no screen reader labels. |
| 02 | **Responsive / Mobile** | HIGH | Layout breaks below 980px. Circuit diagram forces horizontal scroll. Tables overflow on mobile. |
| 03 | **Loading States** | MEDIUM | Plain text loading messages instead of skeleton shimmer screens matching component geometry. |
| 04 | **Error & Empty States** | MEDIUM | Silent fallback to demo data. User cannot distinguish live vs offline. No illustrated empty states. |
| 05 | **Toast / Notification System** | MEDIUM | Clipboard feedback via inline button text swap causes layout twitching. No global notification bus. |
| 06 | **Form Controls** | MEDIUM | RAG query uses single-line `<input>`. Sliders use unstyled browser defaults. No debounced search. |
| 07 | **Data Visualization Fidelity** | HIGH | IQR box-plots hardcoded. Co-occurrence heatmap missing. Graph mining has no network visualization. |
| 08 | **Table Interactivity** | MEDIUM | No column sorting. No pagination. No CSV/JSON export. |
| 09 | **Navigation Deep Linking** | LOW | Tab state not synced to URL hash. No bookmarkable views. No back-to-top button. |
| 10 | **Performance** | MEDIUM | No code splitting. Hover states trigger React re-renders. No API response caching. |
| 11 | **Onboarding & Discoverability** | MEDIUM | Power features rely on exploratory discovery. No shortcuts modal. No welcome banner. |
| 12 | **Typography Minimum Sizes** | LOW | Several labels use 9px-10px text. Sub-optimal readability on standard DPI screens. |

---

## 2. COMPONENT INVENTORY & GAP ANALYSIS

### Full Component Map (12 Components)

| Component | File | Lines | Role | Gap Level |
|-----------|------|-------|------|-----------|
| `App.tsx` | `src/App.tsx` | 525 | Shell, Navigation, Header, Theme, Footer | MEDIUM |
| `MetricsBento.tsx` | `src/components/MetricsBento.tsx` | 383 | Overview KPI Cards | MEDIUM |
| `GeometricPipelineDiagram.tsx` | `src/components/GeometricPipelineDiagram.tsx` | 531 | Interactive Bus Circuit Schematic | MEDIUM |
| `GeometricTelemetryGauges.tsx` | `src/components/GeometricTelemetryGauges.tsx` | 242 | SVG Radial Arc, Tensor Matrix, GPU Equalizer | LOW |
| `EdaView.tsx` | `src/components/EdaView.tsx` | 575 | Exploratory Data Analysis Module | HIGH |
| `MiningPillarsView.tsx` | `src/components/MiningPillarsView.tsx` | 939 | 4 Data Mining Pillars Workstation | HIGH |
| `ScientificRagConsole.tsx` | `src/components/ScientificRagConsole.tsx` | 841 | Researcher RAG Query Console | HIGH |
| `LiveTelemetryFeed.tsx` | `src/components/LiveTelemetryFeed.tsx` | 363 | SSE Real-Time Log Viewer | MEDIUM |
| `StorageInspector.tsx` | `src/components/StorageInspector.tsx` | 240 | R2 Storage Partition Breakdown | LOW |
| `PipelineFlow.tsx` | `src/components/PipelineFlow.tsx` | 214 | 4-Phase Sequential Stepper | LOW |
| `ToolLogos.tsx` | `src/components/ToolLogos.tsx` | 425 | Technology Registry & Spec Bay | LOW |
| `MathRenderer.tsx` | `src/components/MathRenderer.tsx` | 178 | KaTeX Formula Engine | LOW |

### Supporting Files

| File | Lines | Role | Gap Level |
|------|-------|------|-----------|
| `src/index.css` | 232 | Design System Tokens & Animations | MEDIUM |
| `src/api/client.ts` | 547 | API Client & Offline Fallback | MEDIUM |
| `src/api/types.ts` | 233 | TypeScript Data Models | LOW |

---

## 3. EXECUTION PHASES

---

### PHASE 1: Accessibility & Global UX Infrastructure

**Goal:** Achieve WCAG 2.1 AA compliance across all interactive elements. Build shared UX
infrastructure (toast system, focus management, ARIA patterns) that every subsequent phase depends on.

**Estimated Complexity:** MEDIUM  
**Files Touched:** `src/index.css`, `src/App.tsx`, `src/components/MetricsBento.tsx`

#### Task 1.1: Global Focus Ring System

**File:** `src/index.css`

Add a universal `:focus-visible` rule that provides a high-contrast, non-intrusive focus indicator
on all interactive elements (buttons, inputs, links, custom controls).

```css
/* Global accessible focus ring */
:focus-visible {
  outline: 2px solid var(--accent-silver);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Remove default outline only when not keyboard-navigating */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Acceptance Criteria:**
- Every button, input, and link shows a visible 2px outline when focused via keyboard (Tab).
- Mouse clicks do not trigger the outline.
- Outline color adapts to dark/light mode via CSS variable.

#### Task 1.2: WAI-ARIA Tab Navigation Pattern

**File:** `src/App.tsx`

Retrofit the floating capsule navigation bar with proper ARIA tab semantics.

**Changes Required:**
- Wrap tab buttons in a container with `role="tablist"` and `aria-label="Dashboard navigation"`.
- Each tab button receives `role="tab"`, `aria-selected={isActive}`, `aria-controls="tabpanel-{id}"`, and `id="tab-{id}"`.
- The active content pane receives `role="tabpanel"`, `aria-labelledby="tab-{id}"`, `id="tabpanel-{id}"`, and `tabIndex={0}`.
- Implement `ArrowLeft` / `ArrowRight` keyboard navigation within the tablist to cycle between tabs (WAI-ARIA Authoring Practices).

**Acceptance Criteria:**
- Screen reader announces "Tab 1 of 5, Schematic, selected" when focused.
- Arrow keys cycle through tabs without leaving the tablist.
- `Tab` key moves focus from the tablist to the active panel content.

#### Task 1.3: Skip-to-Content Link

**File:** `src/App.tsx`

Add a visually hidden skip link as the very first focusable element in the DOM.

```tsx
<a
  href="#main-content"
  style={{
    position: 'absolute',
    left: '-9999px',
    top: 'auto',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  }}
  onFocus={(e) => {
    e.currentTarget.style.position = 'fixed';
    e.currentTarget.style.left = '16px';
    e.currentTarget.style.top = '16px';
    e.currentTarget.style.width = 'auto';
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.zIndex = '9999';
  }}
  onBlur={(e) => {
    e.currentTarget.style.position = 'absolute';
    e.currentTarget.style.left = '-9999px';
  }}
>
  Skip to main content
</a>
```

**Acceptance Criteria:**
- Pressing `Tab` on page load reveals the skip link.
- Activating it scrolls focus to `#main-content` (the tab panel container).

#### Task 1.4: Global Toast Notification System

**File:** New `src/components/ToastNotification.tsx` + integrate in `src/App.tsx`

Create a lightweight, accessible toast notification component with no external dependencies.

**Specification:**
- Position: Fixed bottom-right corner (`bottom: 20px`, `right: 20px`).
- Stack: Maximum 3 toasts visible. Older toasts slide up.
- Auto-dismiss: 3 seconds default, configurable.
- Types: `success` (green), `info` (silver), `error` (red), `warning` (bronze).
- Accessibility: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`.
- Animation: Slide-in from right with `translateX(100%)` to `translateX(0)`.
- Context: `ToastContext` + `useToast()` hook for global access from any component.

**Usage Pattern:**
```tsx
const { showToast } = useToast();
showToast({ type: 'success', message: 'BibTeX citation copied to clipboard' });
```

**Acceptance Criteria:**
- All existing clipboard copy actions (`[COPY]`, `[BIBTEX]`, S3 path copy) use the toast system.
- Toasts auto-dismiss without layout shift.
- Screen readers announce toast messages via `aria-live`.

#### Task 1.5: Eliminate React Re-render on Hover (MetricsBento)

**File:** `src/components/MetricsBento.tsx`

Replace `useState<number | null>(hoveredCard)` with `onMouseEnter`/`onMouseLeave` with pure CSS
`:hover` classes on card elements. This eliminates unnecessary React reconciliation cycles on every
mouse movement.

**Changes Required:**
- Remove `hoveredCard` state and all `setHoveredCard` calls.
- Add a CSS class `.bento-card` in `src/index.css` with `:hover` styles (transform, box-shadow, border-color).
- Apply the class to each card `div`.

**Acceptance Criteria:**
- Cards still show hover glow and scale effect.
- React DevTools Profiler shows zero re-renders during mouse hover over cards.

#### Task 1.6: Light Mode Contrast Fix

**File:** `src/index.css`

Darken secondary text color in light mode from `#64748b` to `#475569` to guarantee WCAG AAA
contrast ratio (> 7:1) against elevated surface backgrounds (`#f1f5f9`).

**Changes Required:**
```css
[data-theme='light'] {
  --text-secondary: #475569;  /* Was #64748b (4.6:1) -> Now 7.3:1 */
}
```

**Acceptance Criteria:**
- All secondary text in light mode passes WCAG AAA contrast check (> 7:1).
- Verify with browser DevTools accessibility inspector or axe-core.

#### Task 1.7: Minimum Typography Size Standardization

**File:** Multiple components

Audit and raise the minimum font size floor:
- **Body text and labels:** Minimum `11.5px` (was `9px`-`10px` in several places).
- **Keycap badges and micro-labels:** Allowed to remain at `10px` (monospace only).
- **Line height on paragraph text:** `1.6` minimum for readability (abstracts, descriptions).

**Acceptance Criteria:**
- No non-decorative text in the application renders below 11px.
- Abstracts and multi-line descriptions use `line-height: 1.6`.

---

### PHASE 2: Responsive Design & Mobile Experience

**Goal:** The dashboard renders cleanly and remains fully functional on viewports from 375px (mobile)
to 2560px (ultrawide). No horizontal scrollbars. No content clipping. No touch target violations.

**Estimated Complexity:** HIGH  
**Files Touched:** `src/index.css`, `src/App.tsx`, `src/components/GeometricPipelineDiagram.tsx`, `src/components/LiveTelemetryFeed.tsx`, `src/components/StorageInspector.tsx`, `src/components/MiningPillarsView.tsx`

#### Task 2.1: Responsive Breakpoint Token System

**File:** `src/index.css`

Define a standard responsive breakpoint scale as CSS comments (for developer reference) and implement
corresponding `@media` queries:

```
/* Breakpoint Scale:
   --bp-sm:  640px   (mobile landscape)
   --bp-md:  768px   (tablet portrait)
   --bp-lg:  1024px  (tablet landscape / small laptop)
   --bp-xl:  1280px  (desktop)
   --bp-2xl: 1536px  (large desktop / ultrawide)
*/
```

**Acceptance Criteria:**
- All responsive layouts reference these standard breakpoints.
- No hardcoded magic numbers like `980px` remain in the codebase.

#### Task 2.2: Responsive Navigation (Mobile Drawer)

**File:** `src/App.tsx`

On viewports below 768px (`--bp-md`):
- Collapse the floating capsule navigation bar into a compact hamburger icon button.
- Tapping the hamburger opens a full-height slide-in drawer from the left edge.
- Drawer contains all 5 tab buttons in a vertical stack with larger touch targets (min 48px height).
- Drawer has a backdrop overlay and closes on backdrop tap or `Escape` key.
- Header compacts: Hide the observatory clock and reduce branding to `UTH` badge only.

On viewports between 768px and 1024px:
- Capsule bar remains horizontal but reduces padding and hides keycap badges `[1]-[5]`.
- Status badges (`LIVE`, `10K DOCS`) collapse into a single `...` overflow indicator.

**Acceptance Criteria:**
- Tab navigation is fully functional on a 375px viewport with no horizontal scroll.
- Drawer opens/closes with a smooth 200ms slide animation.
- Touch targets meet the 48px minimum accessibility guideline.

#### Task 2.3: Responsive Circuit Schematic (Vertical Lineage)

**File:** `src/components/GeometricPipelineDiagram.tsx`

On viewports below 1024px:
- Replace the 8-node horizontal bus circuit with a vertical lineage layout.
- Each node renders as a full-width card stacked vertically.
- Animated SVG traces run vertically between cards.
- Speed controls and inspection bay remain functional.

**Implementation Strategy:**
- Detect viewport width via a `useMediaQuery(1024)` hook or CSS container query.
- Render a simplified vertical layout with the same data and interaction model.

**Acceptance Criteria:**
- Circuit schematic is fully readable on a 375px mobile viewport.
- Node selection, inspection bay, and speed controls work identically.
- No horizontal scrollbar appears at any viewport width.

#### Task 2.4: Responsive Table-to-Card Transformation

**Files:** `src/components/MiningPillarsView.tsx`, `src/components/LiveTelemetryFeed.tsx`, `src/components/StorageInspector.tsx`

On viewports below 768px, transform data tables into stacked card layouts:
- Each table row becomes a bordered card.
- Column headers become inline labels within the card.
- Sort controls and search filters remain accessible above the card stack.

**Pattern:**
```css
@media (max-width: 768px) {
  .responsive-table thead { display: none; }
  .responsive-table tr {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 12px;
    margin-bottom: 8px;
  }
  .responsive-table td::before {
    content: attr(data-label);
    font-weight: 700;
    font-size: 10px;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
}
```

**Acceptance Criteria:**
- All data tables render as readable stacked cards on mobile.
- No horizontal scrollbar on any table at 375px viewport.

#### Task 2.5: PCA Scatter Plot Touch Targets

**File:** `src/components/MiningPillarsView.tsx`

Increase scatter point touch targets on mobile:
- Increase base radius from `r={1.6}` to `r={2.8}` on touch devices.
- Add an invisible larger hit area circle (`r={8}`, `fill="transparent"`) behind each visible point.
- On touch, show the tooltip as a bottom sheet instead of an overlay inside the SVG.

**Acceptance Criteria:**
- Users can reliably tap individual scatter points on a phone screen.
- Tooltip content is fully readable on a 375px viewport.

---

### PHASE 3: Scientific Data Visualization Upgrades

**Goal:** Transform static and approximate visualizations into dynamically calculated, interactive,
and publication-quality data displays worthy of a scientific research platform.

**Estimated Complexity:** HIGH  
**Files Touched:** `src/components/EdaView.tsx`, `src/components/MiningPillarsView.tsx`

#### Task 3.1: Dynamic IQR Box-Plot Calculations

**File:** `src/components/EdaView.tsx`

Replace hardcoded IQR gauge positions with dynamically computed values from the API response.

**Current Problem:**
```tsx
// HARDCODED - Does not reflect actual data
left: '15%', width: '38%'  // IQR box position
left: '32%'                 // Median marker
```

**Required Fix:**
```tsx
const stats = edaData.math_and_content_stats;
const max = stats.math_formula_density.max;
const p25Pct = (stats.math_formula_density.p25 / max) * 100;
const medianPct = (stats.math_formula_density.median / max) * 100;
const p75Pct = (stats.math_formula_density.p75 / max) * 100;
const iqrWidth = p75Pct - p25Pct;
```

**Acceptance Criteria:**
- IQR box spans exactly from P25 to P75 relative to the maximum value.
- Median marker is positioned at the exact percentile.
- Whiskers extend to P5 and P95.
- Values update dynamically when the API returns different datasets.

#### Task 3.2: Category Co-occurrence Chromatic Heatmap

**File:** `src/components/EdaView.tsx`

Replace the current text chip display of cross-disciplinary pairs with an interactive chromatic
heatmap matrix.

**Specification:**
- Matrix grid: Rows and columns are category labels.
- Cell color intensity: Cool blue (low co-occurrence) to warm amber (high co-occurrence) gradient.
- Cell value: Co-occurrence count displayed on hover tooltip.
- Row/Column highlight: Hovering a cell highlights its entire row and column.
- Legend: Color gradient bar with numeric scale.

**Data Source:** `edaData.cross_disciplinary_pairs`

**Acceptance Criteria:**
- Heatmap renders a symmetric matrix with categories on both axes.
- Hovering a cell shows the exact co-occurrence count and both category names.
- Color gradient is perceptually uniform (no misleading color jumps).

#### Task 3.3: Interactive Column Sorting on All Tables

**Files:** `src/components/MiningPillarsView.tsx`, `src/components/EdaView.tsx`

Add clickable column headers with ascending/descending sort toggles on all data tables.

**Tables to Upgrade:**
1. Pillar 1: FP-Growth Rules (sort by Support, Confidence, Lift, Leverage, Conviction).
2. Pillar 3: PageRank Leaderboard (sort by PageRank, Degree, Paper Count).
3. Pillar 4: Anomalies (sort by Anomaly Score, Math Count, Word Count).
4. EDA: Top Authors (sort by Paper Count).
5. EDA: Category Distribution (sort by Count, Percentage).

**UI Pattern:**
- Header cell shows column name + sort indicator (`/\\` ascending, `\\/` descending, `-` neutral).
- Clicking toggles between: neutral -> ascending -> descending -> neutral.
- Active sort column header text is highlighted with `var(--accent-silver)`.

**Implementation:**
```tsx
const [sortConfig, setSortConfig] = useState<{
  key: string;
  direction: 'asc' | 'desc' | null;
}>({ key: '', direction: null });

const sortedData = useMemo(() => {
  if (!sortConfig.direction) return data;
  return [...data].sort((a, b) => {
    const val = a[sortConfig.key] - b[sortConfig.key];
    return sortConfig.direction === 'asc' ? val : -val;
  });
}, [data, sortConfig]);
```

**Acceptance Criteria:**
- Every numeric column in every table is sortable by click.
- Sort state is visually indicated in the column header.
- Sorting is instant (client-side, no API calls).

#### Task 3.4: Interactive Node-Link Author Network Graph (Pillar 3)

**File:** `src/components/MiningPillarsView.tsx`

Render an interactive force-directed or radial network graph showing author collaboration links
and Louvain community clusters.

**Specification:**
- **Nodes:** Top 50 authors from `graphData.graph_export.nodes`.
- **Edges:** Collaboration links from `graphData.graph_export.links` with weight-proportional thickness.
- **Node Size:** Proportional to PageRank centrality.
- **Node Color:** Colored by Louvain community ID (reuse `clusterColors` array).
- **Interaction:** Click a node to highlight its direct collaborators. Hover to show author name, degree, and paper count.
- **Layout:** Simple force-directed or circular layout computed client-side.
- **Implementation:** Pure SVG with manual force simulation (no D3 dependency needed for 50 nodes).

**Acceptance Criteria:**
- Network graph renders above the existing PageRank leaderboard table.
- Node click highlights the selected author and their direct collaboration edges.
- Graph is responsive and does not overflow on any viewport.

#### Task 3.5: PCA Scatter Plot Enhancements

**File:** `src/components/MiningPillarsView.tsx`

Upgrade the 2D PCA scatter plot with:
- **Cluster Centroid Markers:** Large cross markers (`+`) at the mean (x, y) of each cluster.
- **Convex Hull Outlines:** Faint polygon outlines enclosing each cluster's points.
- **Zoom Controls:** `[+]` / `[-]` buttons to scale the viewBox (zoom in/out). Reset button.
- **Pan:** Click-and-drag to pan the viewBox origin.

**Acceptance Criteria:**
- Centroids are visible as distinct markers (not confused with data points).
- Convex hulls provide clear visual cluster boundaries.
- Zoom and pan controls work smoothly without layout shift.

#### Task 3.6: Data Export Buttons (CSV / JSON)

**File:** `src/components/MiningPillarsView.tsx`

Add export buttons to each pillar table:
- `[EXPORT CSV]` - Downloads the currently visible (filtered) rows as a `.csv` file.
- `[EXPORT JSON]` - Downloads as a `.json` file.

**Implementation:**
```tsx
const exportCSV = (data: object[], filename: string) => {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const blob = new Blob([headers + '\n' + rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Acceptance Criteria:**
- Export includes only filtered/sorted rows (respects active search and slider filters).
- Files download with descriptive names (e.g., `fp_growth_rules_lift_1.2.csv`).
- Toast notification confirms successful export.

---

### PHASE 4: Researcher Experience & Interaction Polish

**Goal:** Elevate the researcher workflow to feel native, intuitive, and delightful. Every
interaction should provide immediate tactile feedback. Power features should be discoverable
without a manual.

**Estimated Complexity:** MEDIUM  
**Files Touched:** `src/components/ScientificRagConsole.tsx`, `src/App.tsx`, `src/components/GeometricTelemetryGauges.tsx`, `src/components/PipelineFlow.tsx`

#### Task 4.1: Multi-line Query Textarea with Auto-Expand

**File:** `src/components/ScientificRagConsole.tsx`

Replace the single-line `<input type="text">` with an auto-expanding `<textarea>`.

**Specification:**
- Default height: 2 lines (~48px).
- Auto-expand: Grows to fit content up to 8 lines (~192px), then scrolls internally.
- Keyboard: `Ctrl/Cmd + Enter` submits. Plain `Enter` creates a new line.
- Placeholder: Multi-line hint text explaining query format.
- Resize handle: Disabled (`resize: none`) since height is auto-managed.

**Implementation:**
```tsx
const textareaRef = useRef<HTMLTextAreaElement>(null);
const autoResize = () => {
  const el = textareaRef.current;
  if (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 192) + 'px';
  }
};
```

**Acceptance Criteria:**
- Researchers can paste multi-paragraph queries and LaTeX formulas.
- Textarea grows smoothly without layout jumps.
- `Ctrl+Enter` still submits; plain `Enter` inserts a newline.

#### Task 4.2: Query History Sidebar

**File:** `src/components/ScientificRagConsole.tsx`

Add a collapsible query history panel persisted in `localStorage`.

**Specification:**
- Position: Left sidebar within the RAG console, toggleable via `[HISTORY]` button.
- Storage: Last 20 queries saved in `localStorage` with timestamp and truncated answer preview.
- Actions: Click to re-run, delete individual entries, clear all.
- Visual: Slim vertical panel (280px width) with monospace timestamps.

**Acceptance Criteria:**
- Query history persists across page reloads.
- Clicking a history item populates the query input and re-submits.
- History panel does not interfere with the main query/response flow.

#### Task 4.3: Multi-Format Citation Export

**File:** `src/components/ScientificRagConsole.tsx`

Expand the `[BIBTEX]` button into a dropdown offering multiple citation formats:
- BibTeX (existing)
- APA 7th Edition
- IEEE

**Acceptance Criteria:**
- Dropdown appears on click with 3 format options.
- Each format produces correctly formatted citation text.
- Toast notification confirms the selected format was copied.

#### Task 4.4: Keyboard Shortcuts Modal

**File:** `src/App.tsx` + new `src/components/ShortcutsModal.tsx`

Add a keyboard shortcuts reference modal triggered by pressing `?` (question mark).

**Content:**
| Shortcut | Action |
|----------|--------|
| `1` - `5` | Switch to tab 1 through 5 |
| `T` | Toggle dark/light mode |
| `Ctrl/Cmd + Enter` | Submit RAG query |
| `?` | Open this shortcuts reference |
| `Escape` | Close modal / drawer |
| `Arrow Left/Right` | Navigate tabs (when tablist focused) |

**Specification:**
- Modal: Centered overlay with backdrop blur.
- Dismiss: `Escape` key, backdrop click, or `[X]` button.
- Accessibility: `role="dialog"`, `aria-modal="true"`, focus trap inside modal.

**Acceptance Criteria:**
- Pressing `?` opens the modal from any context (except when inside an input field).
- Modal is fully keyboard-navigable and dismissable.
- All listed shortcuts are accurate and functional.

#### Task 4.5: Skeleton Loading Screens

**Files:** `src/components/EdaView.tsx`, `src/components/MiningPillarsView.tsx`, `src/components/ScientificRagConsole.tsx`

Replace plain text loading messages with structured skeleton shimmer placeholders that match
the geometry of the final rendered components.

**Components to Build:**
- `SkeletonKPICard`: Matches MetricsBento / EDA KPI card dimensions.
- `SkeletonTable`: Renders 5 shimmer rows matching table column widths.
- `SkeletonScatter`: Renders a shimmer rectangle matching the PCA scatter plot.

**Pattern:**
```tsx
const SkeletonKPICard: FC = () => (
  <div className="skeleton-shimmer" style={{
    height: '120px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-card-shell)',
  }} />
);
```

**Acceptance Criteria:**
- Loading states show skeleton shapes that match the final content geometry.
- Shimmer animation plays smoothly (uses existing `.skeleton-shimmer` keyframe).
- Transition from skeleton to content is smooth (no layout jump).

#### Task 4.6: Offline / Demo Mode Badge

**File:** `src/App.tsx` + `src/api/client.ts`

When the API client falls back to offline demo data, display a subtle persistent badge in the header.

**Specification:**
- Badge text: `DEMO SNAPSHOT` or `OFFLINE MODE`
- Badge style: Amber background (`var(--accent-bronze)`), 9px monospace, positioned next to the API pulse LED.
- Behavior: Appears after the first API timeout/fallback. Disappears if a subsequent live API call succeeds.

**Implementation:**
- Add `isFallback: boolean` flag to each API response in `client.ts`.
- Track global fallback state via a React context or a simple `useState` in `App.tsx`.

**Acceptance Criteria:**
- Users can clearly distinguish between live data and demo snapshots.
- Badge does not obscure other header elements.

#### Task 4.7: Animated GPU Equalizer Bars

**File:** `src/components/GeometricTelemetryGauges.tsx`

Animate the 14-bar GPU equalizer with subtle CSS keyframe jitter to simulate real-time GPU
throughput variance.

**Acceptance Criteria:**
- Equalizer bars oscillate subtly (2-4px height variation) with staggered animation delays.
- Animation respects `prefers-reduced-motion: reduce`.

#### Task 4.8: Pipeline Stepper Animated Connectors

**File:** `src/components/PipelineFlow.tsx`

Add animated SVG connectors between the 4 phase cards with a traveling dot animation
(similar to the circuit schematic electron packets).

**Acceptance Criteria:**
- Connectors show directional flow between phases.
- Animation syncs with the circuit schematic pulse speed (if both are visible).

---

### PHASE 5: Performance Optimization & Production Hardening

**Goal:** Minimize initial load time, eliminate unnecessary re-renders, and prepare the
application for production deployment.

**Estimated Complexity:** MEDIUM  
**Files Touched:** `src/App.tsx`, `src/api/client.ts`, `src/index.css`

#### Task 5.1: Code Splitting with React.lazy()

**File:** `src/App.tsx`

Wrap heavy tab components in `React.lazy()` with `Suspense` fallbacks.

**Components to Lazy-Load:**
- `EdaView` (575 lines, heavy data tables)
- `MiningPillarsView` (939 lines, largest component)
- `ScientificRagConsole` (841 lines, KaTeX engine)
- `LiveTelemetryFeed` (363 lines, SSE stream)

**Pattern:**
```tsx
const EdaView = lazy(() => import('./components/EdaView'));
const MiningPillarsView = lazy(() => import('./components/MiningPillarsView'));

// In render:
<Suspense fallback={<SkeletonTabPane />}>
  {activeTab === 'eda' && <EdaView />}
</Suspense>
```

**Acceptance Criteria:**
- Initial bundle size for the landing tab (Schematic) decreases by at least 40%.
- Tab switching shows skeleton fallback for at most 100ms on subsequent loads (cached).
- No flash of unstyled content.

#### Task 5.2: API Response Caching (SWR Pattern)

**File:** `src/api/client.ts`

Implement a lightweight in-memory Stale-While-Revalidate cache.

**Specification:**
- Cache key: API endpoint URL.
- Stale time: 5 minutes (300 seconds).
- Behavior: Return cached data immediately, then revalidate in the background.
- Cache invalidation: On explicit user action (e.g., "Refresh data" button).

**Implementation:**
```typescript
const cache = new Map<string, { data: unknown; timestamp: number }>();
const STALE_TIME = 300_000; // 5 minutes

async function cachedFetch<T>(url: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < STALE_TIME) {
    return cached.data as T;
  }
  const data = await fetcher();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

**Acceptance Criteria:**
- Switching between tabs does not re-fetch API data within the stale window.
- Network DevTools shows no duplicate requests within 5 minutes.
- Manual refresh button forces a fresh fetch.

#### Task 5.3: URL Hash Routing for Tab State

**File:** `src/App.tsx`

Synchronize `activeTab` with the browser URL hash.

**Behavior:**
- Navigating to `/#eda` activates the EDA tab.
- Clicking a tab updates the URL to `/#schematic`, `/#eda`, `/#pillars`, `/#rag`, `/#logs`.
- Browser back/forward buttons navigate between previously visited tabs.
- Direct bookmark links work correctly.

**Implementation:**
```tsx
useEffect(() => {
  const hash = window.location.hash.replace('#', '');
  if (validTabs.includes(hash)) setActiveTab(hash);
}, []);

useEffect(() => {
  window.location.hash = activeTab;
}, [activeTab]);
```

**Acceptance Criteria:**
- URL hash reflects the active tab at all times.
- Sharing a URL with a hash opens the correct tab.
- Browser navigation (back/forward) works between tabs.

#### Task 5.4: Print Stylesheet

**File:** `src/index.css`

Add `@media print` rules for clean scientific output.

**Specification:**
- Hide: Navigation bar, theme toggle, speed controls, footer, background grid.
- Show: Active tab content only, with black text on white background.
- Tables: Render with visible borders and compact padding.
- Page breaks: `page-break-inside: avoid` on cards and tables.

**Acceptance Criteria:**
- `Ctrl+P` produces a clean, professional printout of the active view.
- No decorative animations or gradients appear in print.

#### Task 5.5: Back-to-Top Floating Button

**File:** `src/App.tsx`

Add a floating "back to top" button that appears after scrolling 400px.

**Specification:**
- Position: Fixed, bottom-right (above the toast stack).
- Icon: Upward arrow (`/\\`).
- Behavior: Smooth scroll to top on click.
- Animation: Fade in/out based on scroll position.

**Acceptance Criteria:**
- Button appears after 400px of scroll.
- Click smoothly scrolls to the top of the page.
- Button does not overlap with toast notifications.

---

## 4. PRIORITY MATRIX

| Phase | Priority | Impact | Effort | Dependencies |
|-------|----------|--------|--------|--------------|
| Phase 1: Accessibility & Global UX Infrastructure | **P0 (Critical)** | HIGH | MEDIUM | None |
| Phase 2: Responsive Design & Mobile | **P0 (Critical)** | HIGH | HIGH | Phase 1 (focus rings, toast) |
| Phase 3: Data Visualization Upgrades | **P1 (High)** | HIGH | HIGH | Phase 1 (toast for export) |
| Phase 4: Researcher Experience | **P1 (High)** | MEDIUM | MEDIUM | Phase 1 (toast, skeleton) |
| Phase 5: Performance & Production | **P2 (Medium)** | MEDIUM | MEDIUM | Phase 4 (skeleton for lazy) |

### Execution Order

```
Phase 1 (Foundation)
  |
  +---> Phase 2 (Mobile)
  |       |
  |       +---> Phase 5 (Performance)
  |
  +---> Phase 3 (Visualization)
  |       |
  |       +---> Phase 4 (Polish)
  |               |
  |               +---> Phase 5 (Performance)
```

---

## 5. SUCCESS CRITERIA & QUALITY GATES

### Build & Lint Gates (Every Phase)

| Check | Command | Required Result |
|-------|---------|-----------------|
| Linter | `npm run lint` (oxlint) | 0 warnings, 0 errors |
| TypeScript | `tsc -b` | 0 type errors |
| Build | `vite build` | Successful build < 500ms |
| Em-dash Policy | `grep -rn "---" src/` | 0 matches (use `-`, `:`, or parentheses) |

### Accessibility Gates (Phase 1)

| Check | Tool | Required Result |
|-------|------|-----------------|
| WCAG AA Color Contrast | Browser DevTools / axe-core | All text > 4.5:1 ratio |
| WCAG AAA Color Contrast | axe-core | Secondary text > 7:1 ratio |
| Keyboard Navigation | Manual testing | All interactive elements reachable via Tab |
| Screen Reader Audit | VoiceOver / NVDA | Tab names, button labels, and live regions announced |

### Responsive Gates (Phase 2)

| Viewport | Requirement |
|----------|-------------|
| 375px (iPhone SE) | All content readable. No horizontal scroll. Touch targets >= 48px. |
| 768px (iPad Portrait) | 2-column layouts. Tables readable or transformed to cards. |
| 1024px (iPad Landscape) | Full layout visible. Circuit schematic renders horizontally. |
| 1440px (Desktop) | Optimal experience. All features visible. |
| 2560px (Ultrawide) | Content centered with max-width. No stretched elements. |

### Performance Gates (Phase 5)

| Metric | Target |
|--------|--------|
| Initial Bundle (Landing Tab) | < 300 KB gzipped |
| Largest Contentful Paint (LCP) | < 1.5s |
| Cumulative Layout Shift (CLS) | < 0.05 |
| Tab Switch Latency | < 100ms (cached) |

---

## 6. FILES MODIFIED PER PHASE

### Phase 1

| File | Action |
|------|--------|
| `src/index.css` | Add focus-visible rules, light mode contrast fix, bento hover class |
| `src/App.tsx` | ARIA tabs, skip-to-content link, toast context provider |
| `src/components/ToastNotification.tsx` | **NEW** - Global toast system |
| `src/components/MetricsBento.tsx` | Remove hover state, use CSS class |
| `src/components/ScientificRagConsole.tsx` | Migrate clipboard to toast |
| `src/components/StorageInspector.tsx` | Migrate clipboard to toast |
| Multiple components | Minimum font size audit |

### Phase 2

| File | Action |
|------|--------|
| `src/index.css` | Breakpoint tokens, responsive utility classes, mobile table cards |
| `src/App.tsx` | Mobile drawer navigation |
| `src/components/GeometricPipelineDiagram.tsx` | Vertical lineage layout |
| `src/components/MiningPillarsView.tsx` | Touch targets, responsive tables |
| `src/components/LiveTelemetryFeed.tsx` | Responsive card layout |
| `src/components/StorageInspector.tsx` | Responsive card layout |

### Phase 3

| File | Action |
|------|--------|
| `src/components/EdaView.tsx` | Dynamic IQR, chromatic heatmap, sorting |
| `src/components/MiningPillarsView.tsx` | Column sorting, network graph, PCA upgrades, export buttons |

### Phase 4

| File | Action |
|------|--------|
| `src/components/ScientificRagConsole.tsx` | Textarea, query history, multi-format citations |
| `src/components/ShortcutsModal.tsx` | **NEW** - Keyboard shortcuts reference |
| `src/App.tsx` | Shortcuts modal trigger, offline badge |
| `src/api/client.ts` | Fallback flag |
| `src/components/EdaView.tsx` | Skeleton loading |
| `src/components/MiningPillarsView.tsx` | Skeleton loading |
| `src/components/GeometricTelemetryGauges.tsx` | Animated equalizer |
| `src/components/PipelineFlow.tsx` | Animated connectors |

### Phase 5

| File | Action |
|------|--------|
| `src/App.tsx` | React.lazy, Suspense, URL hash routing, back-to-top button |
| `src/api/client.ts` | SWR cache layer |
| `src/index.css` | Print stylesheet |

---

> **Total Estimated Tasks:** 27 concrete tasks across 5 phases.  
> **New Files Created:** 2 (`ToastNotification.tsx`, `ShortcutsModal.tsx`).  
> **Existing Files Modified:** 14.  
> **Zero External Dependencies Added.** All implementations use React 19 + TypeScript + vanilla CSS + SVG.
