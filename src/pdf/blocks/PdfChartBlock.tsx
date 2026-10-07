import { Text, View } from '@react-pdf/renderer';
import type { ChartProps } from '../../core/types';
import { formatNumber } from '../../core/utils';
import { PdfBarChart, PdfLineChart, PdfPieChart } from '../charts';
import { usePdfReportContext } from './context';

/**
 * Renders a chart block: resolves its data source via the shared PDF context,
 * picks the right react-pdf chart and shows a legend when enabled.
 *
 * The chart is rendered at a fixed width (the page content width minus the
 * card padding), so the geometry is deterministic.
 */
export function PdfChartBlock({ props }: { props: ChartProps }) {
  const { data, theme, styles, page } = usePdfReportContext();
  const rows = data.rows[props.dataSourceId] ?? [];
  const error = data.errors[props.dataSourceId];
  const colors = theme.colors.chart;

  const formatValue = (v: number) => formatNumber(v, 'number');
  const base = {
    data: rows,
    xField: props.xField,
    series: props.series,
    colors,
    showGrid: props.showGrid,
    formatValue,
  };

  const legendItems =
    props.showLegend !== false
      ? props.series.map((s, i) => ({
          label: s.label ?? s.field,
          color: colors[i % colors.length],
        }))
      : [];

  // The chart card has 12pt padding on each side.
  const chartWidth = Math.max(page.contentWidth - 24, 320);
  const ui = {
    grid: theme.colors.border,
    label: theme.colors.textMuted,
    background: theme.colors.background,
  };

  return (
    <View style={styles.chartBlock}>
      {props.title && <Text style={styles.chartTitle}>{props.title}</Text>}
      {error ? (
        <Text style={styles.error}>Failed to load data: {error}</Text>
      ) : (
        <>
          {props.chartType === 'line' && <PdfLineChart {...base} width={chartWidth} ui={ui} />}
          {props.chartType === 'bar' && <PdfBarChart {...base} width={chartWidth} ui={ui} />}
          {props.chartType === 'pie' && <PdfPieChart {...base} />}
          {legendItems.length > 0 && (
            <View style={styles.legend}>
              {legendItems.map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                  <Text>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
