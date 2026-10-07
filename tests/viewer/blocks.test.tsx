import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  DividerBlock,
  HeaderBlock,
  ImageBlock,
  KpiBlock,
  SectionBlock,
  TableBlock,
  TextBlock,
  renderMarkdown,
  resolveKpiValue,
} from '../../src/viewer';
import { defaultTheme } from '../../src/core/defaults';
import { ReportDataProvider, type ReportDataState } from '../../src/viewer/hooks/useReportData';

const ROWS = [
  { month: 'Jan', revenue: 100, cost: 40 },
  { month: 'Feb', revenue: 200, cost: 60 },
  { month: 'Mar', revenue: 300, cost: 90 },
];

function withData(ui: ReactNode, rows: Record<string, unknown>[] = ROWS) {
  const value: ReportDataState = {
    theme: defaultTheme,
    getSource: () => ({
      data: rows,
      loading: false,
      error: null,
      lastUpdated: null,
      refresh: () => {},
    }),
    loading: false,
    error: null,
  };
  return render(<ReportDataProvider value={value}>{ui}</ReportDataProvider>);
}

describe('HeaderBlock', () => {
  it('renders the correct heading tag per level', () => {
    const { rerender } = render(<HeaderBlock props={{ text: 'Title', level: 1 }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
    rerender(<HeaderBlock props={{ text: 'Title', level: 3 }} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
  });
});

describe('TextBlock', () => {
  it('renders plain text when markdown is disabled', () => {
    render(<TextBlock props={{ content: 'Hello **world**', markdown: false }} />);
    expect(screen.getByText('Hello **world**')).toBeInTheDocument();
  });

  it('renders markdown bold, italic, code and links', () => {
    render(
      <TextBlock
        props={{
          content: 'a **bold** *it* `code` [link](https://example.com)',
          markdown: true,
        }}
      />,
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('it').tagName).toBe('EM');
    expect(screen.getByText('code').tagName).toBe('CODE');
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renderMarkdown returns a fragment of nodes', () => {
    const { container } = render(renderMarkdown('x **y**'));
    expect(container.querySelector('strong')?.textContent).toBe('y');
  });
});

describe('KpiBlock', () => {
  it('renders a literal value with formatting', () => {
    withData(
      <KpiBlock props={{ title: 'Revenue', value: 1234.5, format: 'currency', currency: 'USD' }} />,
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText(/1,234\.50/)).toBeInTheDocument();
  });

  it('aggregates a data reference', () => {
    withData(
      <KpiBlock
        props={{
          title: 'Total',
          value: { dataSourceId: 'ds', field: 'revenue', aggregation: 'sum' },
        }}
      />,
    );
    expect(screen.getByText('600')).toBeInTheDocument();
  });

  it('shows a trend indicator', () => {
    withData(
      <KpiBlock
        props={{
          title: 'M',
          value: 1,
          trend: { direction: 'up', value: 12.5 },
        }}
      />,
    );
    expect(screen.getByText(/▲/)).toBeInTheDocument();
    expect(screen.getByText(/12\.5%/)).toBeInTheDocument();
  });
});

describe('TableBlock', () => {
  const props = {
    dataSourceId: 'ds',
    title: 'Sales',
    columns: [
      { field: 'month', label: 'Month' },
      { field: 'revenue', label: 'Revenue', format: 'number' as const, align: 'right' as const },
    ],
  };

  it('renders headers and rows', () => {
    render(<TableBlock props={props} data={ROWS} />);
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('row')).toHaveLength(ROWS.length + 1);
    expect(screen.getByText('Jan')).toBeInTheDocument();
  });

  it('shows an empty state without data', () => {
    render(<TableBlock props={props} data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('paginates when pageSize is set', async () => {
    const user = userEvent.setup();
    render(<TableBlock props={{ ...props, pagination: { pageSize: 2 } }} data={ROWS} />);
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 rows
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.queryByText('Jan')).not.toBeInTheDocument();
  });

  it('formats numeric cells with the column format', () => {
    render(
      <TableBlock
        props={{
          ...props,
          columns: [{ field: 'revenue', label: 'Revenue', format: 'currency', currency: 'USD' }],
        }}
        data={[{ revenue: 1000 }]}
      />,
    );
    expect(screen.getByText(/1,000\.00/)).toBeInTheDocument();
  });
});

describe('DividerBlock', () => {
  it('renders an hr element', () => {
    const { container } = render(<DividerBlock props={{ style: 'dashed' }} />);
    expect(container.querySelector('hr')).toBeInTheDocument();
  });
});

describe('ImageBlock', () => {
  it('renders image with alt and caption', () => {
    render(<ImageBlock props={{ src: 'https://x/y.png', alt: 'Chart', caption: 'Fig. 1' }} />);
    const img = screen.getByAltText('Chart');
    expect(img).toHaveAttribute('src', 'https://x/y.png');
    expect(screen.getByText('Fig. 1')).toBeInTheDocument();
  });

  it('applies maxWidth when provided', () => {
    render(<ImageBlock props={{ src: 'a.png', alt: 'A', maxWidth: 300 }} />);
    expect(screen.getByAltText('A')).toHaveStyle({ maxWidth: '300px' });
  });
});

describe('SectionBlock', () => {
  it('renders title and nested blocks', () => {
    render(
      <SectionBlock
        props={{ title: 'Details', blocks: [] }}
        renderBlocks={() => <span>child-block</span>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByText('child-block')).toBeInTheDocument();
  });

  it('omits the title when not provided', () => {
    render(<SectionBlock props={{ blocks: [] }} renderBlocks={() => null} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

describe('resolveKpiValue', () => {
  it('passes literal numbers through', () => {
    expect(resolveKpiValue(42, ROWS)).toBe(42);
  });

  it('aggregates references', () => {
    expect(
      resolveKpiValue({ dataSourceId: 'ds', field: 'revenue', aggregation: 'avg' }, ROWS),
    ).toBe(200);
    expect(
      resolveKpiValue({ dataSourceId: 'ds', field: 'revenue', aggregation: 'max' }, ROWS),
    ).toBe(300);
    expect(
      resolveKpiValue({ dataSourceId: 'ds', field: 'revenue', aggregation: 'count' }, ROWS),
    ).toBe(3);
  });
});
