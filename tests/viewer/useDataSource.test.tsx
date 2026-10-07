import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ExternalDataSource } from '../../src/core/types';
import {
  findDataSource,
  useDataSource,
  useExternalData,
} from '../../src/viewer/hooks/useDataSource';

const external = (overrides: Partial<ExternalDataSource> = {}): ExternalDataSource => ({
  id: 'ext-1',
  name: 'External',
  type: 'external',
  url: 'https://api.example.com/data',
  ...overrides,
});

const embedded = {
  id: 'emb-1',
  name: 'Embedded',
  type: 'embedded' as const,
  data: [{ a: 1 }, { a: 2 }],
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  } as Response);
}

describe('useDataSource', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves embedded sources synchronously without fetching', () => {
    const { result } = renderHook(() => useDataSource(embedded));
    expect(result.current.data).toEqual([{ a: 1 }, { a: 2 }]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('returns an empty state for undefined sources', () => {
    const { result } = renderHook(() => useDataSource(undefined));
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches external sources and applies dataPath', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ payload: { rows: [{ x: 10 }] } }));
    // stable reference: the hook re-fetches whenever the source object identity changes
    const source = external({ dataPath: 'payload.rows' });
    const { result } = renderHook(() => useDataSource(source));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ x: 10 }]);
    expect(result.current.lastUpdated).toBeTypeOf('number');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('GET');
  });

  it('sends custom method and headers', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse([{ x: 1 }]));
    const source = external({ method: 'POST', headers: { 'X-Token': 'abc' } });
    renderHook(() => useDataSource(source));
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1));
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'X-Token': 'abc' });
  });

  it('surfaces HTTP errors', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse(null, false, 500));
    const source = external();
    const { result } = renderHook(() => useDataSource(source));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/500/);
    expect(result.current.data).toEqual([]);
  });

  it('surfaces a non-array payload error', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ not: 'an array' }));
    const source = external();
    const { result } = renderHook(() => useDataSource(source));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/Expected an array/);
  });

  it('refresh() re-fetches the source', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse([{ n: 1 }]));
    const source = external();
    const { result } = renderHook(() => useDataSource(source));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.refresh());
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2));
  });
});

describe('useExternalData', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('auto-refreshes on the configured interval', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse([{ n: 1 }]));
    const source = external({ refreshInterval: 50 });
    const { result } = renderHook(() => useExternalData(source));

    await waitFor(() => expect(result.current.loading).toBe(false));
    // wait for at least one auto-refresh tick
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2), { timeout: 2000 });
    expect(result.current.data).toEqual([{ n: 1 }]);
  });

  it('does not fetch when source is undefined', () => {
    renderHook(() => useExternalData(undefined));
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

describe('findDataSource', () => {
  it('finds a source by id', () => {
    expect(findDataSource([embedded], 'emb-1')).toBe(embedded);
    expect(findDataSource([embedded], 'nope')).toBeUndefined();
  });
});
