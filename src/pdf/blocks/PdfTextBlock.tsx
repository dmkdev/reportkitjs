import type { TextProps } from '../../core/types';
import { PdfText } from '../markdown';
import { usePdfReportContext } from './context';

/**
 * Renders a text block. The minimal markdown subset is opt-in via
 * `props.markdown`, matching the viewer's behavior.
 */
export function PdfTextBlock({ props }: { props: TextProps }) {
  const { styles } = usePdfReportContext();
  return <PdfText content={props.content} markdown={props.markdown ?? false} style={styles.text} />;
}
