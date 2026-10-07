import type { KpiProps, KpiValue } from '../../core/types';
import { aggregate, formatNumber } from '../../core/utils';
import { useReportDataContext } from '../hooks/useReportData';
import styles from '../styles/blocks.module.css';

/**
 * Resolve a KPI value to a number. Literal numbers pass through;
 * references are aggregated over the referenced data source's rows.
 */
export function resolveKpiValue(value: KpiValue, rows: Record<string, unknown>[]): number {
  if (typeof value === 'number') return value;
  return aggregate(rows, value.field, value.aggregation);
}

const TREND_CLASS = {
  up: styles.kpiTrendUp,
  down: styles.kpiTrendDown,
  flat: styles.kpiTrendFlat,
} as const;

const TREND_ICON = { up: '▲', down: '▼', flat: '—' } as const;

/**
 * Renders a KPI card. The value is either a literal number or a reference
 * to a data source field (aggregated). Data is resolved via the report's
 * centralized data context (provided by `<ReportViewer>`).
 */
export function KpiBlock({ props }: { props: KpiProps }) {
  const { getSource } = useReportDataContext();
  const value =
    typeof props.value === 'number'
      ? props.value
      : resolveKpiValue(props.value, getSource(props.value.dataSourceId).data);
  const formatted = formatNumber(value, props.format ?? 'number', props.currency);

  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiTitle}>{props.title}</p>
      <p className={styles.kpiValue}>{formatted}</p>
      {props.trend && (
        <span className={`${styles.kpiTrend} ${TREND_CLASS[props.trend.direction]}`}>
          {TREND_ICON[props.trend.direction]} {Math.abs(props.trend.value)}%
        </span>
      )}
    </div>
  );
}
