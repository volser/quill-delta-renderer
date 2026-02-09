import { describe, expect, it } from 'vitest';
import type { Delta } from '../../../../core/ast-types';
import { parseQuillDelta } from '../../../../parse-quill-delta';
import { SemanticHtmlRenderer } from '../semantic-html-renderer';
import { renderDelta, renderDeltaWithMerger } from './test-helpers';

/** Render using the convenience API (parseQuillDelta includes codeBlockGrouper). */
function renderViaConvenience(delta: Delta): string {
  const ast = parseQuillDelta(delta);
  return new SemanticHtmlRenderer().render(ast);
}

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
    expect(html).toBe('<p class="ql-align-right ql-indent-1">text</p>');
  });
});

describe('SemanticHtmlRenderer integration: code-block-container (via parseQuillDelta)', () => {
  it('should render consecutive code blocks as one pre via codeBlockGrouper', () => {
    const html = renderViaConvenience({
      ops: [
        { insert: 'line 1' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 2' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 3' },
        { insert: '\n', attributes: { 'code-block': true } },
      ],
    });
    expect(html.match(/<pre/g)?.length).toBe(1);
    expect(html).toContain('line 1\nline 2\nline 3');
  });

  it('should include language class and data-language attr', () => {
    const html = renderViaConvenience({
      ops: [
        { insert: 'const x = 1;' },
        { insert: '\n', attributes: { 'code-block': 'javascript' } },
        { insert: 'const y = 2;' },
        { insert: '\n', attributes: { 'code-block': 'javascript' } },
      ],
    });
    expect(html).toContain('class="ql-syntax language-javascript"');
    expect(html).toContain('data-language="javascript"');
    expect(html).toContain('const x = 1;\nconst y = 2;');
  });

  it('should HTML-encode content inside code-block-container', () => {
    const html = renderViaConvenience({
      ops: [{ insert: '<div>hello</div>' }, { insert: '\n', attributes: { 'code-block': true } }],
    });
    expect(html).toContain('&lt;div&gt;hello&lt;/div&gt;');
  });

  it('should render a single code block as one pre', () => {
    const html = renderViaConvenience({
      ops: [{ insert: 'solo line' }, { insert: '\n', attributes: { 'code-block': true } }],
    });
    expect(html.match(/<pre/g)?.length).toBe(1);
    expect(html).toContain('solo line');
  });
});

describe('SemanticHtmlRenderer integration: multi-line code block merging', () => {
  it('should merge consecutive code blocks into one pre with newlines', () => {
    const html = renderDeltaWithMerger({
      ops: [
        { insert: 'line 1' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 2' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 3' },
        { insert: '\n', attributes: { 'code-block': true } },
      ],
    });
    expect(html).toContain('<pre');
    // Only one pre block (merged)
    expect(html.match(/<pre/g)?.length).toBe(1);
    expect(html).toContain('line 1');
    expect(html).toContain('line 2');
    expect(html).toContain('line 3');
  });

  it('should HTML-encode content inside code blocks', () => {
    const html = renderDeltaWithMerger({
      ops: [
        { insert: '<p>line 1</p>' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: '<p>line 2</p>' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: '<p>line 3</p>' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: '<p>line 4</p>' },
        { insert: '\n', attributes: { 'code-block': true } },
      ],
    });
    // HTML is encoded inside code blocks
    expect(html).toContain('&lt;p&gt;line 1&lt;/p&gt;');
    expect(html).toContain('&lt;p&gt;line 4&lt;/p&gt;');
    // Single pre block
    expect(html.match(/<pre/g)?.length).toBe(1);
  });
});
