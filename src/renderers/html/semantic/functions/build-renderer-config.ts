import { DEFAULT_MARK_PRIORITIES } from '../../../../common/default-mark-priorities';
import type { RendererConfig } from '../../../../core/ast-types';
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
        const lang = node.attributes['code-block'];
        const syntaxClass = `${cfg.classPrefix}-syntax`;
        const langClass =
          typeof lang === 'string' && lang !== 'true'
            ? `${syntaxClass} language-${lang}`
            : syntaxClass;

        const extraAttrs: Record<string, string> = {};
        if (typeof lang === 'string' && lang !== 'true') {
          extraAttrs['data-language'] = lang;
        }

        const content = children || '<br/>';
        const attrStr = buildBlockAttrs(node, cfg, [langClass], undefined, extraAttrs);
        return `<${tag}${attrStr}>${content}</${tag}>`;
      },

      'list-item': (node, children) => {
        const tag = cfg.customTag?.('list-item', node) ?? cfg.listItemTag;
        const listType = node.attributes.list as string;
        const content = children || '<br/>';

        const extraAttrs: Record<string, string> = {};
        if (listType === 'checked') {
          extraAttrs['data-checked'] = 'true';
        } else if (listType === 'unchecked') {
          extraAttrs['data-checked'] = 'false';
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
        const src = sanitizeUrl(String(node.data), cfg);
        if (!src) return '';
        const videoClass = `${cfg.classPrefix}-video`;
        return `<iframe class="${videoClass}" src="${encodeText(src, cfg)}" frameborder="0" allowfullscreen="true"></iframe>`;
      },

      formula: (node) => {
        const formulaClass = `${cfg.classPrefix}-formula`;
        const data = node.data as string | Record<string, unknown>;
        const text = typeof data === 'string' ? data : String(data);
        return `<span class="${formulaClass}">${encodeText(text, cfg)}</span>`;
      },

      mention: (node) => {
        const mentionData = (node.data ?? node.attributes.mention ?? {}) as Record<string, unknown>;
        const name = String(mentionData.name ?? '');
        const slug = mentionData.slug as string | undefined;
        const endpoint = mentionData['end-point'] as string | undefined;
        const mentionClass = mentionData.class as string | undefined;
        const target = mentionData.target as string | undefined;

        const attrs: Record<string, string> = {};
        if (mentionClass) {
          attrs.class = mentionClass;
        }
        if (endpoint && slug) {
          attrs.href = `${endpoint}/${slug}`;
        } else {
          attrs.href = 'about:blank';
        }
        if (target) {
          attrs.target = target;
        }

        return `<a${buildAttrString(attrs)}>${encodeText(name, cfg)}</a>`;
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

        let attrs = `href="${encodeText(href, cfg)}"`;

        // Per-op target/rel override global config
        const target =
          typeof node.attributes.target === 'string' ? node.attributes.target : cfg.linkTarget;
        const rel = typeof node.attributes.rel === 'string' ? node.attributes.rel : cfg.linkRel;

        if (target) {
          attrs += ` target="${target}"`;
        }
        if (rel) {
          attrs += ` rel="${rel}"`;
        }

        const collected = serializeResolvedAttrs(collectedAttrs);
        return `<a ${attrs}${collected}>${content}</a>`;
      },

      script: scriptMark,

      code: codeMark,

      font: (content, value, node) => {
        if (cfg.inlineStyles !== false) {
          const overrides = cfg.inlineStyles;
          const converter: InlineStyleConverter | undefined =
            overrides.font ?? DEFAULT_INLINE_STYLES.font;
          if (converter) {
            const style = resolveInlineStyle(converter, String(value), node);
            if (style) {
              return `<span style="${style}">${content}</span>`;
            }
          }
          return `<span class="${cfg.classPrefix}-font-${encodeText(String(value), cfg)}">${content}</span>`;
        }
        return `<span class="${cfg.classPrefix}-font-${encodeText(String(value), cfg)}">${content}</span>`;
      },

      size: (content, value, node) => {
        if (cfg.inlineStyles !== false) {
          const overrides = cfg.inlineStyles;
          const converter: InlineStyleConverter | undefined =
            overrides.size ?? DEFAULT_INLINE_STYLES.size;
          if (converter) {
            const style = resolveInlineStyle(converter, String(value), node);
            if (style) {
              return `<span style="${style}">${content}</span>`;
            }
          }
          return `<span class="${cfg.classPrefix}-size-${encodeText(String(value), cfg)}">${content}</span>`;
        }
        return `<span class="${cfg.classPrefix}-size-${encodeText(String(value), cfg)}">${content}</span>`;
      },
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
