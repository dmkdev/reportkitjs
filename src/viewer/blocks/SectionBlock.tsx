import type { ReactNode } from 'react';
import type { SectionProps } from '../../core/types';
import styles from '../styles/blocks.module.css';

export interface SectionBlockProps {
  props: SectionProps;
  /** Renders the nested blocks (provided by BlockRenderer to avoid a circular import). */
  renderBlocks: (blocks: SectionProps['blocks']) => ReactNode;
}

export function SectionBlock({ props, renderBlocks }: SectionBlockProps) {
  return (
    <section className={styles.section}>
      {props.title && <h3 className={styles.sectionTitle}>{props.title}</h3>}
      <div className={styles.sectionBlocks}>{renderBlocks(props.blocks)}</div>
    </section>
  );
}
