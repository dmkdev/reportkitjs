import { View } from '@react-pdf/renderer';
import type { DividerProps } from '../../core/types';
import { usePdfReportContext } from './context';

const BORDER_STYLE = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
} as const;

/** Renders a horizontal divider (solid, dashed or dotted). */
export function PdfDividerBlock({ props }: { props: DividerProps }) {
  const { styles } = usePdfReportContext();
  return <View style={[styles.divider, { borderTopStyle: BORDER_STYLE[props.style] }]} />;
}
