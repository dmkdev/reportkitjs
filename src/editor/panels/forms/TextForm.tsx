import type { TextProps } from '../../../core/types';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { Field } from './fields';

export function TextForm({ id, props }: { id: string; props: TextProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  return (
    <div className={styles.panel}>
      <Field label="Content">
        <textarea
          className={styles.textarea}
          value={props.content}
          onChange={(e) => updateBlock(id, { content: e.target.value })}
        />
      </Field>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={props.markdown ?? false}
          onChange={(e) => updateBlock(id, { markdown: e.target.checked })}
        />
        Render as markdown
      </label>
    </div>
  );
}
