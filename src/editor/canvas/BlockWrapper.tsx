import { useDraggable } from '@dnd-kit/core';
import type { Block } from '../../core/types';
import { blockTypeLabels } from '../../core/defaults';
import { useEditorStore } from '../store/editorStore';
import styles from '../styles/canvas.module.css';
import panelStyles from '../styles/panels.module.css';

export interface BlockWrapperProps {
  block: Block;
}

/** Short human-readable preview of a block's content. */
export function blockPreview(block: Block): string {
  switch (block.type) {
    case 'header':
      return block.props.text;
    case 'text':
      return block.props.content;
    case 'kpi':
      return `${block.props.title}: ${
        typeof block.props.value === 'number' ? block.props.value : 'data ref'
      }`;
    case 'table':
      return `${block.props.columns.length} column(s)`;
    case 'chart':
      return `${block.props.chartType} chart, ${block.props.series.length} series`;
    case 'divider':
      return block.props.style;
    case 'image':
      return block.props.src || '(no src)';
    case 'section':
      return `${block.props.blocks.length} block(s)`;
  }
}

/**
 * A single block on the canvas: draggable, selectable, with a delete
 * action. Nested sections render their children recursively.
 */
export function BlockWrapper({ block }: BlockWrapperProps) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: { from: 'canvas' },
  });

  const isSelected = selectedBlockId === block.id;
  const className = [
    isSelected ? styles.blockSelected : styles.block,
    isDragging ? styles.blockDragging : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      <div className={styles.blockHeader}>
        <span
          {...attributes}
          {...listeners}
          className={panelStyles.iconButton}
          title="Drag to move"
          style={{ cursor: 'grab' }}
        >
          ⠿
        </span>
        <span className={styles.blockType}>{blockTypeLabels[block.type]}</span>
        <span className={styles.blockActions}>
          <button
            type="button"
            className={`${panelStyles.iconButton} ${panelStyles.iconButtonDanger}`}
            title="Delete block"
            onClick={(e) => {
              e.stopPropagation();
              removeBlock(block.id);
            }}
          >
            ✕
          </button>
        </span>
      </div>
      <div className={styles.blockBody}>
        <span className={styles.blockPreview}>{blockPreview(block)}</span>
        {block.type === 'section' && (
          <div className={styles.sectionBody}>
            {block.props.blocks.length === 0 ? (
              <span className={styles.blockPreview}>(empty section)</span>
            ) : (
              block.props.blocks.map((child) => <BlockWrapper key={child.id} block={child} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
