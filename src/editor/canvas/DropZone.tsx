import { useDroppable } from '@dnd-kit/core';
import styles from '../styles/canvas.module.css';

export interface DropZoneProps {
  /** Index the dropped block would be inserted at. */
  index: number;
  /** Owning section id, or undefined for the root list. */
  sectionId?: string;
}

/** Encoded droppable id: `drop:{sectionId|root}:{index}`. */
export function dropZoneId(sectionId: string | undefined, index: number): string {
  return `drop:${sectionId ?? 'root'}:${index}`;
}

/** Parse a drop zone id back into its parts. */
export function parseDropZoneId(
  id: string,
): { sectionId: string | undefined; index: number } | null {
  const [prefix, section, index] = id.split(':');
  if (prefix !== 'drop' || index === undefined) return null;
  return {
    sectionId: section === 'root' ? undefined : section,
    index: Number(index),
  };
}

/**
 * A thin drop target between blocks. Expands and highlights while a
 * draggable is over it.
 */
export function DropZone({ index, sectionId }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: dropZoneId(sectionId, index) });

  return (
    <div
      ref={setNodeRef}
      className={isOver ? `${styles.dropZone} ${styles.dropZoneActive}` : styles.dropZone}
      aria-hidden="true"
    />
  );
}
