import { describe, expect, it } from 'vitest';
import { parseMarkdown, segmentsToText } from '../../src/pdf/markdown';

describe('parseMarkdown', () => {
  it('returns a single text segment for plain content', () => {
    expect(parseMarkdown('hello world')).toEqual([{ type: 'text', text: 'hello world' }]);
  });

  it('returns an empty array for an empty string', () => {
    expect(parseMarkdown('')).toEqual([]);
  });

  it('parses bold', () => {
    expect(parseMarkdown('a **bold** b')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'bold', text: 'bold' },
      { type: 'text', text: ' b' },
    ]);
  });

  it('parses italic', () => {
    expect(parseMarkdown('a *italic* b')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'italic', text: 'italic' },
      { type: 'text', text: ' b' },
    ]);
  });

  it('parses inline code', () => {
    expect(parseMarkdown('run `npm test` now')).toEqual([
      { type: 'text', text: 'run ' },
      { type: 'code', text: 'npm test' },
      { type: 'text', text: ' now' },
    ]);
  });

  it('parses links with text and href', () => {
    expect(parseMarkdown('see [docs](https://example.com) here')).toEqual([
      { type: 'text', text: 'see ' },
      { type: 'link', text: 'docs', href: 'https://example.com' },
      { type: 'text', text: ' here' },
    ]);
  });

  it('parses multiple inline styles in order', () => {
    const segments = parseMarkdown('**bold** and *italic* and `code`');
    expect(segments).toEqual([
      { type: 'bold', text: 'bold' },
      { type: 'text', text: ' and ' },
      { type: 'italic', text: 'italic' },
      { type: 'text', text: ' and ' },
      { type: 'code', text: 'code' },
    ]);
  });

  it('treats bold markers as bold, not two italics', () => {
    const segments = parseMarkdown('**bold**');
    expect(segments).toEqual([{ type: 'bold', text: 'bold' }]);
  });

  it('does not match a lone asterisk', () => {
    expect(parseMarkdown('2 * 3 = 6')).toEqual([{ type: 'text', text: '2 * 3 = 6' }]);
  });

  it('segmentsToText flattens segments back to plain text', () => {
    const segments = parseMarkdown('a **bold** b [link](https://x.y)');
    expect(segmentsToText(segments)).toBe('a bold b link');
  });
});
