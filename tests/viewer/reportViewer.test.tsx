import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Report } from '../../src/core/types';
import { ReportViewer } from '../../src/viewer';
import { themeToCssVars } from '../../src/viewer/theme/themeContext';
import { defaultTheme } from '../../src/core/defaults';

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    version: '1.0.0',
    meta: {
      id: 'r1',
      title: 'Quarterly Report',
      description: 'Q3 numbers',
      author: 'Dmitry',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    dataSources: [
      {
        id: 'ds',
        name: 'Sales',
        type: 'embedded',
        data: [
          { month: 'Jul', revenue: 100 },
          { month: 'Aug', revenue: 200 },
        ],
      },
    ],
    blocks: [
      { id: 'h1', type: 'header', props: { text: 'Overview', level: 1 } },
      { id: 't1', type: 'text', props: { content: 'Revenue grew **strongly**', markdown: true } },
      {
        id: 'k1',
        type: 'kpi',
        props: {
          title: 'Total',
          value: { dataSourceId: 'ds', field: 'revenue', aggregation: 'sum' },
        },
      },
      {
        id: 'tb1',
        type: 'table',
        props: {
          dataSourceId: 'ds',
          columns: [
            { field: 'month', label: 'Month' },
            { field: 'revenue', label: 'Revenue' },
          ],
        },
      },
      { id: 'd1', type: 'divider', props: { style: 'solid' } },
      {
        id: 's1',
        type: 'section',
        props: {
          title: 'Nested',
          blocks: [
            { id: 't2', type: 'text', props: { content: 'inside section', markdown: false } },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe('ReportViewer', () => {
  it('renders meta header and all block types', () => {
    render(<ReportViewer report={makeReport()} />);
    expect(screen.getByRole('heading', { name: 'Quarterly Report' })).toBeInTheDocument();
    expect(screen.getByText('Q3 numbers')).toBeInTheDocument();
    expect(screen.getByText('Dmitry')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Overview', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('strongly').tagName).toBe('STRONG');
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByText('inside section')).toBeInTheDocument();
    expect(document.querySelector('hr')).toBeInTheDocument();
  });

  it('renders nested section blocks', () => {
    render(<ReportViewer report={makeReport()} />);
    expect(screen.getByRole('heading', { name: 'Nested' })).toBeInTheDocument();
  });

  it('shows an error banner when an external source fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Unavailable',
        json: () => Promise.resolve(null),
      } as Response),
    );
    const report = makeReport({
      dataSources: [{ id: 'ext', name: 'Ext', type: 'external', url: 'https://api.example.com/x' }],
      blocks: [
        {
          id: 'k1',
          type: 'kpi',
          props: { title: 'M', value: { dataSourceId: 'ext', field: 'v', aggregation: 'sum' } },
        },
      ],
    });
    render(<ReportViewer report={report} />);
    await waitFor(() => expect(screen.getByText(/Data error: HTTP 503/)).toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it('applies theme CSS variables', () => {
    const { container } = render(
      <ReportViewer
        report={makeReport({
          theme: { primaryColor: '#123456', colors: { background: '#000000' } },
        })}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--rk-primary')).toBe('#123456');
    expect(wrapper.style.getPropertyValue('--rk-bg')).toBe('#000000');
    // defaults still merged in
    expect(wrapper.style.getPropertyValue('--rk-text')).toBe(defaultTheme.colors.text);
  });
});

describe('themeToCssVars', () => {
  it('emits all base variables and chart palette', () => {
    const vars = themeToCssVars(defaultTheme);
    expect(vars['--rk-primary']).toBe(defaultTheme.primaryColor);
    expect(vars['--rk-max-width']).toBe('960px');
    expect(vars['--rk-chart-0']).toBe(defaultTheme.colors.chart[0]);
    expect(Object.keys(vars).filter((k) => k.startsWith('--rk-chart-'))).toHaveLength(
      defaultTheme.colors.chart.length,
    );
  });
});
