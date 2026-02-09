import { d, renderDelta } from './test-helpers';

describe('MarkdownRenderer – inline formatting', () => {
  it('should render bold text', () => {
    const md = renderDelta(
      d({ insert: 'Hello ' }, { insert: 'world', attributes: { bold: true } }, { insert: '\n' }),
    );
    expect(md).toBe('Hello **world**');
  });

  it('should render italic text', () => {
    const md = renderDelta(
      d({ insert: 'Hello ' }, { insert: 'world', attributes: { italic: true } }, { insert: '\n' }),
    );
    expect(md).toBe('Hello _world_');
  });

  it('should render strikethrough text', () => {
    const md = renderDelta(
      d({ insert: 'Hello ' }, { insert: 'world', attributes: { strike: true } }, { insert: '\n' }),
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
