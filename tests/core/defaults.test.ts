import { describe, expect, it } from 'vitest';
import {
  allBlockTypes,
  blockTypeLabels,
  createDefaultBlock,
  defaultTheme,
  defaultThemeColors,
  resolveTheme,
} from '../../src/core/defaults';
import type { BlockType } from '../../src/core/types';

describe('resolveTheme', () => {
  it('returns the default theme when no theme is given', () => {
    expect(resolveTheme()).toEqual(defaultTheme);
    expect(resolveTheme(undefined)).toEqual(defaultTheme);
  });

  it('merges a partial theme over the defaults', () => {
    const resolved = resolveTheme({
      primaryColor: '#ff0000',
      colors: { background: '#111111' },
    });
    expect(resolved.primaryColor).toBe('#ff0000');
    expect(resolved.fontFamily).toBe(defaultTheme.fontFamily);
    expect(resolved.maxWidth).toBe(defaultTheme.maxWidth);
    expect(resolved.colors.background).toBe('#111111');
    expect(resolved.colors.text).toBe(defaultThemeColors.text);
    expect(resolved.colors.chart).toEqual(defaultThemeColors.chart);
  });

  it('does not mutate the default theme', () => {
    resolveTheme({ primaryColor: '#00ff00', colors: { text: '#000000' } });
    expect(defaultTheme.primaryColor).toBe('#2563eb');
    expect(defaultTheme.colors.text).toBe('#0f172a');
  });
});

describe('createDefaultBlock', () => {
  it.each(allBlockTypes)('creates a valid %s block', (type) => {
    const block = createDefaultBlock(type);
    expect(block.id).toBeTruthy();
    expect(block.type).toBe(type);
    expect(block.props).toBeDefined();
  });

  it('generates unique ids across blocks', () => {
    const ids = new Set(allBlockTypes.map((t) => createDefaultBlock(t).id));
    expect(ids.size).toBe(allBlockTypes.length);
  });

  it('creates a table block bound to the given data source', () => {
    const block = createDefaultBlock('table', 'ds-1');
    expect(block.type).toBe('table');
    if (block.type === 'table') {
      expect(block.props.dataSourceId).toBe('ds-1');
    }
  });

  it('creates a chart block bound to the given data source', () => {
    const block = createDefaultBlock('chart', 'ds-2');
    if (block.type === 'chart') {
      expect(block.props.dataSourceId).toBe('ds-2');
      expect(block.props.chartType).toBe('line');
    }
  });

  it('throws for an unknown block type', () => {
    expect(() => createDefaultBlock('video' as BlockType)).toThrow(/Unknown block type/);
  });
});

describe('block palette metadata', () => {
  it('has a label for every block type', () => {
    for (const type of allBlockTypes) {
      expect(blockTypeLabels[type]).toBeTruthy();
    }
  });

  it('covers all 8 block types', () => {
    expect(allBlockTypes).toHaveLength(8);
    expect(new Set(allBlockTypes).size).toBe(8);
  });
});
