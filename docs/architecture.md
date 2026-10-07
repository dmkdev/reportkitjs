# Architecture

ReportkitJs is a single npm package (`@dmkdev/reportkitjs`) split into four
submodules with a strict dependency direction:

```
editor  ──▶  viewer  ──▶  core
pdf     ──▶  viewer  ──▶  core
```

`core` has no React dependency. `viewer` depends on `core`. `editor` depends on
both. `pdf` depends on `core` (types, defaults, `fetchExternalSource`) and on
the viewer's pure chart math (`scales`, `layout`, `types`) — it never imports
viewer components. The root entry re-exports `core`, `viewer` and `editor`;
`pdf` is intentionally **not** re-exported at the root (it pulls in
`@react-pdf/renderer`), so it is imported via the `@dmkdev/reportkitjs/pdf`
subpath.

## Module layout

```
src/
├── index.ts            # root entry — re-exports core, viewer, editor
├── core/               # framework-agnostic domain model
│   ├── types.ts        # Report, Block, DataSource, Theme, block prop types
│   ├── schema.ts       # JSON Schema (draft-07) for a Report
│   ├── validate.ts     # validateReport / assertValidReport (ajv)
│   ├── defaults.ts     # defaultTheme, createDefaultBlock, blockTypeLabels
│   └── utils.ts        # createId, deepClone, resolveDataPath, aggregate,
│                       # formatNumber, collectBlockIds, findBlock
├── viewer/             # render a Report as React
│   ├── ReportViewer.tsx
│   ├── theme/          # ThemeProvider, useTheme, themeToCssVars
│   ├── hooks/          # useReportData (centralized), useDataSource
│   ├── blocks/         # one component per block type + BlockRenderer
│   ├── charts/         # LineChart, BarChart, PieChart, scales, tooltip
│   └── styles/         # CSS Modules
├── editor/             # visual editor
│   ├── ReportEditor.tsx
│   ├── store/          # Zustand store (report, history, selection, drag)
│   ├── canvas/         # ReportCanvas, BlockWrapper, DropZone
│   ├── panels/         # BlockPalette, DataSourcePanel, MetaPanel,
│   │   └── forms/      # one form per block type
│   └── styles/         # CSS Modules
├── pdf/                # export a Report as PDF (@react-pdf/renderer)
│   ├── ReportPdf.tsx   # ReportPdf / ReportPdfDocument, exportReportToPdf,
│   │                   # downloadReportPdf
│   ├── data.ts         # resolveReportData (embedded + external sources)
│   ├── fonts.ts        # configurePdfFonts / getPdfFontFamily (Cyrillic)
│   ├── styles.ts       # buildPdfStyles, page specs (A4 / Letter)
│   ├── markdown.tsx    # parseMarkdown → styled <Text> segments
│   ├── charts/         # PdfLineChart / PdfBarChart / PdfPieChart (SVG)
│   └── blocks/         # one component per block type + PdfBlockRenderer
└── demo/               # Vite demo app (not shipped)
```

## Data model

A `Report` is a plain JSON object:

```
Report
├── version            # "1.0.0"
├── meta               # id, title, description, author, updatedAt
├── theme              # partial theme (merged over defaults at render)
├── dataSources[]      # embedded (inline rows) or external (fetched)
└── blocks[]           # ordered; a `section` block may nest more blocks
```

Blocks are a discriminated union on `type`: `header`, `text`, `kpi`, `table`,
`chart`, `divider`, `image`, `section`. Only `section` carries nested
`blocks`, so the tree is at most two levels deep (top-level + one section
level).

## Viewer data flow

```
ReportViewer
  └─ ThemeProvider(theme)                 # CSS variables from resolved theme
      └─ useReportData(report)            # resolves theme + fetches external
          └─ ReportDataProvider(value)    # context for all blocks
              └─ BlockRenderer(block)     # dispatches on block.type
                  └─ <XBlock>             # reads data via useReportDataContext
```

- **Theme** — `resolveTheme` merges `report.theme` over `defaultTheme` and
  `themeToCssVars` exposes the result as CSS custom properties on the provider.
  Blocks and charts read `var(--rk-*)` values, so theming is purely CSS-driven.
- **Data** — `useReportData` is the single place external sources are fetched.
  Each external source is fetched once (with optional `refreshInterval`
  auto-refresh and `AbortController` cleanup), and the resolved rows are stored
  in a `Record<sourceId, FetchState>`. Blocks call `getSource(id)` from context,
  so multiple blocks referencing the same source share one fetch. Embedded
  sources resolve synchronously with no fetch.
- **Blocks** — `BlockRenderer` switches on `block.type` and renders the matching
  component. Each block component pulls its data source through the context and
  renders a loading / error / content state.

## Charts

Charts are hand-rolled SVG (no charting library). `scales.ts` provides
`bandScale`, `linearScale`, `niceDomain`, `ticks`, `pieAngles`, `arcPath` and
`plotArea`. `useChartLayout` computes pixel geometry from a responsive width.
`ChartTooltip` / `useChartTooltip` manage hover state and a shared tooltip
overlay. `LineChart`, `BarChart` and `PieChart` are thin presentational
components over these primitives.

## PDF export

`pdf` renders a `Report` as a PDF document with `@react-pdf/renderer` (vector
output, selectable text). It reuses the viewer's pure chart math
(`computeChartLayout`, `pieAngles`, `arcPath`, `seriesValues`, `xCategories`)
so PDF charts are geometrically identical to the on-screen ones, and the
core's `fetchExternalSource` for data resolution.

```
downloadReportPdf(report)
  └─ exportReportToPdf(report, options)
      ├─ configurePdfFonts(options.fonts?)     # register font family
      ├─ resolveReportData(report)             # embedded + external sources
      └─ pdf(<ReportPdfDocument>).toBlob()     # render → Blob
```

- **Data** — `resolveReportData` copies embedded sources synchronously and
  fetches external ones in parallel (per-source errors are captured, not
  thrown), returning `{ rows, errors }` consumed by the block components.
- **Theme** — `buildPdfStyles` maps the resolved theme to react-pdf stylesheets
  (colors, fonts, spacing), so a PDF matches the viewer's look.
- **Blocks** — `PdfBlockRenderer` dispatches on `block.type` to one component
  per type; `PdfSectionBlock` renders nested blocks.
- **Markdown** — `parseMarkdown` splits text into styled segments
  (bold / italic / code / link) rendered as nested `<Text>` elements.
- **Fonts** — the built-in PDF fonts have no Cyrillic glyphs, so a custom
  family is registered via `Font.register`. The default is Inter, bundled in
  `src/pdf/fonts/` and inlined into the build as base64 data URLs (no network
  access needed); `configurePdfFonts` overrides it with consumer-provided
  files.

## Editor state

The editor uses a single **Zustand** store (`editorStore.ts`) that is a module
singleton. Its shape:

```
{
  report: Report,
  history: Report[],      // past states (capped at HISTORY_LIMIT = 50)
  future: Report[],       // redo stack
  selectedBlockId: string | null,
  dragState: { blockId, from } | null,
  // actions…
}
```

Every mutating action (`addBlock`, `updateBlock`, `removeBlock`, `moveBlock`,
`addDataSource`, `updateDataSource`, `removeDataSource`, `updateMeta`,
`updateTheme`, `setReport`) first pushes a **deep clone** of the current report
onto `history` and clears `future`. `undo`/`redo` move reports between
`report` / `history` / `future` and clear the selection. `reset` replaces the
report without touching history.

### Drag & drop

Dragging is powered by `@dnd-kit`. Drop targets are encoded as string ids of the
form `drop:{sectionId|root}:{index}` (see `dropZoneId` / `parseDropZoneId`). On
`dragEnd`, `ReportEditor` parses the target and calls `moveBlock` (for a canvas
block) or `addBlock` (for a palette block). Palette items use ids prefixed with
`palette:` so the editor can tell a new block from a reorder.

### Panels

- **BlockPalette** — one draggable item per block type; dropping creates a block
  with `createDefaultBlock(type)`.
- **ReportCanvas** — renders the report as live previews (`blockPreview`), with
  a drag handle and a delete button per block, and `DropZone`s between blocks.
- **PropertiesPanel** — shows a form for the selected block; edits call
  `updateBlock`.
- **MetaPanel** — edits `report.meta` and theme colors.
- **DataSourcePanel** — add/edit/remove data sources.

## Validation

`core/schema.ts` defines a JSON Schema (draft-07) for a full `Report`.
`validateReport` runs it through `ajv` and returns
`{ valid, errors }` with human-readable messages; `assertValidReport` throws on
invalid input. The editor uses `validateReport` to gate JSON import.

## Build

Vite **library mode** with multiple entries (`index`, `core`, `viewer`,
`editor`, `pdf`). `vite-plugin-dts` emits `.d.ts` files. Vite lib mode disables
CSS code-splitting, so all CSS Modules are extracted into a single combined
`dist/reportkitjs.css`. Both the `./viewer.css` and `./editor.css` export
subpaths point at that file (importing one is enough; importing both is
harmless). `react` / `react-dom` are peer dependencies; `zustand`,
`@dnd-kit/*`, `ajv` and `@react-pdf/renderer` are runtime dependencies.
