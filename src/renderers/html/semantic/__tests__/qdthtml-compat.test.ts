/**
 * Compatibility tests: SemanticHtmlRenderer vs quill-delta-to-html (v0.12.1)
 *
 * Verifies that SemanticHtmlRenderer produces identical HTML to the
 * quill-delta-to-html library for all supported Quill Delta formats.
 *
 * Both libraries share the same design goals and default configuration
 * (classPrefix: 'ql', linkTarget: '_blank', encodeHtml: true), so their
 * output should be identical for most cases after normalization.
 *
 * Known semantic differences are documented in a separate section at the
 * end. These are intentional design choices, not bugs.
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
 * - Sort class names alphabetically within each `class="..."` attribute
 * - Sort attributes alphabetically within each tag
 * - Mark nesting order: flatten and re-sort nested inline tags
 *   (e.g. `<em><strong>` vs `<strong><em>` are visually identical)
 */
function normalizeHtml(html: string): string {
  return (
    html
      // Normalize self-closing: <br> → <br/>  and  <tag ... /> → <tag .../> (no space)
      .replace(/<br>/g, '<br/>')
      .replace(/\s+\/>/g, '/>')
      // Sort class names within class="..." attributes
      .replace(/class="([^"]*)"/g, (_match, classes: string) => {
        const sorted = classes.split(/\s+/).filter(Boolean).sort().join(' ');
        return `class="${sorted}"`;
      })
      // Sort attributes within tags
      .replace(/<(\w+)((?:\s+[a-z-]+="[^"]*")+)(\/?)>/g, (_match, tag, attrs: string, slash) => {
        const attrList = attrs
          .trim()
          .match(/[a-z-]+="[^"]*"/g)!
          .sort();
        return `<${tag} ${attrList.join(' ')}${slash}>`;
      })
      .trim()
  );
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
// The following tests document intentional design differences between
// SemanticHtmlRenderer and quill-delta-to-html. Both outputs are valid HTML;
// the semantic renderer makes deliberate choices that improve correctness
// or match Quill editor behavior more closely.
// ─────────────────────────────────────────────────────────────────────────────

describe('qdthtml known differences: inline mark nesting order', () => {
  // When multiple inline marks apply to the same text, the nesting order
  // is cosmetically different but visually identical:
  // Semantic: <em><strong>text</strong></em>
  // Legacy:   <strong><em>text</em></strong>

  it('bold + italic: different nesting, same visual result', () => {
    const delta: Delta = {
      ops: [{ insert: 'both', attributes: { bold: true, italic: true } }, { insert: '\n' }],
    };

    expect(renderSemantic(delta)).toBe('<p><em><strong>both</strong></em></p>');
    expect(renderLegacy(delta)).toBe('<p><strong><em>both</em></strong></p>');
  });

  it('strike + underline: different nesting, same visual result', () => {
    const delta: Delta = {
      ops: [{ insert: 'combo', attributes: { strike: true, underline: true } }, { insert: '\n' }],
    };

    expect(renderSemantic(delta)).toBe('<p><u><s>combo</s></u></p>');
    expect(renderLegacy(delta)).toBe('<p><s><u>combo</u></s></p>');
  });
});

describe('qdthtml known differences: multi-newline inserts', () => {
  // quill-delta-to-html renders `{ insert: 'A\nB\n' }` as `<p>A<br/>B</p>`
  // (all lines in one <p> with <br/> separators).
  // SemanticHtmlRenderer correctly treats each `\n` as a paragraph boundary,
  // producing `<p>A</p><p>B</p>` — matching the Quill editor's DOM structure.

  it('multiple paragraphs via single insert', () => {
    const delta: Delta = { ops: [{ insert: 'Line 1\nLine 2\nLine 3\n' }] };

    expect(renderSemantic(delta)).toBe('<p>Line 1</p><p>Line 2</p><p>Line 3</p>');
    expect(renderLegacy(delta)).toBe('<p>Line 1<br/>Line 2<br/>Line 3</p>');
  });

  it('multiple empty paragraphs via single insert', () => {
    const delta: Delta = { ops: [{ insert: '\n\n\n' }] };

    expect(renderSemantic(delta)).toBe('<p><br/></p><p><br/></p><p><br/></p>');
    expect(renderLegacy(delta)).toBe('<p><br/><br/></p>');
  });
});

describe('qdthtml known differences: code blocks', () => {
  // SemanticHtmlRenderer always adds `class="ql-syntax"` to <pre> tags
  // (and `data-language` + language class for language-specific blocks).
  // quill-delta-to-html omits the class for plain code blocks.

  it('code block has ql-syntax class', () => {
    const delta: Delta = {
      ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
    };

    expect(renderSemantic(delta)).toBe('<pre class="ql-syntax">const x = 1;</pre>');
    expect(renderLegacy(delta)).toBe('<pre>const x = 1;</pre>');
  });

  it('multi-line code block has ql-syntax class', () => {
    const delta: Delta = {
      ops: [
        { insert: 'line 1' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 2' },
        { insert: '\n', attributes: { 'code-block': true } },
      ],
    };

    expect(renderSemantic(delta)).toBe('<pre class="ql-syntax">line 1\nline 2</pre>');
    expect(renderLegacy(delta)).toBe('<pre>line 1\nline 2</pre>');
  });

  it('empty code block', () => {
    const delta: Delta = {
      ops: [{ insert: '\n', attributes: { 'code-block': true } }],
    };

    expect(renderSemantic(delta)).toBe('<pre class="ql-syntax"></pre>');
    // Legacy adds a trailing newline inside the empty <pre>
    expect(renderLegacy(delta)).toBe('<pre>\n</pre>');
  });
});

describe('qdthtml known differences: nested list indent classes', () => {
  // SemanticHtmlRenderer preserves `ql-indent-N` classes on nested <li>
  // elements, which allows CSS-based indent styling to work correctly.
  // quill-delta-to-html strips them because it relies on HTML nesting alone.

  it('nested list items retain indent class', () => {
    const delta: Delta = {
      ops: [
        { insert: 'Parent' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Child' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
      ],
    };

    expect(renderSemantic(delta)).toBe(
      '<ul><li>Parent<ul><li class="ql-indent-1">Child</li></ul></li></ul>',
    );
    expect(renderLegacy(delta)).toBe('<ul><li>Parent<ul><li>Child</li></ul></li></ul>');
  });

  it('deeply nested list items retain indent classes', () => {
    const delta: Delta = {
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
    };

    expect(renderSemantic(delta)).toBe(
      '<ul><li>L0<ul><li class="ql-indent-1">L1<ul>' +
        '<li class="ql-indent-2">L2</li></ul></li></ul></li>' +
        '<li>Back to L0</li></ul>',
    );
    expect(renderLegacy(delta)).toBe(
      '<ul><li>L0<ul><li>L1<ul><li>L2</li></ul></li></ul></li>' + '<li>Back to L0</li></ul>',
    );
  });
});

describe('qdthtml known differences: images', () => {
  // quill-delta-to-html adds `class="ql-image"` to all <img> tags and
  // does not pass through the `alt` attribute from delta attributes.
  // SemanticHtmlRenderer omits the class and correctly renders `alt`.

  it('image: semantic omits ql-image class, legacy adds it', () => {
    const delta: Delta = {
      ops: [{ insert: { image: 'https://example.com/img.png' } }, { insert: '\n' }],
    };

    expect(normalizeHtml(renderSemantic(delta))).toBe(
      '<p><img src="https://example.com/img.png"/></p>',
    );
    expect(normalizeHtml(renderLegacy(delta))).toBe(
      '<p><img class="ql-image" src="https://example.com/img.png"/></p>',
    );
  });

  it('image with alt: semantic preserves alt, legacy drops it', () => {
    const delta: Delta = {
      ops: [
        {
          insert: { image: 'https://example.com/img.png' },
          attributes: { alt: 'A photo' },
        },
        { insert: '\n' },
      ],
    };

    expect(normalizeHtml(renderSemantic(delta))).toBe(
      '<p><img alt="A photo" src="https://example.com/img.png"/></p>',
    );
    // Legacy ignores alt attribute and adds ql-image class
    expect(normalizeHtml(renderLegacy(delta))).toBe(
      '<p><img class="ql-image" src="https://example.com/img.png"/></p>',
    );
  });
});
