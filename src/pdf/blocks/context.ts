import { createContext, useContext } from 'react';
import type { ResolvedTheme } from '../../core/defaults';
import type { ResolvedReportData } from '../data';
import type { PdfPageSpec, PdfStyles } from '../styles';

/**
 * Context shared by all PDF block components. Holds the resolved report data,
 * the resolved theme, the built stylesheet and the page spec.
 *
 * It is provided once by `<ReportPdfContent>` (see `ReportPdf.tsx`) after
 * `resolveReportData` has run, so blocks never fetch or resolve data themselves.
 */
export interface PdfReportContextValue {
  data: ResolvedReportData;
  theme: ResolvedTheme;
  styles: PdfStyles;
  page: PdfPageSpec;
}

export const PdfReportContext = createContext<PdfReportContextValue | null>(null);

/** Access the shared PDF report context. Throws if used outside a provider. */
export function usePdfReportContext(): PdfReportContextValue {
  const ctx = useContext(PdfReportContext);
  if (!ctx) {
    throw new Error('usePdfReportContext must be used within a PdfReportContext.Provider');
  }
  return ctx;
}
