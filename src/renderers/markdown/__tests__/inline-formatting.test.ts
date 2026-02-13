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

  it('should strip underline (standard MD only)', () => {
    const md = renderDelta(
      d(
        { insert: 'Hello ' },
        { insert: 'underlined', attributes: { underline: true } },
        { insert: '\n' },
      ),
    );
    expect(md).toBe('Hello underlined');
  });

  it('should strip subscript (standard MD only)', () => {
    const md = renderDelta(
      d({ insert: 'H' }, { insert: '2', attributes: { script: 'sub' } }, { insert: 'O\n' }),
    );
    expect(md).toBe('H2O');
  });

  it('should strip superscript (standard MD only)', () => {
    const md = renderDelta(
      d({ insert: 'E=mc' }, { insert: '2', attributes: { script: 'super' } }, { insert: '\n' }),
    );
    expect(md).toBe('E=mc2');
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
    // bold has higher priority than italic, so bold wraps outer.
    expect(md).toBe('**_text_**');
  });

  it('should ignore color, background, font, size', () => {
    const md = renderDelta(
      d(
        {
          insert: 'styled',
          attributes: {
            color: 'red',
            background: '#ff0',
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
