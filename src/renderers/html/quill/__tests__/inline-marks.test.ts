import { describe, expect, it } from 'vitest';
import { renderDelta } from './test-helpers';

describe('QuillHtmlRenderer integration: inline marks', () => {
  it('should render bold', () => {
    const html = renderDelta({
      ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><strong>bold</strong></p>');
  });

  it('should render italic', () => {
    const html = renderDelta({
      ops: [{ insert: 'italic', attributes: { italic: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><em>italic</em></p>');
  });

  it('should render underline', () => {
    const html = renderDelta({
      ops: [{ insert: 'underline', attributes: { underline: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><u>underline</u></p>');
  });

  it('should render strikethrough', () => {
    const html = renderDelta({
      ops: [{ insert: 'strike', attributes: { strike: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><s>strike</s></p>');
  });

  it('should render inline code', () => {
    const html = renderDelta({
      ops: [{ insert: 'code', attributes: { code: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><code>code</code></p>');
  });

  it('should render subscript', () => {
    const html = renderDelta({
      ops: [{ insert: 'sub', attributes: { script: 'sub' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><sub>sub</sub></p>');
  });

  it('should render superscript', () => {
    const html = renderDelta({
      ops: [{ insert: 'sup', attributes: { script: 'super' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><sup>sup</sup></p>');
  });

  it('should render link with target="_blank" and rel="noopener noreferrer"', () => {
    const html = renderDelta({
      ops: [{ insert: 'click', attributes: { link: 'https://example.com' } }, { insert: '\n' }],
    });
    expect(html).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">click</a></p>',
    );
  });

  it('should HTML-encode link href', () => {
    const html = renderDelta({
      ops: [{ insert: 'link', attributes: { link: 'http://a.com/?x=a&b=()' } }, { insert: '\n' }],
    });
    expect(html).toContain('href="http://a.com/?x=a&amp;b=()"');
  });

  it('should render color as inline style', () => {
    const html = renderDelta({
      ops: [{ insert: 'red', attributes: { color: '#e60000' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span style="color: #e60000">red</span></p>');
  });

  it('should render background-color as inline style', () => {
    const html = renderDelta({
      ops: [{ insert: 'highlight', attributes: { background: '#ffebcc' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span style="background-color: #ffebcc">highlight</span></p>');
  });

  it('should render font as ql-font class', () => {
    const html = renderDelta({
      ops: [{ insert: 'mono', attributes: { font: 'monospace' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span class="ql-font-monospace">mono</span></p>');
  });

  it('should render size as ql-size class', () => {
    const html = renderDelta({
      ops: [{ insert: 'big', attributes: { size: 'large' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span class="ql-size-large">big</span></p>');
  });

  it('should render combined bold + italic (bold wraps outer like Quill)', () => {
    const html = renderDelta({
      ops: [{ insert: 'both', attributes: { bold: true, italic: true } }, { insert: '\n' }],
    });
    expect(html).toContain('<strong><em>both</em></strong>');
  });

  it('should render combined strikethrough + underline (strike wraps outer like Quill)', () => {
    const html = renderDelta({
      ops: [{ insert: 'combo', attributes: { strike: true, underline: true } }, { insert: '\n' }],
    });
    expect(html).toContain('<s><u>combo</u></s>');
  });

  it('should render bold + code combo', () => {
    const html = renderDelta({
      ops: [{ insert: 'code', attributes: { bold: true, code: true } }, { insert: '\n' }],
    });
    expect(html).toContain('<strong><code>code</code></strong>');
  });
});
