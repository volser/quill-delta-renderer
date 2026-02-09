import { describe, expect, it } from 'vitest';
import { renderDelta } from './test-helpers';

describe('SemanticHtmlRenderer integration: inline marks', () => {
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
      ops: [{ insert: 'u', attributes: { underline: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><u>u</u></p>');
  });

  it('should render strikethrough', () => {
    const html = renderDelta({
      ops: [{ insert: 's', attributes: { strike: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><s>s</s></p>');
  });

  it('should render link with target="_blank" by default', () => {
    const html = renderDelta({
      ops: [{ insert: 'click', attributes: { link: 'https://example.com' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><a href="https://example.com" target="_blank">click</a></p>');
  });

  it('should escape & in link href', () => {
    const html = renderDelta({
      ops: [{ insert: 'link', attributes: { link: 'http://a.com/?x=a&b=()' } }, { insert: '\n' }],
    });
    expect(html).toContain('href="http://a.com/?x=a&amp;b=()');
  });

  it('should render color as inline style', () => {
    const html = renderDelta({
      ops: [{ insert: 'red', attributes: { color: '#e60000' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span style="color:#e60000">red</span></p>');
  });

  it('should render background as inline style', () => {
    const html = renderDelta({
      ops: [{ insert: 'high', attributes: { background: '#ffebcc' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span style="background-color:#ffebcc">high</span></p>');
  });

  it('should render subscript and superscript', () => {
    const html = renderDelta({
      ops: [
        { insert: 'H' },
        { insert: '2', attributes: { script: 'sub' } },
        { insert: 'O' },
        { insert: '2', attributes: { script: 'super' } },
        { insert: '\n' },
      ],
    });
    expect(html).toContain('<sub>2</sub>');
    expect(html).toContain('<sup>2</sup>');
  });

  it('should render inline code', () => {
    const html = renderDelta({
      ops: [{ insert: 'var x', attributes: { code: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><code>var x</code></p>');
  });

  it('should render font class', () => {
    const html = renderDelta({
      ops: [{ insert: 'mono', attributes: { font: 'monospace' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span class="ql-font-monospace">mono</span></p>');
  });

  it('should render size class', () => {
    const html = renderDelta({
      ops: [{ insert: 'big', attributes: { size: 'large' } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><span class="ql-size-large">big</span></p>');
  });

  it('should render combined bold+italic', () => {
    const html = renderDelta({
      ops: [{ insert: 'data', attributes: { italic: true, bold: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><strong><em>data</em></strong></p>');
  });

  it('should render combined strikethrough+underline', () => {
    const html = renderDelta({
      ops: [{ insert: 'that', attributes: { underline: true, strike: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><s><u>that</u></s></p>');
  });

  it('should render combined bold+code', () => {
    const html = renderDelta({
      ops: [{ insert: 'some code', attributes: { code: true, bold: true } }, { insert: '\n' }],
    });
    expect(html).toBe('<p><strong><code>some code</code></strong></p>');
  });

  it('should render combined link+italic+code', () => {
    const html = renderDelta({
      ops: [
        { insert: 'Top', attributes: { italic: true, link: '#top', code: true } },
        { insert: '\n' },
      ],
    });
    expect(html).toBe('<p><a href="#top" target="_blank"><em><code>Top</code></em></a></p>');
  });
});
