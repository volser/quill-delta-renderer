import { DEFAULT_MARK_PRIORITIES } from '../../../common/default-mark-priorities';
import type { NodeOverrideContext, TNode } from '../../../core/ast-types';
import type { SimpleRendererConfig } from '../../../core/simple-renderer';
import { getHeaderLevel } from '../../common/node-attributes';
import { resolveCodeBlockLines } from '../../common/resolve-code-block-lines';
import {
  resolveFormulaText,
  resolveImageData,
  resolveVideoSrc,
} from '../../common/resolve-embed-data';
import type { ResolvedMarkdownConfig } from '../types/markdown-config';
import { padListItemContent } from './pad-list-item-content';
import { resolveCodeBlockLanguage } from './resolve-code-block-language';
import { resolveListType } from './resolve-list-type';

// ─── Node Override Helpers ─────────────────────────────────────────────────

function renderRoot(node: TNode, ctx: NodeOverrideContext<string>): string {
  const parts = node.children.map((child) => ctx.renderNode(child));

  // Trim trailing empty parts (from trailing newlines in the delta)
  while (parts.length > 0 && parts[parts.length - 1] === '') {
    parts.pop();
  }

  return parts.join('\n');
}

function renderCodeBlockContainer(node: TNode, cfg: ResolvedMarkdownConfig): string {
  const { language, lines } = resolveCodeBlockLines(node);
  const lang = language && language !== 'plain' ? language : '';
  return `${cfg.fenceChar}${lang}\n${lines.join('\n')}\n${cfg.fenceChar}`;
}

function renderListNode(
  node: TNode,
  depth: number,
  cfg: ResolvedMarkdownConfig,
  renderNode: (child: TNode) => string,
): string {
  let orderedIndex = 0;
  const items: string[] = [];

  for (const child of node.children) {
    if (child.type !== 'list-item') continue;

    const listType = resolveListType(child);
    if (listType === 'ordered') {
      orderedIndex++;
    }

    items.push(renderListItem(child, listType, orderedIndex, depth, cfg, renderNode));
  }

  return items.join('\n');
}

function renderListItem(
  node: TNode,
  listType: string,
  orderedIndex: number,
  depth: number,
  cfg: ResolvedMarkdownConfig,
  renderNode: (child: TNode) => string,
): string {
  const indent = cfg.indentString.repeat(depth);
  const prefix = getListPrefix(listType, orderedIndex, cfg);

  const inlineChildren = node.children.filter((c) => c.type !== 'list');
  const nestedLists = node.children.filter((c) => c.type === 'list');

  const rawContent = inlineChildren.map(renderNode).join('');
  const content = padListItemContent(rawContent, indent + cfg.indentString);

  let result = `${indent}${prefix}${content}`;

  for (const nestedList of nestedLists) {
    result += `\n${renderListNode(nestedList, depth + 1, cfg, renderNode)}`;
  }

  return result;
}

function getListPrefix(
  listType: string,
  orderedIndex: number,
  cfg: ResolvedMarkdownConfig,
): string {
  switch (listType) {
    case 'ordered':
      return `${orderedIndex}. `;
    case 'checked':
      return '- [x] ';
    case 'unchecked':
      return '- [ ] ';
    default:
      return `${cfg.bulletChar}${cfg.bulletPadding}`;
  }
}

/**
 * Build a full `SimpleRendererConfig<string>` from the resolved markdown config.
 *
 * Defines all block handlers (paragraph, header, blockquote, code-block,
 * image, video, divider, formula, table pass-throughs) and mark handlers
 * (bold, italic, strike, code, link + passthrough for unsupported marks).
 *
 * Node overrides handle `root`, `list`, and `code-block-container` — types
 * that need custom traversal logic not expressible as simple block handlers.
 */
export function buildRendererConfig(cfg: ResolvedMarkdownConfig): SimpleRendererConfig<string> {
  return {
    markPriorities: DEFAULT_MARK_PRIORITIES,

    nodeOverrides: {
      root: (node, ctx) => renderRoot(node, ctx),

      'code-block-container': (node) => renderCodeBlockContainer(node, cfg),

      list: (node, ctx) => renderListNode(node, 0, cfg, ctx.renderNode),
    },

    blocks: {
      paragraph: (_node, children) => {
        return children || '';
      },

      header: (node, children) => {
        const level = getHeaderLevel(node);
        const prefix = '#'.repeat(level);
        return `${prefix} ${children}`;
      },

      blockquote: (_node, children) => {
        const content = children || '';
        return content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
      },

      'code-block': (node, children) => {
        // Standalone code block (when used without codeBlockGrouper).
        // Within a code-block-container this is handled by nodeOverrides.
        const lang = resolveCodeBlockLanguage(node);
        return `${cfg.fenceChar}${lang}\n${children}\n${cfg.fenceChar}`;
      },

      image: (node) => {
        const img = resolveImageData(node);
        if (!img) return '';
        return `![${img.alt}](${img.src})`;
      },

      video: (node) => {
        return resolveVideoSrc(node) ?? '';
      },

      divider: () => cfg.hrString,

      formula: (node) => {
        return resolveFormulaText(node);
      },

      // Table blocks — basic passthrough rendering.
      // A full table→markdown converter can be added via withBlock().
      table: (_node, children) => children,
      'table-row': (_node, children) => children,
      'table-cell': (_node, children) => children,
    },

    marks: {
      bold: (content) => `**${content}**`,
      italic: (content) => `_${content}_`,
      strike: (content) => `~~${content}~~`,
      code: (content) => `\`${content}\``,
      link: (content, value) => `[${content}](${String(value)})`,

      // No native Markdown equivalents — pass content through
      underline: (content) => content as string,
      script: (content) => content as string,
      color: (content) => content as string,
      background: (content) => content as string,
      font: (content) => content as string,
      size: (content) => content as string,
    },
  };
}
