import { useRef, type MouseEvent } from 'react';
import { arcPath, formatTick, pieAngles } from './scales';
import { ChartTooltip, useChartTooltip, type TooltipEntry } from './ChartTooltip';
import { seriesValues, xCategories, type BaseChartProps } from './types';
import styles from '../styles/charts.module.css';

const SIZE = 320;
const RADIUS = 120;
const CX = SIZE / 2;
const CY = SIZE / 2;

/**
 * SVG pie chart. Uses the first series field as the value per category.
 */
export function PieChart(props: BaseChartProps) {
  const { tooltip, show, hide } = useChartTooltip();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const format = props.formatValue ?? ((v: number) => formatTick(v));
  const categories = xCategories(props.data, props.xField);
  const field = props.series[0]?.field;
  const values = field ? seriesValues(props.data, props.xField, field, categories) : [];
  const angles = pieAngles(values);
  const total = values.reduce((a, b) => a + b, 0);

  const handleMove = (index: number) => (event: MouseEvent) => {
    const entries: TooltipEntry[] = [
      {
        label: categories[index],
        value: `${format(values[index])} (${total ? Math.round((values[index] / total) * 100) : 0}%)`,
        color: props.colors[index % props.colors.length],
      },
    ];
    show(event, categories[index], entries, containerRef.current);
  };

  return (
    <div className={styles.chartContainer} ref={containerRef}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Pie chart"
        onMouseLeave={hide}
      >
        {angles.map((a, i) => {
          if (values[i] <= 0) return null;
          const mid = (a.start + a.end) / 2;
          const labelR = RADIUS * 0.72;
          return (
            <g key={categories[i]}>
              <path
                className={styles.pieSlice}
                d={arcPath(CX, CY, RADIUS, a.start, a.end)}
                fill={props.colors[i % props.colors.length]}
                onMouseMove={handleMove(i)}
              />
              {a.end - a.start > 0.35 && (
                <text
                  className={styles.pieLabel}
                  x={CX + labelR * Math.cos(mid)}
                  y={CY + labelR * Math.sin(mid)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {Math.round((values[i] / (total || 1)) * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}
