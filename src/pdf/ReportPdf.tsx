import { useEffect, useMemo, useState } from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import type { PageSize } from '@react-pdf/types';
import type { Report } from '../core/types';
import { resolveTheme } from '../core/defaults';
import { resolveReportData, type ResolvedReportData } from './data';
import { configurePdfFonts, type PdfFontOptions } from './fonts';
import { buildPdfStyles, getPageSpec, type PdfPageSize } from './styles';
import { PdfReportContext } from './blocks/context';
import { PdfBlockList } from './blocks/PdfBlockRenderer';

/** Map our page-size names to react-pdf's `PageSize` (which uses `LETTER`). */
const REACT_PDF_PAGE_SIZE: Record<PdfPageSize, PageSize> = {
  A4: 'A4',
  Letter: 'LETTER',
};

export interface PdfExportOptions {
  /** File name for downloads. Defaults to `${report.meta.id}.pdf`. */
  fileName?: string;
  /** Page size. Defaults to A4. */
  pageSize?: PdfPageSize;
  /** Override the registered font family (see `configurePdfFonts`). */
  fonts?: PdfFontOptions;
}

export interface ReportPdfDocumentProps {
  report: Report;
  /** Pre-resolved data (from `resolveReportData`). */
  data: ResolvedReportData;
  pageSize?: PdfPageSize;
}

/**
 * The synchronous `<Document>` for a report. All data must already be
 * resolved (via `resolveReportData`) — this component performs no fetching,
 * so it can be rendered directly by `pdf(...)` for export.
 */
export function ReportPdfDocument({ report, data, pageSize = 'A4' }: ReportPdfDocumentProps) {
  const theme = useMemo(() => resolveTheme(report.theme), [report.theme]);
  const styles = useMemo(() => buildPdfStyles(theme), [theme]);
  const page = useMemo(() => getPageSpec(pageSize), [pageSize]);
  const ctx = useMemo(() => ({ data, theme, styles, page }), [data, theme, styles, page]);

  return (
    <PdfReportContext.Provider value={ctx}>
      <Document title={report.meta.title} author={report.meta.author}>
        <Page size={REACT_PDF_PAGE_SIZE[pageSize]} style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.reportTitle}>{report.meta.title}</Text>
            {report.meta.description && (
              <Text style={styles.reportDescription}>{report.meta.description}</Text>
            )}
            <View style={styles.reportMeta}>
              {report.meta.author && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Author:</Text>
                  <Text>{report.meta.author}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Updated:</Text>
                <Text>{new Date(report.meta.updatedAt).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.blocks}>
            <PdfBlockList blocks={report.blocks} />
          </View>

          <Text style={styles.footer}>{report.meta.title}</Text>
        </Page>
      </Document>
    </PdfReportContext.Provider>
  );
}

export interface ReportPdfProps {
  report: Report;
  pageSize?: PdfPageSize;
}

/**
 * Embeddable report PDF. Resolves the report's data sources (embedded
 * synchronously, external via fetch) and renders the document.
 *
 * For programmatic export prefer `exportReportToPdf` / `downloadReportPdf`.
 */
export function ReportPdf({ report, pageSize = 'A4' }: ReportPdfProps) {
  const [data, setData] = useState<ResolvedReportData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    void resolveReportData(report).then((resolved) => {
      if (!cancelled) setData(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [report]);

  if (!data) return null;
  return <ReportPdfDocument report={report} data={data} pageSize={pageSize} />;
}

/**
 * Export a report to a PDF `Blob`.
 *
 * Resolves all data sources, then renders the document with
 * `pdf(<Document>).toBlob()`. Requires network access for the default
 * CDN-hosted fonts unless overridden via `options.fonts`.
 */
export async function exportReportToPdf(
  report: Report,
  options: PdfExportOptions = {},
): Promise<Blob> {
  if (options.fonts) configurePdfFonts(options.fonts);
  const data = await resolveReportData(report);
  const doc = pdf(
    <ReportPdfDocument report={report} data={data} pageSize={options.pageSize ?? 'A4'} />,
  );
  return doc.toBlob();
}

/**
 * Export a report to PDF and trigger a browser download.
 *
 * @returns a promise that resolves once the download has been initiated.
 */
export async function downloadReportPdf(
  report: Report,
  options: PdfExportOptions = {},
): Promise<void> {
  const blob = await exportReportToPdf(report, options);
  const fileName = options.fileName ?? `${report.meta.id}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
