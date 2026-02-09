import { describe, expect, it } from 'vitest';
import { renderDelta } from './test-helpers';

describe('SemanticHtmlRenderer integration: blocks', () => {
  it('should render a paragraph', () => {
    expect(renderDelta({ ops: [{ insert: 'Hello world\n' }] })).toBe('<p>Hello world</p>');
  });

  it('should render a header', () => {
    const html = renderDelta({
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
    });
    expect(html).toBe('<h1>Title</h1>');
  });

  it('should render header levels 1-6', () => {
    for (let level = 1; level <= 6; level++) {
      const html = renderDelta({
        ops: [{ insert: 'H' }, { insert: '\n', attributes: { header: level } }],
      });
      expect(html).toBe(`<h${level}>H</h${level}>`);
    }
  });

  it('should render a blockquote', () => {
    const html = renderDelta({
      ops: [{ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }],
    });
    expect(html).toBe('<blockquote>A quote</blockquote>');
  });

  it('should render a code block', () => {
    const html = renderDelta({
      ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
    });
    expect(html).toContain('<pre');
    expect(html).toContain('class="ql-syntax"');
    expect(html).toContain('const x = 1;');
  });

  it('should render a code block with data-language', () => {
    const html = renderDelta({
      ops: [
        { insert: 'const x = 1;' },
        { insert: '\n', attributes: { 'code-block': 'javascript' } },
      ],
    });
    expect(html).toContain('data-language="javascript"');
    expect(html).toContain('language-javascript');
  });

  it('should render empty blocks with <br/>', () => {
    expect(renderDelta({ ops: [{ insert: '\n' }] })).toBe('<p><br/></p>');
  });

  it('should render empty header with <br/>', () => {
    const html = renderDelta({
      ops: [{ insert: '\n', attributes: { header: 1 } }],
    });
    expect(html).toBe('<h1><br/></h1>');
  });

  it('should render newlines as separate paragraphs', () => {
    expect(renderDelta({ ops: [{ insert: 'line1\nline2\n' }] })).toBe('<p>line1</p><p>line2</p>');
  });

  it('should render multiple blank lines', () => {
    expect(renderDelta({ ops: [{ insert: '\n\n' }] })).toBe('<p><br/></p><p><br/></p>');
  });

  it('should add ql-indent class', () => {
    const html = renderDelta({
      ops: [{ insert: 'indented' }, { insert: '\n', attributes: { indent: 2 } }],
    });
    expect(html).toBe('<p class="ql-indent-2">indented</p>');
  });

  it('should add ql-align class', () => {
    const html = renderDelta({
      ops: [{ insert: 'centered' }, { insert: '\n', attributes: { align: 'center' } }],
    });
    expect(html).toBe('<p class="ql-align-center">centered</p>');
  });

  it('should add ql-direction class', () => {
    const html = renderDelta({
      ops: [{ insert: 'rtl' }, { insert: '\n', attributes: { direction: 'rtl' } }],
    });
    expect(html).toBe('<p class="ql-direction-rtl">rtl</p>');
  });

  it('should combine multiple classes', () => {
    const html = renderDelta({
      ops: [{ insert: 'text' }, { insert: '\n', attributes: { indent: 1, align: 'right' } }],
    });
    expect(html).toBe('<p class="ql-indent-1 ql-align-right">text</p>');
  });
});
