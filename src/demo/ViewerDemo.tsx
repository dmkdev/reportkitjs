import { useState } from 'react';
import { ReportViewer } from '../viewer';
import { downloadReportPdf } from '../pdf';
import { useEditorStore } from '../editor';

/**
 * Demo: live preview. Reads the report from the shared editor store, so
 * edits made in the Editor tab appear here instantly.
 */
export function ViewerDemo() {
  const report = useEditorStore((s) => s.report);
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await downloadReportPdf(report);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('PDF export failed. See console for details.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: exporting ? '#e2e8f0' : '#ffffff',
            color: '#0f172a',
            fontWeight: 500,
            cursor: exporting ? 'wait' : 'pointer',
          }}
        >
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
      <ReportViewer report={report} />
    </div>
  );
}
