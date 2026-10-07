import type { ImageProps } from '../../../core/types';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { Field } from './fields';

export function ImageForm({ id, props }: { id: string; props: ImageProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  return (
    <div className={styles.panel}>
      <Field label="Source URL">
        <input
          className={styles.input}
          value={props.src}
          placeholder="https://…"
          onChange={(e) => updateBlock(id, { src: e.target.value })}
        />
      </Field>
      <Field label="Alt text">
        <input
          className={styles.input}
          value={props.alt ?? ''}
          onChange={(e) => updateBlock(id, { alt: e.target.value || undefined })}
        />
      </Field>
      <Field label="Caption">
        <input
          className={styles.input}
          value={props.caption ?? ''}
          onChange={(e) => updateBlock(id, { caption: e.target.value || undefined })}
        />
      </Field>
      <Field label="Max width (px)">
        <input
          className={styles.input}
          type="number"
          min={1}
          value={props.maxWidth ?? ''}
          placeholder="auto"
          onChange={(e) => {
            const v = Number(e.target.value);
            updateBlock(id, { maxWidth: v > 0 ? v : undefined });
          }}
        />
      </Field>
    </div>
  );
}
