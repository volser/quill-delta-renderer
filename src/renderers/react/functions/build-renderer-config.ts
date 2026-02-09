import { type ComponentType, createElement, type ReactNode } from 'react';
import { DEFAULT_MARK_PRIORITIES } from '../../../common/default-mark-priorities';
import type { RendererConfig, TNode } from '../../../core/ast-types';
import { getHeaderLevel, getListType, getTableRow } from '../../common/node-attributes';
import {
  buildCodeBlockClassName,
  resolveCheckedState,
  resolveCodeBlockMeta,
  resolveLinkMeta,
} from '../../common/resolve-block-meta';
import { resolveCodeBlockLines } from '../../common/resolve-code-block-lines';
import {
  resolveFormulaText,
  resolveImageData,
  resolveVideoSrc,
} from '../../common/resolve-embed-data';
import { resolveMentionData } from '../../common/resolve-mention-data';
import {
  boldMark,
  codeMark,
  italicMark,
  scriptMark,
  strikeMark,
  underlineMark,
} from '../../common/simple-marks';
import type { BlockComponentProps, ResolvedReactConfig } from '../types/react-config';
import type { ReactProps } from '../types/react-props';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Resolve the tag name for a block, checking customTag first.
 */
function resolveTag(
  cfg: ResolvedReactConfig,
  format: string,
  node: TNode,
  defaultTag: string,
): string {
  return cfg.customTag?.(format, node) ?? defaultTag;
}

type BlockFn = (node: TNode, children: ReactNode, resolvedAttrs: ReactProps) => ReactNode;

/**
 * Configuration for a block handler that extracts data once and shares it
 * between the default render path and the custom-component path.
 */
interface BlockWithData<TData> {
  /** Extract block-specific data from the node. Called exactly once per render. */
  resolve: (node: TNode, children: ReactNode) => TData;
  /** Default render using extracted data. */
  render: (data: TData, node: TNode, children: ReactNode, resolvedAttrs: ReactProps) => ReactNode;
  /** Convert extracted data to extra props for a custom component. */
  toProps?: (data: TData) => Record<string, unknown> | undefined;
}

/**
 * Wrap a block handler so that a custom component (if registered) is rendered
 * instead of the default element.
 *
 * Simple form: `withCustomComponent(cfg, type, handler)` — no data extraction.
 * Data form: `withCustomComponent(cfg, type, { resolve, render, toProps })` —
 * extracts data once and passes it to both the default and custom-component paths.
 */
function withCustomComponent<TData>(
  cfg: ResolvedReactConfig,
  type: string,
  configOrHandler: BlockWithData<TData> | BlockFn,
): BlockFn {
  if (typeof configOrHandler === 'function') {
    const handler = configOrHandler;
    return (node, children, resolvedAttrs) => {
      const Component: ComponentType<BlockComponentProps> | undefined = cfg.components[type];
      if (Component) {
        return createElement(Component, { node, children });
      }
      return handler(node, children, resolvedAttrs);
    };
  }

  const { resolve, render, toProps } = configOrHandler;
  return (node, children, resolvedAttrs) => {
    const data = resolve(node, children);
    const Component: ComponentType<BlockComponentProps> | undefined = cfg.components[type];
    if (Component) {
      const extra = toProps?.(data);
      return createElement(Component, { node, children, ...extra });
    }
    return render(data, node, children, resolvedAttrs);
  };
}

/**
 * Run the configured URL sanitizer, returning `undefined` for rejected URLs.
 * If no sanitizer is configured, all URLs pass through unchanged.
 */
function sanitizeUrl(url: string, cfg: ResolvedReactConfig): string | undefined {
  if (cfg.urlSanitizer) {
    return cfg.urlSanitizer(url);
  }
  return url;
}

// ─── Node Override Helpers ─────────────────────────────────────────────────

function renderCodeBlockContainer(node: TNode, cfg: ResolvedReactConfig): ReactNode {
  const { language, lines } = resolveCodeBlockLines(node);
  const className = buildCodeBlockClassName(language, cfg.classPrefix);

  const linesWithNewlines = lines.map((text, i) => (i < lines.length - 1 ? `${text}\n` : text));

  const codeElement = createElement('code', { className }, ...linesWithNewlines);
  return createElement('pre', null, codeElement);
}

// ─── Builder ────────────────────────────────────────────────────────────────

/**
 * Build a full `RendererConfig<ReactNode, ReactProps>` from the resolved config.
 *
 * Defines all block handlers (paragraph, header, blockquote, code-block,
 * list, list-item, table, image, video, formula, mention) and mark handlers
 * (bold, italic, underline, strike, link, script, code, font, size).
 *
 * Marks reuse the framework-agnostic `SimpleTagMark` descriptors from
 * `renderers/common/simple-marks.ts` — the `BaseRenderer` calls `renderSimpleTag()`
 * which the React renderer implements with `createElement`.
 *
 * Color and background are defined as `attributors` — they contribute
 * styles to the nearest element mark rather than wrapping.
 *
 * Node overrides handle `code-block-container` which needs custom rendering
 * not expressible as a simple block handler.
 */
export function buildRendererConfig(
  cfg: ResolvedReactConfig,
): RendererConfig<ReactNode, ReactProps> {
  return {
    markPriorities: DEFAULT_MARK_PRIORITIES,

    nodeOverrides: {
      'line-break': () => createElement('br'),

      'code-block-container': (node) => renderCodeBlockContainer(node, cfg),
    },

    blocks: {
      paragraph: withCustomComponent(cfg, 'paragraph', (node, children) => {
        const tag = resolveTag(cfg, 'paragraph', node, 'p');
        return createElement(tag, null, children || null);
      }),

      header: withCustomComponent(cfg, 'header', (node, children) => {
        const level = getHeaderLevel(node);
        const tag = resolveTag(cfg, 'header', node, `h${level}`);
        return createElement(tag, null, children || null);
      }),

      blockquote: withCustomComponent(cfg, 'blockquote', (node, children) => {
        const tag = resolveTag(cfg, 'blockquote', node, 'blockquote');
        return createElement(tag, null, children || null);
      }),

      'code-block': withCustomComponent(cfg, 'code-block', {
        resolve: (node) => resolveCodeBlockMeta(node, cfg.classPrefix),
        render: (meta, node, children) => {
          const props: Record<string, unknown> = { className: meta.className };
          if (meta.language) props['data-language'] = meta.language;
          const tag = resolveTag(cfg, 'code-block', node, 'pre');
          return createElement(tag, props, children || null);
        },
        toProps: (meta) => {
          const props: Record<string, unknown> = { className: meta.className };
          if (meta.language) props['data-language'] = meta.language;
          return props;
        },
      }),

      'list-item': withCustomComponent(cfg, 'list-item', {
        resolve: (node) => resolveCheckedState(node),
        render: (checked, node, children) => {
          const props: Record<string, unknown> = {};
          if (checked !== undefined) props['data-checked'] = checked;
          const tag = resolveTag(cfg, 'list-item', node, 'li');
          return createElement(tag, Object.keys(props).length > 0 ? props : null, children || null);
        },
        toProps: (checked) => {
          if (checked !== undefined) return { 'data-checked': checked };
          return undefined;
        },
      }),

      list: withCustomComponent(cfg, 'list', (node, children) => {
        const listType = getListType(node);
        const tag = listType === 'ordered' ? 'ol' : 'ul';
        return createElement(tag, null, children);
      }),

      table: withCustomComponent(cfg, 'table', (_node, children) => {
        return createElement('table', null, createElement('tbody', null, children));
      }),

      'table-row': withCustomComponent(cfg, 'table-row', (_node, children) => {
        return createElement('tr', null, children);
      }),

      'table-cell': withCustomComponent(cfg, 'table-cell', {
        resolve: (node) => getTableRow(node),
        render: (row, _node, children) => {
          const props: Record<string, unknown> = {};
          if (row) props['data-row'] = row;
          return createElement('td', Object.keys(props).length > 0 ? props : null, children);
        },
        toProps: (row) => {
          if (row) return { 'data-row': row };
          return undefined;
        },
      }),

      image: withCustomComponent(cfg, 'image', {
        resolve: (node) => resolveImageData(node),
        render: (img) => {
          if (!img) return null;

          const imgProps: Record<string, unknown> = { src: img.src, alt: img.alt };
          if (img.width) imgProps.width = img.width;
          if (img.height) imgProps.height = img.height;

          const imgElement = createElement('img', imgProps);

          if (img.linkHref) {
            const sanitizedLink = sanitizeUrl(img.linkHref, cfg);
            if (!sanitizedLink) return imgElement;
            const linkProps: Record<string, unknown> = { href: sanitizedLink };
            if (cfg.linkTarget) linkProps.target = cfg.linkTarget;
            if (cfg.linkRel) linkProps.rel = cfg.linkRel;
            return createElement('a', linkProps, imgElement);
          }

          return imgElement;
        },
        toProps: (img) => {
          if (!img) return undefined;
          const props: Record<string, unknown> = { src: img.src, alt: img.alt };
          if (img.width) props.width = img.width;
          if (img.height) props.height = img.height;
          return props;
        },
      }),

      video: withCustomComponent(cfg, 'video', {
        resolve: (node) => resolveVideoSrc(node),
        render: (src) => {
          if (!src) return null;
          return createElement('iframe', {
            className: `${cfg.classPrefix}-video`,
            src,
            frameBorder: '0',
            allowFullScreen: true,
          });
        },
        toProps: (src) => {
          if (!src) return undefined;
          return { src, className: `${cfg.classPrefix}-video` };
        },
      }),

      formula: withCustomComponent(cfg, 'formula', {
        resolve: (node) => resolveFormulaText(node),
        render: (text) => {
          const formulaClass = `${cfg.classPrefix}-formula`;
          return createElement('span', { className: formulaClass }, text);
        },
        toProps: (text) => ({ className: `${cfg.classPrefix}-formula`, text }),
      }),

      mention: withCustomComponent(cfg, 'mention', {
        resolve: (node) => resolveMentionData(node),
        render: (mention) => {
          const linkProps: Record<string, unknown> = { href: mention.href };
          if (mention.className) linkProps.className = mention.className;
          if (mention.target) linkProps.target = mention.target;
          return createElement('a', linkProps, mention.name);
        },
        toProps: (mention) => {
          const props: Record<string, unknown> = { href: mention.href };
          if (mention.className) props.className = mention.className;
          if (mention.target) props.target = mention.target;
          return props;
        },
      }),
    },

    // ─── Element Marks (create wrapper elements) ─────────────────────────
    // Reuse SimpleTagMark descriptors — BaseRenderer calls renderSimpleTag()
    marks: {
      bold: boldMark,
      italic: italicMark,
      underline: underlineMark,
      strike: strikeMark,
      code: codeMark,
      script: scriptMark,

      link: (content, value, node) => {
        const rawHref = String(value);
        if (!rawHref) return content;

        const href = sanitizeUrl(rawHref, cfg);
        if (!href) return content;

        const meta = resolveLinkMeta(node, cfg.linkTarget, cfg.linkRel);
        const linkProps: Record<string, unknown> = { href };
        if (meta.target) linkProps.target = meta.target;
        if (meta.rel) linkProps.rel = meta.rel;

        return createElement('a', linkProps, content);
      },

      font: (content, value) => {
        const className = `${cfg.classPrefix}-font-${String(value)}`;
        return createElement('span', { className }, content);
      },

      size: (content, value) => {
        const className = `${cfg.classPrefix}-size-${String(value)}`;
        return createElement('span', { className }, content);
      },
    },

    // ─── Attributor Marks (contribute attrs to parent element) ───────────
    attributors: {
      color: (value) => ({
        style: { color: String(value) },
      }),

      background: (value) => ({
        style: { backgroundColor: String(value) },
      }),
    },
  };
}
