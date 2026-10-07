# ReportkitJs

Embeddable, JSON-described reports for React. A report is a single JSON document
that a **viewer** renders as a styled page (KPI cards, tables, charts, text,
images) and a **visual editor** can create and modify.

- **`core`** — types, JSON schema, validation, defaults, pure utilities. No React.
- **`viewer`** — renders a `Report` as React components (SVG charts, theming).
- **`editor`** — drag-and-drop visual editor (block palette, canvas, property forms).
- **`pdf`** — exports a `Report` as a PDF (vector, selectable text) via `@react-pdf/renderer`.

## Install

```bash
npm install @dmkdev/reportkitjs
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Quick start

### Viewer

```tsx
import { ReportViewer } from '@dmkdev/reportkitjs/viewer';
import '@dmkdev/reportkitjs/viewer.css';
import type { Report } from '@dmkdev/reportkitjs/core';

const report: Report = {/* ... */};

function Page() {
  return <ReportViewer report={report} />;
}
```

### Editor

```tsx
import { ReportEditor } from '@dmkdev/reportkitjs/editor';
import '@dmkdev/reportkitjs/editor.css';
import type { Report } from '@dmkdev/reportkitjs/core';

function EditorPage() {
  return (
    <ReportEditor initialReport={report} onChange={(next) => console.log('report changed', next)} />
  );
}
```

The editor is a module-singleton store; pass `initialReport` once to load a
document and use `onChange` to persist edits. The toolbar provides undo/redo,
JSON import, JSON export and PDF export (client-side download).

### PDF export

```tsx
import { downloadReportPdf } from '@dmkdev/reportkitjs/pdf';
import type { Report } from '@dmkdev/reportkitjs/core';

const report: Report = {/* ... */};

async function handleExport() {
  await downloadReportPdf(report); // triggers a browser download
}
```

`exportReportToPdf(report, options)` returns a `Blob` instead of downloading.
Options: `{ fileName?, pageSize?: 'A4' | 'Letter', fonts? }`.

> **Fonts** — the built-in PDF fonts have no Cyrillic glyphs. The default is
> Inter (Cyrillic-capable), bundled with the package and inlined into the
> build, so export works fully offline. Override with
> `configurePdfFonts({ family, fonts })` to use your own font files.

### Core (validation)

```ts
import { validateReport, assertValidReport } from '@dmkdev/reportkitjs/core';

const result = validateReport(json);
if (!result.valid) {
  console.error(result.errors); // human-readable messages
}
```

## Subpath imports

| Import                            | Purpose                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `@dmkdev/reportkitjs`            | Re-exports core, viewer and editor (viewer components shadow core block types). |
| `@dmkdev/reportkitjs/core`       | Types, schema, validation, defaults, utilities.                                 |
| `@dmkdev/reportkitjs/viewer`     | `ReportViewer` and all viewer components/hooks.                                 |
| `@dmkdev/reportkitjs/editor`     | `ReportEditor` and all editor components/store.                                 |
| `@dmkdev/reportkitjs/pdf`        | `downloadReportPdf` / `exportReportToPdf` / `<ReportPdf>` (PDF export).         |
| `@dmkdev/reportkitjs/viewer.css` | Viewer styles.                                                                  |
| `@dmkdev/reportkitjs/editor.css` | Editor styles.                                                                  |

Prefer the subpath imports for tree-shaking. Both CSS subpaths resolve to the
same combined stylesheet (Vite lib mode emits a single `reportkitjs.css`), so
importing either one is sufficient.

## Scripts

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the Vite dev server (demo app).        |
| `npm run build`        | Type-check and build the library to `dist/`. |
| `npm run preview`      | Preview the production build.                |
| `npm run typecheck`    | Run `tsc --noEmit`.                          |
| `npm test`             | Run the test suite (Vitest).                 |
| `npm run test:watch`   | Run tests in watch mode.                     |
| `npm run lint`         | Lint with ESLint.                            |
| `npm run lint:fix`     | Lint and auto-fix.                           |
| `npm run format`       | Format with Prettier.                        |
| `npm run format:check` | Check formatting.                            |

## Demo

`npm run dev` starts a demo app (`src/demo/`) with a sample report rendered by
the viewer and an editor page.

## Documentation

- [Architecture](docs/architecture.md) — module layout, data flow, editor state.
- [JSON schema](docs/json-schema.md) — the full v1.0.0 report format.
- [API reference](docs/api.md) — public API of each submodule.

## License

MIT
