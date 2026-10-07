import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExternalDataSource } from '../../src/core/types';
import { fetchExternalSource } from '../../src/core/data';

const source = (overrides: Partial<ExternalDataSource> = {}): ExternalDataSource => ({
  id: 'ext-1',
  name: 'External',
  type: 'external',
  url: 'https://api.example.com/data',
  ...overrides,
});

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return Promise.resolve({
    ok,
    status,
    statusText,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('fetchExternalSource', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the url and returns the root array', async () => {
    const rows = [{ a: 1 }, { a: 2 }];
    vi.mocked(fetch).mockImplementation(() => jsonResponse(rows));

    const result = await fetchExternalSource(source());

    expect(result).toEqual(rows);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('https://api.example.com/data', {
      method: 'GET',
      headers: undefined,
      signal: undefined,
    });
  });

  it('resolves dataPath into the fetched JSON', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ payload: { rows: [{ x: 10 }] } }));

    const result = await fetchExternalSource(source({ dataPath: 'payload.rows' }));

    expect(result).toEqual([{ x: 10 }]);
  });

  it('passes method and headers through', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse([{ a: 1 }]));

    await fetchExternalSource(source({ method: 'POST', headers: { 'X-Token': 'secret' } }));

    expect(vi.mocked(fetch)).toHaveBeenCalledWith('https://api.example.com/data', {
      method: 'POST',
      headers: { 'X-Token': 'secret' },
      signal: undefined,
    });
  });

  it('forwards an AbortSignal when provided', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse([{ a: 1 }]));
    const controller = new AbortController();

    await fetchExternalSource(source(), controller.signal);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('throws on HTTP errors', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      jsonResponse(null, false, 500, 'Internal Server Error'),
    );

    await expect(fetchExternalSource(source())).rejects.toThrow('HTTP 500 Internal Server Error');
  });

  it('throws when the resolved value is not an array', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ rows: { a: 1 } }));

    await expect(fetchExternalSource(source({ dataPath: 'rows' }))).rejects.toThrow(
      'Expected an array at rows but got object',
    );
  });

  it('throws when the root response is not an array and no dataPath is set', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ a: 1 }));

    await expect(fetchExternalSource(source())).rejects.toThrow(
      'Expected an array at (root) but got object',
    );
  });
});
