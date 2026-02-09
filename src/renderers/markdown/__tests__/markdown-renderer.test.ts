import type { Delta } from '../../../core/ast-types';
import { MarkdownRenderer } from '../markdown-renderer';
import { renderDelta, renderDeltaWith } from './test-helpers';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Shorthand: create a Delta from ops */
function d(...ops: Delta['ops']): Delta {
  return { ops };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('MarkdownRenderer', () => {
  // ─── Inline Formatting ──────────────────────────────────────────────────

  describe('inline formatting', () => {
    it('should render bold text', () => {
      const md = renderDelta(
        d({ insert: 'Hello ' }, { insert: 'world', attributes: { bold: true } }, { insert: '\n' }),
      );
      expect(md).toBe('Hello **world**');
    });

    it('should render italic text', () => {
      const md = renderDelta(
        d(
          { insert: 'Hello ' },
          { insert: 'world', attributes: { italic: true } },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('Hello _world_');
    });

    it('should render strikethrough text', () => {
      const md = renderDelta(
        d(
          { insert: 'Hello ' },
          { insert: 'world', attributes: { strike: true } },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('Hello ~~world~~');
    });

    it('should render inline code', () => {
      const md = renderDelta(
        d(
          { insert: 'Use ' },
          { insert: 'const', attributes: { code: true } },
          { insert: ' keyword\n' },
        ),
      );
      expect(md).toBe('Use `const` keyword');
    });

    it('should render combined bold + italic', () => {
      const md = renderDelta(
        d({ insert: 'text', attributes: { bold: true, italic: true } }, { insert: '\n' }),
      );
      // Both bold and italic have equal priority (10), so nesting order
      // depends on attribute iteration order. Either form is valid markdown.
      expect(md).toBe('_**text**_');
    });

    it('should ignore color, background, underline, font, size', () => {
      const md = renderDelta(
        d(
          {
            insert: 'styled',
            attributes: {
              color: 'red',
              background: '#ff0',
              underline: true,
              font: 'serif',
              size: '18px',
            },
          },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('styled');
    });
  });

  // ─── Links ──────────────────────────────────────────────────────────────

  describe('links', () => {
    it('should render a link', () => {
      const md = renderDelta(
        d({ insert: 'Click here', attributes: { link: 'https://example.com' } }, { insert: '\n' }),
      );
      expect(md).toBe('[Click here](https://example.com)');
    });

    it('should render bold text inside a link', () => {
      const md = renderDelta(
        d(
          { insert: 'bold link', attributes: { bold: true, link: 'https://example.com' } },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('[**bold link**](https://example.com)');
    });
  });

  // ─── Headers ────────────────────────────────────────────────────────────

  describe('headers', () => {
    it('should render h1', () => {
      const md = renderDelta(d({ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }));
      expect(md).toBe('# Title');
    });

    it('should render h2', () => {
      const md = renderDelta(
        d({ insert: 'Subtitle' }, { insert: '\n', attributes: { header: 2 } }),
      );
      expect(md).toBe('## Subtitle');
    });

    it('should render h3 through h6', () => {
      for (let level = 3; level <= 6; level++) {
        const md = renderDelta(
          d({ insert: `Heading ${level}` }, { insert: '\n', attributes: { header: level } }),
        );
        expect(md).toBe(`${'#'.repeat(level)} Heading ${level}`);
      }
    });
  });

  // ─── Blockquotes ──────────────────────────────────────────────────────

  describe('blockquotes', () => {
    it('should render a blockquote', () => {
      const md = renderDelta(
        d({ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }),
      );
      expect(md).toBe('> A quote');
    });

    it('should separate blockquotes with empty paragraph between them', () => {
      const md = renderDelta(
        d(
          { insert: 'This is a quote!' },
          { insert: '\n', attributes: { blockquote: true } },
          { insert: '\n' },
          { insert: 'This is another quote!' },
          { insert: '\n', attributes: { blockquote: true } },
        ),
      );
      expect(md).toBe('> This is a quote!\n\n> This is another quote!');
    });
  });

  // ─── Code Blocks ────────────────────────────────────────────────────────

  describe('code blocks', () => {
    it('should render a single-line code block', () => {
      const md = renderDelta(
        d({ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }),
      );
      expect(md).toBe('```\nconst x = 1;\n```');
    });

    it('should render a multi-line code block', () => {
      const md = renderDelta(
        d(
          { insert: 'const x = 1;' },
          { insert: '\n', attributes: { 'code-block': true } },
          { insert: 'const y = 2;' },
          { insert: '\n', attributes: { 'code-block': true } },
        ),
      );
      expect(md).toBe('```\nconst x = 1;\nconst y = 2;\n```');
    });

    it('should render a code block with language', () => {
      const md = renderDelta(
        d({ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': 'javascript' } }),
      );
      expect(md).toBe('```javascript\nconst x = 1;\n```');
    });

    it('should render plain code block without language tag', () => {
      const md = renderDelta(
        d({ insert: 'plain text' }, { insert: '\n', attributes: { 'code-block': 'plain' } }),
      );
      expect(md).toBe('```\nplain text\n```');
    });
  });

  // ─── Lists ──────────────────────────────────────────────────────────────

  describe('lists', () => {
    it('should render bullet list', () => {
      const md = renderDelta(
        d(
          { insert: 'Item one' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Item two' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ),
      );
      expect(md).toBe('*   Item one\n*   Item two');
    });

    it('should render ordered list', () => {
      const md = renderDelta(
        d(
          { insert: 'First' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'Second' },
          { insert: '\n', attributes: { list: 'ordered' } },
        ),
      );
      expect(md).toBe('1. First\n2. Second');
    });

    it('should render checklist', () => {
      const md = renderDelta(
        d(
          { insert: 'Done' },
          { insert: '\n', attributes: { list: 'checked' } },
          { insert: 'Not done' },
          { insert: '\n', attributes: { list: 'unchecked' } },
        ),
      );
      expect(md).toBe('- [x] Done\n- [ ] Not done');
    });

    it('should render nested bullet lists', () => {
      const md = renderDelta(
        d(
          { insert: 'root bullet list' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 2 } },
        ),
      );
      expect(md).toBe(
        '*   root bullet list\n    *   inner bullet list\n        *   inner bullet list',
      );
    });

    it('should render nested ordered lists', () => {
      const md = renderDelta(
        d(
          { insert: 'root ordered list' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'inner ordered list 1' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
          { insert: 'inner ordered list 2' },
          { insert: '\n', attributes: { list: 'ordered', indent: 2 } },
        ),
      );
      expect(md).toBe(
        '1. root ordered list\n    1. inner ordered list 1\n        1. inner ordered list 2',
      );
    });

    it('should render mixed lists', () => {
      const md = renderDelta(
        d(
          { insert: 'root ordered list' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
          { insert: 'inner ordered list' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
          { insert: 'inner ordered list' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
        ),
      );
      expect(md).toBe(
        [
          '1. root ordered list',
          '    *   inner bullet list',
          '    1. inner ordered list',
          '    *   inner bullet list',
          '    2. inner ordered list',
        ].join('\n'),
      );
    });

    it('should handle adjacent different-type lists', () => {
      const md = renderDelta(
        d(
          { insert: 'Bullet item one' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Bullet item two' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Ordered item one' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'Ordered item two' },
          { insert: '\n', attributes: { list: 'ordered' } },
        ),
      );
      expect(md).toBe(
        [
          '*   Bullet item one',
          '*   Bullet item two',
          '1. Ordered item one',
          '2. Ordered item two',
        ].join('\n'),
      );
    });
  });

  // ─── Embeds ─────────────────────────────────────────────────────────────

  describe('embeds', () => {
    it('should render an image', () => {
      const md = renderDelta(
        d({ insert: { image: 'https://example.com/img.png' } }, { insert: '\n' }),
      );
      expect(md).toBe('![](https://example.com/img.png)');
    });

    it('should render a horizontal rule (divider)', () => {
      const md = renderDelta(
        d(
          { insert: 'Before' },
          { insert: '\n' },
          { insert: { divider: true } },
          { insert: 'After' },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('Before\n* * *\nAfter');
    });

    it('should return empty for unknown embed types', () => {
      const md = renderDelta(d({ insert: { unknown_embed: { data: 'test' } } }, { insert: '\n' }));
      expect(md).toBe('');
    });
  });

  // ─── Spacing ────────────────────────────────────────────────────────────

  describe('spacing', () => {
    it('should render simple text', () => {
      const md = renderDelta(d({ insert: 'test' }));
      expect(md).toBe('test');
    });

    it('should render empty delta as empty string', () => {
      const md = renderDelta({ ops: [] });
      expect(md).toBe('');
    });

    it('should preserve paragraph spacing (single newline)', () => {
      const md = renderDelta(
        d(
          { insert: 'This is a paragraph.' },
          { insert: '\n' },
          { insert: 'This is another paragraph.' },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('This is a paragraph.\nThis is another paragraph.');
    });

    it('should handle horizontal rule spacing', () => {
      const md = renderDelta(
        d(
          { insert: 'This is a paragraph.' },
          { insert: '\n' },
          { insert: { divider: true } },
          { insert: 'This is another paragraph.' },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('This is a paragraph.\n* * *\nThis is another paragraph.');
    });

    it('should handle list spacing with empty paragraph between groups', () => {
      const md = renderDelta(
        d(
          { insert: 'List 1, first item' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'List 1, second item' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: '\n' },
          { insert: 'List 2, first item' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'List 2, second item' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ),
      );
      expect(md).toBe(
        [
          '*   List 1, first item',
          '*   List 1, second item',
          '',
          '*   List 2, first item',
          '*   List 2, second item',
        ].join('\n'),
      );
    });

    it('should handle headers and lists spacing', () => {
      const md = renderDelta(
        d(
          { insert: 'Key Points:' },
          { insert: '\n', attributes: { header: 3 } },
          { insert: 'This is a test document for demonstration purposes.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'It includes headers, bullets, and bilingual content.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'The goal is to keep it concise and clear.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Example Bullets:' },
          { insert: '\n', attributes: { header: 4 } },
          { insert: 'Simple and easy to read.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Organized structure.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Useful for quick reference.' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ),
      );
      expect(md).toBe(
        [
          '### Key Points:',
          '*   This is a test document for demonstration purposes.',
          '*   It includes headers, bullets, and bilingual content.',
          '*   The goal is to keep it concise and clear.',
          '#### Example Bullets:',
          '*   Simple and easy to read.',
          '*   Organized structure.',
          '*   Useful for quick reference.',
        ].join('\n'),
      );
    });
  });

  // ─── Extensibility ──────────────────────────────────────────────────────

  describe('extensibility', () => {
    it('should support custom block handlers via extendBlock()', () => {
      const renderer = new MarkdownRenderer();
      renderer.extendBlock('user_mention', (node) => {
        const data = node.data as Record<string, unknown>;
        return `[@${data.name}](#user_mention#${data.id})`;
      });

      const md = renderDeltaWith(
        d(
          {
            insert: {
              user_mention: { id: '123', name: 'TestUser', email: 'testUser@test.com' },
            },
          },
          { insert: '\n' },
        ),
        renderer,
      );
      expect(md).toBe('[@TestUser](#user_mention#123)');
    });

    it('should support custom link_preview handler', () => {
      const renderer = new MarkdownRenderer();
      renderer.extendBlock('link_preview', (node) => {
        const data = node.data as Record<string, unknown>;
        const url = String(data?.url ?? '');
        return `[${url}](${url})`;
      });

      const md = renderDeltaWith(
        d({
          insert: {
            link_preview: {
              entity: 'doc:123',
              url: 'https://example.com/docs/123',
            },
          },
        }),
        renderer,
      );
      expect(md).toBe('[https://example.com/docs/123](https://example.com/docs/123)');
    });

    it('should support custom formula_bracket handler', () => {
      const renderer = new MarkdownRenderer();
      renderer.extendBlock('formula_bracket', (node) => {
        const data = node.data as Record<string, unknown>;
        return data?.bracketDirection === 'left' ? '(' : ')';
      });

      const leftBracket = renderDeltaWith(
        d({ insert: { formula_bracket: { bracketDirection: 'left', nestingLevel: '3' } } }),
        renderer,
      );
      expect(leftBracket).toBe('(');

      const rightBracket = renderDeltaWith(
        d({ insert: { formula_bracket: { bracketDirection: 'right', nestingLevel: '2' } } }),
        renderer,
      );
      expect(rightBracket).toBe(')');
    });

    it('should support custom mark handlers via extendMark()', () => {
      const renderer = new MarkdownRenderer();
      renderer.extendMark('highlight', (content) => `==${content}==`);

      const md = renderDeltaWith(
        d({ insert: 'important', attributes: { highlight: true } }, { insert: '\n' }),
        renderer,
      );
      expect(md).toBe('==important==');
    });
  });

  // ─── Config Options ─────────────────────────────────────────────────────

  describe('config options', () => {
    it('should support custom bullet character', () => {
      const md = renderDelta(
        d({ insert: 'Item' }, { insert: '\n', attributes: { list: 'bullet' } }),
        { bulletChar: '-', bulletPadding: ' ' },
      );
      expect(md).toBe('- Item');
    });

    it('should support custom horizontal rule', () => {
      const md = renderDelta(
        d(
          { insert: 'Before' },
          { insert: '\n' },
          { insert: { divider: true } },
          { insert: 'After' },
          { insert: '\n' },
        ),
        { hrString: '---' },
      );
      expect(md).toBe('Before\n---\nAfter');
    });

    it('should support custom fence characters', () => {
      const md = renderDelta(
        d({ insert: 'code' }, { insert: '\n', attributes: { 'code-block': true } }),
        { fenceChar: '~~~' },
      );
      expect(md).toBe('~~~\ncode\n~~~');
    });

    it('should support custom indent string', () => {
      const md = renderDelta(
        d(
          { insert: 'root' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'nested' },
          { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
        ),
        { indentString: '  ' },
      );
      expect(md).toBe('*   root\n  *   nested');
    });
  });

  // ─── Integration: Adapted from DeltaToMarkdownTestCases ─────────────────

  describe('integration (adapted from existing test cases)', () => {
    it('should handle empty ops', () => {
      expect(renderDelta({ ops: [] })).toBe('');
    });

    it('should render simple text from ops', () => {
      expect(renderDelta({ ops: [{ insert: 'test' }] })).toBe('test');
    });

    it('should render header', () => {
      expect(
        renderDelta(d({ insert: 'header 1' }, { insert: '\n', attributes: { header: 1 } })),
      ).toBe('# header 1');
    });

    it('should render nested bullet lists (adapted)', () => {
      const md = renderDelta(
        d(
          { insert: 'root bullet list' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 2 } },
        ),
      );
      expect(md).toBe(
        '*   root bullet list\n    *   inner bullet list\n        *   inner bullet list',
      );
    });

    it('should render nested ordered lists (adapted)', () => {
      const md = renderDelta(
        d(
          { insert: 'root ordered list' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'inner ordered list 1' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
          { insert: 'inner ordered list 2' },
          { insert: '\n', attributes: { list: 'ordered', indent: 2 } },
        ),
      );
      expect(md).toBe(
        '1. root ordered list\n    1. inner ordered list 1\n        1. inner ordered list 2',
      );
    });

    it('should render mixed lists (adapted)', () => {
      const md = renderDelta(
        d(
          { insert: 'root ordered list' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
          { insert: 'inner ordered list' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
          { insert: 'inner bullet list' },
          { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
          { insert: 'inner ordered list' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
        ),
      );
      expect(md).toBe(
        [
          '1. root ordered list',
          '    *   inner bullet list',
          '    1. inner ordered list',
          '    *   inner bullet list',
          '    2. inner ordered list',
        ].join('\n'),
      );
    });

    it('should preserve paragraph spacing', () => {
      const md = renderDelta(
        d(
          { insert: 'This is a paragraph.' },
          { insert: '\n' },
          { insert: 'This is another paragraph.' },
          { insert: '\n' },
        ),
      );
      expect(md).toBe('This is a paragraph.\nThis is another paragraph.');
    });

    it('should handle blockquote spacing', () => {
      const md = renderDelta(
        d(
          { insert: 'This is a quote!' },
          { insert: '\n', attributes: { blockquote: true } },
          { insert: '\n' },
          { insert: 'This is another quote!' },
          { insert: '\n', attributes: { blockquote: true } },
        ),
      );
      expect(md).toBe('> This is a quote!\n\n> This is another quote!');
    });

    it('should handle horizontal rule spacing', () => {
      const md = renderDelta(
        d(
          { insert: 'This is a paragraph.' },
          { insert: '\n' },
          { insert: { divider: true } },
          { insert: 'This is another paragraph.' },
          { insert: '\n' },
        ),
      );
      expect(md).toBe(['This is a paragraph.', '* * *', 'This is another paragraph.'].join('\n'));
    });

    it('should handle list spacing with empty paragraph between', () => {
      const md = renderDelta(
        d(
          { insert: 'List 1, first item' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'List 1, second item' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: '\n' },
          { insert: 'List 2, first item' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'List 2, second item' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ),
      );
      expect(md).toBe(
        [
          '*   List 1, first item',
          '*   List 1, second item',
          '',
          '*   List 2, first item',
          '*   List 2, second item',
        ].join('\n'),
      );
    });

    it('should handle headers and lists together', () => {
      const md = renderDelta(
        d(
          { insert: 'Key Points:' },
          { insert: '\n', attributes: { header: 3 } },
          { insert: 'This is a test document for demonstration purposes.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'It includes headers, bullets, and bilingual content.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'The goal is to keep it concise and clear.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Example Bullets:' },
          { insert: '\n', attributes: { header: 4 } },
          { insert: 'Simple and easy to read.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Organized structure.' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Useful for quick reference.' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ),
      );
      expect(md).toBe(
        [
          '### Key Points:',
          '*   This is a test document for demonstration purposes.',
          '*   It includes headers, bullets, and bilingual content.',
          '*   The goal is to keep it concise and clear.',
          '#### Example Bullets:',
          '*   Simple and easy to read.',
          '*   Organized structure.',
          '*   Useful for quick reference.',
        ].join('\n'),
      );
    });

    it('should handle adjacent different-type lists', () => {
      const md = renderDelta(
        d(
          { insert: 'Bullet item one' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Bullet item two' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Ordered item one' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'Ordered item two' },
          { insert: '\n', attributes: { list: 'ordered' } },
        ),
      );
      expect(md).toBe(
        [
          '*   Bullet item one',
          '*   Bullet item two',
          '1. Ordered item one',
          '2. Ordered item two',
        ].join('\n'),
      );
    });
  });
});
