import type { DividerProps } from '../../core/types';
import styles from '../styles/blocks.module.css';

const STYLE_CLASS = {
  solid: undefined,
  dashed: styles.dividerDashed,
  dotted: styles.dividerDotted,
} as const;

export function DividerBlock({ props }: { props: DividerProps }) {
  return <hr className={`${styles.divider} ${STYLE_CLASS[props.style] ?? ''}`} />;
}
