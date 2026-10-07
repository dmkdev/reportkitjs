import type { NumberFormat, TableColumn, TableProps } from '../../../core/types';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { DataSourceSelect, Field } from './fields';

const numberFormats: NumberFormat[] = ['number', 'currency', 'percent', 'compact'];

export function TableForm({ id, props }: { id: string; props: TableProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const dataSources = useEditorStore((s) => s.report.dataSources);

  const setColumn = (index: number, patch: Partial<TableColumn>) => {
    const columns = props.columns.map((c, i) => (i === index ? { ...c, ...patch } : c));
    updateBlock(id, { columns });
  };

  const addColumn = () => {
    updateBlock(id, { columns: [...props.columns, { field: '', label: 'Column' }] });
  };

  const removeColumn = (index: number) => {
    updateBlock(id, { columns: props.columns.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.panel}>
      <Field label="Title">
        <input
          className={styles.input}
          value={props.title ?? ''}
          placeholder="(none)"
          onChange={(e) => updateBlock(id, { title: e.target.value || undefined })}
        />
      </Field>

      <Field label="Data source">
        <DataSourceSelect
          dataSources={dataSources}
          value={props.dataSourceId}
          onChange={(dataSourceId) => updateBlock(id, { dataSourceId })}
        />
      </Field>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Columns</span>
        <div className={styles.list}>
          {props.columns.map((col, i) => (
            <div key={i} className={styles.listItem}>
              <input
                className={styles.input}
                value={col.field}
                placeholder="field"
                onChange={(e) => setColumn(i, { field: e.target.value })}
              />
              <input
                className={styles.input}
                value={col.label}
                placeholder="label"
                onChange={(e) => setColumn(i, { label: e.target.value })}
              />
              <select
                className={styles.select}
                value={col.format ?? ''}
                onChange={(e) =>
                  setColumn(i, {
                    format: (e.target.value || undefined) as NumberFormat | undefined,
                  })
                }
              >
                <option value="">—</option>
                {numberFormats.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={col.align ?? 'left'}
                onChange={(e) => setColumn(i, { align: e.target.value as TableColumn['align'] })}
              >
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
              <button
                type="button"
                className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                title="Remove column"
                onClick={() => removeColumn(i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={styles.input} onClick={addColumn}>
          + Add column
        </button>
      </div>

      <div className={styles.row}>
        <Field label="Pagination (page size)">
          <input
            className={styles.input}
            type="number"
            min={1}
            value={props.pagination?.pageSize ?? ''}
            placeholder="off"
            onChange={(e) => {
              const v = Number(e.target.value);
              updateBlock(id, { pagination: v > 0 ? { pageSize: v } : undefined });
            }}
          />
        </Field>
      </div>
    </div>
  );
}
