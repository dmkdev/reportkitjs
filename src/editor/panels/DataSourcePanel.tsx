import { useState } from 'react';
import type { EmbeddedDataSource, ExternalDataSource } from '../../core/types';
import { createId } from '../../core/utils';
import { useEditorStore } from '../store/editorStore';
import styles from '../styles/panels.module.css';
import { Field } from './forms/fields';

/**
 * Manages the report's data sources: add embedded (inline JSON rows) or
 * external (fetched) sources, edit their settings, remove them.
 */
export function DataSourcePanel() {
  const dataSources = useEditorStore((s) => s.report.dataSources);
  const addDataSource = useEditorStore((s) => s.addDataSource);
  const updateDataSource = useEditorStore((s) => s.updateDataSource);
  const removeDataSource = useEditorStore((s) => s.removeDataSource);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState('');

  const addEmbedded = () => {
    const ds: EmbeddedDataSource = {
      id: createId('ds'),
      name: `Data ${dataSources.length + 1}`,
      type: 'embedded',
      data: [],
    };
    addDataSource(ds);
    setEditingId(ds.id);
    setJsonDraft('[]');
  };

  const addExternal = () => {
    const ds: ExternalDataSource = {
      id: createId('ds'),
      name: `API ${dataSources.length + 1}`,
      type: 'external',
      url: 'https://',
    };
    addDataSource(ds);
    setEditingId(ds.id);
  };

  const applyJson = (id: string) => {
    try {
      const parsed: unknown = JSON.parse(jsonDraft);
      if (!Array.isArray(parsed)) throw new Error('Expected an array of rows');
      updateDataSource(id, { data: parsed as Record<string, unknown>[] });
      setEditingId(null);
    } catch (err) {
      setJsonDraft(`${jsonDraft}\n// ${err instanceof Error ? err.message : 'Invalid JSON'}`);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Data sources</h2>

      <div className={styles.row}>
        <button type="button" className={styles.input} onClick={addEmbedded}>
          + Embedded
        </button>
        <button type="button" className={styles.input} onClick={addExternal}>
          + External
        </button>
      </div>

      {dataSources.length === 0 ? (
        <div className={styles.empty}>No data sources yet.</div>
      ) : (
        <div className={styles.list}>
          {dataSources.map((ds) => (
            <div key={ds.id} className={styles.listItem}>
              <span className={styles.listItemName}>{ds.name}</span>
              <span className={ds.type === 'external' ? styles.badgeExternal : styles.badge}>
                {ds.type}
              </span>
              <button
                type="button"
                className={styles.iconButton}
                title="Edit"
                onClick={() => {
                  setEditingId(editingId === ds.id ? null : ds.id);
                  if (ds.type === 'embedded') setJsonDraft(JSON.stringify(ds.data, null, 2));
                }}
              >
                ✎
              </button>
              <button
                type="button"
                className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                title="Remove"
                onClick={() => removeDataSource(ds.id)}
              >
                ✕
              </button>

              {editingId === ds.id && (
                <div className={styles.field} style={{ width: '100%' }}>
                  <Field label="Name">
                    <input
                      className={styles.input}
                      value={ds.name}
                      onChange={(e) => updateDataSource(ds.id, { name: e.target.value })}
                    />
                  </Field>
                  {ds.type === 'external' ? (
                    <>
                      <Field label="URL">
                        <input
                          className={styles.input}
                          value={ds.url}
                          onChange={(e) => updateDataSource(ds.id, { url: e.target.value })}
                        />
                      </Field>
                      <div className={styles.row}>
                        <Field label="Method">
                          <select
                            className={styles.select}
                            value={ds.method ?? 'GET'}
                            onChange={(e) =>
                              updateDataSource(ds.id, { method: e.target.value as 'GET' | 'POST' })
                            }
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                          </select>
                        </Field>
                        <Field label="Data path">
                          <input
                            className={styles.input}
                            value={ds.dataPath ?? ''}
                            placeholder="data.items"
                            onChange={(e) =>
                              updateDataSource(ds.id, { dataPath: e.target.value || undefined })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Refresh interval (ms)">
                        <input
                          className={styles.input}
                          type="number"
                          min={0}
                          value={ds.refreshInterval ?? ''}
                          placeholder="one-shot"
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateDataSource(ds.id, { refreshInterval: v > 0 ? v : undefined });
                          }}
                        />
                      </Field>
                    </>
                  ) : (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Rows (JSON array)</span>
                      <textarea
                        className={styles.textarea}
                        value={jsonDraft}
                        onChange={(e) => setJsonDraft(e.target.value)}
                        rows={8}
                      />
                      <button
                        type="button"
                        className={styles.input}
                        onClick={() => applyJson(ds.id)}
                      >
                        Apply JSON
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
