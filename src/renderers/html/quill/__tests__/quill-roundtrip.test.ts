// @vitest-environment jsdom
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Delta } from '../../../../core/ast-types';
import { renderDelta } from './test-helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const containers: HTMLDivElement[] = [];

function createQuill(): InstanceType<typeof Quill> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  return new Quill(container);
}

/**
 * Round-trip comparison:
 *
 * Path A: Delta → our renderer → HTML → Quill reads it → getContents()
 * Path B: Delta → Quill setContents() directly → getContents()
 *
 * If Quill produces the same delta from both paths, our HTML is
 * semantically identical to what Quill would produce.
 */
function assertRoundTrip(delta: Delta): void {
  // Path A: render with our renderer, feed HTML to Quill
  const html = renderDelta(delta);
  const quillA = createQuill();
  quillA.clipboard.dangerouslyPasteHTML(html);
  const deltaA = quillA.getContents();

  // Path B: load delta directly into Quill
  const quillB = createQuill();
  quillB.setContents(delta.ops);
  const deltaB = quillB.getContents();

  // Both paths should produce identical deltas
  expect(deltaA.ops).toEqual(deltaB.ops);
}

beforeEach(() => {
  document.body.innerHTML = '';
  containers.length = 0;
});

afterEach(() => {
  for (const c of containers) {
    c.parentNode?.removeChild(c);
  }
});

// ─── Basic text ──────────────────────────────────────────────────────────────

describe('Round-trip: basic text', () => {
  it('plain paragraph', () => {
    assertRoundTrip({ ops: [{ insert: 'Hello World\n' }] });
  });

  it('empty paragraph', () => {
    assertRoundTrip({ ops: [{ insert: '\n' }] });
  });

  it('multiple paragraphs', () => {
    assertRoundTrip({ ops: [{ insert: 'Line 1\nLine 2\nLine 3\n' }] });
  });
});

// ─── Inline marks ────────────────────────────────────────────────────────────

describe('Round-trip: inline marks', () => {
  it('bold', () => {
    assertRoundTrip({
      ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }],
    });
  });

  it('italic', () => {
    assertRoundTrip({
      ops: [{ insert: 'italic', attributes: { italic: true } }, { insert: '\n' }],
    });
  });

  it('underline', () => {
    assertRoundTrip({
      ops: [{ insert: 'underline', attributes: { underline: true } }, { insert: '\n' }],
    });
  });

  it('strikethrough', () => {
    assertRoundTrip({
      ops: [{ insert: 'strike', attributes: { strike: true } }, { insert: '\n' }],
    });
  });

  it('inline code', () => {
    assertRoundTrip({
      ops: [{ insert: 'code', attributes: { code: true } }, { insert: '\n' }],
    });
  });

  it('subscript', () => {
    assertRoundTrip({
      ops: [{ insert: 'sub', attributes: { script: 'sub' } }, { insert: '\n' }],
    });
  });

  it('superscript', () => {
    assertRoundTrip({
      ops: [{ insert: 'sup', attributes: { script: 'super' } }, { insert: '\n' }],
    });
  });

  it('link', () => {
    assertRoundTrip({
      ops: [{ insert: 'click', attributes: { link: 'https://example.com' } }, { insert: '\n' }],
    });
  });

  it('bold + italic combined', () => {
    assertRoundTrip({
      ops: [{ insert: 'both', attributes: { bold: true, italic: true } }, { insert: '\n' }],
    });
  });

  it('strike + underline combined', () => {
    assertRoundTrip({
      ops: [{ insert: 'combo', attributes: { strike: true, underline: true } }, { insert: '\n' }],
    });
  });
});

// ─── Inline attributors ──────────────────────────────────────────────────────

describe('Round-trip: inline attributors', () => {
  it('color', () => {
    assertRoundTrip({
      ops: [{ insert: 'red', attributes: { color: '#e60000' } }, { insert: '\n' }],
    });
  });

  it('background', () => {
    assertRoundTrip({
      ops: [{ insert: 'highlight', attributes: { background: '#ffebcc' } }, { insert: '\n' }],
    });
  });

  it('font', () => {
    assertRoundTrip({
      ops: [{ insert: 'mono', attributes: { font: 'monospace' } }, { insert: '\n' }],
    });
  });

  it('size', () => {
    assertRoundTrip({
      ops: [{ insert: 'big', attributes: { size: 'large' } }, { insert: '\n' }],
    });
  });

  it('color + background + bold combined', () => {
    assertRoundTrip({
      ops: [
        {
          insert: 'styled',
          attributes: { color: '#e60000', background: '#ffebcc', bold: true },
        },
        { insert: '\n' },
      ],
    });
  });
});

// ─── Block formats ───────────────────────────────────────────────────────────

describe('Round-trip: block formats', () => {
  it('header h1', () => {
    assertRoundTrip({
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
    });
  });

  it('header h2', () => {
    assertRoundTrip({
      ops: [{ insert: 'Subtitle' }, { insert: '\n', attributes: { header: 2 } }],
    });
  });

  it('header h3', () => {
    assertRoundTrip({
      ops: [{ insert: 'Section' }, { insert: '\n', attributes: { header: 3 } }],
    });
  });

  it('blockquote', () => {
    assertRoundTrip({
      ops: [{ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }],
    });
  });

  it('code block', () => {
    assertRoundTrip({
      ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
    });
  });

  it('multi-line code block', () => {
    assertRoundTrip({
      ops: [
        { insert: 'line 1' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 2' },
        { insert: '\n', attributes: { 'code-block': true } },
      ],
    });
  });

  it('code block with language', () => {
    assertRoundTrip({
      ops: [
        { insert: 'const x = 1;' },
        { insert: '\n', attributes: { 'code-block': 'javascript' } },
      ],
    });
  });
});

// ─── Block attributors ───────────────────────────────────────────────────────

describe('Round-trip: block attributors', () => {
  it('align center', () => {
    assertRoundTrip({
      ops: [{ insert: 'centered' }, { insert: '\n', attributes: { align: 'center' } }],
    });
  });

  it('align right', () => {
    assertRoundTrip({
      ops: [{ insert: 'right' }, { insert: '\n', attributes: { align: 'right' } }],
    });
  });

  it('indent 1', () => {
    assertRoundTrip({
      ops: [{ insert: 'indented' }, { insert: '\n', attributes: { indent: 1 } }],
    });
  });

  it('indent 3', () => {
    assertRoundTrip({
      ops: [{ insert: 'deep indent' }, { insert: '\n', attributes: { indent: 3 } }],
    });
  });

  it('direction rtl', () => {
    assertRoundTrip({
      ops: [{ insert: 'rtl text' }, { insert: '\n', attributes: { direction: 'rtl' } }],
    });
  });

  it('combined indent + align', () => {
    assertRoundTrip({
      ops: [{ insert: 'text' }, { insert: '\n', attributes: { indent: 1, align: 'right' } }],
    });
  });

  it('header with align', () => {
    assertRoundTrip({
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1, align: 'center' } }],
    });
  });
});

// ─── Lists ───────────────────────────────────────────────────────────────────

describe('Round-trip: lists', () => {
  it('bullet list', () => {
    assertRoundTrip({
      ops: [
        { insert: 'Item 1' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item 2' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
  });

  it('ordered list', () => {
    assertRoundTrip({
      ops: [
        { insert: 'First' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Second' },
        { insert: '\n', attributes: { list: 'ordered' } },
      ],
    });
  });

  it('checked list', () => {
    assertRoundTrip({
      ops: [{ insert: 'Done' }, { insert: '\n', attributes: { list: 'checked' } }],
    });
  });

  it('unchecked list', () => {
    assertRoundTrip({
      ops: [{ insert: 'Not done' }, { insert: '\n', attributes: { list: 'unchecked' } }],
    });
  });

  it('nested list with indent', () => {
    assertRoundTrip({
      ops: [
        { insert: 'Parent' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Child' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
      ],
    });
  });

  it('list item with align', () => {
    assertRoundTrip({
      ops: [
        { insert: 'centered' },
        { insert: '\n', attributes: { list: 'bullet', align: 'center' } },
      ],
    });
  });
});

// ─── Tables ──────────────────────────────────────────────────────────────────

describe('Round-trip: tables', () => {
  it('single cell', () => {
    assertRoundTrip({
      ops: [{ insert: 'Cell' }, { insert: '\n', attributes: { table: 'row-1' } }],
    });
  });

  it('2x2 table', () => {
    assertRoundTrip({
      ops: [
        { insert: 'A1' },
        { insert: '\n', attributes: { table: 'row-1' } },
        { insert: 'A2' },
        { insert: '\n', attributes: { table: 'row-1' } },
        { insert: 'B1' },
        { insert: '\n', attributes: { table: 'row-2' } },
        { insert: 'B2' },
        { insert: '\n', attributes: { table: 'row-2' } },
      ],
    });
  });

  it('table with formatted content', () => {
    assertRoundTrip({
      ops: [
        { insert: 'Bold', attributes: { bold: true } },
        { insert: '\n', attributes: { table: 'row-1' } },
        { insert: 'Normal' },
        { insert: '\n', attributes: { table: 'row-1' } },
      ],
    });
  });

  it('table surrounded by paragraphs', () => {
    assertRoundTrip({
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

// ─── Embeds ──────────────────────────────────────────────────────────────────

describe('Round-trip: embeds', () => {
  it('image', () => {
    assertRoundTrip({
      ops: [{ insert: { image: 'https://example.com/img.png' } }, { insert: '\n' }],
    });
  });

  it('video within content', () => {
    // Standalone video omitted: Quill clipboard.convert doesn't append
    // trailing \n for block embeds, causing a delta shape mismatch.
    // This is a clipboard parsing quirk, not a renderer issue
    // (the HTML compat test proves the output is correct).
    assertRoundTrip({
      ops: [
        { insert: 'Before\n' },
        { insert: { video: 'https://www.youtube.com/embed/abc' } },
        { insert: 'After\n' },
      ],
    });
  });
});

// ─── Complex mixed content ───────────────────────────────────────────────────

describe('Round-trip: complex mixed content', () => {
  it('paragraph + header + list + blockquote', () => {
    assertRoundTrip({
      ops: [
        { insert: 'Normal ' },
        { insert: 'bold', attributes: { bold: true } },
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

  it('paragraph with link + color + bold', () => {
    assertRoundTrip({
      ops: [
        { insert: 'Visit ' },
        {
          insert: 'this site',
          attributes: { link: 'https://example.com', bold: true },
        },
        { insert: ' for ' },
        { insert: 'red info', attributes: { color: '#e60000' } },
        { insert: '\n' },
      ],
    });
  });

  it('code block surrounded by paragraphs', () => {
    // Note: leading whitespace in code lines is stripped by Quill's
    // clipboard parser (a known jsdom/clipboard limitation, not a
    // renderer issue — the HTML compat test proves exact output match).
    assertRoundTrip({
      ops: [
        { insert: 'Before code\n' },
        { insert: 'function foo() {}' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'return 42;' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'After code\n' },
      ],
    });
  });

  it('deeply nested list structure', () => {
    assertRoundTrip({
      ops: [
        { insert: 'Level 0' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Level 1' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
        { insert: 'Level 2' },
        { insert: '\n', attributes: { list: 'bullet', indent: 2 } },
        { insert: 'Back to 0' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
  });

  it('multiple block types in sequence', () => {
    assertRoundTrip({
      ops: [
        { insert: 'Title' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: 'Intro text\n' },
        { insert: 'Section' },
        { insert: '\n', attributes: { header: 2 } },
        { insert: 'Point 1' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Point 2' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'let x = 1;' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'Quote' },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: 'End\n' },
      ],
    });
  });
});
