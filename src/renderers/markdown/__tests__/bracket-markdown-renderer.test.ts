import { d, renderDeltaBracket } from './test-helpers';

describe('BracketMarkdownRenderer – inline formatting', () => {
  it('should render underline as [STYLE underline=true]...[/STYLE]', () => {
    const md = renderDeltaBracket(
      d(
        { insert: 'Hello ' },
        { insert: 'underlined', attributes: { underline: true } },
        { insert: '\n' },
      ),
    );
    expect(md).toBe('Hello [STYLE underline=true]underlined[/STYLE]');
  });

  it('should render subscript as [STYLE sub=true]...[/STYLE]', () => {
    const md = renderDeltaBracket(
      d({ insert: 'H' }, { insert: '2', attributes: { script: 'sub' } }, { insert: 'O\n' }),
    );
    expect(md).toBe('H[STYLE sub=true]2[/STYLE]O');
  });

  it('should render superscript as [STYLE sup=true]...[/STYLE]', () => {
    const md = renderDeltaBracket(
      d({ insert: 'E=mc' }, { insert: '2', attributes: { script: 'super' } }, { insert: '\n' }),
    );
    expect(md).toBe('E=mc[STYLE sup=true]2[/STYLE]');
  });

  it('should render color as [STYLE color=<value>]...[/STYLE]', () => {
    const md = renderDeltaBracket(
      d({ insert: 'red ', attributes: { color: '#e60000' } }, { insert: 'text\n' }),
    );
    expect(md).toBe('[STYLE color=#e60000]red [/STYLE]text');
  });

  it('should render background as [STYLE bg=<value>]...[/STYLE]', () => {
    const md = renderDeltaBracket(
      d({ insert: 'highlighted', attributes: { background: '#ffebcc' } }, { insert: '\n' }),
    );
    expect(md).toBe('[STYLE bg=#ffebcc]highlighted[/STYLE]');
  });

  it('should render font as [STYLE font=<value>]...[/STYLE]', () => {
    const md = renderDeltaBracket(
      d({ insert: 'mono text', attributes: { font: 'monospace' } }, { insert: '\n' }),
    );
    expect(md).toBe('[STYLE font=monospace]mono text[/STYLE]');
  });

  it('should render size as [STYLE size=<value>]...[/STYLE]', () => {
    const md = renderDeltaBracket(
      d({ insert: 'large', attributes: { size: 'large' } }, { insert: ' text\n' }),
    );
    expect(md).toBe('[STYLE size=large]large[/STYLE] text');
  });

  it('should allow standard Markdown inside styled content', () => {
    const md = renderDeltaBracket(
      d(
        {
          insert: 'bold',
          attributes: { color: 'red', bold: true },
        },
        { insert: ' and ', attributes: { color: 'red' } },
        {
          insert: 'code',
          attributes: { color: 'red', code: true },
        },
        { insert: '\n' },
      ),
    );
    expect(md).toContain('[STYLE color=red]');
    expect(md).toContain('**bold**');
    expect(md).toContain('`code`');
    expect(md).toContain('[/STYLE]');
  });

  it('should nest [STYLE] tags when multiple styles apply', () => {
    const md = renderDeltaBracket(
      d(
        {
          insert: 'styled',
          attributes: {
            color: '#e60000',
            background: '#ffebcc',
            underline: true,
          },
        },
        { insert: '\n' },
      ),
    );
    expect(md).toContain('[STYLE ');
    expect(md).toContain('color=#e60000');
    expect(md).toContain('bg=#ffebcc');
    expect(md).toContain('underline=true');
    expect(md).toContain('styled');
    expect(md).toContain('[/STYLE]');
  });
});
