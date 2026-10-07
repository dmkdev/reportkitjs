import { describe, expect, it } from 'vitest';
import {
  aggregate,
  collectBlockIds,
  createId,
  deepClone,
  findBlock,
  formatNumber,
  resolveDataPath,
} from '../../src/core/utils';

describe('createId', () => {
  it('generates unique ids', () => {
    const a = createId('b');
    const b = createId('b');
    expect(a).not.toBe(b);
  });

  it('returns a non-empty string', () => {
    expect(createId()).toMatch(/^[a-z0-9-]+$/i);
  });
});

describe('deepClone', () => {
  it('clones nested objects independently', () => {
    const original = { a: { b: [1, 2, 3] } };
    const clone = deepClone(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.a).not.toBe(original.a);
    clone.a.b.push(4);
    expect(original.a.b).toEqual([1, 2, 3]);
  });

  it('clones arrays and primitives', () => {
    expect(deepClone([1, 2, 3])).toEqual([1, 2, 3]);
    expect(deepClone('x')).toBe('x');
    expect(deepClone(null)).toBe(null);
  });
});

describe('resolveDataPath', () => {
  const data = { data: { items: [{ id: 1 }] } };

  it('returns the data when path is empty', () => {
    expect(resolveDataPath(data)).toBe(data);
    expect(resolveDataPath(data, undefined)).toBe(data);
  });

  it('resolves a dot path', () => {
    expect(resolveDataPath(data, 'data.items')).toEqual([{ id: 1 }]);
    expect(resolveDataPath(data, 'data.items.0.id')).toBe(1);
  });

  it('returns undefined for missing segments', () => {
    expect(resolveDataPath(data, 'data.missing')).toBeUndefined();
    expect(resolveDataPath(data, 'a.b.c')).toBeUndefined();
  });
});

describe('aggregate', () => {
  const rows = [{ v: 10 }, { v: 20 }, { v: 30 }, { v: 'not-a-number' }];

  it('sums numeric values, ignoring non-numeric', () => {
    expect(aggregate(rows, 'v', 'sum')).toBe(60);
  });

  it('computes avg over numeric values only', () => {
    expect(aggregate(rows, 'v', 'avg')).toBe(20);
  });

  it('counts rows (not numeric values)', () => {
    expect(aggregate(rows, 'v', 'count')).toBe(4);
  });

  it('computes min / max', () => {
    expect(aggregate(rows, 'v', 'min')).toBe(10);
    expect(aggregate(rows, 'v', 'max')).toBe(30);
  });

  it('computes first / last numeric values', () => {
    expect(aggregate(rows, 'v', 'first')).toBe(10);
    expect(aggregate(rows, 'v', 'last')).toBe(30);
  });

  it('returns 0 when there are no numeric values', () => {
    expect(aggregate([{ v: 'x' }], 'v', 'sum')).toBe(0);
    expect(aggregate([], 'v', 'sum')).toBe(0);
  });
});

describe('formatNumber', () => {
  it('formats plain numbers with grouping', () => {
    expect(formatNumber(1234.5, 'number')).toBe('1,234.5');
  });

  it('formats currency with ISO code', () => {
    expect(formatNumber(1000, 'currency', 'USD')).toBe('$1,000.00');
    expect(formatNumber(1000, 'currency', 'EUR')).toContain('€');
  });

  it('formats percent from a 0-100 value', () => {
    expect(formatNumber(41.2, 'percent')).toBe('41.2%');
  });

  it('formats compact notation', () => {
    expect(formatNumber(1250000, 'compact')).toBe('1.25M');
  });
});

describe('collectBlockIds / findBlock', () => {
  const blocks = [
    { id: 'a', type: 'header', props: {} },
    {
      id: 's',
      type: 'section',
      props: { blocks: [{ id: 'nested', type: 'text', props: {} }] },
    },
  ];

  it('collects ids including nested sections', () => {
    expect(collectBlockIds(blocks)).toEqual(['a', 's', 'nested']);
  });

  it('finds a top-level block', () => {
    expect(findBlock(blocks, 'a')?.id).toBe('a');
  });

  it('finds a nested block', () => {
    expect(findBlock(blocks, 'nested')?.id).toBe('nested');
  });

  it('returns undefined for unknown ids', () => {
    expect(findBlock(blocks, 'nope')).toBeUndefined();
  });
});
