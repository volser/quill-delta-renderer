import type { TNode } from '../../core/ast-types';
import { SimpleRenderer } from '../../core/simple-renderer';
import { resolveCodeBlockLines } from '../common/resolve-code-block-lines';
import { buildRendererConfig } from './functions/build-renderer-config';
import { padListItemContent } from './functions/pad-list-item-content';
import { resolveConfig } from './functions/resolve-config';
import { resolveListType } from './functions/resolve-list-type';
import type { MarkdownConfig, ResolvedMarkdownConfig } from './types/markdown-config';

/**
 * Renders an AST into Markdown text.
 *
 * Supports all standard Quill block types (paragraphs, headers, blockquotes,
 * code blocks, lists, images, video, horizontal rules) and inline marks
 * (bold, italic, strike, code, link).
 *
 * Markdown has no concept of inline styling, so color, background, font,
 * size, and underline are silently ignored.
 *
 * The renderer is designed for extensibility — use `withBlock()` and
 * `withMark()` to add handlers for custom embed types (e.g. mentions,
 * link previews, formulas).
 *
 * @example
 * ```ts
 * const renderer = new MarkdownRenderer();
 * const md = renderer.render(ast);
 * ```
 *
 * @example
 * ```ts
 * // Customized output
 * const renderer = new MarkdownRenderer({
 *   bulletChar: '-',
 *   hrString: '---',
 *   fenceChar: '~~~',
 * });
 * ```
 *
 * @example
 * ```ts
 * // Extend with custom embed
 * const renderer = new MarkdownRenderer().withBlock('user_mention', (node) => {
 *   const data = node.data as Record<string, unknown>;
 *   return `[@${data.name}](#user_mention#${data.id})`;
 * });
 * ```
 */
export class MarkdownRenderer extends SimpleRenderer<string> {
  private readonly cfg: ResolvedMarkdownConfig;

  constructor(config?: MarkdownConfig) {
    const cfg = resolveConfig(config);
    super(buildRendererConfig(cfg));
    this.cfg = cfg;
  }

  // ─── Tree Traversal Overrides ───────────────────────────────────────────

  protected override renderNode(node: TNode): string {
    if (node.type === 'root') {
      return this.renderRoot(node);
    }

    if (node.type === 'list') {
      return this.renderList(node, 0);
    }

    if (node.type === 'code-block-container') {
      return this.renderCodeBlockContainer(node);
    }

    return super.renderNode(node);
  }

  // ─── Root ─────────────────────────────────────────────────────────────────

  private renderRoot(node: TNode): string {
    const parts = node.children.map((child) => this.renderNode(child));

    // Trim trailing empty parts (from trailing newlines in the delta)
    while (parts.length > 0 && parts[parts.length - 1] === '') {
      parts.pop();
    }

    return parts.join('\n');
  }

  // ─── Code Blocks ──────────────────────────────────────────────────────────

  private renderCodeBlockContainer(node: TNode): string {
    const { language, lines } = resolveCodeBlockLines(node);
    // In Markdown, 'plain' means no language tag on the fence
    const lang = language && language !== 'plain' ? language : '';
    return `${this.cfg.fenceChar}${lang}\n${lines.join('\n')}\n${this.cfg.fenceChar}`;
  }

  // ─── Lists ────────────────────────────────────────────────────────────────

  private renderList(node: TNode, depth: number): string {
    let orderedIndex = 0;
    const items: string[] = [];

    for (const child of node.children) {
      if (child.type !== 'list-item') continue;

      const listType = resolveListType(child);
      if (listType === 'ordered') {
        orderedIndex++;
      }

      items.push(this.renderListItem(child, listType, orderedIndex, depth));
    }

    return items.join('\n');
  }

  private renderListItem(
    node: TNode,
    listType: string,
    orderedIndex: number,
    depth: number,
  ): string {
    const indent = this.cfg.indentString.repeat(depth);
    const prefix = this.getListPrefix(listType, orderedIndex);

    const inlineChildren = node.children.filter((c) => c.type !== 'list');
    const nestedLists = node.children.filter((c) => c.type === 'list');

    const rawContent = inlineChildren.map((c) => this.renderNode(c)).join('');
    const content = padListItemContent(rawContent, indent + this.cfg.indentString);

    let result = `${indent}${prefix}${content}`;

    for (const nestedList of nestedLists) {
      result += `\n${this.renderList(nestedList, depth + 1)}`;
    }

    return result;
  }

  private getListPrefix(listType: string, orderedIndex: number): string {
    switch (listType) {
      case 'ordered':
        return `${orderedIndex}. `;
      case 'checked':
        return '- [x] ';
      case 'unchecked':
        return '- [ ] ';
      default:
        return `${this.cfg.bulletChar}${this.cfg.bulletPadding}`;
    }
  }

  // ─── SimpleRenderer Abstract Methods ─────────────────────────────────────

  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    return text;
  }
}
