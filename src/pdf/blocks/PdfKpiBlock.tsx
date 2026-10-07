import { Text, View } from '@react-pdf/renderer';
import type { KpiProps, KpiValue } from '../../core/types';
import { aggregate, formatNumber } from '../../core/utils';
import { usePdfReportContext } from './context';

/**
 * Resolve a KPI value to a number. Literal numbers pass through; references
 * are aggregated over the referenced data source's rows.
 */
export function resolveKpiValue(value: KpiValue, rows: Record<string, unknown>[]): number {
  if (typeof value === 'number') return value;
  return aggregate(rows, value.field, value.aggregation);
}

const TREND_STYLE = {
  up: 'kpiTrendUp',
  down: 'kpiTrendDown',
  flat: 'kpiTrendFlat',
} as const;

const TREND_ICON = { up: '▲', down: '▼', flat: '—' } as const;

/**
 * Renders a single KPI card. Consecutive KPI blocks are grouped into a row by
 * `PdfBlockList`; each card stretches to fill its share of the row.
 */
export function PdfKpiBlock({ props }: { props: KpiProps }) {
  const { data, styles } = usePdfReportContext();
  const rows = typeof props.value === 'object' ? (data.rows[props.value.dataSourceId] ?? []) : [];
  const value = resolveKpiValue(props.value, rows);
  const formatted = formatNumber(value, props.format ?? 'number', props.currency);

  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{props.title}</Text>
      <Text style={styles.kpiValue}>{formatted}</Text>
      {props.trend && (
        <Text style={[styles.kpiTrend, styles[TREND_STYLE[props.trend.direction]]]}>
          {TREND_ICON[props.trend.direction]} {Math.abs(props.trend.value)}%
        </Text>
      )}
    </View>
  );
}
