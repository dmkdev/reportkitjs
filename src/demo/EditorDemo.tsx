import { useEffect, useRef } from 'react';
import { ReportEditor, useEditorStore } from '../editor';
import sampleReport from './sample-report.json';
import type { Report } from '../core';

/**
 * Demo: the visual editor, preloaded with the sample report.
 * The store is a module singleton, so the Viewer tab shows live updates.
 */
export function EditorDemo() {
  const reset = useEditorStore((s) => s.reset);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      reset(sampleReport as Report);
    }
  }, [reset]);

  return <ReportEditor />;
}
