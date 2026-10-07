import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataSource, ExternalDataSource } from '../../core/types';
import { resolveDataPath } from '../../core/utils';

export interface FetchState {
  data: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
}

const EMPTY_STATE: FetchState = {
  data: [],
  loading: false,
  error: null,
  lastUpdated: null,
  refresh: () => {},
};

/**
 * Fetch an external data source with optional auto-refresh.
 * Pass `undefined` to disable fetching (returns an empty state).
 * Returns the resolved rows array (after applying `dataPath`).
 */
export function useExternalData(source: ExternalDataSource | undefined): FetchState {
  const [state, setState] = useState<Omit<FetchState, 'refresh'>>({
    data: [],
    loading: source !== undefined,
    error: null,
    lastUpdated: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchOnce = useCallback(
    async (signal?: AbortSignal) => {
      if (!source) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch(source.url, {
          method: source.method ?? 'GET',
          headers: source.headers,
          signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const json: unknown = await res.json();
        const rows = resolveDataPath(json, source.dataPath);
        if (!Array.isArray(rows)) {
          throw new Error(
            `Expected an array at ${source.dataPath ?? '(root)'} but got ${typeof rows}`,
          );
        }
        setState({
          data: rows as Record<string, unknown>[],
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    },
    [source],
  );

  useEffect(() => {
    if (!source) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void fetchOnce(controller.signal);

    let interval: ReturnType<typeof setInterval> | undefined;
    if (source.refreshInterval && source.refreshInterval > 0) {
      interval = setInterval(() => void fetchOnce(), source.refreshInterval);
    }

    return () => {
      controller.abort();
      if (interval) clearInterval(interval);
    };
  }, [fetchOnce, source]);

  const refresh = useCallback(() => void fetchOnce(), [fetchOnce]);

  return { ...state, refresh };
}

/**
 * Resolve a data source to rows. Embedded sources resolve synchronously;
 * external sources are fetched (with loading/error state).
 * Always safe to call with `undefined`.
 */
export function useDataSource(source: DataSource | undefined): FetchState {
  const external = source?.type === 'external' ? source : undefined;
  const externalState = useExternalData(external);

  return useMemo<FetchState>(() => {
    if (source?.type === 'embedded') {
      return {
        data: source.data,
        loading: false,
        error: null,
        lastUpdated: null,
        refresh: () => {},
      };
    }
    if (!source) return EMPTY_STATE;
    return externalState;
  }, [source, externalState]);
}

/**
 * Look up a data source by id from a report's dataSources array.
 */
export function findDataSource(sources: DataSource[], id: string): DataSource | undefined {
  return sources.find((s) => s.id === id);
}
