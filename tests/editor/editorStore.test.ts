import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEmptyReport,
  findBlockDeep,
  useEditorStore,
} from '../../src/editor/store/editorStore';
import type { Block, Report } from '../../src/core/types';

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

function sectionWithChild(): Block {
  return {
    id: 'sec1',
    type: 'section',
    props: {
      title: 'Nested',
      blocks: [{ id: 'b3', type: 'text', props: { content: 'Nested text' } }],
    },
  };
}

describe('editorStore initial state', () => {
  it('starts with an empty report', () => {
    const state = useEditorStore.getState();
    expect(state.report.blocks).toEqual([]);
    expect(state.report.dataSources).toEqual([]);
    expect(state.report.meta.title).toBe('Untitled report');
    expect(state.selectedBlockId).toBeNull();
    expect(state.dragState).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.future).toEqual([]);
  });

  it('createEmptyReport produces a valid-shaped report', () => {
    const report = createEmptyReport();
    expect(report.version).toBe('1.0.0');
    expect(report.meta.id).toBeTruthy();
    expect(report.blocks).toEqual([]);
  });
});

describe('block actions', () => {
  beforeEach(() => {
    useEditorStore.getState().reset(baseReport());
  });

  it('addBlock inserts at the given index', () => {
    useEditorStore.getState().addBlock('divider', 1);
    const blocks = useEditorStore.getState().report.blocks;
    expect(blocks.map((b) => b.id)).toHaveLength(3);
    expect(blocks[1].type).toBe('divider');
    expect(blocks[0].id).toBe('b1');
    expect(blocks[2].id).toBe('b2');
  });

  it('addBlock clamps out-of-range indices', () => {
    useEditorStore.getState().addBlock('text', 99);
    const blocks = useEditorStore.getState().report.blocks;
    expect(blocks[blocks.length - 1].type).toBe('text');
  });

  it('addBlock binds table/chart to the first data source', () => {
    useEditorStore.getState().addBlock('table', 0);
    const block = useEditorStore.getState().report.blocks[0];
    expect(block.type).toBe('table');
    expect((block.props as { dataSourceId?: string }).dataSourceId).toBe('ds1');
  });

  it('addBlock inserts into a nested section', () => {
    useEditorStore.getState().reset({ ...baseReport(), blocks: [sectionWithChild()] });
    useEditorStore.getState().addBlock('text', 1, 'sec1');
    const section = useEditorStore.getState().report.blocks[0] as Extract<
      Block,
      { type: 'section' }
    >;
    expect(section.props.blocks).toHaveLength(2);
    expect(section.props.blocks[1].type).toBe('text');
  });

  it('updateBlock merges props on a top-level block', () => {
    useEditorStore.getState().updateBlock('b1', { text: 'New title' } as never);
    const block = useEditorStore.getState().report.blocks[0];
    expect(block.props).toEqual({ text: 'New title', level: 1 });
  });

  it('updateBlock reaches blocks nested in sections', () => {
    useEditorStore.getState().reset({ ...baseReport(), blocks: [sectionWithChild()] });
    useEditorStore.getState().updateBlock('b3', { content: 'Changed' });
    const section = useEditorStore.getState().report.blocks[0] as Extract<
      Block,
      { type: 'section' }
    >;
    expect(section.props.blocks[0].props).toEqual({ content: 'Changed' });
  });

  it('removeBlock removes a top-level block', () => {
    useEditorStore.getState().removeBlock('b1');
    expect(useEditorStore.getState().report.blocks.map((b) => b.id)).toEqual(['b2']);
  });

  it('removeBlock removes nested blocks and clears selection', () => {
    useEditorStore.getState().reset({ ...baseReport(), blocks: [sectionWithChild()] });
    useEditorStore.getState().selectBlock('b3');
    useEditorStore.getState().removeBlock('b3');
    const section = useEditorStore.getState().report.blocks[0] as Extract<
      Block,
      { type: 'section' }
    >;
    expect(section.props.blocks).toEqual([]);
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
  });

  it('moveBlock reorders within the same list', () => {
    useEditorStore.getState().moveBlock('b2', 0);
    expect(useEditorStore.getState().report.blocks.map((b) => b.id)).toEqual(['b2', 'b1']);
  });

  it('moveBlock moves a block into a section', () => {
    const b1 = baseReport().blocks[0];
    useEditorStore.getState().reset({ ...baseReport(), blocks: [b1, sectionWithChild()] });
    useEditorStore.getState().moveBlock('b1', 0, 'sec1');
    const { report } = useEditorStore.getState();
    expect(report.blocks).toHaveLength(1);
    const section = report.blocks[0] as Extract<Block, { type: 'section' }>;
    expect(section.props.blocks.map((b) => b.id)).toEqual(['b1', 'b3']);
  });

  it('moveBlock moves a block out of a section to the root', () => {
    useEditorStore.getState().reset({ ...baseReport(), blocks: [sectionWithChild()] });
    useEditorStore.getState().moveBlock('b3', 0);
    const { report } = useEditorStore.getState();
    expect(report.blocks.map((b) => b.id)).toEqual(['b3', 'sec1']);
  });

  it('moveBlock is a no-op for unknown ids', () => {
    useEditorStore.getState().moveBlock('nope', 0);
    expect(useEditorStore.getState().report.blocks.map((b) => b.id)).toEqual(['b1', 'b2']);
  });
});

describe('undo / redo', () => {
  beforeEach(() => {
    useEditorStore.getState().reset(baseReport());
  });

  it('undo restores the previous report', () => {
    useEditorStore.getState().addBlock('text', 0);
    expect(useEditorStore.getState().report.blocks).toHaveLength(3);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().report.blocks.map((b) => b.id)).toEqual(['b1', 'b2']);
  });

  it('redo reapplies the undone change', () => {
    useEditorStore.getState().addBlock('text', 0);
    useEditorStore.getState().undo();
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().report.blocks).toHaveLength(3);
  });

  it('undo with empty history is a no-op', () => {
    const before = useEditorStore.getState().report;
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().report).toBe(before);
  });

  it('a new edit clears the redo stack', () => {
    useEditorStore.getState().addBlock('text', 0);
    useEditorStore.getState().undo();
    useEditorStore.getState().addBlock('divider', 0);
    expect(useEditorStore.getState().future).toEqual([]);
    useEditorStore.getState().redo();
    // redo was a no-op: report still has the divider
    expect(useEditorStore.getState().report.blocks[0].type).toBe('divider');
  });

  it('undo clears the selection', () => {
    useEditorStore.getState().addBlock('text', 0);
    useEditorStore.getState().selectBlock('b1');
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
  });

  it('history is capped at 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      useEditorStore.getState().updateMeta({ title: `t${i}` });
    }
    expect(useEditorStore.getState().history).toHaveLength(50);
  });

  it('history entries are deep clones (not aliased to the live report)', () => {
    useEditorStore.getState().updateMeta({ title: 'first' });
    useEditorStore.getState().updateMeta({ title: 'second' });
    const history = useEditorStore.getState().history;
    expect(history[0].meta.title).toBe('Test report');
    expect(history[1].meta.title).toBe('first');
    expect(useEditorStore.getState().report.meta.title).toBe('second');
  });
});

describe('data source actions', () => {
  beforeEach(() => {
    useEditorStore.getState().reset(baseReport());
  });

  it('addDataSource appends a source', () => {
    useEditorStore.getState().addDataSource({
      id: 'ds2',
      name: 'Extra',
      type: 'embedded',
      data: [],
    });
    expect(useEditorStore.getState().report.dataSources).toHaveLength(2);
  });

  it('updateDataSource merges fields', () => {
    useEditorStore.getState().updateDataSource('ds1', { name: 'Renamed' });
    const ds = useEditorStore.getState().report.dataSources[0];
    expect(ds.name).toBe('Renamed');
    expect(ds.type).toBe('embedded');
  });

  it('removeDataSource removes by id', () => {
    useEditorStore.getState().removeDataSource('ds1');
    expect(useEditorStore.getState().report.dataSources).toEqual([]);
  });
});

describe('meta / theme / selection actions', () => {
  beforeEach(() => {
    useEditorStore.getState().reset(baseReport());
  });

  it('updateMeta merges meta fields', () => {
    useEditorStore.getState().updateMeta({ title: 'New title' });
    const meta = useEditorStore.getState().report.meta;
    expect(meta.title).toBe('New title');
    expect(meta.id).toBe('r1');
  });

  it('updateTheme sets the theme', () => {
    useEditorStore.getState().updateTheme({ primaryColor: '#123456' });
    expect(useEditorStore.getState().report.theme?.primaryColor).toBe('#123456');
  });

  it('setReport replaces the report and pushes history', () => {
    const next = baseReport();
    next.meta.title = 'Replaced';
    useEditorStore.getState().setReport(next);
    expect(useEditorStore.getState().report.meta.title).toBe('Replaced');
    expect(useEditorStore.getState().history).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().report.meta.title).toBe('Test report');
  });

  it('selectBlock and setDragState update transient state without history', () => {
    useEditorStore.getState().selectBlock('b1');
    useEditorStore.getState().setDragState({ blockId: 'b1', from: 'canvas' });
    const state = useEditorStore.getState();
    expect(state.selectedBlockId).toBe('b1');
    expect(state.dragState).toEqual({ blockId: 'b1', from: 'canvas' });
    expect(state.history).toEqual([]);
  });
});

describe('findBlockDeep', () => {
  it('finds top-level blocks', () => {
    const blocks = baseReport().blocks;
    expect(findBlockDeep(blocks, 'b2')?.id).toBe('b2');
  });

  it('finds blocks nested in sections', () => {
    expect(findBlockDeep([sectionWithChild()], 'b3')?.id).toBe('b3');
  });

  it('returns undefined when absent', () => {
    expect(findBlockDeep(baseReport().blocks, 'missing')).toBeUndefined();
  });
});
