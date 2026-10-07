import { describe, expect, it } from 'vitest';
import { assertValidReport, validateReport } from '../../src/core/validate';
import type { Report } from '../../src/core/types';
import sampleReport from '../../src/demo/sample-report.json';

const valid = sampleReport as Report;

describe('validateReport', () => {
  it('accepts the sample report', () => {
    const result = validateReport(valid);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts a minimal report', () => {
    const minimal: Report = {
      version: '1.0.0',
      meta: {
        id: 'r1',
        title: 'T',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      dataSources: [],
      blocks: [],
    };
    expect(validateReport(minimal).valid).toBe(true);
  });

  it('rejects a missing version', () => {
    const { version: _version, ...rest } = valid;
    const result = validateReport(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/version/i);
  });

  it('rejects a malformed version string', () => {
    const bad = { ...valid, version: 'not-a-version' };
    expect(validateReport(bad).valid).toBe(false);
  });

  it('rejects a missing meta.title', () => {
    const bad = {
      ...valid,
      meta: { id: 'r1', createdAt: 'x', updatedAt: 'y' },
    };
    const result = validateReport(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/title/i);
  });

  it('rejects an unknown top-level property', () => {
    const bad = { ...valid, bogus: true };
    expect(validateReport(bad).valid).toBe(false);
  });

  it('rejects an embedded data source without data', () => {
    const bad: Report = {
      ...valid,
      dataSources: [{ id: 'd1', name: 'N', type: 'embedded' } as never],
    };
    expect(validateReport(bad).valid).toBe(false);
  });

  it('rejects an external data source without url', () => {
    const bad: Report = {
      ...valid,
      dataSources: [{ id: 'd1', name: 'N', type: 'external' } as never],
    };
    expect(validateReport(bad).valid).toBe(false);
  });

  it('rejects an unknown block type', () => {
    const bad: Report = {
      ...valid,
      blocks: [{ id: 'b1', type: 'video', props: {} } as never],
    };
    expect(validateReport(bad).valid).toBe(false);
  });

  it('rejects a header block with an invalid level', () => {
    const bad: Report = {
      ...valid,
      blocks: [{ id: 'b1', type: 'header', props: { text: 'T', level: 5 } } as never],
    };
    expect(validateReport(bad).valid).toBe(false);
  });

  it('rejects a kpi block with an invalid aggregation', () => {
    const bad: Report = {
      ...valid,
      blocks: [
        {
          id: 'b1',
          type: 'kpi',
          props: { title: 'M', value: { dataSourceId: 'd', field: 'f', aggregation: 'median' } },
        } as never,
      ],
    };
    expect(validateReport(bad).valid).toBe(false);
  });

  it('accepts a kpi block with a literal numeric value', () => {
    const report: Report = {
      ...valid,
      blocks: [{ id: 'b1', type: 'kpi', props: { title: 'M', value: 42 } } as never],
    };
    expect(validateReport(report).valid).toBe(true);
  });

  it('accepts nested section blocks', () => {
    const report: Report = {
      ...valid,
      blocks: [
        {
          id: 's1',
          type: 'section',
          props: {
            title: 'S',
            blocks: [{ id: 'b1', type: 'divider', props: { style: 'dotted' } }],
          },
        },
      ],
    };
    expect(validateReport(report).valid).toBe(true);
  });

  it('collects multiple errors at once', () => {
    const result = validateReport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('assertValidReport', () => {
  it('does not throw for a valid report', () => {
    expect(() => assertValidReport(valid)).not.toThrow();
  });

  it('throws for an invalid report', () => {
    expect(() => assertValidReport({})).toThrow(/Invalid report/);
  });
});
