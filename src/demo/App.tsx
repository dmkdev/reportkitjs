import { useState } from 'react';
import { ViewerDemo } from './ViewerDemo';
import { EditorDemo } from './EditorDemo';

type Tab = 'viewer' | 'editor';

/**
 * Demo shell: a tab switcher between the live viewer and the visual editor.
 * Both share the same editor store, so edits appear in the viewer instantly.
 */
export function App() {
  const [tab, setTab] = useState<Tab>('viewer');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <nav
        style={{
          display: 'flex',
          gap: 4,
          padding: '8px 16px',
          background: '#0f172a',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ color: '#e2e8f0', fontWeight: 600, marginRight: 12, alignSelf: 'center' }}>
          ReportkitJs demo
        </span>
        {(['viewer', 'editor'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: tab === t ? '#2563eb' : 'transparent',
              color: tab === t ? '#ffffff' : '#94a3b8',
              fontWeight: 500,
            }}
          >
            {t === 'viewer' ? 'Viewer' : 'Editor'}
          </button>
        ))}
      </nav>

      <main style={{ padding: 16 }}>{tab === 'viewer' ? <ViewerDemo /> : <EditorDemo />}</main>
    </div>
  );
}
