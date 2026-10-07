import { useRef, type MouseEvent } from 'react';
import { formatTick } from './scales';
import { ChartTooltip, useChartTooltip, type TooltipEntry } from './ChartTooltip';
import { useChartLayout } from './useChartLayout';
import type { BaseChartProps } from './types';
import styles from '../styles/charts.module.css';

/**
 * SVG bar chart (grouped bars when multiple series) with hover tooltip.
 */
export function BarChart(props: BaseChartProps) {
  const layout = useChartLayout(props);
  const { tooltip, show, hide } = useChartTooltip();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { plot, categories, values, yTicks, xScale, yScale, bandwidth, width, height } = layout;
  const format = props.formatValue ?? ((v: number) => formatTick(v));
  const seriesCount = Math.max(props.series.length, 1);
  const barWidth = bandwidth / seriesCount;

  const handleMove = (categoryIndex: number, seriesIndex: number) => (event: MouseEvent) => {
    const category = categories[categoryIndex];
    const s = props.series[seriesIndex];
    const entries: TooltipEntry[] = [
      {
        label: s.label ?? s.field,
        value: format(values[seriesIndex][categoryIndex]),
        color: props.colors[seriesIndex % props.colors.length],
      },
    ];
    show(event, category, entries, containerRef.current);
  };

  return (
    <div className={styles.chartContainer} ref={containerRef}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Bar chart"
        onMouseLeave={hide}
      >
        {props.showGrid !== false &&
          yTicks.map((t) => (
            <line
              key={t}
              className={styles.gridLine}
              x1={plot.x}
              x2={plot.x + plot.width}
              y1={yScale(t)}
              y2={yScale(t)}
            />
          ))}

        {yTicks.map((t) => (
          <text
            key={`yl-${t}`}
            className={styles.tickLabel}
            x={plot.x - 8}
            y={yScale(t) + 4}
            textAnchor="end"
          >
            {format(t)}
          </text>
        ))}

        {categories.map((c) => (
          <text
            key={c}
            className={styles.tickLabel}
            x={xScale(c) + bandwidth / 2}
            y={plot.y + plot.height + 18}
            textAnchor="middle"
          >
            {c}
          </text>
        ))}

        <line
          className={styles.axisLine}
          x1={plot.x}
          x2={plot.x + plot.width}
          y1={plot.y + plot.height}
          y2={plot.y + plot.height}
        />
        <line
          className={styles.axisLine}
          x1={plot.x}
          x2={plot.x}
          y1={plot.y}
          y2={plot.y + plot.height}
        />

        {categories.map((c, ci) =>
          props.series.map((s, si) => {
            const v = values[si][ci];
            const y0 = yScale(0);
            const y1 = yScale(v);
            const top = Math.min(y0, y1);
            const h = Math.max(Math.abs(y1 - y0), 0);
            const x = xScale(c) + si * barWidth;
            return (
              <rect
                key={`${c}-${s.field}`}
                className={styles.bar}
                x={x}
                y={top}
                width={Math.max(barWidth - 1, 1)}
                height={h}
                fill={props.colors[si % props.colors.length]}
                onMouseMove={handleMove(ci, si)}
              />
            );
          }),
        )}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}
