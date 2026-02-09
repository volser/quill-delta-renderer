import { MarkdownRenderer } from '../markdown-renderer';
import { d, renderDeltaWith } from './test-helpers';

describe('MarkdownRenderer – extensibility', () => {
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
