import type { ChartProps, ChartSeries, ChartType } from '../../../core/types';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { DataSourceSelect, Field } from './fields';

const chartTypes: ChartType[] = ['line', 'bar', 'pie'];

export function ChartForm({ id, props }: { id: string; props: ChartProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const dataSources = useEditorStore((s) => s.report.dataSources);

  const setSeries = (index: number, patch: Partial<ChartSeries>) => {
    const series = props.series.map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateBlock(id, { series });
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

      <div className={styles.row}>
        <Field label="Chart type">
          <select
            className={styles.select}
            value={props.chartType}
            onChange={(e) => updateBlock(id, { chartType: e.target.value as ChartType })}
          >
            {chartTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data source">
          <DataSourceSelect
            dataSources={dataSources}
            value={props.dataSourceId}
            onChange={(dataSourceId) => updateBlock(id, { dataSourceId })}
          />
        </Field>
      </div>

      <Field label="X field">
        <input
          className={styles.input}
          value={props.xField}
          placeholder="month"
          onChange={(e) => updateBlock(id, { xField: e.target.value })}
        />
      </Field>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Series</span>
        <div className={styles.list}>
          {props.series.map((s, i) => (
            <div key={i} className={styles.listItem}>
              <input
                className={styles.input}
                value={s.field}
                placeholder="field"
                onChange={(e) => setSeries(i, { field: e.target.value })}
              />
              <input
                className={styles.input}
                value={s.label ?? ''}
                placeholder="label"
                onChange={(e) => setSeries(i, { label: e.target.value || undefined })}
              />
              <button
                type="button"
                className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                title="Remove series"
                onClick={() => updateBlock(id, { series: props.series.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.input}
          onClick={() =>
            updateBlock(id, { series: [...props.series, { field: '', label: 'Series' }] })
          }
        >
          + Add series
        </button>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={props.showLegend ?? true}
          onChange={(e) => updateBlock(id, { showLegend: e.target.checked })}
        />
        Show legend
      </label>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={props.showGrid ?? true}
          onChange={(e) => updateBlock(id, { showGrid: e.target.checked })}
        />
        Show grid
      </label>
    </div>
  );
}
