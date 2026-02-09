import type { RendererConfig } from '../../../../core/ast-types';
import {
  getHeaderLevel,
  getHeight,
  getListType,
  getTableRow,
  getWidth,
} from '../../../common/node-attributes';
import {
  resolveFormulaText,
  resolveImageData,
  resolveVideoSrc,
} from '../../../common/resolve-embed-data';
import {
  boldMark,
  codeMark,
  italicMark,
  scriptMark,
  strikeMark,
  underlineMark,
} from '../../../common/simple-marks';
import { escapeHtml, serializeResolvedAttrs } from '../../base-html-renderer';
import { buildAttrString } from '../../common/build-attr-string';
import { getLayoutClasses } from '../../common/get-layout-classes';
import type { ResolvedAttrs } from '../../common/resolved-attrs';

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

    nodeOverrides: {
      'line-break': () => '<br/>',
    },

    // ─── Block Attribute Resolvers ────────────────────────────────────
    // Computed once per block, merged, and passed to every block handler.
    blockAttributeResolvers: [(node) => ({ classes: getLayoutClasses(node, PREFIX) })],

    // ─── Blocks ──────────────────────────────────────────────────────
    blocks: {
      // Declarative: renderer auto-handles attrs + empty content
      paragraph: { tag: 'p' },
      header: { tag: (node) => `h${getHeaderLevel(node)}` },
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

        const content = children || '<br/>';
        return `<div${buildAttrString(attrs)}>${content}</div>`;
      },

      'list-item': (node, children, resolvedAttrs) => {
        const listType = getListType(node);
        const content = children || '<br/>';

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
        const row = getTableRow(node);
        const attrs: Record<string, string> = {};
        if (row) {
          attrs['data-row'] = row;
        }
        return `<td${buildAttrString(attrs)}>${children}</td>`;
      },

      image: (node) => {
        const img = resolveImageData(node);
        if (!img) return '';

        const attrs: Record<string, string> = { src: img.src };
        if (img.alt) attrs.alt = img.alt;
        if (img.width) attrs.width = img.width;
        if (img.height) attrs.height = img.height;

        return `<img${buildAttrString(attrs)}>`;
      },

      video: (node) => {
        const src = resolveVideoSrc(node);
        if (!src) return '';

        const width = getWidth(node);
        const height = getHeight(node);

        const attrs: Record<string, string> = {
          class: `${PREFIX}-video`,
          src,
          frameborder: '0',
          allowfullscreen: 'true',
        };
        if (width) attrs.width = width;
        if (height) attrs.height = height;

        return `<iframe${buildAttrString(attrs)}></iframe>`;
      },

      formula: (node) => {
        const text = resolveFormulaText(node);
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
