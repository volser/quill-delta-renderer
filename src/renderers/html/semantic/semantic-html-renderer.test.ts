import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_BLOCK_ATTRIBUTES } from '../../../common/default-block-attributes';
import { DeltaParser } from '../../../core/parser';
import { SemanticHtmlRenderer } from './semantic-html-renderer';

const QUILL_CONFIG = { blockAttributes: DEFAULT_BLOCK_ATTRIBUTES };

describe('SemanticHtmlRenderer', () => {
  describe('hooks: beforeRender', () => {
    it('should call beforeRender with groupType and node', () => {
      const beforeCb = vi.fn().mockReturnValue(null);
      const renderer = new SemanticHtmlRenderer({ beforeRender: beforeCb });

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      renderer.render(ast);
      expect(beforeCb).toHaveBeenCalled();
    });

    it('should replace output when beforeRender returns a string', () => {
      const renderer = new SemanticHtmlRenderer({
        beforeRender: () => '<custom>replaced</custom>',
      });

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      expect(renderer.render(ast)).toContain('<custom>replaced</custom>');
    });
  });

  describe('hooks: afterRender', () => {
    it('should call afterRender with groupType and html', () => {
      const afterCb = vi.fn().mockImplementation((_type: string, html: string) => html);
      const renderer = new SemanticHtmlRenderer({ afterRender: afterCb });

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      renderer.render(ast);
      expect(afterCb).toHaveBeenCalled();
    });

    it('should allow afterRender to modify output', () => {
      const renderer = new SemanticHtmlRenderer({
        afterRender: (_type, html) => `<wrapper>${html}</wrapper>`,
      });

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      expect(renderer.render(ast)).toContain('<wrapper>');
    });
  });

  describe('hooks: customBlotRenderer', () => {
    it('should render custom embeds using the callback', () => {
      const renderer = new SemanticHtmlRenderer({
        customBlotRenderer: (node) => {
          if (node.type === 'myEmbed') {
            const data = node.data as Record<string, unknown>;
            return `<div class="my-embed">${data.value}</div>`;
          }
          return '';
        },
      });

      const ast = new DeltaParser(
        { ops: [{ insert: { myEmbed: { value: 'custom content' } } }, { insert: '\n' }] },
        QUILL_CONFIG,
      ).toAST();

      expect(renderer.render(ast)).toContain('<div class="my-embed">custom content</div>');
    });
  });

  describe('extensibility', () => {
    it('should allow overriding block handlers via withBlock()', () => {
      const renderer = new SemanticHtmlRenderer().withBlock(
        'paragraph',
        (_node, children) => `<div>${children}</div>`,
      );

      const ast = new DeltaParser({ ops: [{ insert: 'text\n' }] }, QUILL_CONFIG).toAST();
      expect(renderer.render(ast)).toBe('<div>text</div>');
    });

    it('should allow overriding mark handlers via withMark()', () => {
      const renderer = new SemanticHtmlRenderer().withMark(
        'bold',
        (content) => `<b>${content}</b>`,
      );

      const ast = new DeltaParser(
        { ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }] },
        QUILL_CONFIG,
      ).toAST();

      expect(renderer.render(ast)).toBe('<p><b>bold</b></p>');
    });
  });
});
