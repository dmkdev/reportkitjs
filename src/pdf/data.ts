import type { Report } from '../core/types';
import { fetchExternalSource } from '../core/data';

export interface ResolvedReportData {
  /** Rows per data source id. Missing ids mean the source failed to load. */
  rows: Record<string, Record<string, unknown>[]>;
  /** Error message per data source id (null when the source loaded fine). */
  errors: Record<string, string | null>;
}

/**
 * Resolve all data sources of a report for PDF rendering.
 *
 * Embedded sources are copied synchronously; external sources are fetched
 * (in parallel) via `fetchExternalSource`. A failing source does not abort
 * the export — the error is recorded per source and the affected blocks
 * render an error placeholder instead.
 */
export async function resolveReportData(report: Report): Promise<ResolvedReportData> {
  const rows: Record<string, Record<string, unknown>[]> = {};
  const errors: Record<string, string | null> = {};

  const external = report.dataSources.filter((s) => s.type === 'external');

  for (const source of report.dataSources) {
    if (source.type === 'embedded') {
      rows[source.id] = source.data;
      errors[source.id] = null;
    } else {
      errors[source.id] = null; // placeholder, filled by the parallel fetch
    }
  }

  await Promise.all(
    external.map(async (source) => {
      try {
        rows[source.id] = await fetchExternalSource(source);
        errors[source.id] = null;
      } catch (err) {
        errors[source.id] = err instanceof Error ? err.message : String(err);
      }
    }),
  );

  return { rows, errors };
}
