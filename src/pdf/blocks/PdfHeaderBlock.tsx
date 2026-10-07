import { Text } from '@react-pdf/renderer';
import type { HeaderProps } from '../../core/types';
import { usePdfReportContext } from './context';

const LEVEL_STYLE = {
  1: 'header1',
  2: 'header2',
  3: 'header3',
} as const;

/** Renders a heading block (levels 1–3). */
export function PdfHeaderBlock({ props }: { props: HeaderProps }) {
  const { styles } = usePdfReportContext();
  return <Text style={styles[LEVEL_STYLE[props.level]]}>{props.text}</Text>;
}
