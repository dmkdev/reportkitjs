# ReportkitJs — PDF Export Plan

Add PDF export to ReportkitJs using **@react-pdf/renderer** (vector PDF, selectable text).
A new `pdf` submodule renders the same `Report` JSON document as a PDF, reusing
`core` (types, theme, utils) and `viewer` (chart layout math).

## Decisions

| Decision   | Choice                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| PDF engine | `@react-pdf/renderer` (vector, selectable text)                                                                         |
| Module     | New `src/pdf/` submodule, exported as `@dmkdev/reportkitjs/pdf`                                                        |
| Data       | `resolveReportData(report)` resolves embedded + external sources once, before render                                    |
| Charts     | Re-implemented as `@react-pdf` `<Svg>` primitives, reusing `computeChartLayout` + `scales.ts`                           |
| Fonts      | Configurable family; default = bundled/CDN font with Cyrillic support (Inter)                                           |
| Page size  | A4 portrait, theme-driven colors, `maxWidth` respected                                                                  |
| API        | `<ReportPdf report />` component + `exportReportToPdf(report, opts): Promise<Blob>` + `downloadReportPdf(report, opts)` |
| UI         | "Export PDF" button in demo (Viewer tab) and editor toolbar                                                             |

## Architecture

```
editor ──▶ viewer ──▶ core
   │          │
   └──▶ pdf ◀─┘      (pdf depends on core + viewer; viewer does NOT depend on pdf)
```

```
src/pdf/
├── index.ts            # public exports
├── ReportPdf.tsx       # <ReportPdf> (Document+Page), exportReportToPdf, downloadReportPdf
├── data.ts             # resolveReportData(report) → Record<sourceId, rows>
├── fonts.ts            # Font.register + default family (Cyrillic-capable)
├── styles.ts           # StyleSheet (A4, header, blocks) from ResolvedTheme
├── markdown.ts         # pure parseMarkdown + <PdfText> (bold/italic/code/links)
├── blocks/
│   ├── PdfBlockRenderer.tsx
│   ├── PdfHeaderBlock.tsx
│   ├── PdfTextBlock.tsx
│   ├── PdfKpiBlock.tsx
│   ├── PdfTableBlock.tsx
│   ├── PdfChartBlock.tsx
│   ├── PdfDividerBlock.tsx
│   ├── PdfImageBlock.tsx
│   └── PdfSectionBlock.tsx
└── charts/
    ├── PdfLineChart.tsx
    ├── PdfBarChart.tsx
    └── PdfPieChart.tsx
```

## Key design points

### 1. Data resolution (no React needed)

`src/pdf/data.ts`:

```ts
export interface PdfReportData {
  rows: Record<string, Record<string, unknown>[]>;
  errors: Record<string, string | null>;
}
export async function resolveReportData(report: Report): Promise<PdfReportData>;
```

- Embedded sources: copy rows directly.
- External sources: fetch via a **new pure helper** `fetchExternalSource(source): Promise<Record<string, unknown>[]>` added to `core` (e.g. `src/core/data.ts`), which does `fetch` → `res.json()` → `resolveDataPath(json, source.dataPath)` → array check.
- **Refactor** `useReportData` (viewer) to call the same `fetchExternalSource` helper, removing the duplicated fetch logic (keeps behavior identical: AbortController, refreshInterval, per-source state).
- Per-source errors are captured and rendered as a muted note in the PDF (mirrors viewer's error state).

### 2. Chart layout extraction

`useChartLayout` currently mixes measurement (ResizeObserver) with pure math.
Extract the pure part:

```ts
// src/viewer/charts/layout.ts
export function computeChartLayout(props: BaseChartProps, width: number): ChartLayout;
```

- `useChartLayout` becomes: measure width → `computeChartLayout(props, width)`.
- PDF charts call `computeChartLayout(props, fixedWidth)` with a fixed width
  (e.g. `min(theme.maxWidth, 515) - padding`), so geometry is deterministic.
- Existing `scales.ts` (`bandScale`, `linearScale`, `niceDomain`, `ticks`,
  `pieAngles`, `arcPath`, `plotArea`) is reused as-is — it is pure.

### 3. PDF charts

`@react-pdf/renderer` supports `<Svg>`, `<Path>`, `<Line>`, `<Circle>`, `<Rect>`,
`<Text>` (inside Svg). Each chart maps the existing SVG output 1:1:

- **PdfLineChart** — grid lines, axis ticks (Svg `<Text>`), one `<Path>` per series (polyline from `xScale`/`yScale`), optional dots.
- **PdfBarChart** — `<Rect>` per bar (grouped by category), grid + ticks.
- **PdfPieChart** — `<Path d={arcPath(...)}>` per slice using `pieAngles` + `arcPath`, legend as normal `<View>`/`<Text>` below (reuses `ChartLegend` data shape).

Colors come from `resolved.colors.chart` (theme), same as the viewer.

### 4. Fonts (Cyrillic)

`@react-pdf/renderer` requires registered fonts; the default Helvetica has no
Cyrillic. Plan:

- `src/pdf/fonts.ts` exports `configurePdfFonts(options?)` and a default family.
- Default: register **Inter** (matches the default `fontFamily`) from a CDN
  URL (regular + bold + italic) via `Font.register({ family, fonts: [...] })`.
  CDN keeps the npm package small; consumers can override with local files:

```ts
configurePdfFonts({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
  ],
});
```

- `styles.ts` uses the configured family for all text.
- Documented in README/api.md: without a Cyrillic font, Cyrillic text renders
  as blank — configure fonts for non-Latin scripts.

### 5. Styles & theming

`src/pdf/styles.ts` builds a `StyleSheet` from `resolveTheme(report.theme)`:

- Page: A4 portrait, margin ~40pt, background `colors.background`.
- Header: title (18pt bold), description (muted), meta box (surface bg, border) — mirrors `reportViewer.module.css`.
- Blocks: spacing 16pt, KPI cards (surface, border, radius), tables (borders, header row surface), dividers (solid/dashed/dotted via `borderStyle`), sections (title + nested blocks), images (maxWidth, caption).
- `pageBreak` behavior: `wrap={false}` on KPI cards / dividers / images; tables and text flow across pages (react-pdf handles table row splitting; keep `Table` header repeat via `fixed` rows if supported, otherwise accept split).

### 6. Markdown

`TextBlock` with `markdown: true` uses the viewer's `renderMarkdown` (React).
For PDF, add a **pure** parser in `src/pdf/markdown.ts`:

```ts
type Segment =
  | { type: 'text'; text: string }
  | { type: 'bold' | 'italic' | 'code'; text: string }
  | { type: 'link'; text: string; href: string };
export function parseMarkdown(content: string): Segment[];
```

`<PdfText>` renders segments as nested `<Text>` with `bold`/`italic`/`fontFamily`
(monospace for code) and `link` styling. The parser mirrors the subset supported
by the viewer (bold, italic, code, links) — keep the two in sync (same regexes).

### 7. Public API

```ts
// @dmkdev/reportkitjs/pdf
export function ReportPdf({ report, style? }: { report: Report; style?: object });
export async function exportReportToPdf(report: Report, options?: PdfExportOptions): Promise<Blob>;
export function downloadReportPdf(report: Report, options?: PdfExportOptions): void;

export interface PdfExportOptions {
  fileName?: string;          // default: `${report.meta.id}.pdf`
  pageSize?: 'A4' | 'Letter'; // default A4
  fonts?: PdfFontConfig;      // override font registration
}
```

- `exportReportToPdf`: `resolveReportData` → render `<Document>` via
  `renderToStream`/`pdf(...).toBlob()` (react-pdf v4: `pdf(<Document/>).toBlob()`).
- `downloadReportPdf`: blob → object URL → anchor click (same pattern as the
  existing `downloadReport` in `ReportEditor.tsx`).
- `<ReportPdf>` is for embedding (e.g. preview in an iframe via `pdf(<ReportPdf/>).toContainer()`).

### 8. Build & packaging

- `package.json`: add `@react-pdf/renderer` to `dependencies`; add exports
  subpath `"./pdf": { "types": "./dist/pdf.d.ts", "import": "./dist/pdf.js" }`.
- `vite.config.ts`: add `pdf: r('./src/pdf/index.ts')` to lib entries.
- **Build risk**: `@react-pdf/renderer` pulls in Node-ish deps (e.g. `crypto`,
  `stream` polyfills). Vite lib mode may need `resolve.alias` or
  `optimizeDeps`/`define` shims. Mitigation: mark problematic Node builtins as
  external or alias to browser polyfills; verify with `npm run build` and a
  smoke test in the demo. If the bundle bloats unacceptably, document that the
  `./pdf` subpath is the only entry that includes it (tree-shaking keeps
  `core`/`viewer`/`editor` clean).

### 9. Demo wiring

- `ViewerDemo.tsx`: add an "Export PDF" button above the viewer that calls
  `downloadReportPdf(report)` with a loading state.
- `ReportEditor.tsx` toolbar: add "Export PDF" button next to "Export JSON"
  (calls `downloadReportPdf(report)`).

### 10. Tests

- `tests/pdf/data.test.ts` — `resolveReportData`: embedded rows copied; external
  fetched (mock `fetch`), `dataPath` resolved, error captured per source.
- `tests/pdf/markdown.test.ts` — `parseMarkdown` for bold/italic/code/links/nesting.
- `tests/pdf/charts.test.ts` — `computeChartLayout` (after extraction) + arc
  path generation for pie (pure math, no rendering).
- `tests/core/data.test.ts` — `fetchExternalSource` (mock fetch: ok, HTTP error,
  non-array at dataPath).
- Existing viewer tests must still pass after the `useReportData` refactor.
- Full PDF render test is optional (jsdom + react-pdf is flaky); rely on the
  demo for visual verification.

### 11. Docs

- `docs/architecture.md`: add `pdf` to module layout + dependency diagram.
- `docs/api.md`: new `@dmkdev/reportkitjs/pdf` section (components, functions,
  options, font configuration).
- `README.md`: PDF export usage snippet + font note.

## Execution order

1. Deps + packaging: `@react-pdf/renderer`, `package.json` exports, `vite.config.ts` entry.
2. `core`: add `fetchExternalSource` helper (+ tests).
3. `viewer`: extract `computeChartLayout`; refactor `useReportData` to use the core helper; run existing tests.
4. `pdf` module: `data.ts` → `fonts.ts` → `styles.ts` → `markdown.ts` → charts → blocks → `ReportPdf.tsx` → `index.ts`.
5. Demo wiring (Viewer + editor toolbar).
6. Tests for new pure logic.
7. Docs (architecture, api, README).
8. Verify: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; fix any @react-pdf bundling issues; visual check in `npm run dev`.

## Risks & mitigations

| Risk                                                                 | Mitigation                                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| @react-pdf/renderer bundling issues in Vite lib mode (Node builtins) | Alias/external shims in `vite.config.ts`; verify with build + demo smoke test  |
| Cyrillic text blank without proper font                              | Default Inter (Cyrillic) via CDN; `configurePdfFonts` override; documented     |
| Charts look different from viewer                                    | Reuse exact same layout math (`computeChartLayout` + `scales.ts`)              |
| Long tables split awkwardly across pages                             | Accept row-level split (react-pdf default); keep KPI/divider/image unbreakable |
| Bundle size for consumers not using PDF                              | Separate `./pdf` subpath entry; only that entry includes react-pdf             |
