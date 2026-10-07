/**
 * @dmkdev/reportkitjs — root entry.
 *
 * Re-exports all three submodules. For tree-shaking, prefer the subpath
 * imports:
 *   - `@dmkdev/reportkitjs/core`
 *   - `@dmkdev/reportkitjs/viewer` (+ `@dmkdev/reportkitjs/viewer.css`)
 *   - `@dmkdev/reportkitjs/editor` (+ `@dmkdev/reportkitjs/editor.css`)
 *
 * Note: at the root level the viewer's block *components* shadow the core
 * block *types* (e.g. `HeaderBlock` is the component here). The core types
 * are always available via `@dmkdev/reportkitjs/core`.
 */

export * from './core';
export * from './editor';

/* ------------------------------------------------------------------ */
/* viewer — explicit re-exports (block components shadow core types)   */
/* ------------------------------------------------------------------ */

export { ReportViewer, type ReportViewerProps } from './viewer/ReportViewer';

/* Theme */
export { ThemeProvider, type ThemeProviderProps } from './viewer/theme/ThemeProvider';
export {
  ThemeContext,
  useTheme,
  themeToCssVars,
  type ThemeContextValue,
} from './viewer/theme/themeContext';

/* Data hooks */
export {
  useReportData,
  ReportDataProvider,
  useReportDataContext,
  type ReportDataState,
} from './viewer/hooks/useReportData';
export {
  useDataSource,
  useExternalData,
  findDataSource,
  type FetchState,
} from './viewer/hooks/useDataSource';

/* Blocks (components) */
export { BlockRenderer, type BlockRendererProps } from './viewer/blocks/BlockRenderer';
export { HeaderBlock } from './viewer/blocks/HeaderBlock';
export { TextBlock, renderMarkdown } from './viewer/blocks/TextBlock';
export { KpiBlock, resolveKpiValue } from './viewer/blocks/KpiBlock';
export { TableBlock } from './viewer/blocks/TableBlock';
export { ChartBlock, type ChartBlockProps } from './viewer/blocks/ChartBlock';
export { DividerBlock } from './viewer/blocks/DividerBlock';
export { ImageBlock } from './viewer/blocks/ImageBlock';
export { SectionBlock, type SectionBlockProps } from './viewer/blocks/SectionBlock';

/* Charts */
export { LineChart } from './viewer/charts/LineChart';
export { BarChart } from './viewer/charts/BarChart';
export { PieChart } from './viewer/charts/PieChart';
export {
  ChartTooltip,
  ChartLegend,
  useChartTooltip,
  HIDDEN_TOOLTIP,
  type TooltipState,
  type TooltipEntry,
  type LegendItem,
} from './viewer/charts/ChartTooltip';
export { useChartLayout } from './viewer/charts/useChartLayout';
export {
  bandScale,
  linearScale,
  niceDomain,
  ticks,
  formatTick,
  pieAngles,
  arcPath,
  plotArea,
  DEFAULT_CHART,
  type ChartDimensions,
} from './viewer/charts/scales';
export { xCategories, seriesValues, type BaseChartProps } from './viewer/charts/types';
