import { describe, expect, it } from 'vitest';
import { computeChartLayout } from '../../src/viewer/charts/layout';
import { arcPath, pieAngles } from '../../src/viewer/charts/scales';
import type { BaseChartProps } from '../../src/viewer/charts/types';

const data = [
  { month: 'Jan', sales: 100, profit: 20 },
  { month: 'Feb', sales: 150, profit: 30 },
  { month: 'Mar', sales: 120, profit: 25 },
];

const props: BaseChartProps = {
  data,
  xField: 'month',
  series: [{ field: 'sales' }, { field: 'profit' }],
  colors: ['#000', '#111'],
};

describe('computeChartLayout', () => {
  it('computes categories in order of appearance', () => {
    const layout = computeChartLayout(props, 640);
    expect(layout.categories).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('aligns per-series values to the categories', () => {
    const layout = computeChartLayout(props, 640);
    expect(layout.values).toEqual([
      [100, 150, 120],
      [20, 30, 25],
    ]);
  });

  it('uses the requested width (clamped to a minimum of 320)', () => {
    expect(computeChartLayout(props, 640).width).toBe(640);
    expect(computeChartLayout(props, 100).width).toBe(320);
  });

  it('produces a y domain that includes zero and the max value', () => {
    const layout = computeChartLayout(props, 640);
    expect(layout.yDomain[0]).toBeLessThanOrEqual(0);
    expect(layout.yDomain[1]).toBeGreaterThanOrEqual(150);
  });

  it('maps the y domain onto the plot area (inverted)', () => {
    const layout = computeChartLayout(props, 640);
    const [min, max] = layout.yDomain;
    // min value sits at the bottom of the plot, max at the top
    expect(layout.yScale(min)).toBeCloseTo(layout.plot.y + layout.plot.height);
    expect(layout.yScale(max)).toBeCloseTo(layout.plot.y);
  });

  it('maps categories onto the plot area with a band scale', () => {
    const layout = computeChartLayout(props, 640);
    expect(layout.xScale('Jan')).toBeGreaterThanOrEqual(layout.plot.x);
    expect(layout.xScale('Mar') + layout.bandwidth).toBeLessThanOrEqual(
      layout.plot.x + layout.plot.width,
    );
    expect(layout.bandwidth).toBeGreaterThan(0);
  });

  it('generates evenly spaced y ticks', () => {
    const layout = computeChartLayout(props, 640);
    expect(layout.yTicks.length).toBe(6);
    expect(layout.yTicks[0]).toBe(layout.yDomain[0]);
    expect(layout.yTicks[5]).toBe(layout.yDomain[1]);
  });
});

describe('pieAngles', () => {
  it('starts at the top (-90deg) and covers a full circle', () => {
    const angles = pieAngles([1, 1, 1, 1]);
    expect(angles[0].start).toBeCloseTo(-Math.PI / 2);
    expect(angles[3].end).toBeCloseTo(-Math.PI / 2 + Math.PI * 2);
  });

  it('sweeps proportionally to the values', () => {
    const angles = pieAngles([1, 3]);
    expect(angles[0].end - angles[0].start).toBeCloseTo((1 / 4) * Math.PI * 2);
    expect(angles[1].end - angles[1].start).toBeCloseTo((3 / 4) * Math.PI * 2);
  });

  it('handles an all-zero total without crashing', () => {
    const angles = pieAngles([0, 0]);
    expect(angles).toHaveLength(2);
  });
});

describe('arcPath', () => {
  it('builds a pie slice from the center for a full radius', () => {
    const path = arcPath(0, 0, 10, -Math.PI / 2, 0);
    expect(path).toContain('M 0 0');
    expect(path).toContain('A 10 10 0 0 1');
    expect(path).toContain('Z');
  });

  it('builds a donut slice with an inner radius', () => {
    const path = arcPath(0, 0, 10, -Math.PI / 2, 0, 5);
    expect(path).toContain('A 10 10 0 0 1');
    expect(path).toContain('A 5 5 0 0 0');
    expect(path).toContain('Z');
  });

  it('sets the large-arc flag for sweeps greater than 180deg', () => {
    const small = arcPath(0, 0, 10, 0, Math.PI / 2);
    const large = arcPath(0, 0, 10, 0, Math.PI * 1.5);
    expect(small).toContain('A 10 10 0 0 1');
    expect(large).toContain('A 10 10 0 1 1');
  });
});
