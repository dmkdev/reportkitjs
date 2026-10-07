import type { ReactNode } from 'react';
import type { TextProps } from '../../core/types';
import styles from '../styles/blocks.module.css';

/**
 * Minimal markdown subset: **bold**, *italic*, `code`, [text](url).
 * Returns React nodes; no HTML is injected.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Order matters: code first (no nesting inside), then bold, italic, links.
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (match[1]) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (match[2]) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (match[4]) {
      const m = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(token);
      if (m) {
        nodes.push(
          <a key={key} href={m[2]} target="_blank" rel="noreferrer noopener">
            {m[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

/**
 * Render text with a minimal markdown subset (bold, italic, code, links).
 * Newlines are preserved via CSS `white-space: pre-wrap`.
 */
export function renderMarkdown(content: string): ReactNode {
  return <>{renderInline(content, 'md')}</>;
}

export function TextBlock({ props }: { props: TextProps }) {
  return (
    <p className={styles.text}>{props.markdown ? renderMarkdown(props.content) : props.content}</p>
  );
}
