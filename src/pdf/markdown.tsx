import { Fragment } from 'react';
import { Link, Text } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';

/**
 * A parsed inline markdown segment. Mirrors the viewer's minimal markdown
 * subset: **bold**, *italic*, `code`, [text](url).
 */
export type MarkdownSegment =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

const INLINE_PATTERN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)\s]+\))/g;
const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/;

/**
 * Parse a string into inline markdown segments.
 * Order matters: code first (no nesting inside), then bold, italic, links.
 */
export function parseMarkdown(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(content)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', text: content.slice(last, match.index) });
    }
    const token = match[0];
    if (match[1]) {
      segments.push({ type: 'code', text: token.slice(1, -1) });
    } else if (match[2]) {
      segments.push({ type: 'bold', text: token.slice(2, -2) });
    } else if (match[3]) {
      segments.push({ type: 'italic', text: token.slice(1, -1) });
    } else if (match[4]) {
      const link = LINK_PATTERN.exec(token);
      if (link) {
        segments.push({ type: 'link', text: link[1], href: link[2] });
      }
    }
    last = match.index + token.length;
  }
  if (last < content.length) {
    segments.push({ type: 'text', text: content.slice(last) });
  }
  return segments;
}

export interface PdfTextProps {
  content: string;
  /** Enable the minimal markdown subset (default: true). */
  markdown?: boolean;
  style?: Style;
}

/**
 * A PDF text element supporting the same minimal markdown subset as the
 * viewer. Newlines are preserved via `white-space: pre-wrap`.
 */
export function PdfText({ content, markdown = true, style }: PdfTextProps) {
  if (!markdown) {
    return <Text style={style}>{content}</Text>;
  }
  const segments = parseMarkdown(content);
  return (
    <Text style={style}>
      {segments.map((segment, i) => {
        const key = `md-${i}`;
        switch (segment.type) {
          case 'text':
            return <Fragment key={key}>{segment.text}</Fragment>;
          case 'bold':
            return (
              <Text key={key} style={{ fontWeight: 700 }}>
                {segment.text}
              </Text>
            );
          case 'italic':
            return (
              <Text key={key} style={{ fontStyle: 'italic' }}>
                {segment.text}
              </Text>
            );
          case 'code':
            return (
              <Text key={key} style={{ fontFamily: 'Courier', fontSize: 8.5 }}>
                {segment.text}
              </Text>
            );
          case 'link':
            return (
              <Link key={key} href={segment.href}>
                {segment.text}
              </Link>
            );
        }
      })}
    </Text>
  );
}

/** Flatten parsed segments back into plain text (used for accessibility/tests). */
export function segmentsToText(segments: MarkdownSegment[]): string {
  return segments.map((s) => s.text).join('');
}
