import { describe, expect, it } from 'vitest';
import type { Delta } from '../../../../core/ast-types';
import { renderDelta } from './test-helpers';

describe('SemanticHtmlRenderer integration: full delta (quill-delta-to-html compat)', () => {
  it('should render delta1 with mixed inline formats', () => {
    const delta: Delta = {
      ops: [
        { insert: 'link', attributes: { link: 'http://a.com/?x=a&b=()' } },
        { insert: 'This ' },
        { attributes: { font: 'monospace' }, insert: 'is' },
        { insert: ' a ' },
        { attributes: { size: 'large' }, insert: 'test' },
        { insert: ' ' },
        { attributes: { italic: true, bold: true }, insert: 'data' },
        { insert: ' ' },
        { attributes: { underline: true, strike: true }, insert: 'that' },
        { insert: ' is ' },
        { attributes: { color: '#e60000' }, insert: 'will' },
        { insert: ' ' },
        { attributes: { background: '#ffebcc' }, insert: 'test' },
        { insert: ' ' },
        { attributes: { script: 'sub' }, insert: 'the' },
        { insert: ' ' },
        { attributes: { script: 'super' }, insert: 'rendering' },
        { insert: ' of ' },
        { attributes: { link: 'http://yahoo' }, insert: 'inline' },
        { insert: ' ' },
        { insert: { formula: 'x=data' } },
        { insert: ' formats.\n' },
        { insert: 'list' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'list' },
        { insert: '\n', attributes: { list: 'checked' } },
        { insert: 'some code', attributes: { code: true, bold: true } },
        { attributes: { italic: true, link: '#top', code: true }, insert: 'Top' },
        { insert: '\n' },
      ],
    };

    const html = renderDelta(delta);

    expect(html).toContain('<a href="http://a.com/?x=a&amp;b=()" target="_blank">link</a>');
    expect(html).toContain('<span class="ql-font-monospace">is</span>');
    expect(html).toContain('<span class="ql-size-large">test</span>');
    expect(html).toContain('<strong><em>data</em></strong>');
    expect(html).toContain('<s><u>that</u></s>');
    expect(html).toContain('style="color:#e60000"');
    expect(html).toContain('style="background-color:#ffebcc"');
    expect(html).toContain('<sub>the</sub>');
    expect(html).toContain('<sup>rendering</sup>');
    expect(html).toContain('<a href="http://yahoo" target="_blank">inline</a>');
    expect(html).toContain('<span class="ql-formula">x=data</span>');
    expect(html).toContain('<ul><li>list</li></ul>');
    expect(html).toContain('data-checked="true"');
    expect(html).toContain('<strong><code>some code</code></strong>');
    expect(html).toContain('<a href="#top" target="_blank"><em><code>Top</code></em></a>');
  });
});
