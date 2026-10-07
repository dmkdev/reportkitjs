import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHART,
  arcPath,
  bandScale,
  formatTick,
  linearScale,
  niceDomain,
  pieAngles,
  plotArea,
  ticks,
} from '../../src/viewer/charts/scales';

describe('plotArea', () => {
  it('subtracts margins from the chart dimensions', () => {
    const area = plotArea(DEFAULT_CHART);
    expect(area.x).toBe(56);
    expect(area.y).toBe(24);
    expect(area.width).toBe(640 - 56 - 24);
    expect(area.height).toBe(320 - 24 - 48);
  });
});

describe('bandScale', () => {
  it('maps categories to evenly spaced bands', () => {
    // step = 300/3 = 100, bandwidth = 100 * 0.8 = 80, offset = 10
    const scale = bandScale(['a', 'b', 'c'], [0, 300]);
    expect(scale('a')).toBeCloseTo(10);
    expect(scale('b')).toBeCloseTo(110);
    expect(scale('c')).toBeCloseTo(210);
    expect(scale.bandwidth).toBeCloseTo(80);
    expect(scale.step).toBeCloseTo(100);
  });

  it('returns the range start for unknown categories', () => {
    const scale = bandScale(['a'], [10, 100]);
    expect(scale('zzz')).toBe(10);
  });

  it('handles an empty domain without crashing', () => {
    const scale = bandScale([], [0, 100]);
    expect(scale.bandwidth).toBeGreaterThan(0);
  });
});

describe('linearScale', () => {
  it('maps the domain onto the range', () => {
    const scale = linearScale([0, 10], [0, 100]);
    expect(scale(0)).toBe(0);
    expect(scale(5)).toBe(50);
    expect(scale(10)).toBe(100);
  });

  it('supports inverted ranges (y-axis)', () => {
    const scale = linearScale([0, 10], [200, 0]);
    expect(scale(0)).toBe(200);
    expect(scale(10)).toBe(0);
  });

  it('handles a zero-span domain', () => {
    const scale = linearScale([5, 5], [0, 100]);
    expect(scale(5)).toBe(0);
  });
});

describe('niceDomain', () => {
  it('always includes zero', () => {
    expect(niceDomain([10, 20, 30])).toEqual([0, 30]);
    expect(niceDomain([-10, -20])).toEqual([-20, 0]);
  });

  it('rounds to nice boundaries', () => {
    const [min, max] = niceDomain([1, 99]);
    expect(min).toBe(0);
    expect(max).toBeGreaterThanOrEqual(99);
    expect(max % 20).toBe(0);
  });

  it('returns [0, 1] for an empty input', () => {
    expect(niceDomain([])).toEqual([0, 1]);
  });

  it('expands a constant domain', () => {
    const [min, max] = niceDomain([5, 5, 5]);
    expect(max).toBeGreaterThan(min);
  });
});

describe('ticks', () => {
  it('produces count + 1 evenly spaced values', () => {
    const result = ticks([0, 100], 4);
    expect(result).toEqual([0, 25, 50, 75, 100]);
  });
});

describe('formatTick', () => {
  it('formats thousands and millions compactly', () => {
    expect(formatTick(1000)).toBe('1.0k');
    expect(formatTick(1_500_000)).toBe('1.5M');
  });

  it('keeps small integers as-is', () => {
    expect(formatTick(42)).toBe('42');
    expect(formatTick(-7)).toBe('-7');
  });

  it('rounds fractional values to one decimal', () => {
    expect(formatTick(2.35)).toBe('2.4');
  });
});

describe('pieAngles', () => {
  it('starts at the top (-90deg) and covers a full circle', () => {
    const angles = pieAngles([25, 25, 25, 25]);
    expect(angles[0].start).toBeCloseTo(-Math.PI / 2);
    expect(angles[3].end).toBeCloseTo(-Math.PI / 2 + Math.PI * 2);
    for (const a of angles) {
      expect(a.end - a.start).toBeCloseTo(Math.PI / 2);
    }
  });

  it('scales slices proportionally', () => {
    const angles = pieAngles([75, 25]);
    expect(angles[0].end - angles[0].start).toBeCloseTo(Math.PI * 1.5);
    expect(angles[1].end - angles[1].start).toBeCloseTo(Math.PI * 0.5);
  });

  it('handles all-zero values without dividing by zero', () => {
    const angles = pieAngles([0, 0]);
    expect(angles).toHaveLength(2);
  });
});

describe('arcPath', () => {
  it('builds a pie slice path from the center', () => {
    const path = arcPath(100, 100, 50, -Math.PI / 2, 0);
    expect(path).toMatch(/^M 100 100/);
    expect(path).toContain('A 50 50 0 0 1');
    expect(path).toMatch(/Z$/);
  });

  it('builds a donut slice with an inner radius', () => {
    const path = arcPath(100, 100, 50, 0, Math.PI / 2, 20);
    expect(path).not.toMatch(/^M 100 100/);
    expect(path).toContain('A 50 50 0 0 1');
    expect(path).toContain('A 20 20 0 0 0');
  });

  it('sets the large-arc flag for slices over 180deg', () => {
    const small = arcPath(0, 0, 10, 0, Math.PI / 2);
    const large = arcPath(0, 0, 10, 0, Math.PI * 1.5);
    expect(small).toContain('A 10 10 0 0 1');
    expect(large).toContain('A 10 10 0 1 1');
  });
});
