import { StyleSheet } from '@react-pdf/renderer';
import type { ResolvedTheme } from '../core/defaults';
import { getPdfFontFamily } from './fonts';

/** Supported page sizes (points). */
export const PDF_PAGES = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
} as const;

export type PdfPageSize = keyof typeof PDF_PAGES;

/** Page margin in points. */
export const PDF_MARGIN = 40;

export interface PdfPageSpec {
  size: PdfPageSize;
  width: number;
  height: number;
  margin: number;
  /** Usable content width (page width minus both margins). */
  contentWidth: number;
}

export function getPageSpec(size: PdfPageSize = 'A4'): PdfPageSpec {
  const { width, height } = PDF_PAGES[size];
  return { size, width, height, margin: PDF_MARGIN, contentWidth: width - PDF_MARGIN * 2 };
}

/**
 * Build the PDF stylesheet from a resolved report theme.
 *
 * The font family is the registered PDF family (see `configurePdfFonts`),
 * not the theme's CSS font stack — PDF can only use fonts that were
 * explicitly registered.
 */
export function buildPdfStyles(theme: ResolvedTheme) {
  const fontFamily = getPdfFontFamily();
  const { border, surface, text, textMuted, background } = theme.colors;

  return StyleSheet.create({
    page: {
      backgroundColor: background,
      color: text,
      fontFamily,
      fontSize: 10,
      lineHeight: 1.5,
    },

    /* Report header */
    header: { marginBottom: 16 },
    reportTitle: { fontSize: 22, fontWeight: 700, lineHeight: 1.25, marginBottom: 4 },
    reportDescription: { fontSize: 12, color: textMuted, marginBottom: 12 },
    reportMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      border: `1 solid ${border}`,
      borderRadius: 8,
      backgroundColor: surface,
      fontSize: 9,
      color: textMuted,
      marginBottom: 16,
    },
    metaItem: { flexDirection: 'row', gap: 4, marginRight: 12 },
    metaLabel: { fontWeight: 600, color: text },

    /* Blocks container */
    blocks: { flexDirection: 'column', gap: 14 },

    /* Header blocks */
    header1: { fontSize: 20, fontWeight: 700, lineHeight: 1.25, marginTop: 8 },
    header2: { fontSize: 16, fontWeight: 700, lineHeight: 1.25, marginTop: 4 },
    header3: { fontSize: 13, fontWeight: 700, lineHeight: 1.25 },

    /* Text */
    text: { fontSize: 10, lineHeight: 1.55 },
    code: {
      backgroundColor: surface,
      border: `0.5 solid ${border}`,
      borderRadius: 3,
      paddingHorizontal: 4,
      fontSize: 8.5,
      fontFamily: 'Courier',
    },
    link: { color: theme.primaryColor },

    /* KPI */
    kpiRow: { flexDirection: 'row', gap: 12 },
    kpiCard: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 14,
      border: `1 solid ${border}`,
      borderRadius: 10,
      backgroundColor: surface,
    },
    kpiTitle: {
      fontSize: 8,
      fontWeight: 600,
      color: textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    kpiValue: { fontSize: 18, fontWeight: 700 },
    kpiTrend: { fontSize: 8, fontWeight: 600, marginTop: 4 },
    kpiTrendUp: { color: '#16a34a' },
    kpiTrendDown: { color: '#dc2626' },
    kpiTrendFlat: { color: textMuted },

    /* Table */
    tableTitle: { fontSize: 12, fontWeight: 600, marginBottom: 8 },
    table: { border: `1 solid ${border}`, borderRadius: 8 },
    tableHeaderCell: {
      backgroundColor: surface,
      color: textMuted,
      fontSize: 8,
      fontWeight: 600,
      textTransform: 'uppercase',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderBottom: `1 solid ${border}`,
    },
    tableCell: {
      fontSize: 9,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderBottom: `1 solid ${border}`,
    },
    tableEmpty: {
      padding: 12,
      color: textMuted,
      fontSize: 9,
      textAlign: 'center',
      border: `1 solid ${border}`,
      borderRadius: 8,
    },

    /* Chart */
    chartBlock: {
      border: `1 solid ${border}`,
      borderRadius: 10,
      backgroundColor: surface,
      padding: 12,
    },
    chartTitle: { fontSize: 12, fontWeight: 600, marginBottom: 8 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, fontSize: 8.5 },
    legendSwatch: { width: 8, height: 8, borderRadius: 2 },

    /* Divider */
    divider: { borderTopWidth: 1, borderTopColor: border, marginVertical: 4 },

    /* Image */
    imageCaption: { marginTop: 4, color: textMuted, fontSize: 8, textAlign: 'center' },

    /* Section */
    section: {
      padding: 14,
      border: `1 solid ${border}`,
      borderRadius: 10,
      backgroundColor: surface,
    },
    sectionTitle: { fontSize: 12, fontWeight: 600, marginBottom: 10 },
    sectionBlocks: { flexDirection: 'column', gap: 12 },

    /* Data source error */
    error: {
      padding: 10,
      border: '1 solid #fecaca',
      borderRadius: 8,
      backgroundColor: '#fef2f2',
      color: '#b91c1c',
      fontSize: 9,
    },

    /* Page footer */
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      fontSize: 8,
      color: textMuted,
      textAlign: 'center',
    },
  });
}

export type PdfStyles = ReturnType<typeof buildPdfStyles>;
