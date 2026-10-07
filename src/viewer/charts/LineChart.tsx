import { useRef, type MouseEvent } from 'react';
import { formatTick } from './scales';
import { ChartTooltip, useChartTooltip, type TooltipEntry } from './ChartTooltip';
import { useChartLayout } from './useChartLayout';
import type { BaseChartProps } from './types';
import styles from '../styles/charts.module.css';

/**
 * SVG line chart with optional grid, dots and hover tooltip.
 */
export function LineChart(props: BaseChartProps) {
  const layout = useChartLayout(props);
  const { tooltip, show, hide } = useChartTooltip();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { plot, categories, values, yTicks, xScale, yScale, bandwidth, width, height } = layout;
  const format = props.formatValue ?? ((v: number) => formatTick(v));

  const handleMove = (categoryIndex: number) => (event: MouseEvent) => {
    const category = categories[categoryIndex];
    const entries: TooltipEntry[] = props.series.map((s, i) => ({
      label: s.label ?? s.field,
      value: format(values[i][categoryIndex]),
      color: props.colors[i % props.colors.length],
    }));
    show(event, category, entries, containerRef.current);
  };

  return (
    <div className={styles.chartContainer} ref={containerRef}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Line chart"
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

        {/* y-axis tick labels */}
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

        {/* x-axis category labels */}
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

        {/* axes */}
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

        {/* series */}
        {props.series.map((s, i) => {
          const color = props.colors[i % props.colors.length];
          const points = values[i]
            .map((v, ci) => `${xScale(categories[ci]) + bandwidth / 2},${yScale(v)}`)
            .join(' ');
          return (
            <g key={s.field}>
              <polyline className={styles.seriesLine} points={points} stroke={color} />
              {values[i].map((v, ci) => (
                <circle
                  key={ci}
                  className={styles.seriesDot}
                  cx={xScale(categories[ci]) + bandwidth / 2}
                  cy={yScale(v)}
                  r={3.5}
                  fill={color}
                />
              ))}
              {/* invisible hover targets */}
              {categories.map((c, ci) => (
                <rect
                  key={`h-${c}`}
                  x={xScale(c)}
                  y={plot.y}
                  width={bandwidth}
                  height={plot.height}
                  fill="transparent"
                  onMouseMove={handleMove(ci)}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}
