/**
 * Performance benchmarks: SemanticHtmlRenderer vs quill-delta-to-html
 *
 * Run with:
 *   npx vitest bench
 *
 * Each benchmark converts the same Quill Delta to HTML using both libraries,
 * measuring throughput (ops/sec) and relative performance.
 */
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import { bench, describe } from 'vitest';
import type { Delta, DeltaOp } from '../core/ast-types';
import { parseQuillDelta } from '../parse-quill-delta';
import { SemanticHtmlRenderer } from '../renderers/html/semantic/semantic-html-renderer';

// ─── Renderer Instances (reused across iterations) ──────────────────────────

const semanticRenderer = new SemanticHtmlRenderer();

function renderSemantic(delta: Delta): string {
  const ast = parseQuillDelta(delta);
  return semanticRenderer.render(ast);
}

function renderLegacy(delta: Delta): string {
  const converter = new QuillDeltaToHtmlConverter(delta.ops);
  return converter.convert();
}

// ─── Fixture Helpers ────────────────────────────────────────────────────────

function makeParagraphs(count: number): Delta {
  const ops: DeltaOp[] = [];
  for (let i = 0; i < count; i++) {
    ops.push({
      insert: `Paragraph ${i + 1} with some representative body text that spans a reasonable length.\n`,
    });
  }
  return { ops };
}

function makeFormattedText(count: number): Delta {
  const ops: DeltaOp[] = [];
  for (let i = 0; i < count; i++) {
    ops.push({ insert: 'Bold text ', attributes: { bold: true } });
    ops.push({ insert: 'italic text ', attributes: { italic: true } });
    ops.push({ insert: 'bold+italic ', attributes: { bold: true, italic: true } });
    ops.push({
      insert: 'colored link',
      attributes: { link: 'https://example.com', color: '#ff0000', bold: true },
    });
    ops.push({ insert: ' and normal text' });
    ops.push({ insert: '\n' });
  }
  return { ops };
}

function makeNestedLists(depth: number, itemsPerLevel: number): Delta {
  const ops: DeltaOp[] = [];
  for (let d = 0; d < depth; d++) {
    for (let i = 0; i < itemsPerLevel; i++) {
      ops.push({ insert: `Level ${d + 1} item ${i + 1}` });
      ops.push({ insert: '\n', attributes: { list: 'bullet', indent: d } });
    }
  }
  return { ops };
}

function makeHeaders(): Delta {
  const ops: DeltaOp[] = [];
  for (let level = 1; level <= 6; level++) {
    ops.push({ insert: `Heading Level ${level}` });
    ops.push({ insert: '\n', attributes: { header: level } });
    ops.push({ insert: 'Body text under the heading with some detail.\n' });
  }
  return { ops };
}

function makeCodeBlocks(blockCount: number, linesPerBlock: number): Delta {
  const ops: DeltaOp[] = [];
  for (let b = 0; b < blockCount; b++) {
    for (let l = 0; l < linesPerBlock; l++) {
      ops.push({ insert: `  const value${l} = compute(${l});` });
      ops.push({ insert: '\n', attributes: { 'code-block': 'javascript' } });
    }
    ops.push({ insert: '\n' }); // paragraph break between blocks
  }
  return { ops };
}

function makeEmbeds(count: number): Delta {
  const ops: DeltaOp[] = [];
  for (let i = 0; i < count; i++) {
    ops.push({ insert: `Text before embed ${i + 1}. ` });
    ops.push({ insert: { image: `https://example.com/img${i}.png` } });
    ops.push({ insert: '\n' });
  }
  return { ops };
}

function makeTables(rows: number, cols: number): Delta {
  const ops: DeltaOp[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ops.push({ insert: `R${r + 1}C${c + 1}` });
      ops.push({ insert: '\n', attributes: { table: `row-${r}` } });
    }
  }
  return { ops };
}

/** Realistic document: mixed content mimicking a real-world rich text note. */
function makeRealisticDocument(): Delta {
  const ops: DeltaOp[] = [
    // Title
    { insert: 'Project Status Update — Q4 2025' },
    { insert: '\n', attributes: { header: 1 } },

    // Intro paragraph with formatting
    { insert: 'This document outlines the ' },
    { insert: 'key milestones', attributes: { bold: true } },
    { insert: ' and ' },
    { insert: 'deliverables', attributes: { italic: true } },
    { insert: ' for the quarter. Please review before the ' },
    { insert: 'Friday standup', attributes: { bold: true, underline: true } },
    { insert: '.\n' },

    // Section header
    { insert: 'Completed Tasks' },
    { insert: '\n', attributes: { header: 2 } },

    // Checklist
    { insert: 'Migrated database to PostgreSQL 16' },
    { insert: '\n', attributes: { list: 'checked' } },
    { insert: 'Updated CI pipeline with caching' },
    { insert: '\n', attributes: { list: 'checked' } },
    { insert: 'Deployed v2.3.0 to staging' },
    { insert: '\n', attributes: { list: 'checked' } },
    { insert: 'Performance testing on staging' },
    { insert: '\n', attributes: { list: 'unchecked' } },

    // Another section
    { insert: 'Architecture Decision' },
    { insert: '\n', attributes: { header: 2 } },

    // Blockquote
    {
      insert:
        'We decided to adopt an AST-based rendering pipeline over direct string concatenation for flexibility and testability.',
    },
    { insert: '\n', attributes: { blockquote: true } },

    // Paragraph with link
    { insert: 'See the ' },
    { insert: 'RFC document', attributes: { link: 'https://docs.internal/rfc-042' } },
    { insert: ' for the full rationale. The ' },
    {
      insert: 'benchmark results',
      attributes: { link: 'https://perf.internal/bench/q4', bold: true },
    },
    { insert: ' show a 2.3x improvement.\n' },

    // Code block
    { insert: 'Key Metrics' },
    { insert: '\n', attributes: { header: 3 } },
    { insert: 'const metrics = {' },
    { insert: '\n', attributes: { 'code-block': 'typescript' } },
    { insert: '  parseTime: 0.8,   // ms per delta' },
    { insert: '\n', attributes: { 'code-block': 'typescript' } },
    { insert: '  renderTime: 0.3,  // ms per AST' },
    { insert: '\n', attributes: { 'code-block': 'typescript' } },
    { insert: '  totalOps: 520,    // tests passing' },
    { insert: '\n', attributes: { 'code-block': 'typescript' } },
    { insert: '};' },
    { insert: '\n', attributes: { 'code-block': 'typescript' } },

    // Image embed
    { insert: '\nPerformance chart:\n' },
    { insert: { image: 'https://charts.internal/perf-q4.png' } },
    { insert: '\n' },

    // Ordered list
    { insert: 'Next Steps' },
    { insert: '\n', attributes: { header: 2 } },
    { insert: 'Finalize v2.3.0 release notes' },
    { insert: '\n', attributes: { list: 'ordered' } },
    { insert: 'Run load tests on production-like environment' },
    { insert: '\n', attributes: { list: 'ordered' } },
    { insert: 'Schedule rollout for Monday' },
    { insert: '\n', attributes: { list: 'ordered' } },
    { insert: 'Notify stakeholders via ' },
    { insert: 'Slack', attributes: { bold: true } },
    { insert: '\n', attributes: { list: 'ordered' } },

    // Formatted closing
    { insert: '\n' },
    { insert: 'Updated by ', attributes: { italic: true } },
    { insert: '@sergiy', attributes: { italic: true, bold: true, color: '#1a73e8' } },
    { insert: ' on 2025-12-15', attributes: { italic: true } },
    { insert: '\n' },
  ];
  return { ops };
}

// ─── Fixtures ───────────────────────────────────────────────────────────────

const SMALL_PLAIN = makeParagraphs(5);
const MEDIUM_PLAIN = makeParagraphs(50);
const LARGE_PLAIN = makeParagraphs(500);

const SMALL_FORMATTED = makeFormattedText(5);
const MEDIUM_FORMATTED = makeFormattedText(50);
const LARGE_FORMATTED = makeFormattedText(200);

const NESTED_LIST = makeNestedLists(5, 4);
const HEADERS_DOC = makeHeaders();
const CODE_BLOCKS = makeCodeBlocks(5, 10);
const EMBEDS_DOC = makeEmbeds(20);
const TABLE_DOC = makeTables(10, 4);
const REALISTIC_DOC = makeRealisticDocument();

// ─── Benchmarks ─────────────────────────────────────────────────────────────

describe('Plain text paragraphs', () => {
  bench('SemanticHtmlRenderer — 5 paragraphs', () => {
    renderSemantic(SMALL_PLAIN);
  });
  bench('quill-delta-to-html — 5 paragraphs', () => {
    renderLegacy(SMALL_PLAIN);
  });

  bench('SemanticHtmlRenderer — 50 paragraphs', () => {
    renderSemantic(MEDIUM_PLAIN);
  });
  bench('quill-delta-to-html — 50 paragraphs', () => {
    renderLegacy(MEDIUM_PLAIN);
  });

  bench('SemanticHtmlRenderer — 500 paragraphs', () => {
    renderSemantic(LARGE_PLAIN);
  });
  bench('quill-delta-to-html — 500 paragraphs', () => {
    renderLegacy(LARGE_PLAIN);
  });
});

describe('Formatted text (bold, italic, links, colors)', () => {
  bench('SemanticHtmlRenderer — 5 blocks', () => {
    renderSemantic(SMALL_FORMATTED);
  });
  bench('quill-delta-to-html — 5 blocks', () => {
    renderLegacy(SMALL_FORMATTED);
  });

  bench('SemanticHtmlRenderer — 50 blocks', () => {
    renderSemantic(MEDIUM_FORMATTED);
  });
  bench('quill-delta-to-html — 50 blocks', () => {
    renderLegacy(MEDIUM_FORMATTED);
  });

  bench('SemanticHtmlRenderer — 200 blocks', () => {
    renderSemantic(LARGE_FORMATTED);
  });
  bench('quill-delta-to-html — 200 blocks', () => {
    renderLegacy(LARGE_FORMATTED);
  });
});

describe('Nested lists (5 levels × 4 items)', () => {
  bench('SemanticHtmlRenderer', () => {
    renderSemantic(NESTED_LIST);
  });
  bench('quill-delta-to-html', () => {
    renderLegacy(NESTED_LIST);
  });
});

describe('Headers with body text', () => {
  bench('SemanticHtmlRenderer', () => {
    renderSemantic(HEADERS_DOC);
  });
  bench('quill-delta-to-html', () => {
    renderLegacy(HEADERS_DOC);
  });
});

describe('Code blocks (5 blocks × 10 lines)', () => {
  bench('SemanticHtmlRenderer', () => {
    renderSemantic(CODE_BLOCKS);
  });
  bench('quill-delta-to-html', () => {
    renderLegacy(CODE_BLOCKS);
  });
});

describe('Embeds (20 images)', () => {
  bench('SemanticHtmlRenderer', () => {
    renderSemantic(EMBEDS_DOC);
  });
  bench('quill-delta-to-html', () => {
    renderLegacy(EMBEDS_DOC);
  });
});

describe('Tables (10 rows × 4 cols)', () => {
  bench('SemanticHtmlRenderer', () => {
    renderSemantic(TABLE_DOC);
  });
  bench('quill-delta-to-html', () => {
    renderLegacy(TABLE_DOC);
  });
});

describe('Realistic document (mixed content)', () => {
  bench('SemanticHtmlRenderer', () => {
    renderSemantic(REALISTIC_DOC);
  });
  bench('quill-delta-to-html', () => {
    renderLegacy(REALISTIC_DOC);
  });
});
