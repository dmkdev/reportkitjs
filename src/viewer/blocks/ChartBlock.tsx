import type { ChartProps } from '../../core/types';
import { formatNumber } from '../../core/utils';
import { useTheme } from '../theme/themeContext';
import { useReportDataContext } from '../hooks/useReportData';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { ChartLegend } from '../charts/ChartTooltip';
import styles from '../styles/blocks.module.css';

export interface ChartBlockProps {
  props: ChartProps;
}

/**
 * Renders a chart block: resolves its data source via the report's
 * centralized data context, picks the right SVG chart and shows a legend
 * when enabled.
 */
export function ChartBlock({ props }: ChartBlockProps) {
  const { resolved } = useTheme();
  const { getSource } = useReportDataContext();
  const { data, loading, error } = getSource(props.dataSourceId);

  const formatValue = (v: number) => formatNumber(v, 'number');
  const base = {
    data,
    xField: props.xField,
    series: props.series,
    colors: resolved.colors.chart,
    showGrid: props.showGrid,
    formatValue,
  };

  const legendItems =
    props.showLegend !== false
      ? props.series.map((s, i) => ({
          label: s.label ?? s.field,
          color: resolved.colors.chart[i % resolved.colors.chart.length],
        }))
      : [];

  return (
    <div className={styles.chartBlock}>
      {props.title && <p className={styles.chartTitle}>{props.title}</p>}
      {loading ? (
        <div className={styles.loading}>Loading data…</div>
      ) : error ? (
        <div className={styles.error}>Failed to load data: {error}</div>
      ) : (
        <>
          {props.chartType === 'line' && <LineChart {...base} />}
          {props.chartType === 'bar' && <BarChart {...base} />}
          {props.chartType === 'pie' && <PieChart {...base} />}
          {legendItems.length > 0 && <ChartLegend items={legendItems} />}
        </>
      )}
    </div>
  );
}
