import { DEFAULT_CHART, bandScale, linearScale, niceDomain, plotArea, ticks } from './scales';
import { seriesValues, xCategories, type BaseChartProps } from './types';

export interface ChartLayout {
  width: number;
  height: number;
  plot: { x: number; y: number; width: number; height: number };
  categories: string[];
  /** Per-series values aligned to categories. */
  values: number[][];
  yDomain: [number, number];
  yTicks: number[];
  xScale: (category: string) => number;
  yScale: (value: number) => number;
  bandwidth: number;
}

/**
 * Pure layout computation for cartesian charts (line/bar).
 *
 * Shared by the responsive `useChartLayout` hook (viewer) and the PDF
 * charts, which pass a fixed width.
 */
export function computeChartLayout(props: BaseChartProps, width: number): ChartLayout {
  const dim = { ...DEFAULT_CHART, width: Math.max(width, 320) };
  const plot = plotArea(dim);
  const categories = xCategories(props.data, props.xField);
  const values = props.series.map((s) =>
    seriesValues(props.data, props.xField, s.field, categories),
  );

  const allValues = values.flat();
  const yDomain = niceDomain(allValues);
  const yTicks = ticks(yDomain, 5);

  const xScale = bandScale(categories, [plot.x, plot.x + plot.width]);
  const yScale = linearScale(yDomain, [plot.y + plot.height, plot.y]);

  return {
    width: dim.width,
    height: dim.height,
    plot,
    categories,
    values,
    yDomain,
    yTicks,
    xScale,
    yScale,
    bandwidth: xScale.bandwidth,
  };
}
