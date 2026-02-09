import { DEFAULT_MARK_PRIORITIES } from '../../../../common/default-mark-priorities';
import type { RendererConfig } from '../../../../core/ast-types';
import { DEFAULT_INLINE_STYLES } from '../consts/default-inline-styles';
import type { ResolvedConfig } from '../types/resolved-config';
import type { InlineStyleConverter } from '../types/semantic-html-config';
import { buildAttrString } from './build-attr-string';
import { buildBlockAttrs } from './build-block-attrs';
import { encodeText } from './encode-text';
import { resolveInlineStyle } from './resolve-inline-style';
import { sanitizeUrl } from './sanitize-url';

/**
 * Build a full `RendererConfig` from the resolved semantic config.
 * Defines all block handlers (paragraph, header, blockquote, code-block,
 * list, table, image, video, formula, mention) and mark handlers
 * (bold, italic, underline, strike, link, color, background, script, code,
 * font, size).
 */
export function buildRendererConfig(cfg: ResolvedConfig): RendererConfig<string> {
  return {
    markPriorities: DEFAULT_MARK_PRIORITIES,
    blocks: {
      paragraph: (node, children) => {
        const tag = cfg.customTag?.('paragraph', node) ?? cfg.paragraphTag;
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

        let imgAttrs = `src="${encodeText(src, cfg)}"`;
        if (width) {
          imgAttrs += ` width="${encodeText(width, cfg)}"`;
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

    marks: {
      bold: (content) => `<strong>${content}</strong>`,
      italic: (content) => `<em>${content}</em>`,
      underline: (content) => `<u>${content}</u>`,
      strike: (content) => `<s>${content}</s>`,

      link: (content, value) => {
        const rawHref = String(value);
        const href = sanitizeUrl(rawHref, cfg);
        if (!href) return content;

        let attrs = `href="${encodeText(href, cfg)}"`;
        if (cfg.linkTarget) {
          attrs += ` target="${cfg.linkTarget}"`;
        }
        if (cfg.linkRel) {
          attrs += ` rel="${cfg.linkRel}"`;
        }
        return `<a ${attrs}>${content}</a>`;
      },

      color: (content, value) => {
        return `<span style="color:${encodeText(String(value), cfg)}">${content}</span>`;
      },

      background: (content, value) => {
        if (cfg.allowBackgroundClasses) {
          const cls = `${cfg.classPrefix}-background-${value}`;
          return `<span class="${cls}">${content}</span>`;
        }
        return `<span style="background-color:${encodeText(String(value), cfg)}">${content}</span>`;
      },

      script: (content, value) => {
        const tag = value === 'super' ? 'sup' : 'sub';
        return `<${tag}>${content}</${tag}>`;
      },

      code: (content) => `<code>${content}</code>`,

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
  };
}
