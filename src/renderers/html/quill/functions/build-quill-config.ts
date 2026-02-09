import type { RendererConfig } from '../../../../core/ast-types';
import { escapeHtml, serializeResolvedAttrs } from '../../base-html-renderer';
import { buildAttrString } from '../../common/build-attr-string';
import { getLayoutClasses } from '../../common/get-layout-classes';
import type { ResolvedAttrs } from '../../common/resolved-attrs';
import {
  boldMark,
  codeMark,
  italicMark,
  scriptMark,
  strikeMark,
  underlineMark,
} from '../../common/simple-marks';

const PREFIX = 'ql';

/**
 * Mark nesting priorities matching Quill's actual DOM nesting order.
 *
 * Only element marks (bold, strike, etc.) need priorities here.
 * Color, background, font, and size are attributors — they contribute
 * styles/classes to the nearest element mark instead of creating wrappers.
 */
const QUILL_MARK_PRIORITIES: Record<string, number> = {
  bold: 50,
  strike: 40,
  underline: 30,
  italic: 20,
  link: 15,
  code: 10,
  script: 5,
};

/**
 * Build the full `RendererConfig` for the Quill-native HTML renderer.
 *
 * Produces markup that exactly matches Quill editor's output, including:
 * - `ql-*` CSS classes for indentation, alignment, direction, fonts, sizes
 * - `<br>` for empty blocks (matching Quill's behavior)
 * - `spellcheck="false"` on code blocks
 * - `rel="noopener noreferrer"` on links
 * - `data-row` on table cells
 * - `data-list` for all list items
 * - `data-language` on code blocks with a specified language
 *
 * Layout classes (indent, align, direction) are computed centrally
 * via `blockAttributeResolvers` — no need to repeat in each handler.
 *
 * Color, background, font, and size are `attributors` — they contribute
 * styles/classes to the nearest element mark rather than wrapping.
 */
export function buildQuillConfig(): RendererConfig<string, ResolvedAttrs> {
  return {
    markPriorities: QUILL_MARK_PRIORITIES,

    // ─── Block Attribute Resolvers ────────────────────────────────────
    // Computed once per block, merged, and passed to every block handler.
    blockAttributeResolvers: [(node) => ({ classes: getLayoutClasses(node, PREFIX) })],

    // ─── Blocks ──────────────────────────────────────────────────────
    blocks: {
      // Declarative: renderer auto-handles attrs + empty content
      paragraph: { tag: 'p' },
      header: { tag: (node) => `h${node.attributes.header}` },
      blockquote: { tag: 'blockquote' },

      // Complex blocks — receive pre-computed resolvedAttrs
      'code-block-container': (_node, children) => {
        return `<div class="${PREFIX}-code-block-container" spellcheck="false">${children}</div>`;
      },

      'code-block': (node, children) => {
        const lang = node.attributes['code-block'];
        const attrs: Record<string, string> = {
          class: `${PREFIX}-code-block`,
        };

        if (typeof lang === 'string' && lang !== 'true') {
          attrs['data-language'] = lang;
        }

        const content = children || '<br>';
        return `<div${buildAttrString(attrs)}>${content}</div>`;
      },

      'list-item': (node, children, resolvedAttrs) => {
        const listType = node.attributes.list as string;
        const content = children || '<br>';

        const classes = [...(resolvedAttrs.classes ?? [])];
        const attrs: Record<string, string> = {};
        if (classes.length > 0) {
          attrs.class = classes.join(' ');
        }
        attrs['data-list'] = listType;

        return `<li${buildAttrString(attrs)}>${content}</li>`;
      },

      list: (_node, children) => {
        return `<ol>${children}</ol>`;
      },

      table: (_node, children) => {
        return `<table><tbody>${children}</tbody></table>`;
      },

      'table-row': (_node, children) => {
        return `<tr>${children}</tr>`;
      },

      'table-cell': (node, children) => {
        const row = node.attributes.table as string | undefined;
        const attrs: Record<string, string> = {};
        if (row) {
          attrs['data-row'] = row;
        }
        return `<td${buildAttrString(attrs)}>${children}</td>`;
      },

      image: (node) => {
        const src = escapeHtml(String(node.data));
        const alt = node.attributes.alt as string | undefined;
        const width = node.attributes.width as string | undefined;
        const height = node.attributes.height as string | undefined;

        let imgAttrs = `src="${src}"`;
        if (alt != null) {
          imgAttrs += ` alt="${escapeHtml(alt)}"`;
        }
        if (width) {
          imgAttrs += ` width="${escapeHtml(width)}"`;
        }
        if (height) {
          imgAttrs += ` height="${escapeHtml(height)}"`;
        }

        return `<img ${imgAttrs}>`;
      },

      video: (node) => {
        const src = escapeHtml(String(node.data));
        const width = node.attributes.width as string | undefined;
        const height = node.attributes.height as string | undefined;

        let attrs = `class="${PREFIX}-video" src="${src}" frameborder="0" allowfullscreen="true"`;
        if (width) {
          attrs += ` width="${escapeHtml(width)}"`;
        }
        if (height) {
          attrs += ` height="${escapeHtml(height)}"`;
        }

        return `<iframe ${attrs}></iframe>`;
      },

      formula: (node) => {
        const data = node.data as string | Record<string, unknown>;
        const text = typeof data === 'string' ? data : String(data);
        return `<span class="${PREFIX}-formula" data-value="${escapeHtml(text)}">${escapeHtml(text)}</span>`;
      },
    },

    // ─── Element Marks (create wrapper elements) ─────────────────────
    marks: {
      bold: boldMark,
      italic: italicMark,
      underline: underlineMark,
      strike: strikeMark,
      script: scriptMark,
      code: codeMark,

      link: (content, value, _node, collectedAttrs) => {
        const href = escapeHtml(String(value));
        const attrStr = serializeResolvedAttrs(collectedAttrs);
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${attrStr}>${content}</a>`;
      },
    },

    // ─── Attributor Marks (contribute attrs to parent element) ───────
    attributors: {
      color: (value) => ({
        style: { color: String(value) },
      }),
      background: (value) => ({
        style: { 'background-color': String(value) },
      }),
      font: (value) => ({
        classes: [`${PREFIX}-font-${value}`],
      }),
      size: (value) => ({
        classes: [`${PREFIX}-size-${value}`],
      }),
    },
  };
}
