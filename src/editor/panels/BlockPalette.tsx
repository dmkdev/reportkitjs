import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from '../../core/types';
import { allBlockTypes, blockTypeLabels } from '../../core/defaults';
import { useEditorStore } from '../store/editorStore';
import styles from '../styles/panels.module.css';

const paletteIcons: Record<BlockType, string> = {
  header: 'H',
  text: '¶',
  kpi: 'K',
  table: '▦',
  chart: '◔',
  divider: '—',
  image: '▣',
  section: '⊞',
};

function PaletteItem({ type }: { type: BlockType }) {
  const addBlock = useEditorStore((s) => s.addBlock);
  const report = useEditorStore((s) => s.report);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { from: 'palette', type },
  });

  return (
    <div
      ref={setNodeRef}
      className={styles.paletteItem}
      style={isDragging ? { opacity: 0.5 } : undefined}
      {...attributes}
      {...listeners}
      onClick={() => addBlock(type, report.blocks.length)}
      title={`Click or drag to add a ${blockTypeLabels[type]}`}
    >
      <span className={styles.paletteIcon}>{paletteIcons[type]}</span>
      {blockTypeLabels[type]}
    </div>
  );
}

/**
 * Left-hand palette of block types. Items can be dragged onto the canvas
 * drop zones or clicked to append to the root list.
 */
export function BlockPalette() {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Blocks</h2>
      <div className={styles.list}>
        {allBlockTypes.map((type) => (
          <PaletteItem key={type} type={type} />
        ))}
      </div>
    </div>
  );
}
