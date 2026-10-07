import type { HeaderProps } from '../../core/types';
import styles from '../styles/blocks.module.css';

const LEVEL_CLASS: Record<HeaderProps['level'], string> = {
  1: styles.header1,
  2: styles.header2,
  3: styles.header3,
};

const TAG: Record<HeaderProps['level'], 'h1' | 'h2' | 'h3'> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
};

export function HeaderBlock({ props }: { props: HeaderProps }) {
  const Tag = TAG[props.level];
  return <Tag className={`${styles.header} ${LEVEL_CLASS[props.level]}`}>{props.text}</Tag>;
}
