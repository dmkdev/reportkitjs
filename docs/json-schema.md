# Report JSON Schema (v1.0.0)

A report is a self-describing JSON document. The canonical shape is defined by
the TypeScript types in `src/core/types.ts` and the JSON Schema (draft-07) in
`src/core/schema.ts`. `REPORT_VERSION` is `"1.0.0"`.

## Top level

```jsonc
{
  "version": "1.0.0",
  "meta": {/* ReportMeta */},
  "theme": {/* ReportTheme, optional */},
  "dataSources": [/* DataSource[] */],
  "blocks": [/* Block[] */],
}
```

| Field         | Type           | Required | Notes                                    |
| ------------- | -------------- | -------- | ---------------------------------------- |
| `version`     | string         | yes      | Must be `"1.0.0"`.                       |
| `meta`        | `ReportMeta`   | yes      | Identity and timestamps.                 |
| `theme`       | `ReportTheme`  | no       | Partial overrides; merged over defaults. |
| `dataSources` | `DataSource[]` | yes      | May be empty.                            |
| `blocks`      | `Block[]`      | yes      | Ordered; sections may nest blocks.       |

## `meta` (`ReportMeta`)

| Field         | Type              | Required | Notes                     |
| ------------- | ----------------- | -------- | ------------------------- |
| `id`          | string            | yes      | Unique report id.         |
| `title`       | string            | yes      | Display title.            |
| `description` | string            | no       | Shown under the title.    |
| `author`      | string            | no       | Shown in the meta header. |
| `createdAt`   | string (ISO 8601) | yes      |                           |
| `updatedAt`   | string (ISO 8601) | yes      |                           |

## `theme` (`ReportTheme`)

All fields optional; missing values fall back to `defaultTheme`.

| Field          | Type                         | Default               |
| -------------- | ---------------------------- | --------------------- |
| `primaryColor` | string (CSS color)           | `#2563eb`             |
| `fontFamily`   | string (CSS font-family)     | `Inter, system-ui, …` |
| `maxWidth`     | number (px)                  | `960`                 |
| `colors`       | `Partial<ReportThemeColors>` | see below             |

`ReportThemeColors`:

| Field        | Type     | Default         |
| ------------ | -------- | --------------- |
| `background` | string   | `#ffffff`       |
| `surface`    | string   | `#f8fafc`       |
| `text`       | string   | `#0f172a`       |
| `textMuted`  | string   | `#64748b`       |
| `border`     | string   | `#e2e8f0`       |
| `chart`      | string[] | 7-color palette |

`resolveTheme(theme)` returns a fully-resolved `ResolvedTheme` (no optional
fields). The resolved theme is exposed to the DOM as `--rk-*` CSS custom
properties.

## Data sources (`DataSource`)

A discriminated union on `type`.

### Embedded

```jsonc
{
  "id": "ds1",
  "name": "Sales",
  "type": "embedded",
  "data": [ { "month": "Jan", "revenue": 100 }, … ]
}
```

| Field  | Type                        | Required |
| ------ | --------------------------- | -------- |
| `id`   | string                      | yes      |
| `name` | string                      | yes      |
| `type` | `"embedded"`                | yes      |
| `data` | `Record<string, unknown>[]` | yes      |

Rows are flat objects. Resolved synchronously, no fetch.

### External

```jsonc
{
  "id": "ds2",
  "name": "Live metrics",
  "type": "external",
  "url": "https://api.example.com/metrics",
  "method": "GET",
  "headers": { "Authorization": "Bearer …" },
  "dataPath": "data.items",
  "refreshInterval": 30000,
}
```

| Field             | Type                     | Required | Notes                                                                               |
| ----------------- | ------------------------ | -------- | ----------------------------------------------------------------------------------- |
| `id`              | string                   | yes      |                                                                                     |
| `name`            | string                   | yes      |                                                                                     |
| `type`            | `"external"`             | yes      |                                                                                     |
| `url`             | string                   | yes      | Fetched with `fetch`.                                                               |
| `method`          | `"GET" \| "POST"`        | no       | Default `GET`.                                                                      |
| `headers`         | `Record<string, string>` | no       |                                                                                     |
| `dataPath`        | string                   | no       | Dot-path to the rows array, e.g. `"data.items"`. Omit if the response is the array. |
| `refreshInterval` | number (ms)              | no       | Auto-refresh; omit for one-shot.                                                    |

External sources are fetched once by `useReportData` and shared across all
blocks that reference them.

## Blocks (`Block`)

A discriminated union on `type`. Every block has an `id` (string) and a
`props` object.

| `type`    | `props` type   |
| --------- | -------------- |
| `header`  | `HeaderProps`  |
| `text`    | `TextProps`    |
| `kpi`     | `KpiProps`     |
| `table`   | `TableProps`   |
| `chart`   | `ChartProps`   |
| `divider` | `DividerProps` |
| `image`   | `ImageProps`   |
| `section` | `SectionProps` |

### `header` — `HeaderProps`

| Field   | Type          | Required | Notes          |
| ------- | ------------- | -------- | -------------- |
| `text`  | string        | yes      |                |
| `level` | `1 \| 2 \| 3` | yes      | Heading level. |

### `text` — `TextProps`

| Field      | Type    | Required | Notes                                                         |
| ---------- | ------- | -------- | ------------------------------------------------------------- |
| `content`  | string  | yes      | Note: the field is `content`, not `text`.                     |
| `markdown` | boolean | no       | Render a minimal markdown subset (bold, italic, code, links). |

### `kpi` — `KpiProps`

| Field      | Type                    | Required | Notes                               |
| ---------- | ----------------------- | -------- | ----------------------------------- |
| `title`    | string                  | yes      |                                     |
| `value`    | `number \| KpiValueRef` | yes      | Literal number or a data reference. |
| `format`   | `NumberFormat`          | no       | Default `number`.                   |
| `currency` | string (ISO code)       | no       | Used when `format === "currency"`.  |
| `trend`    | `KpiTrend`              | no       |                                     |

`KpiValueRef`:

| Field          | Type             | Notes                                                 |
| -------------- | ---------------- | ----------------------------------------------------- |
| `dataSourceId` | string           | Reference to a data source.                           |
| `field`        | string           | Numeric field to aggregate.                           |
| `aggregation`  | `KpiAggregation` | `sum \| avg \| count \| min \| max \| first \| last`. |

`KpiTrend`: `{ value: number, direction: "up" \| "down" \| "flat" }` where
`value` is a percentage change (e.g. `12.5` = +12.5%).

### `table` — `TableProps`

| Field          | Type                   | Required | Notes |
| -------------- | ---------------------- | -------- | ----- |
| `dataSourceId` | string                 | yes      |       |
| `columns`      | `TableColumn[]`        | yes      |       |
| `title`        | string                 | no       |       |
| `pagination`   | `{ pageSize: number }` | no       |       |

`TableColumn`:

| Field      | Type                            | Required | Notes         |
| ---------- | ------------------------------- | -------- | ------------- |
| `field`    | string                          | yes      | Row key.      |
| `label`    | string                          | yes      | Header label. |
| `format`   | `NumberFormat`                  | no       |               |
| `currency` | string                          | no       |               |
| `align`    | `"left" \| "center" \| "right"` | no       |               |

### `chart` — `ChartProps`

| Field          | Type                       | Required | Notes                     |
| -------------- | -------------------------- | -------- | ------------------------- |
| `chartType`    | `"line" \| "bar" \| "pie"` | yes      |                           |
| `dataSourceId` | string                     | yes      |                           |
| `xField`       | string                     | yes      | x-axis / pie label field. |
| `series`       | `ChartSeries[]`            | yes      |                           |
| `title`        | string                     | no       |                           |
| `showLegend`   | boolean                    | no       |                           |
| `showGrid`     | boolean                    | no       |                           |

`ChartSeries`: `{ field: string, label?: string }`.

### `divider` — `DividerProps`

| Field   | Type                              | Required | Notes |
| ------- | --------------------------------- | -------- | ----- |
| `style` | `"solid" \| "dashed" \| "dotted"` | yes      |       |

### `image` — `ImageProps`

| Field      | Type        | Required | Notes |
| ---------- | ----------- | -------- | ----- |
| `src`      | string      | yes      |       |
| `alt`      | string      | no       |       |
| `caption`  | string      | no       |       |
| `maxWidth` | number (px) | no       |       |

### `section` — `SectionProps`

| Field    | Type      | Required | Notes                                 |
| -------- | --------- | -------- | ------------------------------------- |
| `title`  | string    | no       |                                       |
| `blocks` | `Block[]` | yes      | Nested blocks (one level of nesting). |

## Number formats (`NumberFormat`)

`"number" \| "currency" \| "percent" \| "compact"`. Implemented by
`formatNumber(value, format, currency, locale)`:

- `number` — `Intl.NumberFormat`, up to 2 fraction digits.
- `currency` — currency style, `currency` defaults to `USD`.
- `percent` — value is divided by 100, percent style.
- `compact` — compact notation (e.g. `1.2M`).

## KPI aggregations (`KpiAggregation`)

`sum \| avg \| count \| min \| max \| first \| last`. Implemented by
`aggregate(rows, field, agg)`. Non-numeric values are ignored (except `count`,
which counts rows). Returns `0` when no numeric values exist.

## Validation

`validateReport(json)` returns `{ valid: boolean, errors: string[] }` with
human-readable messages. `assertValidReport(json)` throws on invalid input.
Both are backed by the JSON Schema in `src/core/schema.ts` via `ajv`.
