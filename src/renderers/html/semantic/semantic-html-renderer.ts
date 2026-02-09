import { DEFAULT_MARK_PRIORITIES } from '../../../common/default-mark-priorities';
import type { RendererConfig, TNode } from '../../../core/ast-types';
import { BaseHtmlRenderer, escapeHtml } from '../base-html-renderer';
import { DEFAULT_INLINE_STYLES } from './default-inline-styles';
import type {
  AfterRenderCallback,
  BeforeRenderCallback,
  CustomBlotRenderer,
  InlineStyleConverter,
  InlineStyleOverrides,
  RenderGroupType,
  SemanticHtmlConfig,
} from './semantic-html-config';

// ─── Resolved Config (all defaults applied) ─────────────────────────────────

interface ResolvedConfig {
  paragraphTag: string;
  orderedListTag: string;
  bulletListTag: string;
  listItemTag: string;
  classPrefix: string;
  inlineStyles: false | InlineStyleOverrides;
  allowBackgroundClasses: boolean;
  linkTarget: string;
  linkRel: string | undefined;
  encodeHtml: boolean;
  urlSanitizer: ((url: string) => string | undefined) | undefined;
  customTag: ((format: string, node: TNode) => string | undefined) | undefined;
  customTagAttributes: ((node: TNode) => Record<string, string> | undefined) | undefined;
  customCssClasses: ((node: TNode) => string | string[] | undefined) | undefined;
  customCssStyles: ((node: TNode) => string | string[] | undefined) | undefined;
}

function resolveConfig(config?: SemanticHtmlConfig): ResolvedConfig {
  const c = config ?? {};
  let inlineStyles: false | InlineStyleOverrides = false;
  if (c.inlineStyles === true) {
    inlineStyles = {};
  } else if (typeof c.inlineStyles === 'object') {
    inlineStyles = c.inlineStyles;
  }

  return {
    paragraphTag: c.paragraphTag ?? 'p',
    orderedListTag: c.orderedListTag ?? 'ol',
    bulletListTag: c.bulletListTag ?? 'ul',
    listItemTag: c.listItemTag ?? 'li',
    classPrefix: c.classPrefix ?? 'ql',
    inlineStyles,
    allowBackgroundClasses: c.allowBackgroundClasses ?? false,
    linkTarget: c.linkTarget ?? '_blank',
    linkRel: c.linkRel,
    encodeHtml: c.encodeHtml ?? true,
    urlSanitizer: c.urlSanitizer,
    customTag: c.customTag,
    customTagAttributes: c.customTagAttributes,
    customCssClasses: c.customCssClasses,
    customCssStyles: c.customCssStyles,
  };
}

// ─── Attribute Building Helpers ──────────────────────────────────────────────

function buildAttrString(attrs: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== '') {
      parts.push(`${key}="${value}"`);
    }
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

// ─── Config-Aware Helpers ───────────────────────────────────────────────────

function getBlockClasses(node: TNode, cfg: ResolvedConfig): string[] {
  if (cfg.inlineStyles !== false) return [];

  const classes: string[] = [];
  const indent = node.attributes.indent as number | undefined;
  if (indent != null && indent > 0) {
    classes.push(`${cfg.classPrefix}-indent-${indent}`);
  }

  const align = node.attributes.align as string | undefined;
  if (align) {
    classes.push(`${cfg.classPrefix}-align-${align}`);
  }

  const direction = node.attributes.direction as string | undefined;
  if (direction) {
    classes.push(`${cfg.classPrefix}-direction-${direction}`);
  }

  return classes;
}

function getBlockStyles(node: TNode, cfg: ResolvedConfig): string[] {
  if (cfg.inlineStyles === false) return [];

  const styles: string[] = [];
  const overrides = cfg.inlineStyles;
  const props = ['indent', 'align', 'direction'] as const;

  for (const prop of props) {
    const value = node.attributes[prop];
    if (value == null) continue;

    const converter: InlineStyleConverter | undefined =
      overrides[prop] ?? DEFAULT_INLINE_STYLES[prop];

    if (!converter) continue;

    const resolved = resolveInlineStyle(converter, String(value), node);
    if (resolved) {
      styles.push(resolved);
    }
  }

  return styles;
}

function resolveInlineStyle(
  converter: InlineStyleConverter,
  value: string,
  node: TNode,
): string | undefined {
  if (typeof converter === 'function') {
    return converter(value, node);
  }
  return converter[value];
}

function getCustomClasses(node: TNode, cfg: ResolvedConfig): string[] {
  if (!cfg.customCssClasses) return [];
  const result = cfg.customCssClasses(node);
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

function getCustomStyles(node: TNode, cfg: ResolvedConfig): string[] {
  if (!cfg.customCssStyles) return [];
  const result = cfg.customCssStyles(node);
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

function getCustomTagAttributes(node: TNode, cfg: ResolvedConfig): Record<string, string> {
  if (!cfg.customTagAttributes) return {};
  return cfg.customTagAttributes(node) ?? {};
}

function buildBlockAttrs(
  node: TNode,
  cfg: ResolvedConfig,
  extraClasses?: string[],
  extraStyles?: string[],
  extraAttrs?: Record<string, string>,
): string {
  const classes = [
    ...getCustomClasses(node, cfg),
    ...(extraClasses ?? []),
    ...getBlockClasses(node, cfg),
  ].filter(Boolean);

  const styles = [
    ...getCustomStyles(node, cfg),
    ...(extraStyles ?? []),
    ...getBlockStyles(node, cfg),
  ].filter(Boolean);

  const attrs: Record<string, string> = {
    ...getCustomTagAttributes(node, cfg),
    ...(extraAttrs ?? {}),
  };

  if (classes.length > 0) {
    attrs.class = classes.join(' ');
  }
  if (styles.length > 0) {
    attrs.style = styles.join(';');
  }

  return buildAttrString(attrs);
}

function sanitizeUrl(url: string, cfg: ResolvedConfig): string {
  if (cfg.urlSanitizer) {
    const result = cfg.urlSanitizer(url);
    return result ?? '';
  }
  return url;
}

function encodeText(text: string, cfg: ResolvedConfig): string {
  return cfg.encodeHtml ? escapeHtml(text) : text;
}

// ─── Build RendererConfig from SemanticHtmlConfig ───────────────────────────

function buildRendererConfig(cfg: ResolvedConfig): RendererConfig<string> {
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

// ─── SemanticHtmlRenderer ───────────────────────────────────────────────────

/**
 * Renders an AST into clean, configurable HTML.
 *
 * Produces markup compatible with quill-delta-to-html output by default,
 * using `ql-*` CSS classes for formatting. All aspects are configurable:
 * class prefix, tag names, inline styles mode, link behavior, and more.
 *
 * Suitable for CMS output, email, read-only display, or any context
 * where clean, configurable HTML matters.
 *
 * @example
 * ```ts
 * // Default: quill-delta-to-html compatible output
 * const renderer = new SemanticHtmlRenderer();
 * const html = renderer.render(ast);
 * ```
 *
 * @example
 * ```ts
 * // Customized output
 * const renderer = new SemanticHtmlRenderer({
 *   classPrefix: 'article',
 *   paragraphTag: 'div',
 *   linkTarget: '',
 *   inlineStyles: true,
 * });
 * ```
 */
export class SemanticHtmlRenderer extends BaseHtmlRenderer {
  private readonly cfg: ResolvedConfig;
  private beforeRenderCb: BeforeRenderCallback | undefined;
  private afterRenderCb: AfterRenderCallback | undefined;
  private customBlotRenderer: CustomBlotRenderer | undefined;

  constructor(config?: SemanticHtmlConfig) {
    const cfg = resolveConfig(config);
    super(buildRendererConfig(cfg));
    this.cfg = cfg;
  }

  // ─── Hooks ──────────────────────────────────────────────────────────────

  /**
   * Register a callback called before rendering each block-level group.
   * If the callback returns a non-empty string, it replaces the default output.
   */
  beforeRender(cb: BeforeRenderCallback): void {
    this.beforeRenderCb = cb;
  }

  /**
   * Register a callback called after rendering each block-level group.
   * The callback receives the generated HTML and can modify it.
   */
  afterRender(cb: AfterRenderCallback): void {
    this.afterRenderCb = cb;
  }

  /**
   * Register a callback for rendering custom embed types (blots).
   * Called for embed nodes that have no built-in block handler.
   */
  renderCustomWith(cb: CustomBlotRenderer): void {
    this.customBlotRenderer = cb;
  }

  // ─── Override renderNode for hooks and custom blots ─────────────────────

  protected override renderNode(node: TNode): string {
    if (node.type === 'root') {
      return this.renderChildren(node);
    }

    if (node.type === 'text') {
      return this.renderTextNode(node);
    }

    // Try custom blot renderer for unknown types
    if (!this.blocks[node.type] && this.customBlotRenderer) {
      return this.customBlotRenderer(node, null);
    }

    const groupType = this.getGroupType(node);

    // Before-render hook
    if (this.beforeRenderCb && groupType) {
      const replaced = this.beforeRenderCb(groupType, node);
      if (replaced) {
        if (this.afterRenderCb) {
          return this.afterRenderCb(groupType, replaced);
        }
        return replaced;
      }
    }

    // Standard rendering
    const blockHandler = this.blocks[node.type];
    let html: string;
    if (blockHandler) {
      const childrenOutput = this.renderChildren(node);
      html = blockHandler(node, childrenOutput);
    } else {
      html = this.renderChildren(node);
    }

    // After-render hook
    if (this.afterRenderCb && groupType) {
      html = this.afterRenderCb(groupType, html);
    }

    return html;
  }

  // ─── Override renderText for encodeHtml=false ───────────────────────────

  protected override renderText(text: string): string {
    return this.cfg.encodeHtml ? escapeHtml(text) : text;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private getGroupType(node: TNode): RenderGroupType | null {
    switch (node.type) {
      case 'list':
        return 'list';
      case 'table':
        return 'table';
      case 'video':
        return 'video';
      case 'text':
        return null;
      default:
        if (node.isInline) return null;
        return 'block';
    }
  }
}
