import type { KpiAggregation, NumberFormat } from './types';

/**
 * Generate a unique id. Uses crypto.randomUUID when available,
 * falls back to a counter-based id for non-secure contexts.
 */
let counter = 0;

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/**
 * Deep-clone a JSON-compatible value.
 */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Resolve a dot-path (e.g. "data.items") into a value.
 * Returns undefined when any segment is missing.
 */
export function resolveDataPath(data: unknown, path?: string): unknown {
  if (!path) return data;
  const segments = path.split('.');
  let current: unknown = data;
  for (const segment of segments) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Aggregate a numeric field across rows.
 * Non-numeric values are ignored (except `count`, which counts rows).
 */
export function aggregate(
  rows: Record<string, unknown>[],
  field: string,
  agg: KpiAggregation,
): number {
  if (agg === 'count') return rows.length;
  const values = rows
    .map((row) => row[field])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (values.length === 0) return 0;
  switch (agg) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'first':
      return values[0];
    case 'last':
      return values[values.length - 1];
    default:
      return 0;
  }
}

/**
 * Format a number for display.
 */
export function formatNumber(
  value: number,
  format: NumberFormat = 'number',
  currency?: string,
  locale = 'en-US',
): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency ?? 'USD',
        maximumFractionDigits: 2,
      }).format(value);
    case 'percent':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 2,
      }).format(value / 100);
    case 'compact':
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(value);
    case 'number':
    default:
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  }
}

/**
 * Collect all block ids in a report (including nested sections).
 */
export function collectBlockIds(blocks: { id: string; type: string; props?: unknown }[]): string[] {
  const ids: string[] = [];
  const walk = (list: { id: string; type: string; props?: unknown }[]): void => {
    for (const block of list) {
      ids.push(block.id);
      if (
        block.type === 'section' &&
        Array.isArray((block.props as { blocks?: unknown[] })?.blocks)
      ) {
        walk((block.props as { blocks: { id: string; type: string; props?: unknown }[] }).blocks);
      }
    }
  };
  walk(blocks);
  return ids;
}

/**
 * Find a block by id, searching nested sections.
 */
export function findBlock(
  blocks: { id: string; type: string; props?: unknown }[],
  id: string,
): { id: string; type: string; props?: unknown } | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (
      block.type === 'section' &&
      Array.isArray((block.props as { blocks?: unknown[] })?.blocks)
    ) {
      const found = findBlock(
        (block.props as { blocks: { id: string; type: string; props?: unknown }[] }).blocks,
        id,
      );
      if (found) return found;
    }
  }
  return undefined;
}
