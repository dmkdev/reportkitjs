import type { KpiAggregation, KpiProps, KpiValueRef, NumberFormat } from '../../../core/types';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { DataSourceSelect, Field } from './fields';

const numberFormats: NumberFormat[] = ['number', 'currency', 'percent', 'compact'];
const aggregations: KpiAggregation[] = ['sum', 'avg', 'count', 'min', 'max', 'first', 'last'];

function isRef(value: KpiProps['value']): value is KpiValueRef {
  return typeof value !== 'number';
}

export function KpiForm({ id, props }: { id: string; props: KpiProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const dataSources = useEditorStore((s) => s.report.dataSources);
  const ref = isRef(props.value) ? props.value : null;

  return (
    <div className={styles.panel}>
      <Field label="Title">
        <input
          className={styles.input}
          value={props.title}
          onChange={(e) => updateBlock(id, { title: e.target.value })}
        />
      </Field>

      <Field label="Value source">
        <select
          className={styles.select}
          value={ref ? 'ref' : 'literal'}
          onChange={(e) => {
            if (e.target.value === 'ref') {
              updateBlock(id, {
                value: {
                  dataSourceId: dataSources[0]?.id ?? '',
                  field: '',
                  aggregation: 'sum',
                },
              });
            } else {
              updateBlock(id, { value: 0 });
            }
          }}
        >
          <option value="literal">Literal number</option>
          <option value="ref">Data reference</option>
        </select>
      </Field>

      {ref ? (
        <>
          <Field label="Data source">
            <DataSourceSelect
              dataSources={dataSources}
              value={ref.dataSourceId}
              onChange={(dataSourceId) => updateBlock(id, { value: { ...ref, dataSourceId } })}
            />
          </Field>
          <div className={styles.row}>
            <Field label="Field">
              <input
                className={styles.input}
                value={ref.field}
                placeholder="revenue"
                onChange={(e) => updateBlock(id, { value: { ...ref, field: e.target.value } })}
              />
            </Field>
            <Field label="Aggregation">
              <select
                className={styles.select}
                value={ref.aggregation}
                onChange={(e) =>
                  updateBlock(id, {
                    value: { ...ref, aggregation: e.target.value as KpiAggregation },
                  })
                }
              >
                {aggregations.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </>
      ) : (
        <Field label="Value">
          <input
            className={styles.input}
            type="number"
            value={typeof props.value === 'number' ? props.value : 0}
            onChange={(e) => updateBlock(id, { value: Number(e.target.value) })}
          />
        </Field>
      )}

      <div className={styles.row}>
        <Field label="Format">
          <select
            className={styles.select}
            value={props.format ?? 'number'}
            onChange={(e) => updateBlock(id, { format: e.target.value as NumberFormat })}
          >
            {numberFormats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
        {(props.format ?? 'number') === 'currency' && (
          <Field label="Currency">
            <input
              className={styles.input}
              value={props.currency ?? 'USD'}
              placeholder="USD"
              onChange={(e) => updateBlock(id, { currency: e.target.value })}
            />
          </Field>
        )}
      </div>
    </div>
  );
}
