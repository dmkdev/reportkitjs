import type { HeaderProps } from '../../../core/types';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { Field } from './fields';

export function HeaderForm({ id, props }: { id: string; props: HeaderProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  return (
    <div className={styles.panel}>
      <Field label="Text">
        <input
          className={styles.input}
          value={props.text}
          onChange={(e) => updateBlock(id, { text: e.target.value })}
        />
      </Field>
      <Field label="Level">
        <select
          className={styles.select}
          value={props.level}
          onChange={(e) => updateBlock(id, { level: Number(e.target.value) as 1 | 2 | 3 })}
        >
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
        </select>
      </Field>
    </div>
  );
}
