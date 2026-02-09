import { describe, expect, it } from 'vitest';
import type { Delta, ParserConfig, Transformer } from './ast-types';
import { DeltaParser, parseDelta } from './parser';

/** Empty config — no block attributes, tests pure generic parsing. */
const EMPTY_CONFIG: ParserConfig = { blockAttributes: {} };

describe('parseDelta input validation', () => {
  it('should throw TypeError for null delta', () => {
    expect(() => parseDelta(null as unknown as Delta, EMPTY_CONFIG)).toThrow(TypeError);
    expect(() => parseDelta(null as unknown as Delta, EMPTY_CONFIG)).toThrow(
      'parseDelta: expected a Delta object with an ops array, received null',
    );
  });

  it('should throw TypeError for undefined delta', () => {
    expect(() => parseDelta(undefined as unknown as Delta, EMPTY_CONFIG)).toThrow(TypeError);
    expect(() => parseDelta(undefined as unknown as Delta, EMPTY_CONFIG)).toThrow(
      'parseDelta: expected a Delta object with an ops array, received undefined',
    );
  });

  it('should throw TypeError when ops is not an array', () => {
    expect(() => parseDelta({ ops: 'not-an-array' } as unknown as Delta, EMPTY_CONFIG)).toThrow(
      TypeError,
    );
  });

  it('should throw TypeError for an empty object', () => {
    expect(() => parseDelta({} as unknown as Delta, EMPTY_CONFIG)).toThrow(TypeError);
  });

  it('should accept a valid delta with empty ops', () => {
    const ast = parseDelta({ ops: [] }, EMPTY_CONFIG);
    expect(ast.type).toBe('root');
    expect(ast.children).toHaveLength(0);
  });

  it('should throw TypeError for an empty embed object', () => {
    const delta: Delta = { ops: [{ insert: {} as Record<string, unknown> }] };
    expect(() => parseDelta(delta, EMPTY_CONFIG)).toThrow(TypeError);
    expect(() => parseDelta(delta, EMPTY_CONFIG)).toThrow(
      'parseEmbedOp: received an empty embed object with no type key',
    );
  });
});

describe('parseDelta (pure function)', () => {
  it('should produce the same result as DeltaParser for plain text', () => {
    const delta: Delta = { ops: [{ insert: 'Hello world\n' }] };

    const fromClass = new DeltaParser(delta, EMPTY_CONFIG).toAST();
    const fromFn = parseDelta(delta, EMPTY_CONFIG);

    expect(fromFn).toEqual(fromClass);
  });

  it('should parse block attributes via config', () => {
    const config: ParserConfig = {
      blockAttributes: {
        header: (value) => ({
          blockType: 'header',
          blockAttrs: { header: value },
        }),
      },
    };
    const delta: Delta = {
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
    };

    const ast = parseDelta(delta, config);

    expect(ast.children[0]!.type).toBe('header');
    expect(ast.children[0]!.attributes.header).toBe(1);
  });

  it('should handle block embeds', () => {
    const config: ParserConfig = {
      blockAttributes: {},
      blockEmbeds: ['video'],
    };
    const delta: Delta = {
      ops: [
        { insert: 'before' },
        { insert: { video: 'https://example.com/v.mp4' } },
        { insert: 'after\n' },
      ],
    };

    const ast = parseDelta(delta, config);

    const videoNode = ast.children.find((c) => c.type === 'video');
    expect(videoNode).toBeDefined();
    expect(videoNode!.data).toBe('https://example.com/v.mp4');
  });
});

describe('DeltaParser', () => {
  describe('basic text parsing', () => {
    it('should parse a single line of plain text into a paragraph', () => {
      const delta: Delta = {
        ops: [{ insert: 'Hello world\n' }],
      };

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();

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

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();

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

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();

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

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();
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

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();
      const textNode = ast.children[0]!.children[0]!;

      expect(textNode.attributes.bold).toBe(true);
      expect(textNode.attributes.italic).toBe(true);
      expect(textNode.attributes.color).toBe('#ff0000');
    });
  });

  describe('block attributes from config', () => {
    it('should use a configured handler to set block type and attrs', () => {
      const config: ParserConfig = {
        blockAttributes: {
          header: (value) => ({
            blockType: 'header',
            blockAttrs: { header: value },
          }),
        },
      };

      const delta: Delta = {
        ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
      };

      const ast = new DeltaParser(delta, config).toAST();

      expect(ast.children).toHaveLength(1);
      expect(ast.children[0]!.type).toBe('header');
      expect(ast.children[0]!.attributes.header).toBe(1);
      expect(ast.children[0]!.children[0]!.data).toBe('Title');
    });

    it('should fall back to paragraph when attribute has no handler', () => {
      const delta: Delta = {
        ops: [{ insert: 'text' }, { insert: '\n', attributes: { unknownBlock: true } }],
      };

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();

      expect(ast.children[0]!.type).toBe('paragraph');
    });

    it('should merge passthrough attrs without changing block type', () => {
      const config: ParserConfig = {
        blockAttributes: {
          align: (value) => ({ blockType: '', blockAttrs: { align: value } }),
        },
      };

      const delta: Delta = {
        ops: [{ insert: 'centered' }, { insert: '\n', attributes: { align: 'center' } }],
      };

      const ast = new DeltaParser(delta, config).toAST();

      expect(ast.children[0]!.type).toBe('paragraph');
      expect(ast.children[0]!.attributes.align).toBe('center');
    });

    it('should exclude block attributes from inline text nodes', () => {
      const config: ParserConfig = {
        blockAttributes: {
          list: (value) => ({
            blockType: 'list-item',
            blockAttrs: { list: value },
          }),
        },
      };

      const delta: Delta = {
        ops: [{ insert: 'Item 1' }, { insert: '\n', attributes: { list: 'bullet' } }],
      };

      const ast = new DeltaParser(delta, config).toAST();

      expect(ast.children[0]!.type).toBe('list-item');
      expect(ast.children[0]!.attributes.list).toBe('bullet');
    });

    it('should support custom block types', () => {
      const config: ParserConfig = {
        blockAttributes: {
          'my-widget': (value) => ({
            blockType: 'widget',
            blockAttrs: { widgetId: value },
          }),
        },
      };

      const delta: Delta = {
        ops: [{ insert: 'content' }, { insert: '\n', attributes: { 'my-widget': 'abc-123' } }],
      };

      const ast = new DeltaParser(delta, config).toAST();

      expect(ast.children[0]!.type).toBe('widget');
      expect(ast.children[0]!.attributes.widgetId).toBe('abc-123');
    });
  });

  describe('embeds', () => {
    it('should parse an image embed', () => {
      const delta: Delta = {
        ops: [{ insert: { image: 'https://example.com/photo.jpg' } }, { insert: '\n' }],
      };

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();
      const paragraph = ast.children[0]!;

      expect(paragraph.children).toHaveLength(1);
      expect(paragraph.children[0]!.type).toBe('image');
      expect(paragraph.children[0]!.data).toBe('https://example.com/photo.jpg');
    });

    it('should parse a formula embed', () => {
      const delta: Delta = {
        ops: [{ insert: { formula: 'e=mc^2' } }, { insert: '\n' }],
      };

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();
      const embed = ast.children[0]!.children[0]!;

      expect(embed.type).toBe('formula');
      expect(embed.data).toBe('e=mc^2');
    });

    it('should parse a mention embed with data', () => {
      const delta: Delta = {
        ops: [
          {
            insert: { mention: { name: 'John', slug: 'john' } },
            attributes: { mention: { name: 'John', slug: 'john' } },
          },
          { insert: '\n' },
        ],
      };

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();
      const embed = ast.children[0]!.children[0]!;

      expect(embed.type).toBe('mention');
      expect(embed.data).toEqual({ name: 'John', slug: 'john' });
      expect(embed.attributes.mention).toEqual({ name: 'John', slug: 'john' });
    });

    it('should pass through custom/unknown embed types', () => {
      const delta: Delta = {
        ops: [
          { insert: { myWidget: { id: 'w-123', config: { color: 'blue' } } } },
          { insert: '\n' },
        ],
      };

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();
      const embed = ast.children[0]!.children[0]!;

      expect(embed.type).toBe('myWidget');
      expect(embed.data).toEqual({ id: 'w-123', config: { color: 'blue' } });
    });

    it('should preserve attributes on embeds', () => {
      const delta: Delta = {
        ops: [
          {
            insert: { image: 'https://example.com/img.png' },
            attributes: { width: '200', link: 'https://example.com' },
          },
          { insert: '\n' },
        ],
      };

      const ast = new DeltaParser(delta, EMPTY_CONFIG).toAST();
      const embed = ast.children[0]!.children[0]!;

      expect(embed.type).toBe('image');
      expect(embed.attributes.width).toBe('200');
      expect(embed.attributes.link).toBe('https://example.com');
    });
  });

  describe('transformer integration', () => {
    it('should apply a transformer via .use()', () => {
      const delta: Delta = {
        ops: [{ insert: 'Hello\n' }],
      };

      const uppercaseTransformer: Transformer = (children) =>
        children.map((child) => ({
          ...child,
          children: child.children.map((textNode) => ({
            ...textNode,
            data: typeof textNode.data === 'string' ? textNode.data.toUpperCase() : textNode.data,
          })),
        }));

      const ast = new DeltaParser(delta, EMPTY_CONFIG).use(uppercaseTransformer).toAST();

      expect(ast.children[0]!.children[0]!.data).toBe('HELLO');
    });

    it('should chain multiple transformers in order', () => {
      const delta: Delta = {
        ops: [{ insert: 'hello\n' }],
      };

      const calls: string[] = [];

      const t1: Transformer = (children) => {
        calls.push('t1');
        return children;
      };
      const t2: Transformer = (children) => {
        calls.push('t2');
        return children;
      };

      new DeltaParser(delta, EMPTY_CONFIG).use(t1).use(t2).toAST();

      expect(calls).toEqual(['t1', 't2']);
    });
  });
});

// ─── softLineBreaks ─────────────────────────────────────────────────────────

describe('parseDelta softLineBreaks', () => {
  const CONFIG_WITH_BLOCKS: ParserConfig = {
    blockAttributes: {
      header: (v) => ({ blockType: 'header', blockAttrs: { header: v } }),
    },
    softLineBreaks: true,
  };

  const SOFT_CONFIG: ParserConfig = { blockAttributes: {}, softLineBreaks: true };

  it('should insert line-break nodes for inner newlines in a single insert', () => {
    const delta: Delta = { ops: [{ insert: 'A\nB\nC\n' }] };
    const ast = parseDelta(delta, SOFT_CONFIG);

    expect(ast.children).toHaveLength(1);
    const block = ast.children[0]!;
    expect(block.type).toBe('paragraph');

    expect(block.children).toHaveLength(5);
    expect(block.children[0]).toMatchObject({ type: 'text', data: 'A' });
    expect(block.children[1]).toMatchObject({ type: 'line-break', isInline: true });
    expect(block.children[2]).toMatchObject({ type: 'text', data: 'B' });
    expect(block.children[3]).toMatchObject({ type: 'line-break', isInline: true });
    expect(block.children[4]).toMatchObject({ type: 'text', data: 'C' });
  });

  it('should insert line-break nodes for empty inner lines', () => {
    const delta: Delta = { ops: [{ insert: '\n\n\n' }] };
    const ast = parseDelta(delta, SOFT_CONFIG);

    expect(ast.children).toHaveLength(1);
    const block = ast.children[0]!;
    expect(block.type).toBe('paragraph');

    // 3 newlines: first two become line-breaks, last flushes
    expect(block.children).toHaveLength(2);
    expect(block.children[0]).toMatchObject({ type: 'line-break' });
    expect(block.children[1]).toMatchObject({ type: 'line-break' });
  });

  it('should still create separate blocks for block-level attributes', () => {
    const delta: Delta = {
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }, { insert: 'Body\n' }],
    };
    const ast = parseDelta(delta, CONFIG_WITH_BLOCKS);

    expect(ast.children).toHaveLength(2);
    expect(ast.children[0]).toMatchObject({ type: 'header' });
    expect(ast.children[1]).toMatchObject({ type: 'paragraph' });
  });

  it('should not affect single-newline inserts', () => {
    const delta: Delta = { ops: [{ insert: 'Hello\n' }] };
    const ast = parseDelta(delta, SOFT_CONFIG);

    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]!.children).toHaveLength(1);
    expect(ast.children[0]!.children[0]).toMatchObject({ type: 'text', data: 'Hello' });
  });

  it('should handle text without trailing newline (mid-insert)', () => {
    const delta: Delta = { ops: [{ insert: 'A\nB' }] };
    const ast = parseDelta(delta, SOFT_CONFIG);

    // No trailing \n → content stays in buffer, flushed as trailing paragraph
    expect(ast.children).toHaveLength(1);
    const block = ast.children[0]!;
    expect(block.children).toHaveLength(3);
    expect(block.children[0]).toMatchObject({ type: 'text', data: 'A' });
    expect(block.children[1]).toMatchObject({ type: 'line-break' });
    expect(block.children[2]).toMatchObject({ type: 'text', data: 'B' });
  });
});
