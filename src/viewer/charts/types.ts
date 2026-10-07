import type { ChartSeries } from '../../core/types';

/** Common props shared by all chart components. */
export interface BaseChartProps {
  data: Record<string, unknown>[];
  xField: string;
  series: ChartSeries[];
  /** Color palette (from the theme). */
  colors: string[];
  showGrid?: boolean;
  /** Format a numeric value for display (tooltip, axis). */
  formatValue?: (value: number) => string;
}

/** Extract the x-axis category labels (in order of appearance). */
export function xCategories(data: Record<string, unknown>[], xField: string): string[] {
  const seen: string[] = [];
  const set = new Set<string>();
  for (const row of data) {
    const key = String(row[xField] ?? '');
    if (!set.has(key)) {
      set.add(key);
      seen.push(key);
    }
  }
  return seen;
}

/** Extract numeric values for a series field, aligned to xCategories order. */
export function seriesValues(
  data: Record<string, unknown>[],
  xField: string,
  field: string,
  categories: string[],
): number[] {
  const byCategory = new Map<string, number>();
  for (const row of data) {
    const key = String(row[xField] ?? '');
    const value = row[field];
    byCategory.set(key, typeof value === 'number' && Number.isFinite(value) ? value : 0);
  }
  return categories.map((c) => byCategory.get(c) ?? 0);
}
