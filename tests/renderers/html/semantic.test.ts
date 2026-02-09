import { describe, expect, it } from 'vitest';
import type { Delta } from '../../../src/core/ast-types';
import { DeltaParser } from '../../../src/core/parser';
import { SemanticHtmlRenderer } from '../../../src/renderers/html/semantic';

function renderDelta(delta: Delta): string {
  const ast = new DeltaParser(delta).toAST();
  const renderer = new SemanticHtmlRenderer();
  return renderer.render(ast);
}

describe('SemanticHtmlRenderer', () => {
  describe('basic blocks', () => {
    it('should render a paragraph', () => {
      const html = renderDelta({
        ops: [{ insert: 'Hello world\n' }],
      });

      expect(html).toBe('<p>Hello world</p>');
    });

    it('should render a header', () => {
      const html = renderDelta({
        ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
      });

      expect(html).toBe('<h1>Title</h1>');
    });

    it('should render h2 through h6', () => {
      for (let level = 2; level <= 6; level++) {
        const html = renderDelta({
          ops: [{ insert: `Heading ${level}` }, { insert: '\n', attributes: { header: level } }],
        });

        expect(html).toBe(`<h${level}>Heading ${level}</h${level}>`);
      }
    });

    it('should render a blockquote', () => {
      const html = renderDelta({
        ops: [{ insert: 'A wise quote' }, { insert: '\n', attributes: { blockquote: true } }],
      });

      expect(html).toBe('<blockquote>A wise quote</blockquote>');
    });

    it('should render a code block', () => {
      const html = renderDelta({
        ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
      });

      expect(html).toBe('<pre><code>const x = 1;</code></pre>');
    });
  });

  describe('inline formatting (marks)', () => {
    it('should render bold text', () => {
      const html = renderDelta({
        ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }],
      });

      expect(html).toBe('<p><strong>bold</strong></p>');
    });

    it('should render italic text', () => {
      const html = renderDelta({
        ops: [{ insert: 'italic', attributes: { italic: true } }, { insert: '\n' }],
      });

      expect(html).toBe('<p><em>italic</em></p>');
    });

    it('should render a link', () => {
      const html = renderDelta({
        ops: [
          {
            insert: 'click me',
            attributes: { link: 'https://example.com' },
          },
          { insert: '\n' },
        ],
      });

      expect(html).toBe('<p><a href="https://example.com">click me</a></p>');
    });

    it('should render colored text', () => {
      const html = renderDelta({
        ops: [{ insert: 'red text', attributes: { color: '#ff0000' } }, { insert: '\n' }],
      });

      expect(html).toBe('<p><span style="color: #ff0000">red text</span></p>');
    });

    it('should nest marks according to priority (link outermost)', () => {
      const html = renderDelta({
        ops: [
          {
            insert: 'styled link',
            attributes: { bold: true, link: 'https://example.com' },
          },
          { insert: '\n' },
        ],
      });

      // link (priority 100) should wrap bold (priority 10)
      expect(html).toBe('<p><a href="https://example.com"><strong>styled link</strong></a></p>');
    });
  });

  describe('mixed content', () => {
    it('should render paragraph with mixed inline formatting', () => {
      const html = renderDelta({
        ops: [
          { insert: 'Hello ' },
          { insert: 'bold', attributes: { bold: true } },
          { insert: ' world' },
          { insert: '\n' },
        ],
      });

      expect(html).toBe('<p>Hello <strong>bold</strong> world</p>');
    });

    it('should render multiple blocks of different types', () => {
      const html = renderDelta({
        ops: [
          { insert: 'Title' },
          { insert: '\n', attributes: { header: 1 } },
          { insert: 'A paragraph' },
          { insert: '\n' },
        ],
      });

      expect(html).toBe('<h1>Title</h1><p>A paragraph</p>');
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML entities in text', () => {
      const html = renderDelta({
        ops: [{ insert: '<script>alert("xss")</script>\n' }],
      });

      expect(html).toBe('<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>');
    });
  });

  describe('extendBlock / extendMark', () => {
    it('should allow overriding block handlers at runtime', () => {
      const delta: Delta = {
        ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
      };

      const ast = new DeltaParser(delta).toAST();
      const renderer = new SemanticHtmlRenderer();

      renderer.extendBlock('header', (node, children) => {
        const level = node.attributes.header as number;
        return `<h${level} class="custom">${children}</h${level}>`;
      });

      const html = renderer.render(ast);

      expect(html).toBe('<h1 class="custom">Title</h1>');
    });

    it('should allow overriding mark handlers at runtime', () => {
      const delta: Delta = {
        ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }],
      };

      const ast = new DeltaParser(delta).toAST();
      const renderer = new SemanticHtmlRenderer();

      renderer.extendMark('bold', (content) => `<b>${content}</b>`);

      const html = renderer.render(ast);

      expect(html).toBe('<p><b>bold</b></p>');
    });
  });
});
