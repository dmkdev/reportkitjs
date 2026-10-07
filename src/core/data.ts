import type { ExternalDataSource } from './types';
import { resolveDataPath } from './utils';

/**
 * Fetch an external data source and resolve its rows.
 *
 * Pure async helper shared by the viewer (`useReportData`) and the PDF
 * exporter (`resolveReportData`). Performs the fetch, parses the JSON body,
 * resolves `dataPath` (if any) and validates that the result is an array.
 *
 * @throws on network/HTTP errors or when the resolved value is not an array.
 */
export async function fetchExternalSource(
  source: ExternalDataSource,
  signal?: AbortSignal,
): Promise<Record<string, unknown>[]> {
  const res = await fetch(source.url, {
    method: source.method ?? 'GET',
    headers: source.headers,
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json: unknown = await res.json();
  const rows = resolveDataPath(json, source.dataPath);
  if (!Array.isArray(rows)) {
    throw new Error(`Expected an array at ${source.dataPath ?? '(root)'} but got ${typeof rows}`);
  }
  return rows as Record<string, unknown>[];
}
