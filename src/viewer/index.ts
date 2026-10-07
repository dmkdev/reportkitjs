/**
 * @dmkdev/viewer — render a report JSON document as a React component.
 *
 * ```tsx
 * import { ReportViewer } from '@dmkdev/viewer';
 * import '@dmkdev/viewer.css';
 *
 * function Page() {
 *   return <ReportViewer report={report} />;
 * }
 * ```
 */

export { ReportViewer, type ReportViewerProps } from './ReportViewer';

/* Theme */
export { ThemeProvider, type ThemeProviderProps } from './theme/ThemeProvider';
export {
  ThemeContext,
  useTheme,
  themeToCssVars,
  type ThemeContextValue,
} from './theme/themeContext';

/* Data hooks */
export {
  useReportData,
  ReportDataProvider,
  useReportDataContext,
  type ReportDataState,
} from './hooks/useReportData';
export {
  useDataSource,
  useExternalData,
  findDataSource,
  type FetchState,
} from './hooks/useDataSource';

/* Blocks */
export { BlockRenderer, type BlockRendererProps } from './blocks/BlockRenderer';
export { HeaderBlock } from './blocks/HeaderBlock';
export { TextBlock, renderMarkdown } from './blocks/TextBlock';
export { KpiBlock, resolveKpiValue } from './blocks/KpiBlock';
export { TableBlock } from './blocks/TableBlock';
export { ChartBlock, type ChartBlockProps } from './blocks/ChartBlock';
export { DividerBlock } from './blocks/DividerBlock';
export { ImageBlock } from './blocks/ImageBlock';
export { SectionBlock, type SectionBlockProps } from './blocks/SectionBlock';

/* Charts */
export { LineChart } from './charts/LineChart';
export { BarChart } from './charts/BarChart';
export { PieChart } from './charts/PieChart';
export {
  ChartTooltip,
  ChartLegend,
  useChartTooltip,
  HIDDEN_TOOLTIP,
  type TooltipState,
  type TooltipEntry,
  type LegendItem,
} from './charts/ChartTooltip';
export { useChartLayout } from './charts/useChartLayout';
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
} from './charts/scales';
export { xCategories, seriesValues, type BaseChartProps } from './charts/types';
