import type { Block } from '../../core/types';
import { useEditorStore } from '../store/editorStore';
import styles from '../styles/canvas.module.css';
import { BlockWrapper } from './BlockWrapper';
import { DropZone } from './DropZone';

export interface ReportCanvasProps {
  /** The block list to render (root list or a section's list). */
  blocks: Block[];
  /** Owning section id, or undefined for the root list. */
  sectionId?: string;
}

/**
 * Renders a block list with drop zones between (and around) the blocks.
 * Used for the root canvas and recursively for sections.
 */
export function ReportCanvas({ blocks, sectionId }: ReportCanvasProps) {
  const selectBlock = useEditorStore((s) => s.selectBlock);

  return (
    <div
      className={styles.canvas}
      onClick={() => selectBlock(null)}
      role="list"
      aria-label={sectionId ? 'Section blocks' : 'Report blocks'}
    >
      <DropZone index={0} sectionId={sectionId} />
      {blocks.map((block, i) => (
        <div key={block.id} role="listitem">
          <BlockWrapper block={block} />
          <DropZone index={i + 1} sectionId={sectionId} />
        </div>
      ))}
      {blocks.length === 0 && (
        <div className={styles.canvasEmpty}>
          Drag a block here from the palette, or click a palette item to add it.
        </div>
      )}
    </div>
  );
}
