import { DEFAULT_MARK_PRIORITIES } from '../../../../common/default-mark-priorities';
import type { MarkHandler, RendererConfig, TNode } from '../../../../core/ast-types';
import {
  resolveCheckedState,
  resolveCodeBlockMeta,
  resolveLinkMeta,
} from '../../../common/resolve-block-meta';
import { resolveFormulaText, resolveVideoSrc } from '../../../common/resolve-embed-data';
import { resolveMentionData } from '../../../common/resolve-mention-data';
import { serializeResolvedAttrs } from '../../base-html-renderer';
import { buildAttrString } from '../../common/build-attr-string';
import type { ResolvedAttrs } from '../../common/resolved-attrs';
import {
  boldMark,
  codeMark,
  italicMark,
  scriptMark,
  strikeMark,
  underlineMark,
} from '../../common/simple-marks';
import { DEFAULT_INLINE_STYLES } from '../consts/default-inline-styles';
import type { ResolvedConfig } from '../types/resolved-config';
import type { InlineStyleConverter } from '../types/semantic-html-config';
import { buildBlockAttrs } from './build-block-attrs';
import { encodeText } from './encode-text';
import { resolveInlineStyle } from './resolve-inline-style';
import { sanitizeUrl } from './sanitize-url';

/**
 * Creates a mark handler for attributes like `font` and `size` that render
 * as either an inline style (when `inlineStyles` is enabled and a converter
 * exists) or a CSS class (default).
 *
 * Eliminates duplication between the `font` and `size` mark handler code paths.
 */
function createClassOrStyleMark(
  attrName: string,
  cfg: ResolvedConfig,
): MarkHandler<string, ResolvedAttrs> {
  return (content: string, value: unknown, node: TNode) => {
    const strValue = String(value);
    if (cfg.inlineStyles !== false) {
      const overrides = cfg.inlineStyles;
      const converter: InlineStyleConverter | undefined =
        overrides[attrName] ?? DEFAULT_INLINE_STYLES[attrName];
      if (converter) {
        const style = resolveInlineStyle(converter, strValue, node);
        if (style) {
          return `<span style="${style}">${content}</span>`;
        }
      }
    }
    return `<span class="${cfg.classPrefix}-${attrName}-${encodeText(strValue, cfg)}">${content}</span>`;
  };
}

/**
 * Build a full `RendererConfig` from the resolved semantic config.
 * Defines all block handlers (paragraph, header, blockquote, code-block,
 * list, table, image, video, formula, mention) and mark handlers
 * (bold, italic, underline, strike, link, script, code, font, size).
 *
 * Color and background are defined as `attributors` — they contribute
 * styles/classes to the nearest element mark rather than wrapping.
 */
export function buildRendererConfig(cfg: ResolvedConfig): RendererConfig<string, ResolvedAttrs> {
  return {
    markPriorities: DEFAULT_MARK_PRIORITIES,
    blocks: {
      paragraph: (node, children) => {
        const tag = cfg.customTag?.('paragraph', node) ?? cfg.paragraphTag;
        if (!tag) {
          return children || '<br/>';
        }
        const content = children || '<br/>';
        const attrStr = buildBlockAttrs(node, cfg);
        return `<${tag}${attrStr}>${content}</${tag}>`;
      },

      header: (node, children) => {
        const level = node.attributes.header as number;
        const defaultTag = `h${level}`;
        const tag = cfg.customTag?.('header', node) ?? defaultTag;
        const content = children || '<br/>';
        const attrStr = buildBlockAttrs(node, cfg);
        return `<${tag}${attrStr}>${content}</${tag}>`;
      },

      blockquote: (node, children) => {
        const tag = cfg.customTag?.('blockquote', node) ?? 'blockquote';
        const content = children || '<br/>';
        const attrStr = buildBlockAttrs(node, cfg);
        return `<${tag}${attrStr}>${content}</${tag}>`;
      },

      'code-block': (node, children) => {
        const tag = cfg.customTag?.('code-block', node) ?? 'pre';
        const meta = resolveCodeBlockMeta(node, cfg.classPrefix);

        const extraAttrs: Record<string, string> = {};
        if (meta.language) {
          extraAttrs['data-language'] = meta.language;
        }

        const content = children || '<br/>';
        const attrStr = buildBlockAttrs(node, cfg, [meta.className], undefined, extraAttrs);
        return `<${tag}${attrStr}>${content}</${tag}>`;
      },

      'list-item': (node, children) => {
        const tag = cfg.customTag?.('list-item', node) ?? cfg.listItemTag;
        const content = children || '<br/>';

        const extraAttrs: Record<string, string> = {};
        const checked = resolveCheckedState(node);
        if (checked !== undefined) {
          extraAttrs['data-checked'] = checked;
        }

        const attrStr = buildBlockAttrs(node, cfg, undefined, undefined, extraAttrs);
        return `<${tag}${attrStr}>${content}</${tag}>`;
      },

      list: (node, children) => {
        const listType = node.attributes.list as string;
        let tag: string;
        if (listType === 'ordered') {
          tag = cfg.orderedListTag;
        } else {
          tag = cfg.bulletListTag;
        }
        return `<${tag}>${children}</${tag}>`;
      },

      table: (_node, children) => {
        return `<table><tbody>${children}</tbody></table>`;
      },

      'table-row': (_node, children) => {
        return `<tr>${children}</tr>`;
      },

      'table-cell': (node, children) => {
        const row = node.attributes.table as string | undefined;
        const extraAttrs: Record<string, string> = {};
        if (row) {
          extraAttrs['data-row'] = row;
        }
        const attrStr = buildBlockAttrs(node, cfg, undefined, undefined, extraAttrs);
        return `<td${attrStr}>${children}</td>`;
      },

      image: (node) => {
        const src = sanitizeUrl(String(node.data), cfg);
        if (!src) return '';
        const alt = (node.attributes.alt as string) ?? '';
        const linkHref = node.attributes.link as string | undefined;
        const width = node.attributes.width as string | undefined;
        const height = node.attributes.height as string | undefined;

        let imgAttrs = `src="${encodeText(src, cfg)}"`;
        if (width) {
          imgAttrs += ` width="${encodeText(width, cfg)}"`;
        }
        if (height) {
          imgAttrs += ` height="${encodeText(height, cfg)}"`;
        }
        imgAttrs += ` alt="${encodeText(alt, cfg)}"`;

        const imgTag = `<img ${imgAttrs} />`;

        if (linkHref) {
          const sanitizedLink = sanitizeUrl(linkHref, cfg);
          if (!sanitizedLink) return imgTag;
          let linkAttrs = `href="${encodeText(sanitizedLink, cfg)}"`;
          if (cfg.linkTarget) {
            linkAttrs += ` target="${cfg.linkTarget}"`;
          }
          if (cfg.linkRel) {
            linkAttrs += ` rel="${cfg.linkRel}"`;
          }
          return `<a ${linkAttrs}>${imgTag}</a>`;
        }

        return imgTag;
      },

      video: (node) => {
        const rawSrc = resolveVideoSrc(node);
        if (!rawSrc) return '';
        const src = sanitizeUrl(rawSrc, cfg);
        if (!src) return '';
        const videoClass = `${cfg.classPrefix}-video`;
        return `<iframe class="${videoClass}" src="${encodeText(src, cfg)}" frameborder="0" allowfullscreen="true"></iframe>`;
      },

      formula: (node) => {
        const formulaClass = `${cfg.classPrefix}-formula`;
        const text = resolveFormulaText(node);
        return `<span class="${formulaClass}">${encodeText(text, cfg)}</span>`;
      },

      mention: (node) => {
        const mention = resolveMentionData(node);

        const attrs: Record<string, string> = {};
        if (mention.className) {
          attrs.class = mention.className;
        }
        attrs.href = mention.href;
        if (mention.target) {
          attrs.target = mention.target;
        }

        return `<a${buildAttrString(attrs)}>${encodeText(mention.name, cfg)}</a>`;
      },
    },

    // ─── Element Marks (create wrapper elements) ─────────────────────
    marks: {
      bold: boldMark,
      italic: italicMark,
      underline: underlineMark,
      strike: strikeMark,

      link: (content, value, node, collectedAttrs) => {
        const rawHref = String(value);
        const href = sanitizeUrl(rawHref, cfg);
        if (!href) return content;

        const meta = resolveLinkMeta(node, cfg.linkTarget, cfg.linkRel);
        let attrs = `href="${encodeText(href, cfg)}"`;
        if (meta.target) {
          attrs += ` target="${meta.target}"`;
        }
        if (meta.rel) {
          attrs += ` rel="${meta.rel}"`;
        }

        const collected = serializeResolvedAttrs(collectedAttrs);
        return `<a ${attrs}${collected}>${content}</a>`;
      },

      script: scriptMark,

      code: codeMark,

      font: createClassOrStyleMark('font', cfg),

      size: createClassOrStyleMark('size', cfg),
    },

    // ─── Attributor Marks (contribute attrs to parent element) ───────
    attributors: {
      color: (value) => ({
        style: { color: encodeText(String(value), cfg) },
      }),

      background: (value) => {
        if (cfg.allowBackgroundClasses) {
          return { classes: [`${cfg.classPrefix}-background-${value}`] };
        }
        return {
          style: { 'background-color': encodeText(String(value), cfg) },
        };
      },
    },
  };
}
