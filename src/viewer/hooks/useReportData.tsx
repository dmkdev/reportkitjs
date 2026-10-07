import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DataSource, ExternalDataSource, Report } from '../../core/types';
import { resolveTheme, type ResolvedTheme } from '../../core/defaults';
import { fetchExternalSource } from '../../core/data';
import type { FetchState } from './useDataSource';

const EMPTY_STATE: FetchState = {
  data: [],
  loading: false,
  error: null,
  lastUpdated: null,
  refresh: () => {},
};

export interface ReportDataState {
  /** Fully-resolved theme (defaults merged in). */
  theme: ResolvedTheme;
  /** Resolve a data source id to its rows + status. Safe for unknown ids. */
  getSource: (id: string) => FetchState;
  /** True while any external source is loading. */
  loading: boolean;
  /** First error among external sources, if any. */
  error: string | null;
}

/**
 * Centralized data resolution for a report.
 *
 * Embedded sources resolve synchronously; external sources are fetched once
 * here (with optional auto-refresh) so that multiple blocks referencing the
 * same source share a single fetch. Returns a `getSource(id)` accessor plus
 * the resolved theme and aggregate loading/error state.
 */
export function useReportData(report: Report): ReportDataState {
  const theme = useMemo(() => resolveTheme(report.theme), [report.theme]);
  const [states, setStates] = useState<Record<string, FetchState>>({});

  const externalSources = useMemo(
    () => report.dataSources.filter((s): s is ExternalDataSource => s.type === 'external'),
    [report.dataSources],
  );

  useEffect(() => {
    if (externalSources.length === 0) return;
    const controllers: AbortController[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    const fetchSource = async (source: ExternalDataSource, signal?: AbortSignal) => {
      setStates((s) => ({
        ...s,
        [source.id]: { ...(s[source.id] ?? EMPTY_STATE), loading: true, error: null },
      }));
      try {
        const rows = await fetchExternalSource(source, signal);
        setStates((s) => ({
          ...s,
          [source.id]: {
            data: rows as Record<string, unknown>[],
            loading: false,
            error: null,
            lastUpdated: Date.now(),
            refresh: () => {},
          },
        }));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setStates((s) => ({
          ...s,
          [source.id]: {
            ...(s[source.id] ?? EMPTY_STATE),
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          },
        }));
      }
    };

    for (const source of externalSources) {
      const controller = new AbortController();
      controllers.push(controller);
      void fetchSource(source, controller.signal);
      if (source.refreshInterval && source.refreshInterval > 0) {
        intervals.push(setInterval(() => void fetchSource(source), source.refreshInterval));
      }
    }

    return () => {
      controllers.forEach((c) => c.abort());
      intervals.forEach((i) => clearInterval(i));
    };
  }, [externalSources]);

  const getSource = useCallback(
    (id: string): FetchState => {
      const source: DataSource | undefined = report.dataSources.find((s) => s.id === id);
      if (!source) return EMPTY_STATE;
      if (source.type === 'embedded') {
        return {
          data: source.data,
          loading: false,
          error: null,
          lastUpdated: null,
          refresh: () => {},
        };
      }
      return states[id] ?? { ...EMPTY_STATE, loading: true };
    },
    [report.dataSources, states],
  );

  const loading = externalSources.some((s) => states[s.id]?.loading);
  const error =
    externalSources.map((s) => states[s.id]?.error).find((e) => e !== null && e !== undefined) ??
    null;

  return { theme, getSource, loading, error };
}

/* ------------------------------------------------------------------ */
/* Context so blocks can resolve data without prop-drilling            */
/* ------------------------------------------------------------------ */

const ReportDataContext = createContext<ReportDataState | null>(null);

export function ReportDataProvider({
  value,
  children,
}: {
  value: ReportDataState;
  children: ReactNode;
}) {
  return <ReportDataContext.Provider value={value}>{children}</ReportDataContext.Provider>;
}

/**
 * Access the report's centralized data state. Must be used inside a
 * `<ReportDataProvider>` (provided by `<ReportViewer>`).
 */
export function useReportDataContext(): ReportDataState {
  const ctx = useContext(ReportDataContext);
  if (!ctx) {
    throw new Error('useReportDataContext must be used within a ReportDataProvider');
  }
  return ctx;
}
