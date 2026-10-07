import type { Report } from '../core/types';
import { ThemeProvider } from './theme/ThemeProvider';
import { useReportData, ReportDataProvider } from './hooks/useReportData';
import { BlockRenderer } from './blocks/BlockRenderer';
import styles from './styles/reportViewer.module.css';

export interface ReportViewerProps {
  report: Report;
}

/**
 * Renders a full report: theme, meta header and all blocks.
 *
 * External data sources are fetched once (shared across blocks) via
 * `useReportData`; embedded sources resolve synchronously.
 */
export function ReportViewer({ report }: ReportViewerProps) {
  return (
    <ThemeProvider theme={report.theme}>
      <ReportViewerInner report={report} />
    </ThemeProvider>
  );
}

function ReportViewerInner({ report }: ReportViewerProps) {
  const data = useReportData(report);

  return (
    <ReportDataProvider value={data}>
      <div className={styles.viewer}>
        <header>
          <h1 className={styles.reportTitle}>{report.meta.title}</h1>
          {report.meta.description && (
            <p className={styles.reportDescription}>{report.meta.description}</p>
          )}
          <dl className={styles.reportMeta}>
            {report.meta.author && (
              <>
                <dt>Author:</dt>
                <dd>{report.meta.author}</dd>
              </>
            )}
            <dt>Updated:</dt>
            <dd>{new Date(report.meta.updatedAt).toLocaleDateString()}</dd>
          </dl>
        </header>

        {data.error && <div className={styles.errorBanner}>Data error: {data.error}</div>}

        <div className={styles.blocks}>
          {report.blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </div>
    </ReportDataProvider>
  );
}
