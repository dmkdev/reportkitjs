# API Reference

Public API of the four submodules. All types referenced below are exported
from `@dmkdev/reportkitjs/core`.

## `@dmkdev/reportkitjs/core`

Framework-agnostic. No React import.

### Types

- `REPORT_VERSION` — `"1.0.0"`.
- `Report`, `ReportMeta`, `ReportTheme`, `ReportThemeColors`.
- `DataSource`, `EmbeddedDataSource`, `ExternalDataSource`.
- `Block`, `BlockType`, and per-type blocks: `HeaderBlock`, `TextBlock`,
  `KpiBlock`, `TableBlock`, `ChartBlock`, `DividerBlock`, `ImageBlock`,
  `SectionBlock`.
- Block props: `HeaderProps`, `TextProps`, `KpiProps`, `KpiValue`,
  `KpiValueRef`, `KpiTrend`, `KpiAggregation`, `TableProps`, `TableColumn`,
  `ChartProps`, `ChartType`, `ChartSeries`, `DividerProps`, `ImageProps`,
  `SectionProps`.
- `NumberFormat`.

### Schema & validation

| Export              | Signature                                   | Description                            |
| ------------------- | ------------------------------------------- | -------------------------------------- |
| `reportSchema`      | `object`                                    | JSON Schema (draft-07) for a `Report`. |
| `validateReport`    | `(json: unknown) => ValidationResult`       | Returns `{ valid, errors }`.           |
| `assertValidReport` | `(json: unknown) => asserts json is Report` | Throws on invalid input.               |

`ValidationResult` is `{ valid: boolean; errors: string[] }`.

### Defaults

| Export                                    | Description                                            |
| ----------------------------------------- | ------------------------------------------------------ |
| `defaultTheme`                            | Fully-resolved default theme.                          |
| `defaultThemeColors`                      | Default color palette.                                 |
| `resolveTheme(theme?)`                    | Merge a partial theme over defaults → `ResolvedTheme`. |
| `createDefaultBlock(type, dataSourceId?)` | A new block with default props.                        |
| `blockTypeLabels`                         | `Record<BlockType, string>` display labels.            |
| `allBlockTypes`                           | `BlockType[]` in palette order.                        |

### Utilities

| Export                | Signature                                                 | Description                                      |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `createId`            | `(prefix?) => string`                                     | Unique id (UUID when available).                 |
| `deepClone`           | `<T>(value: T) => T`                                      | Deep-clone a JSON value.                         |
| `resolveDataPath`     | `(data: unknown, path?) => unknown`                       | Resolve a dot-path.                              |
| `aggregate`           | `(rows, field, agg) => number`                            | Aggregate a numeric field.                       |
| `formatNumber`        | `(value, format?, currency?, locale?) => string`          | Format a number.                                 |
| `collectBlockIds`     | `(blocks) => string[]`                                    | All block ids incl. nested.                      |
| `findBlock`           | `(blocks, id) => Block \| undefined`                      | Find a block by id (nested).                     |
| `fetchExternalSource` | `(source, signal?) => Promise<Record<string, unknown>[]>` | Fetch an external source (used by viewer + pdf). |

## `@dmkdev/reportkitjs/viewer`

Import the CSS once: `import '@dmkdev/reportkitjs/viewer.css';`

### Components

| Export                                                                                                                  | Props                               | Description                                   |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| `ReportViewer`                                                                                                          | `{ report: Report }`                | Render a full report (theme + meta + blocks). |
| `ThemeProvider`                                                                                                         | `{ theme?: ReportTheme, children }` | Provide a resolved theme via CSS vars.        |
| `BlockRenderer`                                                                                                         | `{ block: Block }`                  | Render a single block by type.                |
| `HeaderBlock` / `TextBlock` / `KpiBlock` / `TableBlock` / `ChartBlock` / `DividerBlock` / `ImageBlock` / `SectionBlock` | `{ block }`                         | Individual block components.                  |
| `LineChart` / `BarChart` / `PieChart`                                                                                   | chart props                         | SVG chart components.                         |
| `ChartTooltip` / `ChartLegend`                                                                                          | tooltip/legend props                | Shared chart overlay + legend.                |

### Hooks

| Export                       | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `useTheme()`                 | Read the resolved theme from context.                     |
| `useReportData(report)`      | Centralized data: `{ theme, getSource, loading, error }`. |
| `ReportDataProvider`         | Provide `useReportData` result to blocks.                 |
| `useReportDataContext()`     | Read the report data context.                             |
| `useDataSource(source?)`     | Resolve one source to `FetchState`.                       |
| `useExternalData(source?)`   | Fetch one external source to `FetchState`.                |
| `findDataSource(report, id)` | Look up a data source by id.                              |
| `useChartLayout(...)`        | Compute responsive chart geometry.                        |
| `useChartTooltip()`          | Manage chart hover/tooltip state.                         |

`FetchState` is `{ data, loading, error, lastUpdated, refresh }`.

### Chart primitives

`bandScale`, `linearScale`, `niceDomain`, `ticks`, `formatTick`, `pieAngles`,
`arcPath`, `plotArea`, `DEFAULT_CHART`, `xCategories`, `seriesValues`,
`themeToCssVars`, `renderMarkdown`, `resolveKpiValue`.

## `@dmkdev/reportkitjs/editor`

Import the CSS once: `import '@dmkdev/reportkitjs/editor.css';`

### Components

| Export            | Props                                                        | Description                          |
| ----------------- | ------------------------------------------------------------ | ------------------------------------ |
| `ReportEditor`    | `{ initialReport?: Report, onChange?: (r: Report) => void }` | The full visual editor.              |
| `ReportCanvas`    | —                                                            | Live-preview canvas with drop zones. |
| `BlockWrapper`    | —                                                            | A single draggable block preview.    |
| `DropZone`        | —                                                            | A drop target between blocks.        |
| `BlockPalette`    | —                                                            | Draggable block-type palette.        |
| `PropertiesPanel` | —                                                            | Form for the selected block.         |
| `MetaPanel`       | —                                                            | Edit report meta + theme.            |
| `DataSourcePanel` | —                                                            | Manage data sources.                 |

### Store

`useEditorStore` is a Zustand store (module singleton). State:

```ts
{
  report: Report;
  selectedBlockId: string | null;
  dragState: { blockId: string; from: 'palette' | 'canvas' } | null;
  history: Report[];   // capped at 50
  future: Report[];
}
```

Actions:

| Action             | Signature                                     | Notes                                    |
| ------------------ | --------------------------------------------- | ---------------------------------------- |
| `setReport`        | `(r: Report) => void`                         | Replace report, push to history.         |
| `reset`            | `(r: Report) => void`                         | Replace report, clear history/selection. |
| `updateBlock`      | `(id, props: Partial<AnyBlockProps>) => void` | Update a block (nested-aware).           |
| `addBlock`         | `(type, index, sectionId?) => void`           | Insert a default block.                  |
| `removeBlock`      | `(id) => void`                                | Remove a block (nested-aware).           |
| `moveBlock`        | `(id, toIndex, toSectionId?) => void`         | Reorder / move between sections.         |
| `selectBlock`      | `(id \| null) => void`                        | Set selection (no history).              |
| `setDragState`     | `(state) => void`                             | Set drag state (no history).             |
| `undo` / `redo`    | `() => void`                                  | History navigation.                      |
| `addDataSource`    | `(ds: DataSource) => void`                    |                                          |
| `updateDataSource` | `(id, ds: Partial<DataSource>) => void`       |                                          |
| `removeDataSource` | `(id) => void`                                |                                          |
| `updateMeta`       | `(meta: Partial<ReportMeta>) => void`         |                                          |
| `updateTheme`      | `(theme: Partial<ReportTheme>) => void`       |                                          |

Helpers:

| Export                                                 | Description                      |
| ------------------------------------------------------ | -------------------------------- |
| `createEmptyReport()`                                  | A minimal valid report.          |
| `findBlockDeep(blocks, id)`                            | Find a block by id (nested).     |
| `dropZoneId(sectionId, index)` / `parseDropZoneId(id)` | Encode/decode drop targets.      |
| `blockPreview(block)`                                  | A short text preview of a block. |

`AnyBlockProps` is the union of all block prop shapes.

## `@dmkdev/reportkitjs/pdf`

Export a `Report` as a PDF (vector output, selectable text) via
`@react-pdf/renderer`. No CSS import needed.

### Export

| Export              | Signature                             | Description                                     |
| ------------------- | ------------------------------------- | ----------------------------------------------- |
| `exportReportToPdf` | `(report, options?) => Promise<Blob>` | Resolve data + render → PDF `Blob`.             |
| `downloadReportPdf` | `(report, options?) => Promise<void>` | Export and trigger a browser download.          |
| `ReportPdf`         | `{ report, pageSize? }`               | Embeddable document (resolves data itself).     |
| `ReportPdfDocument` | `{ report, data, pageSize? }`         | Synchronous `<Document>` for pre-resolved data. |

`PdfExportOptions` is `{ fileName?, pageSize?, fonts? }` where `pageSize` is
`'A4' | 'Letter'` (default `'A4'`) and `fileName` defaults to
`${report.meta.id}.pdf`.

### Data

| Export              | Signature                                 | Description                                    |
| ------------------- | ----------------------------------------- | ---------------------------------------------- |
| `resolveReportData` | `(report) => Promise<ResolvedReportData>` | Embedded copied, external fetched in parallel. |

`ResolvedReportData` is `{ rows: Record<string, Record<string, unknown>[]>, errors: Record<string, string \| null> }` — per-source errors are captured, not thrown.

### Fonts

| Export              | Signature              | Description                                         |
| ------------------- | ---------------------- | --------------------------------------------------- |
| `configurePdfFonts` | `(options?) => string` | Register a font family (default: bundled Inter).    |
| `getPdfFontFamily`  | `() => string`         | Ensure defaults registered; return the family name. |

`PdfFontOptions` is `{ family?, fonts?: PdfFontSource[] }`; `PdfFontSource` is
`{ src, fontWeight?, fontStyle? }` (`src` is a URL or base64 data URL). The
built-in PDF fonts have no Cyrillic glyphs, so the default family is the
bundled Inter font (inlined into the build — no network access needed);
`configurePdfFonts` overrides it with your own files.

### Styles

`buildPdfStyles(theme)` → `PdfStyles` (react-pdf stylesheet from the resolved
theme); `getPageSpec(pageSize)` → `PdfPageSpec`; `PDF_PAGES`, `PDF_MARGIN`.

### Markdown

| Export           | Signature                        | Description                                  |
| ---------------- | -------------------------------- | -------------------------------------------- |
| `parseMarkdown`  | `(content) => MarkdownSegment[]` | Split text into styled segments.             |
| `segmentsToText` | `(segments) => string`           | Flatten segments back to plain text.         |
| `PdfText`        | `{ content, style? }`            | Render markdown as nested `<Text>` elements. |

`MarkdownSegment` is `{ type: 'text' \| 'bold' \| 'italic' \| 'code' \| 'link', value, href? }`.

### Charts

`PdfLineChart`, `PdfBarChart`, `PdfPieChart` — SVG charts reusing the viewer's
`computeChartLayout` / `pieAngles` / `arcPath`, so geometry matches the
on-screen charts. `PdfCartesianChartProps` / `PdfChartUiColors`.

### Blocks

`PdfBlockRenderer` (dispatch on `block.type`), `PdfBlockList`, and one
component per type: `PdfHeaderBlock`, `PdfTextBlock`, `PdfKpiBlock`,
`PdfTableBlock`, `PdfChartBlock`, `PdfDividerBlock`, `PdfImageBlock`,
`PdfSectionBlock`. `resolveKpiValue` resolves a KPI value against rows.
`PdfReportContext` / `usePdfReportContext` provide `{ data, theme, styles, page }`.

## Root entry `@dmkdev/reportkitjs`

Re-exports `core` and `editor` in full, plus the viewer's public API. At the
root level the viewer's block **components** shadow the core block **types**
(e.g. `HeaderBlock` is the component). Use `@dmkdev/reportkitjs/core` for the
types.

The `pdf` submodule is **not** re-exported at the root on purpose: it pulls in
`@react-pdf/renderer`, so importing it from the root would bloat the bundle for
consumers who never export PDFs. Import it via the `@dmkdev/reportkitjs/pdf`
subpath instead.
