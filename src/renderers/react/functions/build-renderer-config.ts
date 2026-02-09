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
} from '../../html/common/simple-marks';
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
 * Wrap a block handler so that a custom component (if registered) is rendered
 * instead of the default element. Eliminates the repetitive `tryCustomComponent`
 * guard at the top of every block handler.
 */
function withCustomComponent(
  cfg: ResolvedReactConfig,
  type: string,
  handler: BlockFn,
  extraPropsFromNode?: (node: TNode, children: ReactNode) => Record<string, unknown> | undefined,
): BlockFn {
  return (node, children, resolvedAttrs) => {
    const Component: ComponentType<BlockComponentProps> | undefined = cfg.components[type];
    if (Component) {
      const extra = extraPropsFromNode?.(node, children);
      return createElement(Component, { node, children, ...extra });
    }
    return handler(node, children, resolvedAttrs);
  };
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
 * `html/common/simple-marks.ts` — the `BaseRenderer` calls `renderSimpleTag()`
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

      'code-block': withCustomComponent(
        cfg,
        'code-block',
        (node, children) => {
          const meta = resolveCodeBlockMeta(node, cfg.classPrefix);
          const props: Record<string, unknown> = { className: meta.className };
          if (meta.language) props['data-language'] = meta.language;

          const tag = resolveTag(cfg, 'code-block', node, 'pre');
          return createElement(tag, props, children || null);
        },
        (node) => {
          const meta = resolveCodeBlockMeta(node, cfg.classPrefix);
          const props: Record<string, unknown> = { className: meta.className };
          if (meta.language) props['data-language'] = meta.language;
          return props;
        },
      ),

      'list-item': withCustomComponent(
        cfg,
        'list-item',
        (node, children) => {
          const checked = resolveCheckedState(node);
          const props: Record<string, unknown> = {};
          if (checked !== undefined) props['data-checked'] = checked;

          const tag = resolveTag(cfg, 'list-item', node, 'li');
          return createElement(tag, Object.keys(props).length > 0 ? props : null, children || null);
        },
        (node) => {
          const checked = resolveCheckedState(node);
          if (checked !== undefined) return { 'data-checked': checked };
          return undefined;
        },
      ),

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

      'table-cell': withCustomComponent(
        cfg,
        'table-cell',
        (node, children) => {
          const row = getTableRow(node);
          const props: Record<string, unknown> = {};
          if (row) props['data-row'] = row;

          return createElement('td', Object.keys(props).length > 0 ? props : null, children);
        },
        (node) => {
          const row = getTableRow(node);
          if (row) return { 'data-row': row };
          return undefined;
        },
      ),

      image: withCustomComponent(
        cfg,
        'image',
        (node) => {
          const img = resolveImageData(node);
          if (!img) return null;

          const imgProps: Record<string, unknown> = { src: img.src, alt: img.alt };
          if (img.width) imgProps.width = img.width;
          if (img.height) imgProps.height = img.height;

          const imgElement = createElement('img', imgProps);

          if (img.linkHref) {
            const linkProps: Record<string, unknown> = { href: img.linkHref };
            if (cfg.linkTarget) linkProps.target = cfg.linkTarget;
            if (cfg.linkRel) linkProps.rel = cfg.linkRel;
            return createElement('a', linkProps, imgElement);
          }

          return imgElement;
        },
        (node) => {
          const img = resolveImageData(node);
          if (!img) return undefined;
          const props: Record<string, unknown> = { src: img.src, alt: img.alt };
          if (img.width) props.width = img.width;
          if (img.height) props.height = img.height;
          return props;
        },
      ),

      video: withCustomComponent(
        cfg,
        'video',
        (node) => {
          const src = resolveVideoSrc(node);
          if (!src) return null;

          return createElement('iframe', {
            className: `${cfg.classPrefix}-video`,
            src,
            frameBorder: '0',
            allowFullScreen: true,
          });
        },
        (node) => {
          const src = resolveVideoSrc(node);
          if (!src) return undefined;
          return { src, className: `${cfg.classPrefix}-video` };
        },
      ),

      formula: withCustomComponent(
        cfg,
        'formula',
        (node) => {
          const formulaClass = `${cfg.classPrefix}-formula`;
          const text = resolveFormulaText(node);
          return createElement('span', { className: formulaClass }, text);
        },
        (node) => {
          const text = resolveFormulaText(node);
          return { className: `${cfg.classPrefix}-formula`, text };
        },
      ),

      mention: withCustomComponent(
        cfg,
        'mention',
        (node) => {
          const mention = resolveMentionData(node);
          const linkProps: Record<string, unknown> = { href: mention.href };
          if (mention.className) linkProps.className = mention.className;
          if (mention.target) linkProps.target = mention.target;
          return createElement('a', linkProps, mention.name);
        },
        (node) => {
          const mention = resolveMentionData(node);
          const props: Record<string, unknown> = { href: mention.href };
          if (mention.className) props.className = mention.className;
          if (mention.target) props.target = mention.target;
          return props;
        },
      ),
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
        const href = String(value);
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
