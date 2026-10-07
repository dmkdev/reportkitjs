import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dropZoneId,
  parseDropZoneId,
  ReportCanvas,
  BlockPalette,
  MetaPanel,
  PropertiesPanel,
  useEditorStore,
} from '../../src/editor';
import type { Report } from '../../src/core/types';

function baseReport(): Report {
  return {
    version: '1.0.0',
    meta: {
      id: 'r1',
      title: 'Test report',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    dataSources: [
      { id: 'ds1', name: 'Sales', type: 'embedded', data: [{ month: 'Jan', revenue: 100 }] },
    ],
    blocks: [
      { id: 'b1', type: 'header', props: { text: 'Title', level: 1 } },
      { id: 'b2', type: 'text', props: { content: 'Body' } },
    ],
  };
}

beforeEach(() => {
  useEditorStore.getState().reset(baseReport());
});

describe('dropZoneId / parseDropZoneId', () => {
  it('round-trips a root zone', () => {
    const id = dropZoneId(undefined, 2);
    expect(id).toBe('drop:root:2');
    expect(parseDropZoneId(id)).toEqual({ sectionId: undefined, index: 2 });
  });

  it('round-trips a section zone', () => {
    const id = dropZoneId('sec1', 0);
    expect(id).toBe('drop:sec1:0');
    expect(parseDropZoneId(id)).toEqual({ sectionId: 'sec1', index: 0 });
  });

  it('returns null for malformed ids', () => {
    expect(parseDropZoneId('nope')).toBeNull();
    expect(parseDropZoneId('drop:root')).toBeNull();
  });
});

describe('BlockPalette', () => {
  it('renders all block types', () => {
    render(<BlockPalette />);
    expect(screen.getByText('Heading')).toBeTruthy();
    expect(screen.getByText('Text')).toBeTruthy();
    expect(screen.getByText('KPI Card')).toBeTruthy();
    expect(screen.getByText('Table')).toBeTruthy();
    expect(screen.getByText('Chart')).toBeTruthy();
    expect(screen.getByText('Divider')).toBeTruthy();
    expect(screen.getByText('Image')).toBeTruthy();
    expect(screen.getByText('Section')).toBeTruthy();
  });

  it('clicking a palette item appends a block to the root list', async () => {
    const user = userEvent.setup();
    render(<BlockPalette />);
    const before = useEditorStore.getState().report.blocks.length;
    await user.click(screen.getByText('Divider'));
    const after = useEditorStore.getState().report.blocks;
    expect(after).toHaveLength(before + 1);
    expect(after[after.length - 1].type).toBe('divider');
  });
});

describe('ReportCanvas', () => {
  it('renders each block with its preview', () => {
    render(<ReportCanvas blocks={baseReport().blocks} />);
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('shows an empty hint when there are no blocks', () => {
    render(<ReportCanvas blocks={[]} />);
    expect(screen.getByText(/Drag a block here/)).toBeTruthy();
  });

  it('clicking a block selects it', async () => {
    const user = userEvent.setup();
    render(<ReportCanvas blocks={baseReport().blocks} />);
    await user.click(screen.getByText('Title'));
    expect(useEditorStore.getState().selectedBlockId).toBe('b1');
  });

  it('the delete button removes a block', async () => {
    const user = userEvent.setup();
    render(<ReportCanvas blocks={baseReport().blocks} />);
    const deleteButtons = screen.getAllByTitle('Delete block');
    await user.click(deleteButtons[0]);
    expect(useEditorStore.getState().report.blocks.map((b) => b.id)).toEqual(['b2']);
  });
});

describe('MetaPanel', () => {
  it('editing the title updates the store', async () => {
    const user = userEvent.setup();
    render(<MetaPanel />);
    const title = screen.getByDisplayValue('Test report');
    await user.clear(title);
    await user.type(title, 'New title');
    expect(useEditorStore.getState().report.meta.title).toBe('New title');
  });

  it('editing the primary color updates the theme', () => {
    render(<MetaPanel />);
    const color = screen.getByDisplayValue('#2563eb');
    fireEvent.change(color, { target: { value: '#ff0000' } });
    expect(useEditorStore.getState().report.theme?.primaryColor).toBe('#ff0000');
  });
});

describe('PropertiesPanel', () => {
  it('shows a hint when nothing is selected', () => {
    render(<PropertiesPanel />);
    expect(screen.getByText(/Select a block on the canvas/)).toBeTruthy();
  });

  it('shows the header form for a selected header block', async () => {
    const user = userEvent.setup();
    useEditorStore.getState().selectBlock('b1');
    render(<PropertiesPanel />);
    expect(screen.getByText('Heading')).toBeTruthy();
    const text = screen.getByDisplayValue('Title');
    await user.clear(text);
    await user.type(text, 'Changed');
    const block = useEditorStore.getState().report.blocks[0];
    expect(block.props).toEqual({ text: 'Changed', level: 1 });
  });
});

describe('ReportCanvas nested sections', () => {
  it('renders nested section children', () => {
    const report: Report = {
      ...baseReport(),
      blocks: [
        {
          id: 'sec1',
          type: 'section',
          props: {
            title: 'Nested',
            blocks: [{ id: 'b3', type: 'text', props: { content: 'Nested text' } }],
          },
        },
      ],
    };
    render(<ReportCanvas blocks={report.blocks} />);
    expect(screen.getByText('Nested text')).toBeTruthy();
  });
});
