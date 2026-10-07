import type { ReactNode } from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { SectionProps } from '../../core/types';
import { usePdfReportContext } from './context';

export interface PdfSectionBlockProps {
  props: SectionProps;
  /** Renders the nested blocks (provided by PdfBlockRenderer to avoid a circular import). */
  renderBlocks: (blocks: SectionProps['blocks']) => ReactNode;
}

/** Renders a section block: an optional title and nested blocks. */
export function PdfSectionBlock({ props, renderBlocks }: PdfSectionBlockProps) {
  const { styles } = usePdfReportContext();
  return (
    <View style={styles.section}>
      {props.title && <Text style={styles.sectionTitle}>{props.title}</Text>}
      <View style={styles.sectionBlocks}>{renderBlocks(props.blocks)}</View>
    </View>
  );
}
