/**
 * Minimal scale + layout helpers for the SVG charts.
 * No external charting library — just math.
 */

export interface ChartDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export const DEFAULT_CHART: ChartDimensions = {
  width: 640,
  height: 320,
  margin: { top: 24, right: 24, bottom: 48, left: 56 },
};

/** Inner plot area (excluding margins). */
export function plotArea(dim: ChartDimensions) {
  return {
    x: dim.margin.left,
    y: dim.margin.top,
    width: dim.width - dim.margin.left - dim.margin.right,
    height: dim.height - dim.margin.top - dim.margin.bottom,
  };
}

/**
 * Band scale: maps discrete categories to evenly-spaced bands.
 * Returns a function that maps a category index to its band start,
 * plus the band width.
 */
export function bandScale(domain: string[], range: [number, number], padding = 0.2) {
  const [start, end] = range;
  const n = Math.max(domain.length, 1);
  const step = (end - start) / n;
  const bandwidth = step * (1 - padding);
  const offset = (step - bandwidth) / 2;
  const index = new Map(domain.map((d, i) => [d, i]));
  const scale = (value: string): number => {
    const i = index.get(value);
    if (i === undefined) return start;
    return start + i * step + offset;
  };
  scale.bandwidth = bandwidth;
  scale.step = step;
  return scale;
}

/**
 * Linear scale: maps a numeric domain to a numeric range.
 */
export function linearScale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const scale = (value: number): number => r0 + ((value - d0) / span) * (r1 - r0);
  scale.domain = domain;
  scale.range = range;
  return scale;
}

/**
 * Compute a "nice" numeric domain that includes zero and rounds to
 * sensible tick boundaries.
 */
export function niceDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  let min = Math.min(...values, 0);
  let max = Math.max(...values, 0);
  if (min === max) {
    max = min + 1;
  }
  const span = max - min;
  const step = niceStep(span / 5);
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;
  return [min, max];
}

function niceStep(rough: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  const frac = (rough || 1) / pow;
  let nice: number;
  if (frac <= 1) nice = 1;
  else if (frac <= 2) nice = 2;
  else if (frac <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

/** Generate evenly-spaced tick values across a domain. */
export function ticks(domain: [number, number], count = 5): number[] {
  const [min, max] = domain;
  const step = (max - min) / count;
  const result: number[] = [];
  for (let i = 0; i <= count; i++) {
    result.push(min + i * step);
  }
  return result;
}

/** Format a tick value compactly (e.g. 1000 -> "1k"). */
export function formatTick(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

/**
 * Compute pie slice angles (in radians) for a set of values.
 * Returns start/end angle per value, starting at -90deg (top).
 */
export function pieAngles(values: number[]): { start: number; end: number }[] {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let angle = -Math.PI / 2;
  return values.map((v) => {
    const sweep = (v / total) * Math.PI * 2;
    const slice = { start: angle, end: angle + sweep };
    angle += sweep;
    return slice;
  });
}

/**
 * Build an SVG arc path for a pie/donut slice.
 */
export function arcPath(
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number,
  innerRadius = 0,
): string {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const x0 = cx + radius * Math.cos(start);
  const y0 = cy + radius * Math.sin(start);
  const x1 = cx + radius * Math.cos(end);
  const y1 = cy + radius * Math.sin(end);
  if (innerRadius <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${x0} ${y0}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1}`,
      'Z',
    ].join(' ');
  }
  const ix0 = cx + innerRadius * Math.cos(start);
  const iy0 = cy + innerRadius * Math.sin(start);
  const ix1 = cx + innerRadius * Math.cos(end);
  const iy1 = cy + innerRadius * Math.sin(end);
  return [
    `M ${x0} ${y0}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1}`,
    `L ${ix1} ${iy1}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix0} ${iy0}`,
    'Z',
  ].join(' ');
}
