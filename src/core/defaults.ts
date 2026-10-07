import type { Block, BlockType, ReportTheme, ReportThemeColors } from './types';
import { createId } from './utils';

/** A fully-resolved theme with no optional fields. */
export interface ResolvedTheme {
  primaryColor: string;
  fontFamily: string;
  maxWidth: number;
  colors: ReportThemeColors;
}

/** Default theme applied when a report has no `theme` (or partial theme). */
export const defaultThemeColors: ReportThemeColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  chart: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'],
};

export const defaultTheme: ResolvedTheme = {
  primaryColor: '#2563eb',
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  maxWidth: 960,
  colors: defaultThemeColors,
};

/**
 * Merge a partial report theme over the defaults, returning a fully-resolved theme.
 */
export function resolveTheme(theme?: ReportTheme): ResolvedTheme {
  if (!theme) return defaultTheme;
  return {
    primaryColor: theme.primaryColor ?? defaultTheme.primaryColor,
    fontFamily: theme.fontFamily ?? defaultTheme.fontFamily,
    maxWidth: theme.maxWidth ?? defaultTheme.maxWidth,
    colors: { ...defaultTheme.colors, ...(theme.colors ?? {}) },
  };
}

/**
 * Default props for each block type, used when creating a new block in the editor.
 */
export function createDefaultBlock(type: BlockType, dataSourceId?: string): Block {
  const id = createId('b');
  switch (type) {
    case 'header':
      return { id, type, props: { text: 'New heading', level: 2 } };
    case 'text':
      return { id, type, props: { content: 'New text block', markdown: false } };
    case 'kpi':
      return {
        id,
        type,
        props: {
          title: 'Metric',
          value: 0,
          format: 'number',
        },
      };
    case 'table':
      return {
        id,
        type,
        props: {
          dataSourceId: dataSourceId ?? '',
          columns: [{ field: 'name', label: 'Name' }],
          title: 'Table',
        },
      };
    case 'chart':
      return {
        id,
        type,
        props: {
          chartType: 'line',
          dataSourceId: dataSourceId ?? '',
          xField: 'x',
          series: [{ field: 'y', label: 'Series' }],
          title: 'Chart',
          showLegend: true,
          showGrid: true,
        },
      };
    case 'divider':
      return { id, type, props: { style: 'solid' } };
    case 'image':
      return { id, type, props: { src: '', alt: 'Image', caption: '' } };
    case 'section':
      return { id, type, props: { title: 'Section', blocks: [] } };
    default:
      throw new Error(`Unknown block type: ${type as string}`);
  }
}

/** Human-readable labels for block types (used by the editor palette). */
export const blockTypeLabels: Record<BlockType, string> = {
  header: 'Heading',
  text: 'Text',
  kpi: 'KPI Card',
  table: 'Table',
  chart: 'Chart',
  divider: 'Divider',
  image: 'Image',
  section: 'Section',
};

/** All block types in palette order. */
export const allBlockTypes: BlockType[] = [
  'header',
  'text',
  'kpi',
  'table',
  'chart',
  'divider',
  'image',
  'section',
];
