import { describe, expect, it } from 'vitest';
import { renderDelta } from './test-helpers';

describe('SemanticHtmlRenderer integration: embeds', () => {
  it('should render an image', () => {
    const html = renderDelta({
      ops: [{ insert: { image: 'https://example.com/img.png' } }, { insert: '\n' }],
    });
    expect(html).toContain('src="https://example.com/img.png"');
  });

  it('should render an image with width', () => {
    const html = renderDelta({
      ops: [
        { insert: { image: 'https://example.com/img.png' }, attributes: { width: '200' } },
        { insert: '\n' },
      ],
    });
    expect(html).toContain('width="200"');
  });

  it('should render an image wrapped in a link', () => {
    const html = renderDelta({
      ops: [
        {
          insert: { image: 'https://example.com/img.png' },
          attributes: { link: 'https://example.com' },
        },
        { insert: '\n' },
      ],
    });
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('<img');
    expect(html).toContain('</a>');
  });

  it('should render a video as iframe', () => {
    const html = renderDelta({
      ops: [{ insert: { video: 'https://youtube.com/watch?v=123' } }, { insert: '\n' }],
    });
    expect(html).toContain('<iframe');
    expect(html).toContain('class="ql-video"');
    expect(html).toContain('frameborder="0"');
    expect(html).toContain('allowfullscreen="true"');
  });

  it('should render a formula', () => {
    const html = renderDelta({
      ops: [{ insert: { formula: 'x=data' } }, { insert: '\n' }],
    });
    expect(html).toContain('<span class="ql-formula">x=data</span>');
  });

  it('should render a mention as a link', () => {
    const html = renderDelta({
      ops: [
        {
          insert: { mention: { name: 'John', slug: 'john', 'end-point': '/users' } },
          attributes: { mention: { name: 'John', slug: 'john', 'end-point': '/users' } },
        },
        { insert: '\n' },
      ],
    });
    expect(html).toContain('href="/users/john"');
    expect(html).toContain('John');
  });

  it('should render mention with class', () => {
    const html = renderDelta({
      ops: [
        {
          insert: {
            mention: { name: 'J', slug: 'j', class: 'mention-link', 'end-point': '/u' },
          },
          attributes: {
            mention: { name: 'J', slug: 'j', class: 'mention-link', 'end-point': '/u' },
          },
        },
        { insert: '\n' },
      ],
    });
    expect(html).toContain('class="mention-link"');
  });

  it('should render mention with about:blank when no endpoint/slug', () => {
    const html = renderDelta({
      ops: [
        {
          insert: { mention: { name: 'John' } },
          attributes: { mention: { name: 'John' } },
        },
        { insert: '\n' },
      ],
    });
    expect(html).toContain('href="about:blank"');
  });
});
