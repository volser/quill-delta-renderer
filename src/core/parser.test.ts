import { describe, expect, it } from 'vitest';
import type { Delta, TNode } from './ast-types';
import { DeltaParser } from './parser';

describe('DeltaParser', () => {
  describe('basic text parsing', () => {
    it('should parse a single line of plain text into a paragraph', () => {
      const delta: Delta = {
        ops: [{ insert: 'Hello world\n' }],
      };

      const ast = new DeltaParser(delta).toAST();

      expect(ast.type).toBe('root');
      expect(ast.children).toHaveLength(1);
      expect(ast.children[0]!.type).toBe('paragraph');
      expect(ast.children[0]!.children).toHaveLength(1);
      expect(ast.children[0]!.children[0]!.type).toBe('text');
      expect(ast.children[0]!.children[0]!.data).toBe('Hello world');
    });

    it('should parse multiple paragraphs', () => {
      const delta: Delta = {
        ops: [{ insert: 'First\nSecond\n' }],
      };

      const ast = new DeltaParser(delta).toAST();

      expect(ast.children).toHaveLength(2);
      expect(ast.children[0]!.type).toBe('paragraph');
      expect(ast.children[0]!.children[0]!.data).toBe('First');
      expect(ast.children[1]!.type).toBe('paragraph');
      expect(ast.children[1]!.children[0]!.data).toBe('Second');
    });

    it('should flush trailing text without newline as a paragraph', () => {
      const delta: Delta = {
        ops: [{ insert: 'No trailing newline' }],
      };

      const ast = new DeltaParser(delta).toAST();

      expect(ast.children).toHaveLength(1);
      expect(ast.children[0]!.type).toBe('paragraph');
      expect(ast.children[0]!.children[0]!.data).toBe('No trailing newline');
    });
  });

  describe('inline formatting', () => {
    it('should parse bold text', () => {
      const delta: Delta = {
        ops: [
          { insert: 'Hello ', attributes: { bold: true } },
          { insert: 'world' },
          { insert: '\n' },
        ],
      };

      const ast = new DeltaParser(delta).toAST();
      const paragraph = ast.children[0]!;

      expect(paragraph.children).toHaveLength(2);
      expect(paragraph.children[0]!.attributes.bold).toBe(true);
      expect(paragraph.children[0]!.data).toBe('Hello ');
      expect(paragraph.children[1]!.data).toBe('world');
    });

    it('should parse multiple inline formats on the same text', () => {
      const delta: Delta = {
        ops: [
          {
            insert: 'styled',
            attributes: { bold: true, italic: true, color: '#ff0000' },
          },
          { insert: '\n' },
        ],
      };

      const ast = new DeltaParser(delta).toAST();
      const textNode = ast.children[0]!.children[0]!;

      expect(textNode.attributes.bold).toBe(true);
      expect(textNode.attributes.italic).toBe(true);
      expect(textNode.attributes.color).toBe('#ff0000');
    });
  });

  describe('block types', () => {
    it('should parse a header', () => {
      const delta: Delta = {
        ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
      };

      const ast = new DeltaParser(delta).toAST();

      expect(ast.children).toHaveLength(1);
      expect(ast.children[0]!.type).toBe('header');
      expect(ast.children[0]!.attributes.header).toBe(1);
      expect(ast.children[0]!.children[0]!.data).toBe('Title');
    });

    it('should parse a blockquote', () => {
      const delta: Delta = {
        ops: [{ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }],
      };

      const ast = new DeltaParser(delta).toAST();

      expect(ast.children[0]!.type).toBe('blockquote');
    });

    it('should parse a code block', () => {
      const delta: Delta = {
        ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
      };

      const ast = new DeltaParser(delta).toAST();

      expect(ast.children[0]!.type).toBe('code-block');
    });

    it('should parse list items', () => {
      const delta: Delta = {
        ops: [
          { insert: 'Item 1' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Item 2' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ],
      };

      const ast = new DeltaParser(delta).toAST();

      expect(ast.children).toHaveLength(2);
      expect(ast.children[0]!.type).toBe('list-item');
      expect(ast.children[0]!.attributes.list).toBe('bullet');
      expect(ast.children[1]!.type).toBe('list-item');
    });
  });

  describe('embeds', () => {
    it('should parse an image embed', () => {
      const delta: Delta = {
        ops: [{ insert: { image: 'https://example.com/photo.jpg' } }, { insert: '\n' }],
      };

      const ast = new DeltaParser(delta).toAST();
      const paragraph = ast.children[0]!;

      expect(paragraph.children).toHaveLength(1);
      expect(paragraph.children[0]!.type).toBe('image');
      expect(paragraph.children[0]!.data).toBe('https://example.com/photo.jpg');
    });
  });

  describe('transformer integration', () => {
    it('should apply a transformer via .use()', () => {
      const delta: Delta = {
        ops: [{ insert: 'Hello\n' }],
      };

      const uppercaseTransformer = (root: TNode): TNode => ({
        ...root,
        children: root.children.map((child) => ({
          ...child,
          children: child.children.map((textNode) => ({
            ...textNode,
            data: typeof textNode.data === 'string' ? textNode.data.toUpperCase() : textNode.data,
          })),
        })),
      });

      const ast = new DeltaParser(delta).use(uppercaseTransformer).toAST();

      expect(ast.children[0]!.children[0]!.data).toBe('HELLO');
    });

    it('should chain multiple transformers in order', () => {
      const delta: Delta = {
        ops: [{ insert: 'hello\n' }],
      };

      const calls: string[] = [];

      const t1 = (root: TNode): TNode => {
        calls.push('t1');
        return root;
      };
      const t2 = (root: TNode): TNode => {
        calls.push('t2');
        return root;
      };

      new DeltaParser(delta).use(t1).use(t2).toAST();

      expect(calls).toEqual(['t1', 't2']);
    });
  });
});
