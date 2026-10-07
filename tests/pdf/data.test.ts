import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Report } from '../../src/core/types';
import { resolveReportData } from '../../src/pdf/data';

const meta = {
  id: 'r-1',
  title: 'Test',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function report(dataSources: Report['dataSources']): Report {
  return { version: '1.0.0', meta, dataSources, blocks: [] };
}

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return Promise.resolve({
    ok,
    status,
    statusText,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('resolveReportData', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('copies embedded rows synchronously without fetching', async () => {
    const rows = [{ a: 1 }, { a: 2 }];
    const result = await resolveReportData(
      report([{ id: 'emb-1', name: 'Embedded', type: 'embedded', data: rows }]),
    );

    expect(result.rows['emb-1']).toEqual(rows);
    expect(result.errors['emb-1']).toBeNull();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('fetches external sources and resolves dataPath', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ payload: { rows: [{ x: 10 }] } }));

    const result = await resolveReportData(
      report([
        {
          id: 'ext-1',
          name: 'External',
          type: 'external',
          url: 'https://api.example.com/data',
          dataPath: 'payload.rows',
        },
      ]),
    );

    expect(result.rows['ext-1']).toEqual([{ x: 10 }]);
    expect(result.errors['ext-1']).toBeNull();
  });

  it('captures an error per failing source without aborting the export', async () => {
    vi.mocked(fetch).mockImplementation((input: string | URL | Request) => {
      if (String(input).includes('bad')) {
        return jsonResponse(null, false, 500, 'Internal Server Error');
      }
      return jsonResponse([{ ok: 1 }]);
    });

    const result = await resolveReportData(
      report([
        { id: 'ext-bad', name: 'Bad', type: 'external', url: 'https://api.example.com/bad' },
        { id: 'ext-good', name: 'Good', type: 'external', url: 'https://api.example.com/good' },
      ]),
    );

    expect(result.errors['ext-bad']).toBe('HTTP 500 Internal Server Error');
    expect(result.rows['ext-bad']).toBeUndefined();
    expect(result.errors['ext-good']).toBeNull();
    expect(result.rows['ext-good']).toEqual([{ ok: 1 }]);
  });

  it('records a non-array error when dataPath resolves to a non-array', async () => {
    vi.mocked(fetch).mockImplementation(() => jsonResponse({ rows: { a: 1 } }));

    const result = await resolveReportData(
      report([
        {
          id: 'ext-1',
          name: 'External',
          type: 'external',
          url: 'https://api.example.com/data',
          dataPath: 'rows',
        },
      ]),
    );

    expect(result.errors['ext-1']).toBe('Expected an array at rows but got object');
    expect(result.rows['ext-1']).toBeUndefined();
  });
});
