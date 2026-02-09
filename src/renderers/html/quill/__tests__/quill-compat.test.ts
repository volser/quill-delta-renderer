// @vitest-environment jsdom
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Delta } from '../../../../core/ast-types';
import { normalizeHtml } from './normalize-html';
import { renderDelta } from './test-helpers';

// ─── Quill setup helpers ─────────────────────────────────────────────────────

let quill: InstanceType<typeof Quill>;
let container: HTMLDivElement;

function getQuillHtml(delta: Delta): string {
  container = document.createElement('div');
  document.body.appendChild(container);
  quill = new Quill(container);
  quill.setContents(delta.ops);
  return quill.root.innerHTML;
}

function assertHtmlMatch(delta: Delta): void {
  const quillHtml = normalizeHtml(getQuillHtml(delta));
  const rendererHtml = normalizeHtml(renderDelta(delta));
  expect(rendererHtml).toBe(quillHtml);
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
});

// ─── Basic text ──────────────────────────────────────────────────────────────

describe('Quill compat: basic text', () => {
  it('plain paragraph', () => {
    assertHtmlMatch({ ops: [{ insert: 'Hello World\n' }] });
  });

  it('empty paragraph', () => {
    assertHtmlMatch({ ops: [{ insert: '\n' }] });
  });

  it('multiple paragraphs', () => {
    assertHtmlMatch({ ops: [{ insert: 'Line 1\nLine 2\nLine 3\n' }] });
  });

  it('multiple empty paragraphs', () => {
    assertHtmlMatch({ ops: [{ insert: '\n\n\n' }] });
  });
});

// ─── Inline marks ────────────────────────────────────────────────────────────

describe('Quill compat: inline marks', () => {
  it('bold', () => {
    assertHtmlMatch({
      ops: [{ insert: 'bold', attributes: { bold: true } }, { insert: '\n' }],
    });
  });

  it('italic', () => {
    assertHtmlMatch({
      ops: [{ insert: 'italic', attributes: { italic: true } }, { insert: '\n' }],
    });
  });

  it('underline', () => {
    assertHtmlMatch({
      ops: [{ insert: 'underline', attributes: { underline: true } }, { insert: '\n' }],
    });
  });

  it('strikethrough', () => {
    assertHtmlMatch({
      ops: [{ insert: 'strike', attributes: { strike: true } }, { insert: '\n' }],
    });
  });

  it('inline code', () => {
    assertHtmlMatch({
      ops: [{ insert: 'code', attributes: { code: true } }, { insert: '\n' }],
    });
  });

  it('subscript', () => {
    assertHtmlMatch({
      ops: [{ insert: 'sub', attributes: { script: 'sub' } }, { insert: '\n' }],
    });
  });

  it('superscript', () => {
    assertHtmlMatch({
      ops: [{ insert: 'sup', attributes: { script: 'super' } }, { insert: '\n' }],
    });
  });

  it('link', () => {
    assertHtmlMatch({
      ops: [{ insert: 'click', attributes: { link: 'https://example.com' } }, { insert: '\n' }],
    });
  });

  it('bold + italic combined', () => {
    assertHtmlMatch({
      ops: [{ insert: 'both', attributes: { bold: true, italic: true } }, { insert: '\n' }],
    });
  });

  it('strike + underline combined', () => {
    assertHtmlMatch({
      ops: [{ insert: 'combo', attributes: { strike: true, underline: true } }, { insert: '\n' }],
    });
  });
});

// ─── Inline attributors ──────────────────────────────────────────────────────

describe('Quill compat: inline attributors', () => {
  it('color', () => {
    assertHtmlMatch({
      ops: [{ insert: 'red', attributes: { color: '#e60000' } }, { insert: '\n' }],
    });
  });

  it('background', () => {
    assertHtmlMatch({
      ops: [{ insert: 'highlight', attributes: { background: '#ffebcc' } }, { insert: '\n' }],
    });
  });

  it('font', () => {
    assertHtmlMatch({
      ops: [{ insert: 'mono', attributes: { font: 'monospace' } }, { insert: '\n' }],
    });
  });

  it('size', () => {
    assertHtmlMatch({
      ops: [{ insert: 'big', attributes: { size: 'large' } }, { insert: '\n' }],
    });
  });

  it('color + background + bold combined', () => {
    assertHtmlMatch({
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

describe('Quill compat: block formats', () => {
  it('header h1', () => {
    assertHtmlMatch({
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1 } }],
    });
  });

  it('header h2', () => {
    assertHtmlMatch({
      ops: [{ insert: 'Subtitle' }, { insert: '\n', attributes: { header: 2 } }],
    });
  });

  it('header h3', () => {
    assertHtmlMatch({
      ops: [{ insert: 'Section' }, { insert: '\n', attributes: { header: 3 } }],
    });
  });

  it('empty header', () => {
    assertHtmlMatch({
      ops: [{ insert: '\n', attributes: { header: 1 } }],
    });
  });

  it('blockquote', () => {
    assertHtmlMatch({
      ops: [{ insert: 'A quote' }, { insert: '\n', attributes: { blockquote: true } }],
    });
  });

  it('empty blockquote', () => {
    assertHtmlMatch({
      ops: [{ insert: '\n', attributes: { blockquote: true } }],
    });
  });

  it('single code block', () => {
    assertHtmlMatch({
      ops: [{ insert: 'const x = 1;' }, { insert: '\n', attributes: { 'code-block': true } }],
    });
  });

  it('multi-line code block', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'line 1' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 2' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'line 3' },
        { insert: '\n', attributes: { 'code-block': true } },
      ],
    });
  });

  it('code block with language', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'const x = 1;' },
        { insert: '\n', attributes: { 'code-block': 'javascript' } },
      ],
    });
  });

  it('empty code block', () => {
    assertHtmlMatch({
      ops: [{ insert: '\n', attributes: { 'code-block': true } }],
    });
  });
});

// ─── Block attributors ───────────────────────────────────────────────────────

describe('Quill compat: block attributors', () => {
  it('align center', () => {
    assertHtmlMatch({
      ops: [{ insert: 'centered' }, { insert: '\n', attributes: { align: 'center' } }],
    });
  });

  it('align right', () => {
    assertHtmlMatch({
      ops: [{ insert: 'right' }, { insert: '\n', attributes: { align: 'right' } }],
    });
  });

  it('align justify', () => {
    assertHtmlMatch({
      ops: [{ insert: 'justified' }, { insert: '\n', attributes: { align: 'justify' } }],
    });
  });

  it('indent 1', () => {
    assertHtmlMatch({
      ops: [{ insert: 'indented' }, { insert: '\n', attributes: { indent: 1 } }],
    });
  });

  it('indent 3', () => {
    assertHtmlMatch({
      ops: [{ insert: 'deep indent' }, { insert: '\n', attributes: { indent: 3 } }],
    });
  });

  it('direction rtl', () => {
    assertHtmlMatch({
      ops: [{ insert: 'rtl text' }, { insert: '\n', attributes: { direction: 'rtl' } }],
    });
  });

  it('combined indent + align', () => {
    assertHtmlMatch({
      ops: [{ insert: 'text' }, { insert: '\n', attributes: { indent: 1, align: 'right' } }],
    });
  });

  it('header with align', () => {
    assertHtmlMatch({
      ops: [{ insert: 'Title' }, { insert: '\n', attributes: { header: 1, align: 'center' } }],
    });
  });
});

// ─── Lists ───────────────────────────────────────────────────────────────────

describe('Quill compat: lists', () => {
  it('bullet list', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'Item 1' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item 2' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
  });

  it('ordered list', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'First' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Second' },
        { insert: '\n', attributes: { list: 'ordered' } },
      ],
    });
  });

  it('checked list', () => {
    assertHtmlMatch({
      ops: [{ insert: 'Done' }, { insert: '\n', attributes: { list: 'checked' } }],
    });
  });

  it('unchecked list', () => {
    assertHtmlMatch({
      ops: [{ insert: 'Not done' }, { insert: '\n', attributes: { list: 'unchecked' } }],
    });
  });

  it('mixed checked/unchecked', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'Done' },
        { insert: '\n', attributes: { list: 'checked' } },
        { insert: 'Not done' },
        { insert: '\n', attributes: { list: 'unchecked' } },
      ],
    });
  });

  it('nested list with indent', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'Parent' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Child' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
      ],
    });
  });

  it('empty list item', () => {
    assertHtmlMatch({
      ops: [{ insert: '\n', attributes: { list: 'bullet' } }],
    });
  });

  it('switching between ordered and bullet', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'ordered' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'bullet' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
  });

  it('list item with align', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'centered' },
        { insert: '\n', attributes: { list: 'bullet', align: 'center' } },
      ],
    });
  });
});

// ─── Embeds ──────────────────────────────────────────────────────────────────

describe('Quill compat: embeds', () => {
  it('image', () => {
    assertHtmlMatch({
      ops: [{ insert: { image: 'https://example.com/img.png' } }, { insert: '\n' }],
    });
  });

  it('image with alt and width', () => {
    assertHtmlMatch({
      ops: [
        {
          insert: { image: 'https://example.com/img.png' },
          attributes: { alt: 'Photo', width: '200' },
        },
        { insert: '\n' },
      ],
    });
  });

  it('video', () => {
    assertHtmlMatch({
      ops: [{ insert: { video: 'https://www.youtube.com/embed/abc' } }, { insert: '\n' }],
    });
  });

  it('video with dimensions', () => {
    assertHtmlMatch({
      ops: [
        {
          insert: { video: 'https://www.youtube.com/embed/abc' },
          attributes: { width: '640', height: '360' },
        },
        { insert: '\n' },
      ],
    });
  });
});

// ─── Complex mixed content ───────────────────────────────────────────────────

describe('Quill compat: complex mixed content', () => {
  it('paragraph with inline marks + header + list + blockquote', () => {
    assertHtmlMatch({
      ops: [
        // Paragraph with bold + italic text
        { insert: 'Normal text ' },
        { insert: 'bold', attributes: { bold: true } },
        { insert: ' and ' },
        { insert: 'italic', attributes: { italic: true } },
        { insert: '\n' },
        // Header
        { insert: 'My Header' },
        { insert: '\n', attributes: { header: 2 } },
        // Bullet list
        { insert: 'Item A' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item B' },
        { insert: '\n', attributes: { list: 'bullet' } },
        // Blockquote
        { insert: 'A famous quote' },
        { insert: '\n', attributes: { blockquote: true } },
        // Trailing paragraph
        { insert: 'Final paragraph\n' },
      ],
    });
  });

  it('code block surrounded by paragraphs', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'Before code\n' },
        { insert: 'function foo() {}' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: '  return 42;' },
        { insert: '\n', attributes: { 'code-block': true } },
        { insert: 'After code\n' },
      ],
    });
  });

  it('paragraph with link + color + bold', () => {
    assertHtmlMatch({
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

  it('header with inline formatting', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'Plain and ' },
        { insert: 'bold header', attributes: { bold: true } },
        { insert: '\n', attributes: { header: 1 } },
      ],
    });
  });

  it('ordered list with formatted items', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'Bold item', attributes: { bold: true } },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Link item', attributes: { link: 'https://example.com' } },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Italic item', attributes: { italic: true } },
        { insert: '\n', attributes: { list: 'ordered' } },
      ],
    });
  });

  it('multiple block types in sequence', () => {
    assertHtmlMatch({
      ops: [
        // h1
        { insert: 'Title' },
        { insert: '\n', attributes: { header: 1 } },
        // Regular paragraph
        { insert: 'Intro text\n' },
        // h2
        { insert: 'Section' },
        { insert: '\n', attributes: { header: 2 } },
        // Bullet list
        { insert: 'Point 1' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Point 2' },
        { insert: '\n', attributes: { list: 'bullet' } },
        // Code block
        { insert: 'let x = 1;' },
        { insert: '\n', attributes: { 'code-block': true } },
        // Blockquote
        { insert: 'Quote' },
        { insert: '\n', attributes: { blockquote: true } },
        // h3 with alignment
        { insert: 'Centered' },
        { insert: '\n', attributes: { header: 3, align: 'center' } },
        // Final paragraph
        { insert: 'End\n' },
      ],
    });
  });

  it('deeply nested list structure', () => {
    assertHtmlMatch({
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

  it('indented paragraph with direction and alignment', () => {
    assertHtmlMatch({
      ops: [
        { insert: 'RTL centered' },
        { insert: '\n', attributes: { direction: 'rtl', align: 'center', indent: 1 } },
      ],
    });
  });
});
