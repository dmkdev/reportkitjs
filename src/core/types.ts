/**
 * ReportkitJs — core type definitions for the report JSON schema (v1.0.0).
 *
 * A report is a self-describing JSON document:
 *   - `meta`          — identity & timestamps
 *   - `theme`         — optional visual overrides (falls back to defaults)
 *   - `dataSources`   — embedded (inline rows) or external (fetched) data
 *   - `blocks`        — ordered list of renderable blocks (sections nest recursively)
 */

export const REPORT_VERSION = '1.0.0';

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

export interface ReportMeta {
  id: string;
  title: string;
  description?: string;
  author?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

export interface ReportThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  /** Palette used by charts, in order. */
  chart: string[];
}

export interface ReportTheme {
  primaryColor?: string;
  fontFamily?: string;
  /** Max content width in px. */
  maxWidth?: number;
  colors?: Partial<ReportThemeColors>;
}

/* ------------------------------------------------------------------ */
/* Data sources                                                        */
/* ------------------------------------------------------------------ */

export interface EmbeddedDataSource {
  id: string;
  name: string;
  type: 'embedded';
  /** Tabular rows: array of flat objects. */
  data: Record<string, unknown>[];
}

export interface ExternalDataSource {
  id: string;
  name: string;
  type: 'external';
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  /**
   * Dot-path into the fetched JSON to reach the rows array,
   * e.g. `"data.items"`. Omit when the response is the array itself.
   */
  dataPath?: string;
  /** Auto-refresh interval in ms. Omit for one-shot fetch. */
  refreshInterval?: number;
}

export type DataSource = EmbeddedDataSource | ExternalDataSource;

/* ------------------------------------------------------------------ */
/* Number formatting                                                   */
/* ------------------------------------------------------------------ */

export type NumberFormat = 'number' | 'currency' | 'percent' | 'compact';

/* ------------------------------------------------------------------ */
/* KPI                                                                 */
/* ------------------------------------------------------------------ */

export type KpiAggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';

/** Reference to a field in a data source, aggregated. */
export interface KpiValueRef {
  dataSourceId: string;
  field: string;
  aggregation: KpiAggregation;
}

/** A KPI value is either a literal number or a data reference. */
export type KpiValue = number | KpiValueRef;

export interface KpiTrend {
  /** Percentage change, e.g. 12.5 means +12.5%. */
  value: number;
  direction: 'up' | 'down' | 'flat';
}

/* ------------------------------------------------------------------ */
/* Block props                                                         */
/* ------------------------------------------------------------------ */

export interface HeaderProps {
  text: string;
  level: 1 | 2 | 3;
}

export interface TextProps {
  content: string;
  /** Render content as a minimal markdown subset (bold, italic, code, links). */
  markdown?: boolean;
}

export interface KpiProps {
  title: string;
  value: KpiValue;
  format?: NumberFormat;
  /** ISO currency code, used when format === 'currency'. */
  currency?: string;
  trend?: KpiTrend;
}

export interface TableColumn {
  field: string;
  label: string;
  format?: NumberFormat;
  currency?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps {
  dataSourceId: string;
  columns: TableColumn[];
  title?: string;
  pagination?: { pageSize: number };
}

export type ChartType = 'line' | 'bar' | 'pie';

export interface ChartSeries {
  field: string;
  label?: string;
}

export interface ChartProps {
  chartType: ChartType;
  dataSourceId: string;
  /** Field used for the x-axis / pie labels. */
  xField: string;
  series: ChartSeries[];
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface DividerProps {
  style: 'solid' | 'dashed' | 'dotted';
}

export interface ImageProps {
  src: string;
  alt?: string;
  caption?: string;
  /** Max width in px. */
  maxWidth?: number;
}

export interface SectionProps {
  title?: string;
  blocks: Block[];
}

/* ------------------------------------------------------------------ */
/* Blocks                                                              */
/* ------------------------------------------------------------------ */

export interface HeaderBlock {
  id: string;
  type: 'header';
  props: HeaderProps;
}

export interface TextBlock {
  id: string;
  type: 'text';
  props: TextProps;
}

export interface KpiBlock {
  id: string;
  type: 'kpi';
  props: KpiProps;
}

export interface TableBlock {
  id: string;
  type: 'table';
  props: TableProps;
}

export interface ChartBlock {
  id: string;
  type: 'chart';
  props: ChartProps;
}

export interface DividerBlock {
  id: string;
  type: 'divider';
  props: DividerProps;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  props: ImageProps;
}

export interface SectionBlock {
  id: string;
  type: 'section';
  props: SectionProps;
}

export type Block =
  | HeaderBlock
  | TextBlock
  | KpiBlock
  | TableBlock
  | ChartBlock
  | DividerBlock
  | ImageBlock
  | SectionBlock;

export type BlockType = Block['type'];

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

export interface Report {
  /** Optional pointer to the JSON schema, e.g. "https://reportkitjs.dev/schema.json". */
  $schema?: string;
  version: string;
  meta: ReportMeta;
  theme?: ReportTheme;
  dataSources: DataSource[];
  blocks: Block[];
}
