import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { BlockType, Report } from '../core/types';
import { validateReport } from '../core/validate';
import { parseDropZoneId } from './canvas/DropZone';
import { ReportCanvas } from './canvas/ReportCanvas';
import { BlockPalette } from './panels/BlockPalette';
import { DataSourcePanel } from './panels/DataSourcePanel';
import { MetaPanel } from './panels/MetaPanel';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { useEditorStore } from './store/editorStore';
import { downloadReportPdf } from '../pdf';
import styles from './styles/reportEditor.module.css';

export interface ReportEditorProps {
  /** Initial report to load. Defaults to an empty report. */
  initialReport?: Report;
  /** Called whenever the report changes. */
  onChange?: (report: Report) => void;
}

/** Trigger a client-side download of the report JSON. */
function downloadReport(report: Report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${report.meta.id}.reportkitjs.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * The visual report editor: block palette + data sources (left), canvas
 * (center), properties / meta panels (right), and a toolbar with
 * undo/redo, import and export.
 */
export function ReportEditor({ initialReport, onChange }: ReportEditorProps) {
  const report = useEditorStore((s) => s.report);
  const history = useEditorStore((s) => s.history);
  const future = useEditorStore((s) => s.future);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const setReport = useEditorStore((s) => s.setReport);
  const reset = useEditorStore((s) => s.reset);
  const addBlock = useEditorStore((s) => s.addBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const setDragState = useEditorStore((s) => s.setDragState);

  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Load the initial report once (the store is a module singleton).
  useEffect(() => {
    if (initialReport && !initializedRef.current) {
      initializedRef.current = true;
      reset(initialReport);
    }
  }, [initialReport, reset]);

  // Notify the parent whenever the report changes.
  useEffect(() => {
    onChange?.(report);
  }, [report, onChange]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setDragState({ blockId: id, from: id.startsWith('palette:') ? 'palette' : 'canvas' });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragState(null);
    if (!over) return;

    const zone = parseDropZoneId(String(over.id));
    if (!zone) return;

    const activeId = String(active.id);
    if (activeId.startsWith('palette:')) {
      const type = activeId.slice('palette:'.length) as BlockType;
      addBlock(type, zone.index, zone.sectionId);
    } else {
      moveBlock(activeId, zone.index, zone.sectionId);
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        const result = validateReport(parsed);
        if (!result.valid) {
          window.alert(`Invalid report:\n${result.errors.join('\n')}`);
          return;
        }
        setReport(parsed as Report);
      } catch (err) {
        window.alert(`Could not parse JSON: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
  };

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
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>{report.meta.title}</span>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={undo}
          disabled={history.length === 0}
          title="Undo"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={redo}
          disabled={future.length === 0}
          title="Redo"
        >
          ↪ Redo
        </button>
        <span className={styles.toolbarSpacer} />
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = '';
          }}
        />
        <button type="button" className={styles.toolbarButton} onClick={() => reset(report)}>
          Reset
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={handleExportPdf}
          disabled={exporting}
          title="Export the report as a PDF file"
        >
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
        <button
          type="button"
          className={styles.toolbarButtonPrimary}
          onClick={() => downloadReport(report)}
        >
          Export JSON
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.palette}>
          <BlockPalette />
          <div style={{ marginTop: 16 }}>
            <DataSourcePanel />
          </div>
        </div>

        <div className={styles.canvas}>
          <ReportCanvas blocks={report.blocks} />
        </div>

        <div className={styles.properties}>
          {selectedBlockId ? <PropertiesPanel /> : <MetaPanel />}
        </div>
      </DndContext>
    </div>
  );
}
