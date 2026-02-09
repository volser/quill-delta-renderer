import { describe, expect, it } from 'vitest';
import type { TNode } from '../../../../core/ast-types';
import { renderDelta } from './test-helpers';

describe('SemanticHtmlRenderer integration: config', () => {
  describe('paragraphTag', () => {
    it('should use custom paragraph tag', () => {
      expect(renderDelta({ ops: [{ insert: 'Hello\n' }] }, { paragraphTag: 'div' })).toBe(
        '<div>Hello</div>',
      );
    });

    it('should use custom paragraph tag for empty blocks', () => {
      expect(renderDelta({ ops: [{ insert: '\n' }] }, { paragraphTag: 'div' })).toBe(
        '<div><br/></div>',
      );
    });
  });

  describe('classPrefix', () => {
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

  describe('linkTarget', () => {
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

  describe('linkRel', () => {
    it('should add rel attribute to links', () => {
      const html = renderDelta(
        { ops: [{ insert: 'link', attributes: { link: '#' } }, { insert: '\n' }] },
        { linkRel: 'nofollow' },
      );
      expect(html).toContain('rel="nofollow"');
    });
  });

  describe('list tags', () => {
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

  describe('encodeHtml', () => {
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

  describe('allowBackgroundClasses', () => {
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

  describe('inlineStyles', () => {
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

  describe('urlSanitizer', () => {
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
        {
          ops: [{ insert: 'link', attributes: { link: 'http://example.com' } }, { insert: '\n' }],
        },
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

  describe('customCssClasses', () => {
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

  describe('customCssStyles', () => {
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

  describe('customTagAttributes', () => {
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

  describe('customTag', () => {
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
});
