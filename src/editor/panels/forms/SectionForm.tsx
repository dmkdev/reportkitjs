import type { SectionProps } from '../../../core/types';
import { blockTypeLabels } from '../../../core/defaults';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { Field } from './fields';

export function SectionForm({ id, props }: { id: string; props: SectionProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  return (
    <div className={styles.panel}>
      <Field label="Title">
        <input
          className={styles.input}
          value={props.title ?? ''}
          placeholder="(none)"
          onChange={(e) => updateBlock(id, { title: e.target.value || undefined })}
        />
      </Field>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Blocks ({props.blocks.length})</span>
        <div className={styles.list}>
          {props.blocks.length === 0 ? (
            <div className={styles.empty}>
              Drag blocks from the palette into this section on the canvas.
            </div>
          ) : (
            props.blocks.map((child) => (
              <div key={child.id} className={styles.listItem}>
                <span className={styles.listItemName}>{blockTypeLabels[child.type]}</span>
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                  title="Remove block"
                  onClick={() => removeBlock(child.id)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
