import { useEditorStore } from '../store/editorStore';
import styles from '../styles/panels.module.css';
import { Field } from './forms/fields';

/**
 * Report-level settings: meta (title, description, author) and theme
 * overrides. Shown when no block is selected.
 */
export function MetaPanel() {
  const report = useEditorStore((s) => s.report);
  const updateMeta = useEditorStore((s) => s.updateMeta);
  const updateTheme = useEditorStore((s) => s.updateTheme);

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Report</h2>

      <Field label="Title">
        <input
          className={styles.input}
          value={report.meta.title}
          onChange={(e) => updateMeta({ title: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={styles.textarea}
          value={report.meta.description ?? ''}
          onChange={(e) => updateMeta({ description: e.target.value || undefined })}
        />
      </Field>
      <Field label="Author">
        <input
          className={styles.input}
          value={report.meta.author ?? ''}
          onChange={(e) => updateMeta({ author: e.target.value || undefined })}
        />
      </Field>

      <div className={styles.section}>
        <h3 className={styles.panelTitle}>Theme</h3>
        <div className={styles.row}>
          <Field label="Primary color">
            <input
              className={styles.input}
              type="color"
              value={report.theme?.primaryColor ?? '#2563eb'}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            />
          </Field>
          <Field label="Max width">
            <input
              className={styles.input}
              type="number"
              min={320}
              value={report.theme?.maxWidth ?? 960}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateTheme({ maxWidth: v > 0 ? v : undefined });
              }}
            />
          </Field>
        </div>
        <Field label="Font family">
          <input
            className={styles.input}
            value={report.theme?.fontFamily ?? ''}
            placeholder="default"
            onChange={(e) => updateTheme({ fontFamily: e.target.value || undefined })}
          />
        </Field>
      </div>
    </div>
  );
}
