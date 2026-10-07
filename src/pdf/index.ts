/**
 * @dmkdev/pdf — export a report JSON document as a PDF.
 *
 * ```ts
 * import { downloadReportPdf } from '@dmkdev/pdf';
 *
 * // Trigger a browser download of the report as a PDF.
 * await downloadReportPdf(report);
 * ```
 *
 * The PDF is rendered with `@react-pdf/renderer` (vector output, selectable
 * text). Cyrillic text requires a registered font — the default is Inter
 * fetched from a CDN; override with `configurePdfFonts`.
 */

/* Public API */
export {
  ReportPdf,
  ReportPdfDocument,
  exportReportToPdf,
  downloadReportPdf,
  type ReportPdfProps,
  type ReportPdfDocumentProps,
  type PdfExportOptions,
} from './ReportPdf';

/* Data resolution */
export { resolveReportData, type ResolvedReportData } from './data';

/* Fonts */
export {
  configurePdfFonts,
  getPdfFontFamily,
  type PdfFontOptions,
  type PdfFontSource,
} from './fonts';

/* Styles */
export {
  buildPdfStyles,
  getPageSpec,
  PDF_PAGES,
  PDF_MARGIN,
  type PdfPageSize,
  type PdfPageSpec,
  type PdfStyles,
} from './styles';

/* Markdown */
export {
  parseMarkdown,
  segmentsToText,
  PdfText,
  type MarkdownSegment,
  type PdfTextProps,
} from './markdown';

/* Charts */
export {
  PdfLineChart,
  PdfBarChart,
  PdfPieChart,
  type PdfCartesianChartProps,
  type PdfChartUiColors,
} from './charts';

/* Blocks */
export { PdfBlockRenderer, PdfBlockList } from './blocks/PdfBlockRenderer';
export { PdfHeaderBlock } from './blocks/PdfHeaderBlock';
export { PdfTextBlock } from './blocks/PdfTextBlock';
export { PdfKpiBlock, resolveKpiValue } from './blocks/PdfKpiBlock';
export { PdfTableBlock } from './blocks/PdfTableBlock';
export { PdfChartBlock } from './blocks/PdfChartBlock';
export { PdfDividerBlock } from './blocks/PdfDividerBlock';
export { PdfImageBlock } from './blocks/PdfImageBlock';
export { PdfSectionBlock, type PdfSectionBlockProps } from './blocks/PdfSectionBlock';
export {
  PdfReportContext,
  usePdfReportContext,
  type PdfReportContextValue,
} from './blocks/context';
