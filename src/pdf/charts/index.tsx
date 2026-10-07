import type { ComponentProps, ReactNode } from 'react';
import { Circle, G, Line, Path, Polyline, Rect, Svg, Text as SvgText } from '@react-pdf/renderer';
import { arcPath, formatTick, pieAngles } from '../../viewer/charts/scales';
import { computeChartLayout, type ChartLayout } from '../../viewer/charts/layout';
import { seriesValues, xCategories, type BaseChartProps } from '../../viewer/charts/types';

/**
 * PDF chart components.
 *
 * These render the same geometry as the viewer's SVG charts (via the shared
 * `computeChartLayout`) but emit react-pdf SVG primitives, so the PDF output
 * matches the on-screen report.
 */

export interface PdfChartUiColors {
  /** Grid line / axis line color. */
  grid: string;
  /** Tick label color. */
  label: string;
  /** Background color (used for dot/slice separators). */
  background: string;
}

export interface PdfCartesianChartProps extends BaseChartProps {
  /** Fixed render width (typically the page content width). */
  width: number;
  /** UI colors for grid/axes/labels. */
  ui: PdfChartUiColors;
}

const TICK_FONT = 8;

type SvgTextProps = ComponentProps<typeof SvgText>;

interface SvgLabelProps {
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: number;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'auto' | 'middle' | 'central';
  children: ReactNode;
}

/**
 * SVG text label. react-pdf reads `fontSize`/`fontWeight`/`fill` from props at
 * runtime (see `BASE_SVG_INHERITED_PROPS` in @react-pdf/layout), but the bundled
 * `SVGTextProps` type omits them, so we cast once here.
 */
function SvgLabel({
  x,
  y,
  fontSize,
  fontWeight,
  fill,
  textAnchor,
  dominantBaseline,
  children,
}: SvgLabelProps) {
  const props = {
    x,
    y,
    fontSize,
    fontWeight,
    fill,
    textAnchor,
    dominantBaseline,
    children,
  } as unknown as SvgTextProps;
  return <SvgText {...props} />;
}

function CartesianAxes({
  layout,
  ui,
  showGrid,
  format,
}: {
  layout: ChartLayout;
  ui: PdfChartUiColors;
  showGrid?: boolean;
  format: (v: number) => string;
}) {
  const { plot, yTicks, xScale, yScale, bandwidth, categories } = layout;
  return (
    <G>
      {showGrid !== false &&
        yTicks.map((t) => (
          <Line
            key={`grid-${t}`}
            x1={plot.x}
            x2={plot.x + plot.width}
            y1={yScale(t)}
            y2={yScale(t)}
            stroke={ui.grid}
            strokeWidth={0.5}
          />
        ))}
      {yTicks.map((t) => (
        <SvgLabel
          key={`yl-${t}`}
          x={plot.x - 8}
          y={yScale(t) + 4}
          fontSize={TICK_FONT}
          fill={ui.label}
          textAnchor="end"
        >
          {format(t)}
        </SvgLabel>
      ))}
      {categories.map((c) => (
        <SvgLabel
          key={`xl-${c}`}
          x={xScale(c) + bandwidth / 2}
          y={plot.y + plot.height + 18}
          fontSize={TICK_FONT}
          fill={ui.label}
          textAnchor="middle"
        >
          {c}
        </SvgLabel>
      ))}
      <Line
        x1={plot.x}
        x2={plot.x + plot.width}
        y1={plot.y + plot.height}
        y2={plot.y + plot.height}
        stroke={ui.grid}
        strokeWidth={1}
      />
      <Line
        x1={plot.x}
        x2={plot.x}
        y1={plot.y}
        y2={plot.y + plot.height}
        stroke={ui.grid}
        strokeWidth={1}
      />
    </G>
  );
}

export function PdfLineChart(props: PdfCartesianChartProps) {
  const layout = computeChartLayout(props, props.width);
  const { categories, values, xScale, yScale, bandwidth, width, height } = layout;
  const format = props.formatValue ?? ((v: number) => formatTick(v));
  return (
    <Svg width={width} height={height}>
      <CartesianAxes layout={layout} ui={props.ui} showGrid={props.showGrid} format={format} />
      {props.series.map((s, i) => {
        const color = props.colors[i % props.colors.length];
        const points = values[i]
          .map((v, ci) => `${xScale(categories[ci]) + bandwidth / 2},${yScale(v)}`)
          .join(' ');
        return (
          <G key={s.field}>
            <Polyline points={points} stroke={color} strokeWidth={2} fill="none" />
            {values[i].map((v, ci) => (
              <Circle
                key={`${s.field}-${ci}`}
                cx={xScale(categories[ci]) + bandwidth / 2}
                cy={yScale(v)}
                r={3.5}
                fill={color}
                stroke={props.ui.background}
                strokeWidth={1.5}
              />
            ))}
          </G>
        );
      })}
    </Svg>
  );
}

export function PdfBarChart(props: PdfCartesianChartProps) {
  const layout = computeChartLayout(props, props.width);
  const { categories, values, xScale, yScale, bandwidth, width, height } = layout;
  const format = props.formatValue ?? ((v: number) => formatTick(v));
  const seriesCount = Math.max(props.series.length, 1);
  const barWidth = bandwidth / seriesCount;
  return (
    <Svg width={width} height={height}>
      <CartesianAxes layout={layout} ui={props.ui} showGrid={props.showGrid} format={format} />
      {categories.map((c, ci) =>
        props.series.map((s, si) => {
          const v = values[si][ci];
          const y0 = yScale(0);
          const y1 = yScale(v);
          const top = Math.min(y0, y1);
          const h = Math.max(Math.abs(y1 - y0), 0);
          const x = xScale(c) + si * barWidth;
          return (
            <Rect
              key={`${c}-${s.field}`}
              x={x}
              y={top}
              width={Math.max(barWidth - 1, 1)}
              height={h}
              fill={props.colors[si % props.colors.length]}
            />
          );
        }),
      )}
    </Svg>
  );
}

const PIE_SIZE = 320;
const PIE_RADIUS = 120;

export function PdfPieChart(props: BaseChartProps) {
  const categories = xCategories(props.data, props.xField);
  const field = props.series[0]?.field;
  const values = field ? seriesValues(props.data, props.xField, field, categories) : [];
  const angles = pieAngles(values);
  const total = values.reduce((a, b) => a + b, 0);
  const cx = PIE_SIZE / 2;
  const cy = PIE_SIZE / 2;
  return (
    <Svg width={PIE_SIZE} height={PIE_SIZE}>
      {angles.map((a, i) => {
        if (values[i] <= 0) return null;
        const mid = (a.start + a.end) / 2;
        const labelR = PIE_RADIUS * 0.72;
        return (
          <G key={categories[i]}>
            <Path
              d={arcPath(cx, cy, PIE_RADIUS, a.start, a.end)}
              fill={props.colors[i % props.colors.length]}
              stroke="#ffffff"
              strokeWidth={1}
            />
            {a.end - a.start > 0.35 && (
              <SvgLabel
                x={cx + labelR * Math.cos(mid)}
                y={cy + labelR * Math.sin(mid)}
                fontSize={9}
                fontWeight={600}
                fill="#0f172a"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {Math.round((values[i] / (total || 1)) * 100)}%
              </SvgLabel>
            )}
          </G>
        );
      })}
    </Svg>
  );
}
