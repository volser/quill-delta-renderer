import { d, renderDelta } from './test-helpers';

describe('MarkdownRenderer – embeds', () => {
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
