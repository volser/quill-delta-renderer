/**
 * Compatibility tests: SemanticHtmlRenderer vs quill-delta-to-html (v0.12.1)
 *
 * Verifies that SemanticHtmlRenderer produces identical HTML to the
 * quill-delta-to-html library for all supported Quill Delta formats.
 *
 * With default configuration, SemanticHtmlRenderer produces byte-identical
 * output to quill-delta-to-html for all tested cases.
 *
 * Configurable behaviors (non-default → more semantic/accessible):
 *   - codeSyntaxClass: true  → adds `ql-syntax` class to <pre> (Quill editor compat)
 *   - imageClass: false      → removes `ql-image` class from images
 *   - preserveImageAlt: true → preserves alt attribute on images (accessibility)
 *   - blockMerger: false     → keeps paragraphs separate instead of merging with <br/>
 */
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import { describe, expect, it } from 'vitest';
import type { Delta, DeltaOp } from '../../../../core/ast-types';
import { parseQuillDelta } from '../../../../parse-quill-delta';
import { SemanticHtmlRenderer } from '../semantic-html-renderer';

// ─── Helpers ────────────────────────────────────────────────────────────────

const renderer = new SemanticHtmlRenderer();

function renderSemantic(delta: Delta): string {
  const ast = parseQuillDelta(delta);
  return renderer.render(ast);
}

function renderLegacy(delta: Delta): string {
  const converter = new QuillDeltaToHtmlConverter(delta.ops as DeltaOp[]);
  return converter.convert();
}

/**
 * Normalize trivial HTML differences that don't affect semantics:
 * - `<br>` → `<br/>`
 * - `<tag ... />` → `<tag .../>`  (no space before self-close)
 * - Sort class names alphabetically within each `class="..."` attribute
 * - Sort attributes alphabetically within each tag
 */
function normalizeHtml(html: string): string {
  return html
    .replace(/<br>/g, '<br/>')
    .replace(/\s+\/>/g, '/>')
    .replace(/class="([^"]*)"/g, (_match, classes: string) => {
      const sorted = classes.split(/\s+/).filter(Boolean).sort().join(' ');
      return `class="${sorted}"`;
    })
    .replace(/<(\w+)((?:\s+[a-z-]+="[^"]*")+)(\/?)>/g, (_match, tag, attrs: string, slash) => {
      const attrList = attrs
        .trim()
        .match(/[a-z-]+="[^"]*"/g)!
        .sort();
      return `<${tag} ${attrList.join(' ')}${slash}>`;
    })
    .trim();
}

function assertMatch(delta: Delta): void {
  const semanticHtml = normalizeHtml(renderSemantic(delta));
  const legacyHtml = normalizeHtml(renderLegacy(delta));
  expect(semanticHtml).toBe(legacyHtml);
}

// ─── Basic text ─────────────────────────────────────────────────────────────

describe('qdthtml compat: basic text', () => {
  it('plain paragraph', () => {
    assertMatch({ ops: [{ insert: 'Hello World\n' }] });
  });

  it('empty paragraph', () => {
    assertMatch({ ops: [{ insert: '\n' }] });
  });

  it('paragraph with special characters', () => {
    assertMatch({ ops: [{ insert: 'a < b & c > d "quoted"\n' }] });
  });
});

// ─── Inline marks ───────────────────────────────────────────────────────────

describe('qdthtml compat: inline marks', () => {
  it('bold', () => {
    assertMatch({
      ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }],
    });
  });

  it('italic', () => {
    assertMatch({
      ops: [{ insert: 'italic', attributes: { italic: true } }, { insert: '\n' }],
    });
  });

  it('underline', () => {
    assertMatch({
      ops: [{ insert: 'underline', attributes: { underline: true } }, { insert: '\n' }],
    });
  });

  it('strikethrough', () => {
    assertMatch({
      ops: [{ insert: 'strike', attributes: { strike: true } }, { insert: '\n' }],
    });
  });

  it('inline code', () => {
    assertMatch({
      ops: [{ insert: 'code', attributes: { code: true } }, { insert: '\n' }],
    });
  });

  it('subscript', () => {
    assertMatch({
      ops: [{ insert: 'sub', attributes: { script: 'sub' } }, { insert: '\n' }],
    });
  });

  it('superscript', () => {
    assertMatch({
      ops: [{ insert: 'sup', attributes: { script: 'super' } }, { insert: '\n' }],
    });
  });

  it('link', () => {
    assertMatch({
      ops: [{ insert: 'click', attributes: { link: 'https://example.com' } }, { insert: '\n' }],
    });
  });

  it('bold + italic combined', () => {
    assertMatch({
      ops: [{ insert: 'both', attributes: { bold: true, italic: true } }, { insert: '\n' }],
    });
  });

  it('strike + underline combined', () => {
    assertMatch({
      ops: [{ insert: 'combo', attributes: { strike: true, underline: true } }, { insert: '\n' }],
    });
  });

  it('bold + link combined', () => {
    assertMatch({
      ops: [
        { insert: 'bold link', attributes: { bold: true, link: 'https://example.com' } },
        { insert: '\n' },
      ],
    });
  });
});

// ─── Inline attributors ─────────────────────────────────────────────────────

describe('qdthtml compat: inline attributors', () => {
  it('color', () => {
    assertMatch({
      ops: [{ insert: 'red', attributes: { color: '#e60000' } }, { insert: '\n' }],
    });
  });

  it('background', () => {
    assertMatch({
      ops: [{ insert: 'highlight', attributes: { background: '#ffebcc' } }, { insert: '\n' }],
    });
  });

  it('font', () => {
    assertMatch({
      ops: [{ insert: 'mono', attributes: { font: 'monospace' } }, { insert: '\n' }],
    });
  });

  it('size', () => {
    assertMatch({
      ops: [{ insert: 'big', attributes: { size: 'large' } }, { insert: '\n' }],
    });
  });

  it('color on bold text', () => {
    assertMatch({
      ops: [{ insert: 'styled', attributes: { color: '#e60000', bold: true } }, { insert: '\n' }],
    });
  });

  it('background on italic text', () => {
    assertMatch({
      ops: [
        { insert: 'styled', attributes: { background: '#ffebcc', italic: true } },
        { insert: '\n' },
      ],
    });
  });
});

// ─── Block formats ──────────────────────────────────────────────────────────

describe('qdthtml compat: block formats', () => {
  it('header h1', () => {
    assertMatch({
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
    });
  });

  it('header h2', () => {
    assertMatch({
      ops: [{ insert: 'Subtitle' }, { insert: '\n', attributes: { header: 2 } }],
    });
  });

  it('header h3', () => {
    assertMatch({
      ops: [{ insert: 'Section' }, { insert: '\n', attributes: { header: 3 } }],
    });
  });

  it('header h4', () => {
    assertMatch({
      ops: [{ insert: 'Sub' }, { insert: '\n', attributes: { header: 4 } }],
    });
  });

  it('empty header', () => {
    assertMatch({
      ops: [{ insert: '\n', attributes: { header: 1 } }],
    });
  });

  it('blockquote', () => {
    assertMatch({
      ops: [{ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }],
    });
  });

  it('empty blockquote', () => {
    assertMatch({
      ops: [{ insert: '\n', attributes: { blockquote: true } }],
    });
  });
});

// ─── Block attributors ──────────────────────────────────────────────────────

describe('qdthtml compat: block attributors', () => {
  it('align center', () => {
    assertMatch({
      ops: [{ insert: 'centered' }, { insert: '\n', attributes: { align: 'center' } }],
    });
  });

  it('align right', () => {
    assertMatch({
      ops: [{ insert: 'right' }, { insert: '\n', attributes: { align: 'right' } }],
    });
  });

  it('align justify', () => {
    assertMatch({
      ops: [{ insert: 'justified' }, { insert: '\n', attributes: { align: 'justify' } }],
    });
  });

  it('indent 1', () => {
    assertMatch({
      ops: [{ insert: 'indented' }, { insert: '\n', attributes: { indent: 1 } }],
    });
  });

  it('indent 3', () => {
    assertMatch({
      ops: [{ insert: 'deep indent' }, { insert: '\n', attributes: { indent: 3 } }],
    });
  });

  it('direction rtl', () => {
    assertMatch({
      ops: [{ insert: 'rtl text' }, { insert: '\n', attributes: { direction: 'rtl' } }],
    });
  });

  it('combined indent + align', () => {
    assertMatch({
      ops: [{ insert: 'text' }, { insert: '\n', attributes: { indent: 1, align: 'right' } }],
    });
  });

  it('header with align', () => {
    assertMatch({
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1, align: 'center' } }],
    });
  });
});

// ─── Lists ──────────────────────────────────────────────────────────────────

describe('qdthtml compat: lists', () => {
  it('bullet list', () => {
    assertMatch({
      ops: [
        { insert: 'Item 1' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item 2' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
  });

  it('ordered list', () => {
    assertMatch({
      ops: [
        { insert: 'First' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Second' },
        { insert: '\n', attributes: { list: 'ordered' } },
      ],
    });
  });

  it('checked list', () => {
    assertMatch({
      ops: [{ insert: 'Done' }, { insert: '\n', attributes: { list: 'checked' } }],
    });
  });

  it('unchecked list', () => {
    assertMatch({
      ops: [{ insert: 'Not done' }, { insert: '\n', attributes: { list: 'unchecked' } }],
    });
  });

  it('mixed checked/unchecked', () => {
    assertMatch({
      ops: [
        { insert: 'Done' },
        { insert: '\n', attributes: { list: 'checked' } },
        { insert: 'Not done' },
        { insert: '\n', attributes: { list: 'unchecked' } },
      ],
    });
  });

  it('nested list with indent', () => {
    assertMatch({
      ops: [
        { insert: 'Parent' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Child' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
      ],
    });
  });

  it('deeply nested list', () => {
    assertMatch({
      ops: [
        { insert: 'L0' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'L1' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
        { insert: 'L2' },
        { insert: '\n', attributes: { list: 'bullet', indent: 2 } },
        { insert: 'Back to L0' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
  });

  it('empty list item', () => {
    assertMatch({
      ops: [{ insert: '\n', attributes: { list: 'bullet' } }],
    });
  });

  it('ordered then bullet', () => {
    assertMatch({
      ops: [
        { insert: 'ordered' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'bullet' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
  });

  it('list item with formatted text', () => {
    assertMatch({
      ops: [
        { insert: 'Bold item', attributes: { bold: true } },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Link item', attributes: { link: 'https://example.com' } },
        { insert: '\n', attributes: { list: 'ordered' } },
      ],
    });
  });
});

// ─── Embeds ─────────────────────────────────────────────────────────────────

describe('qdthtml compat: embeds', () => {
  it('video', () => {
    assertMatch({
      ops: [{ insert: { video: 'https://www.youtube.com/embed/abc' } }, { insert: '\n' }],
    });
  });

  it('formula', () => {
    assertMatch({
      ops: [{ insert: { formula: 'e=mc^2' } }, { insert: '\n' }],
    });
  });
});

// ─── Tables ─────────────────────────────────────────────────────────────────

describe('qdthtml compat: tables', () => {
  it('single row', () => {
    assertMatch({
      ops: [
        { insert: 'A' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: 'B' },
        { insert: '\n', attributes: { table: 'r1' } },
      ],
    });
  });

  it('2x2 table', () => {
    assertMatch({
      ops: [
        { insert: 'A1' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: 'A2' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: 'B1' },
        { insert: '\n', attributes: { table: 'r2' } },
        { insert: 'B2' },
        { insert: '\n', attributes: { table: 'r2' } },
      ],
    });
  });

  it('table with formatted content', () => {
    assertMatch({
      ops: [
        { insert: 'Bold', attributes: { bold: true } },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: 'Normal' },
        { insert: '\n', attributes: { table: 'r1' } },
      ],
    });
  });

  it('table surrounded by paragraphs', () => {
    assertMatch({
      ops: [
        { insert: 'Before\n' },
        { insert: 'Cell A' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: 'Cell B' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: 'After\n' },
      ],
    });
  });
});

// ─── Complex mixed content ──────────────────────────────────────────────────

describe('qdthtml compat: complex mixed content', () => {
  it('paragraph + header + list + blockquote', () => {
    assertMatch({
      ops: [
        { insert: 'Normal text ' },
        { insert: 'bold', attributes: { bold: true } },
        { insert: ' and ' },
        { insert: 'italic', attributes: { italic: true } },
        { insert: '\n' },
        { insert: 'My Header' },
        { insert: '\n', attributes: { header: 2 } },
        { insert: 'Item A' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item B' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'A famous quote' },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: 'Final paragraph\n' },
      ],
    });
  });

  it('paragraph with link + color', () => {
    assertMatch({
      ops: [
        { insert: 'Visit ' },
        { insert: 'this site', attributes: { link: 'https://example.com', bold: true } },
        { insert: ' for ' },
        { insert: 'red info', attributes: { color: '#e60000' } },
        { insert: '\n' },
      ],
    });
  });

  it('header with inline formatting', () => {
    assertMatch({
      ops: [
        { insert: 'Plain and ' },
        { insert: 'bold header', attributes: { bold: true } },
        { insert: '\n', attributes: { header: 1 } },
      ],
    });
  });
});

// ─── Known differences ──────────────────────────────────────────────────────
//
// The remaining differences are intentional design choices where our
// ─── Configurable behaviors ──────────────────────────────────────────────────
// These sections test behaviors that are configurable via SemanticHtmlConfig
// or parseQuillDelta options. Defaults match quill-delta-to-html; opt-in
// flags enable more correct / accessible output.
// ─────────────────────────────────────────────────────────────────────────────

describe('qdthtml compat: multi-newline inserts', () => {
  // blockMerger (included in parseQuillDelta by default) merges
  // consecutive paragraphs with <br/> — matching quill-delta-to-html.

  it('multiple lines in single insert', () => {
    assertMatch({ ops: [{ insert: 'Line 1\nLine 2\nLine 3\n' }] });
  });

  it('multiple lines in separate inserts', () => {
    assertMatch({ ops: [{ insert: 'Line 1\n' }, { insert: 'Line 2\n' }, { insert: 'Line 3\n' }] });
  });

  it('empty paragraphs', () => {
    assertMatch({ ops: [{ insert: '\n\n\n' }] });
  });

  it('opt-out: blockMerger disabled produces separate paragraphs', () => {
    const delta: Delta = { ops: [{ insert: 'A\nB\n' }] };
    const ast = parseQuillDelta(delta, { blockMerger: { multiLineParagraph: false } });
    expect(renderer.render(ast)).toBe('<p>A</p><p>B</p>');
  });
});

describe('qdthtml compat: code blocks', () => {
  // By default, no ql-syntax class — matching quill-delta-to-html.
  // Set codeSyntaxClass: true to add it (matches Quill editor output).

  it('code block without ql-syntax class (default)', () => {
    assertMatch({
      ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
    });
  });

  it('multi-line code block', () => {
    assertMatch({
      ops: [
        { insert: 'line 1' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 2' },
        { insert: '\n', attributes: { 'code-block': true } },
      ],
    });
  });

  it('opt-in: codeSyntaxClass adds ql-syntax class', () => {
    const delta: Delta = {
      ops: [{ insert: 'code' }, { insert: '\n', attributes: { 'code-block': true } }],
    };
    const ast = parseQuillDelta(delta);
    const html = new SemanticHtmlRenderer({ codeSyntaxClass: true }).render(ast);
    expect(html).toBe('<pre class="ql-syntax">code</pre>');
  });
});

describe('qdthtml compat: images', () => {
  // By default, adds ql-image class and drops alt — matching quill-delta-to-html.
  // Set imageClass: false and preserveImageAlt: true for accessibility.

  it('image with ql-image class (default)', () => {
    assertMatch({
      ops: [{ insert: { image: 'https://example.com/img.png' } }, { insert: '\n' }],
    });
  });

  it('image with alt dropped (default)', () => {
    assertMatch({
      ops: [
        { insert: { image: 'https://example.com/img.png' }, attributes: { alt: 'A photo' } },
        { insert: '\n' },
      ],
    });
  });

  it('opt-in: preserveImageAlt keeps alt attribute', () => {
    const delta: Delta = {
      ops: [
        { insert: { image: 'https://example.com/img.png' }, attributes: { alt: 'A photo' } },
        { insert: '\n' },
      ],
    };
    const ast = parseQuillDelta(delta);
    const html = new SemanticHtmlRenderer({ preserveImageAlt: true, imageClass: false }).render(
      ast,
    );
    expect(normalizeHtml(html)).toBe(
      '<p><img alt="A photo" src="https://example.com/img.png"/></p>',
    );
  });
});
