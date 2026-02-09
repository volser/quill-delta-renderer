import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_BLOCK_ATTRIBUTES } from '../../../common/default-block-attributes';
import { listGrouper } from '../../../common/transformers/list-grouper';
import { tableGrouper } from '../../../common/transformers/table-grouper';
import type { Delta, TNode } from '../../../core/ast-types';
import { DeltaParser } from '../../../core/parser';
import { SemanticHtmlRenderer } from './semantic-html-renderer';
import type { SemanticHtmlConfig } from './types/semantic-html-config';

const QUILL_CONFIG = { blockAttributes: DEFAULT_BLOCK_ATTRIBUTES };

function renderDelta(delta: Delta, config?: SemanticHtmlConfig): string {
  const ast = new DeltaParser(delta, QUILL_CONFIG).use(listGrouper).use(tableGrouper).toAST();
  const renderer = new SemanticHtmlRenderer(config);
  return renderer.render(ast);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEFAULT BEHAVIOR
// ─────────────────────────────────────────────────────────────────────────────

describe('SemanticHtmlRenderer', () => {
  describe('basic blocks', () => {
    it('should render a paragraph', () => {
      const html = renderDelta({ ops: [{ insert: 'Hello world\n' }] });
      expect(html).toBe('<p>Hello world</p>');
    });

    it('should render a header', () => {
      const html = renderDelta({
        ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
      });
      expect(html).toBe('<h1>Title</h1>');
    });

    it('should render header levels 1-6', () => {
      for (let level = 1; level <= 6; level++) {
        const html = renderDelta({
          ops: [{ insert: 'H' }, { insert: '\n', attributes: { header: level } }],
        });
        expect(html).toBe(`<h${level}>H</h${level}>`);
      }
    });

    it('should render a blockquote', () => {
      const html = renderDelta({
        ops: [{ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }],
      });
      expect(html).toBe('<blockquote>A quote</blockquote>');
    });

    it('should render a code block', () => {
      const html = renderDelta({
        ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
      });
      expect(html).toContain('<pre');
      expect(html).toContain('class="ql-syntax"');
      expect(html).toContain('const x = 1;');
    });

    it('should render a code block with data-language', () => {
      const html = renderDelta({
        ops: [
          { insert: 'const x = 1;' },
          { insert: '\n', attributes: { 'code-block': 'javascript' } },
        ],
      });
      expect(html).toContain('data-language="javascript"');
      expect(html).toContain('language-javascript');
    });

    it('should render empty blocks with <br/>', () => {
      const html = renderDelta({ ops: [{ insert: '\n' }] });
      expect(html).toBe('<p><br/></p>');
    });

    it('should render empty header with <br/>', () => {
      const html = renderDelta({
        ops: [{ insert: '\n', attributes: { header: 1 } }],
      });
      expect(html).toBe('<h1><br/></h1>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. DEFAULT CLASSES (ql-*)
  // ───────────────────────────────────────────────────────────────────────────

  describe('default ql-* classes', () => {
    it('should add ql-indent class', () => {
      const html = renderDelta({
        ops: [{ insert: 'indented' }, { insert: '\n', attributes: { indent: 2 } }],
      });
      expect(html).toBe('<p class="ql-indent-2">indented</p>');
    });

    it('should add ql-align class', () => {
      const html = renderDelta({
        ops: [{ insert: 'centered' }, { insert: '\n', attributes: { align: 'center' } }],
      });
      expect(html).toBe('<p class="ql-align-center">centered</p>');
    });

    it('should add ql-direction class', () => {
      const html = renderDelta({
        ops: [{ insert: 'rtl' }, { insert: '\n', attributes: { direction: 'rtl' } }],
      });
      expect(html).toBe('<p class="ql-direction-rtl">rtl</p>');
    });

    it('should combine multiple classes', () => {
      const html = renderDelta({
        ops: [{ insert: 'text' }, { insert: '\n', attributes: { indent: 1, align: 'right' } }],
      });
      expect(html).toBe('<p class="ql-indent-1 ql-align-right">text</p>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. INLINE MARKS
  // ───────────────────────────────────────────────────────────────────────────

  describe('inline marks', () => {
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

  // ───────────────────────────────────────────────────────────────────────────
  // 4. EMBEDS
  // ───────────────────────────────────────────────────────────────────────────

  describe('embeds', () => {
    it('should render an image', () => {
      const html = renderDelta({
        ops: [{ insert: { image: 'https://example.com/img.png' } }, { insert: '\n' }],
      });
      expect(html).toContain('src="https://example.com/img.png"');
    });

    it('should render an image with width', () => {
      const html = renderDelta({
        ops: [
          { insert: { image: 'https://example.com/img.png' }, attributes: { width: '200' } },
          { insert: '\n' },
        ],
      });
      expect(html).toContain('width="200"');
    });

    it('should render an image wrapped in a link', () => {
      const html = renderDelta({
        ops: [
          {
            insert: { image: 'https://example.com/img.png' },
            attributes: { link: 'https://example.com' },
          },
          { insert: '\n' },
        ],
      });
      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain('<img');
      expect(html).toContain('</a>');
    });

    it('should render a video as iframe', () => {
      const html = renderDelta({
        ops: [{ insert: { video: 'https://youtube.com/watch?v=123' } }, { insert: '\n' }],
      });
      expect(html).toContain('<iframe');
      expect(html).toContain('class="ql-video"');
      expect(html).toContain('frameborder="0"');
      expect(html).toContain('allowfullscreen="true"');
    });

    it('should render a formula', () => {
      const html = renderDelta({
        ops: [{ insert: { formula: 'x=data' } }, { insert: '\n' }],
      });
      expect(html).toContain('<span class="ql-formula">x=data</span>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. LISTS
  // ───────────────────────────────────────────────────────────────────────────

  describe('lists', () => {
    it('should render a bullet list', () => {
      const html = renderDelta({
        ops: [
          { insert: 'Item 1' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Item 2' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ],
      });
      expect(html).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    it('should render an ordered list', () => {
      const html = renderDelta({
        ops: [
          { insert: 'First' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'Second' },
          { insert: '\n', attributes: { list: 'ordered' } },
        ],
      });
      expect(html).toBe('<ol><li>First</li><li>Second</li></ol>');
    });

    it('should render checked items with data-checked="true"', () => {
      const html = renderDelta({
        ops: [{ insert: 'Done' }, { insert: '\n', attributes: { list: 'checked' } }],
      });
      expect(html).toContain('data-checked="true"');
    });

    it('should render unchecked items with data-checked="false"', () => {
      const html = renderDelta({
        ops: [{ insert: 'Not done' }, { insert: '\n', attributes: { list: 'unchecked' } }],
      });
      expect(html).toContain('data-checked="false"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. TABLES
  // ───────────────────────────────────────────────────────────────────────────

  describe('tables', () => {
    it('should render a table with data-row', () => {
      const html = renderDelta({
        ops: [{ insert: 'A' }, { insert: '\n', attributes: { table: 'row-1' } }],
      });
      expect(html).toContain('<table><tbody>');
      expect(html).toContain('data-row="row-1"');
      expect(html).toContain('>A</td>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. MENTIONS
  // ───────────────────────────────────────────────────────────────────────────

  describe('mentions', () => {
    it('should render a mention as a link', () => {
      const html = renderDelta({
        ops: [
          {
            insert: { mention: { name: 'John', slug: 'john', 'end-point': '/users' } },
            attributes: {
              mention: { name: 'John', slug: 'john', 'end-point': '/users' },
            },
          },
          { insert: '\n' },
        ],
      });
      expect(html).toContain('href="/users/john"');
      expect(html).toContain('John');
    });

    it('should render mention with class', () => {
      const html = renderDelta({
        ops: [
          {
            insert: {
              mention: { name: 'J', slug: 'j', class: 'mention-link', 'end-point': '/u' },
            },
            attributes: {
              mention: { name: 'J', slug: 'j', class: 'mention-link', 'end-point': '/u' },
            },
          },
          { insert: '\n' },
        ],
      });
      expect(html).toContain('class="mention-link"');
    });

    it('should render mention with about:blank when no endpoint/slug', () => {
      const html = renderDelta({
        ops: [
          {
            insert: { mention: { name: 'John' } },
            attributes: { mention: { name: 'John' } },
          },
          { insert: '\n' },
        ],
      });
      expect(html).toContain('href="about:blank"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. NEWLINE / <br/> HANDLING
  // ───────────────────────────────────────────────────────────────────────────

  describe('newline / br handling', () => {
    it('should render newlines as separate paragraphs', () => {
      const html = renderDelta({ ops: [{ insert: 'line1\nline2\n' }] });
      expect(html).toBe('<p>line1</p><p>line2</p>');
    });

    it('should render multiple blank lines', () => {
      const html = renderDelta({ ops: [{ insert: '\n\n' }] });
      expect(html).toBe('<p><br/></p><p><br/></p>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. CONFIG: paragraphTag
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: paragraphTag', () => {
    it('should use custom paragraph tag', () => {
      const html = renderDelta({ ops: [{ insert: 'Hello\n' }] }, { paragraphTag: 'div' });
      expect(html).toBe('<div>Hello</div>');
    });

    it('should use custom paragraph tag for empty blocks', () => {
      const html = renderDelta({ ops: [{ insert: '\n' }] }, { paragraphTag: 'div' });
      expect(html).toBe('<div><br/></div>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10. CONFIG: classPrefix
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: classPrefix', () => {
    it('should use custom class prefix for indent', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { indent: 1 } }] },
        { classPrefix: 'noz' },
      );
      expect(html).toBe('<p class="noz-indent-1">text</p>');
    });

    it('should use custom class prefix for align', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { align: 'center' } }] },
        { classPrefix: 'noz' },
      );
      expect(html).toBe('<p class="noz-align-center">text</p>');
    });

    it('should use custom class prefix for direction', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { direction: 'rtl' } }] },
        { classPrefix: 'noz' },
      );
      expect(html).toBe('<p class="noz-direction-rtl">text</p>');
    });

    it('should use custom class prefix for font', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text', attributes: { font: 'serif' } }, { insert: '\n' }] },
        { classPrefix: 'noz' },
      );
      expect(html).toBe('<p><span class="noz-font-serif">text</span></p>');
    });

    it('should use custom class prefix for size', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text', attributes: { size: 'large' } }, { insert: '\n' }] },
        { classPrefix: 'noz' },
      );
      expect(html).toBe('<p><span class="noz-size-large">text</span></p>');
    });

    it('should use custom class prefix for video', () => {
      const html = renderDelta(
        { ops: [{ insert: { video: 'https://example.com/v.mp4' } }, { insert: '\n' }] },
        { classPrefix: 'noz' },
      );
      expect(html).toContain('class="noz-video"');
    });

    it('should use custom class prefix for formula', () => {
      const html = renderDelta(
        { ops: [{ insert: { formula: 'x=1' } }, { insert: '\n' }] },
        { classPrefix: 'noz' },
      );
      expect(html).toContain('class="noz-formula"');
    });

    it('should use custom class prefix for code-block', () => {
      const html = renderDelta(
        { ops: [{ insert: 'code' }, { insert: '\n', attributes: { 'code-block': true } }] },
        { classPrefix: 'noz' },
      );
      expect(html).toContain('class="noz-syntax"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11. CONFIG: linkTarget / linkRel
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: linkTarget', () => {
    it('should use custom link target', () => {
      const html = renderDelta(
        { ops: [{ insert: 'link', attributes: { link: '#' } }, { insert: '\n' }] },
        { linkTarget: '_self' },
      );
      expect(html).toContain('target="_self"');
    });

    it('should omit target when set to empty string', () => {
      const html = renderDelta(
        { ops: [{ insert: 'link', attributes: { link: '#' } }, { insert: '\n' }] },
        { linkTarget: '' },
      );
      expect(html).not.toContain('target=');
    });
  });

  describe('config: linkRel', () => {
    it('should add rel attribute to links', () => {
      const html = renderDelta(
        { ops: [{ insert: 'link', attributes: { link: '#' } }, { insert: '\n' }] },
        { linkRel: 'nofollow' },
      );
      expect(html).toContain('rel="nofollow"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 12. CONFIG: list tags
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: list tags', () => {
    it('should use custom orderedListTag', () => {
      const html = renderDelta(
        { ops: [{ insert: 'item' }, { insert: '\n', attributes: { list: 'ordered' } }] },
        { orderedListTag: 'OL' },
      );
      expect(html).toContain('<OL>');
      expect(html).toContain('</OL>');
    });

    it('should use custom bulletListTag', () => {
      const html = renderDelta(
        { ops: [{ insert: 'item' }, { insert: '\n', attributes: { list: 'bullet' } }] },
        { bulletListTag: 'UL' },
      );
      expect(html).toContain('<UL>');
      expect(html).toContain('</UL>');
    });

    it('should use custom listItemTag', () => {
      const html = renderDelta(
        { ops: [{ insert: 'item' }, { insert: '\n', attributes: { list: 'bullet' } }] },
        { listItemTag: 'LI' },
      );
      expect(html).toContain('<LI>');
      expect(html).toContain('</LI>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 13. CONFIG: encodeHtml
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: encodeHtml', () => {
    it('should encode HTML by default', () => {
      const html = renderDelta({ ops: [{ insert: '<script>alert("xss")</script>\n' }] });
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should not encode HTML when encodeHtml is false', () => {
      const html = renderDelta({ ops: [{ insert: '<b>bold</b>\n' }] }, { encodeHtml: false });
      expect(html).toContain('<b>bold</b>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 14. CONFIG: allowBackgroundClasses
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: allowBackgroundClasses', () => {
    it('should render background as class when enabled', () => {
      const html = renderDelta(
        { ops: [{ insert: 'bg', attributes: { background: 'red' } }, { insert: '\n' }] },
        { allowBackgroundClasses: true },
      );
      expect(html).toContain('class="ql-background-red"');
      expect(html).not.toContain('style=');
    });

    it('should render background as inline style when disabled (default)', () => {
      const html = renderDelta({
        ops: [{ insert: 'bg', attributes: { background: '#ff0' } }, { insert: '\n' }],
      });
      expect(html).toContain('style="background-color:#ff0"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 15. CONFIG: inlineStyles
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: inlineStyles', () => {
    it('should render font as inline style when inlineStyles is true', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text', attributes: { font: 'monospace' } }, { insert: '\n' }] },
        { inlineStyles: true },
      );
      expect(html).toContain('style="font-family: Monaco, Courier New, monospace"');
      expect(html).not.toContain('class=');
    });

    it('should render size as inline style when inlineStyles is true', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text', attributes: { size: 'huge' } }, { insert: '\n' }] },
        { inlineStyles: true },
      );
      expect(html).toContain('style="font-size: 2.5em"');
    });

    it('should render indent as inline style when inlineStyles is true', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { indent: 2 } }] },
        { inlineStyles: true },
      );
      expect(html).toContain('style="padding-left: 6em"');
      expect(html).not.toContain('ql-indent');
    });

    it('should render align as inline style when inlineStyles is true', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { align: 'center' } }] },
        { inlineStyles: true },
      );
      expect(html).toContain('style="text-align: center"');
      expect(html).not.toContain('ql-align');
    });

    it('should render direction as inline style when inlineStyles is true', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { direction: 'rtl' } }] },
        { inlineStyles: true },
      );
      expect(html).toContain('direction: rtl');
    });

    it('should support custom inline style overrides (object)', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text', attributes: { size: 'custom' } }, { insert: '\n' }] },
        { inlineStyles: { size: { custom: 'font-size: 99px' } } },
      );
      expect(html).toContain('style="font-size: 99px"');
    });

    it('should support function-based inline style overrides', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text', attributes: { size: '18px' } }, { insert: '\n' }] },
        { inlineStyles: { size: (value: string) => `font-size: ${value}` } },
      );
      expect(html).toContain('style="font-size: 18px"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 16. CONFIG: urlSanitizer
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: urlSanitizer', () => {
    it('should use urlSanitizer on link href', () => {
      const html = renderDelta(
        {
          ops: [{ insert: 'link', attributes: { link: 'javascript:alert(1)' } }, { insert: '\n' }],
        },
        { urlSanitizer: (url: string) => (url.startsWith('http') ? url : undefined) },
      );
      expect(html).not.toContain('javascript:');
    });

    it('should use urlSanitizer to modify URLs', () => {
      const html = renderDelta(
        { ops: [{ insert: 'link', attributes: { link: 'http://example.com' } }, { insert: '\n' }] },
        { urlSanitizer: (url: string) => `${url}?sanitized=1` },
      );
      expect(html).toContain('http://example.com?sanitized=1');
    });

    it('should use urlSanitizer on image src', () => {
      const html = renderDelta(
        { ops: [{ insert: { image: 'http://example.com/img.png' } }, { insert: '\n' }] },
        { urlSanitizer: (url: string) => `${url}?w=100` },
      );
      expect(html).toContain('http://example.com/img.png?w=100');
    });

    it('should use urlSanitizer on video src', () => {
      const html = renderDelta(
        { ops: [{ insert: { video: 'http://example.com/v.mp4' } }, { insert: '\n' }] },
        { urlSanitizer: (url: string) => `${url}?q=720` },
      );
      expect(html).toContain('http://example.com/v.mp4?q=720');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 17. CONFIG: customCssClasses / customCssStyles / customTagAttributes / customTag
  // ───────────────────────────────────────────────────────────────────────────

  describe('config: customCssClasses', () => {
    it('should add custom CSS classes to nodes', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { header: 1 } }] },
        {
          customCssClasses: (node: TNode) => (node.type === 'header' ? 'custom-header' : undefined),
        },
      );
      expect(html).toContain('class="custom-header"');
    });

    it('should add multiple custom CSS classes', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { blockquote: true } }] },
        {
          customCssClasses: (node: TNode) =>
            node.type === 'blockquote' ? ['cls-a', 'cls-b'] : undefined,
        },
      );
      expect(html).toContain('cls-a');
      expect(html).toContain('cls-b');
    });
  });

  describe('config: customCssStyles', () => {
    it('should add custom CSS styles to nodes', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { header: 1 } }] },
        {
          customCssStyles: (node: TNode) => (node.type === 'header' ? 'color: red' : undefined),
        },
      );
      expect(html).toContain('style="color: red"');
    });
  });

  describe('config: customTagAttributes', () => {
    it('should add custom HTML attributes to nodes', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { header: 1 } }] },
        {
          customTagAttributes: (node: TNode) =>
            node.type === 'header' ? { 'data-id': 'h1-title' } : undefined,
        },
      );
      expect(html).toContain('data-id="h1-title"');
    });
  });

  describe('config: customTag', () => {
    it('should use custom tag for a format', () => {
      const html = renderDelta(
        { ops: [{ insert: 'text' }, { insert: '\n', attributes: { header: 1 } }] },
        {
          customTag: (format: string) => (format === 'header' ? 'div' : undefined),
        },
      );
      expect(html).toContain('<div');
      expect(html).toContain('</div>');
      expect(html).not.toContain('<h1');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 18. HOOKS: beforeRender / afterRender / renderCustomWith
  // ───────────────────────────────────────────────────────────────────────────

  describe('hooks: beforeRender', () => {
    it('should call beforeRender with groupType and node', () => {
      const renderer = new SemanticHtmlRenderer();
      const beforeCb = vi.fn().mockReturnValue(null);
      renderer.beforeRender(beforeCb);

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      renderer.render(ast);
      expect(beforeCb).toHaveBeenCalled();
    });

    it('should replace output when beforeRender returns a string', () => {
      const renderer = new SemanticHtmlRenderer();
      renderer.beforeRender(() => '<custom>replaced</custom>');

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      expect(renderer.render(ast)).toContain('<custom>replaced</custom>');
    });
  });

  describe('hooks: afterRender', () => {
    it('should call afterRender with groupType and html', () => {
      const renderer = new SemanticHtmlRenderer();
      const afterCb = vi.fn().mockImplementation((_type: string, html: string) => html);
      renderer.afterRender(afterCb);

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      renderer.render(ast);
      expect(afterCb).toHaveBeenCalled();
    });

    it('should allow afterRender to modify output', () => {
      const renderer = new SemanticHtmlRenderer();
      renderer.afterRender((_type, html) => `<wrapper>${html}</wrapper>`);

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      expect(renderer.render(ast)).toContain('<wrapper>');
    });
  });

  describe('hooks: renderCustomWith', () => {
    it('should render custom embeds using the callback', () => {
      const renderer = new SemanticHtmlRenderer();
      renderer.renderCustomWith((node) => {
        if (node.type === 'myEmbed') {
          const data = node.data as Record<string, unknown>;
          return `<div class="my-embed">${data.value}</div>`;
        }
        return '';
      });

      const ast = new DeltaParser(
        { ops: [{ insert: { myEmbed: { value: 'custom content' } } }, { insert: '\n' }] },
        QUILL_CONFIG,
      ).toAST();

      expect(renderer.render(ast)).toContain('<div class="my-embed">custom content</div>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 19. EXTENSIBILITY (existing pattern)
  // ───────────────────────────────────────────────────────────────────────────

  describe('extensibility', () => {
    it('should allow overriding block handlers at runtime', () => {
      const renderer = new SemanticHtmlRenderer();
      renderer.extendBlock('paragraph', (_node, children) => `<div>${children}</div>`);

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      expect(renderer.render(ast)).toBe('<div>text</div>');
    });

    it('should allow overriding mark handlers at runtime', () => {
      const renderer = new SemanticHtmlRenderer();
      renderer.extendMark('bold', (content) => `<b>${content}</b>`);

      const ast = new DeltaParser(
        { ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }] },
        QUILL_CONFIG,
      ).toAST();

      expect(renderer.render(ast)).toBe('<p><b>bold</b></p>');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 20. INTEGRATION: delta1 from quill-delta-to-html
  // ───────────────────────────────────────────────────────────────────────────

  describe('integration: delta1 (quill-delta-to-html compat)', () => {
    it('should render delta1 with mixed inline formats', () => {
      const delta: Delta = {
        ops: [
          { insert: 'link', attributes: { link: 'http://a.com/?x=a&b=()' } },
          { insert: 'This ' },
          { attributes: { font: 'monospace' }, insert: 'is' },
          { insert: ' a ' },
          { attributes: { size: 'large' }, insert: 'test' },
          { insert: ' ' },
          { attributes: { italic: true, bold: true }, insert: 'data' },
          { insert: ' ' },
          { attributes: { underline: true, strike: true }, insert: 'that' },
          { insert: ' is ' },
          { attributes: { color: '#e60000' }, insert: 'will' },
          { insert: ' ' },
          { attributes: { background: '#ffebcc' }, insert: 'test' },
          { insert: ' ' },
          { attributes: { script: 'sub' }, insert: 'the' },
          { insert: ' ' },
          { attributes: { script: 'super' }, insert: 'rendering' },
          { insert: ' of ' },
          { attributes: { link: 'http://yahoo' }, insert: 'inline' },
          { insert: ' ' },
          { insert: { formula: 'x=data' } },
          { insert: ' formats.\n' },
          { insert: 'list' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'list' },
          { insert: '\n', attributes: { list: 'checked' } },
          { insert: 'some code', attributes: { code: true, bold: true } },
          { attributes: { italic: true, link: '#top', code: true }, insert: 'Top' },
          { insert: '\n' },
        ],
      };

      const html = renderDelta(delta);

      expect(html).toContain('<a href="http://a.com/?x=a&amp;b=()" target="_blank">link</a>');
      expect(html).toContain('<span class="ql-font-monospace">is</span>');
      expect(html).toContain('<span class="ql-size-large">test</span>');
      expect(html).toContain('<strong><em>data</em></strong>');
      expect(html).toContain('<s><u>that</u></s>');
      expect(html).toContain('style="color:#e60000"');
      expect(html).toContain('style="background-color:#ffebcc"');
      expect(html).toContain('<sub>the</sub>');
      expect(html).toContain('<sup>rendering</sup>');
      expect(html).toContain('<a href="http://yahoo" target="_blank">inline</a>');
      expect(html).toContain('<span class="ql-formula">x=data</span>');
      expect(html).toContain('<ul><li>list</li></ul>');
      expect(html).toContain('data-checked="true"');
      expect(html).toContain('<strong><code>some code</code></strong>');
      expect(html).toContain('<a href="#top" target="_blank"><em><code>Top</code></em></a>');
    });
  });
});
