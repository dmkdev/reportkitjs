import type { DividerProps } from '../../../core/types';
import { useEditorStore } from '../../store/editorStore';
import styles from '../../styles/panels.module.css';
import { Field } from './fields';

const dividerStyles: DividerProps['style'][] = ['solid', 'dashed', 'dotted'];

export function DividerForm({ id, props }: { id: string; props: DividerProps }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  return (
    <div className={styles.panel}>
      <Field label="Style">
        <select
          className={styles.select}
          value={props.style}
          onChange={(e) => updateBlock(id, { style: e.target.value as DividerProps['style'] })}
        >
          {dividerStyles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
