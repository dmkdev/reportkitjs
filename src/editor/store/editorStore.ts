import { create } from 'zustand';
import type {
  Block,
  BlockType,
  DataSource,
  HeaderProps,
  ImageProps,
  KpiProps,
  Report,
  ReportMeta,
  ReportTheme,
  SectionProps,
  TableProps,
  TextProps,
  ChartProps,
  DividerProps,
} from '../../core/types';
import { REPORT_VERSION } from '../../core/types';
import { createDefaultBlock, createId, deepClone } from '../../core';

/** Union of all block prop shapes. */
export type AnyBlockProps =
  | HeaderProps
  | TextProps
  | KpiProps
  | TableProps
  | ChartProps
  | DividerProps
  | ImageProps
  | SectionProps;

const HISTORY_LIMIT = 50;

/* ------------------------------------------------------------------ */
/* Immutable block-list helpers                                        */
/* ------------------------------------------------------------------ */

function updateBlockById(blocks: Block[], id: string, props: Partial<AnyBlockProps>): Block[] {
  return blocks.map((b) => {
    if (b.id === id) {
      return { ...b, props: { ...b.props, ...props } } as Block;
    }
    if (b.type === 'section') {
      return { ...b, props: { ...b.props, blocks: updateBlockById(b.props.blocks, id, props) } };
    }
    return b;
  });
}

function removeBlockById(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) =>
      b.type === 'section'
        ? { ...b, props: { ...b.props, blocks: removeBlockById(b.props.blocks, id) } }
        : b,
    );
}

function insertAt(blocks: Block[], block: Block, index: number): Block[] {
  const next = blocks.slice();
  const clamped = Math.max(0, Math.min(index, next.length));
  next.splice(clamped, 0, block);
  return next;
}

/**
 * Apply a transform to the block list that `sectionId` points to
 * (root list when `sectionId` is undefined).
 */
function transformList(
  blocks: Block[],
  sectionId: string | undefined,
  fn: (list: Block[]) => Block[],
): Block[] {
  if (sectionId === undefined) return fn(blocks);
  return blocks.map((b) => {
    if (b.type === 'section' && b.id === sectionId) {
      return { ...b, props: { ...b.props, blocks: fn(b.props.blocks) } };
    }
    if (b.type === 'section') {
      return { ...b, props: { ...b.props, blocks: transformList(b.props.blocks, sectionId, fn) } };
    }
    return b;
  });
}

function touch(report: Report): Report {
  return { ...report, meta: { ...report.meta, updatedAt: new Date().toISOString() } };
}

/** Create a minimal valid report (used to initialize the editor). */
export function createEmptyReport(): Report {
  const now = new Date().toISOString();
  return {
    version: REPORT_VERSION,
    meta: {
      id: createId('r'),
      title: 'Untitled report',
      createdAt: now,
      updatedAt: now,
    },
    dataSources: [],
    blocks: [],
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export interface EditorState {
  report: Report;
  selectedBlockId: string | null;
  dragState: { blockId: string; from: 'palette' | 'canvas' } | null;
  history: Report[];
  future: Report[];

  /* actions */
  setReport: (r: Report) => void;
  reset: (r: Report) => void;
  updateBlock: (id: string, props: Partial<AnyBlockProps>) => void;
  addBlock: (type: BlockType, index: number, sectionId?: string) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, toIndex: number, toSectionId?: string) => void;
  selectBlock: (id: string | null) => void;
  setDragState: (state: EditorState['dragState']) => void;
  undo: () => void;
  redo: () => void;

  /* data source actions */
  addDataSource: (ds: DataSource) => void;
  updateDataSource: (id: string, ds: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;

  /* meta actions */
  updateMeta: (meta: Partial<ReportMeta>) => void;
  updateTheme: (theme: Partial<ReportTheme>) => void;
}

/**
 * Central editor state. Every mutating action pushes the previous report
 * onto `history` (capped at HISTORY_LIMIT) and clears `future`, so
 * undo/redo work across all edit kinds.
 */
export const useEditorStore = create<EditorState>()((set, get) => {
  /** Push current report to history and apply a report transform. */
  const mutate = (fn: (report: Report) => Report) => {
    const { report, history } = get();
    const next = touch(fn(deepClone(report)));
    set({
      report: next,
      history: [...history.slice(-HISTORY_LIMIT + 1), deepClone(report)],
      future: [],
    });
  };

  return {
    report: createEmptyReport(),
    selectedBlockId: null,
    dragState: null,
    history: [],
    future: [],

    setReport: (r) => {
      const { report, history } = get();
      set({
        report: deepClone(r),
        history: [...history.slice(-HISTORY_LIMIT + 1), deepClone(report)],
        future: [],
        selectedBlockId: null,
      });
    },

    reset: (r) =>
      set({
        report: deepClone(r),
        selectedBlockId: null,
        dragState: null,
        history: [],
        future: [],
      }),

    updateBlock: (id, props) =>
      mutate((report) => ({ ...report, blocks: updateBlockById(report.blocks, id, props) })),

    addBlock: (type, index, sectionId) =>
      mutate((report) => {
        const block = createDefaultBlock(type, report.dataSources[0]?.id);
        return {
          ...report,
          blocks: transformList(report.blocks, sectionId, (list) => insertAt(list, block, index)),
        };
      }),

    removeBlock: (id) => {
      const { selectedBlockId } = get();
      mutate((report) => ({ ...report, blocks: removeBlockById(report.blocks, id) }));
      if (selectedBlockId === id) set({ selectedBlockId: null });
    },

    moveBlock: (id, toIndex, toSectionId) =>
      mutate((report) => {
        const found = findBlockDeep(report.blocks, id);
        if (!found) return report;
        const without = removeBlockById(report.blocks, id);
        return {
          ...report,
          blocks: transformList(without, toSectionId, (list) => insertAt(list, found, toIndex)),
        };
      }),

    selectBlock: (id) => set({ selectedBlockId: id }),
    setDragState: (state) => set({ dragState: state }),

    undo: () => {
      const { history, future, report } = get();
      if (history.length === 0) return;
      const previous = history[history.length - 1];
      set({
        report: previous,
        history: history.slice(0, -1),
        future: [deepClone(report), ...future],
        selectedBlockId: null,
      });
    },

    redo: () => {
      const { history, future, report } = get();
      if (future.length === 0) return;
      const [next, ...rest] = future;
      set({
        report: next,
        history: [...history, deepClone(report)],
        future: rest,
        selectedBlockId: null,
      });
    },

    addDataSource: (ds) =>
      mutate((report) => ({ ...report, dataSources: [...report.dataSources, ds] })),

    updateDataSource: (id, ds) =>
      mutate((report) => ({
        ...report,
        dataSources: report.dataSources.map((s) =>
          s.id === id ? ({ ...s, ...ds } as DataSource) : s,
        ),
      })),

    removeDataSource: (id) =>
      mutate((report) => ({
        ...report,
        dataSources: report.dataSources.filter((s) => s.id !== id),
      })),

    updateMeta: (meta) => mutate((report) => ({ ...report, meta: { ...report.meta, ...meta } })),

    updateTheme: (theme) =>
      mutate((report) => ({
        ...report,
        theme: { ...report.theme, ...theme },
      })),
  };
});

/** Find a block (including nested sections) by id. */
export function findBlockDeep(blocks: Block[], id: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'section') {
      const found = findBlockDeep(block.props.blocks, id);
      if (found) return found;
    }
  }
  return undefined;
}
