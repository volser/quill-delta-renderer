import type { BlockDescriptor, TNode } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';
import { buildRendererConfig } from './functions/build-renderer-config';
import { padListItemContent } from './functions/pad-list-item-content';
import { resolveCodeBlockLanguage } from './functions/resolve-code-block-language';
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
 * The renderer is designed for extensibility — use `extendBlock()` and
 * `extendMark()` to add handlers for custom embed types (e.g. mentions,
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
 * const renderer = new MarkdownRenderer();
 * renderer.extendBlock('user_mention', (node) => {
 *   const data = node.data as Record<string, unknown>;
 *   return `[@${data.name}](#user_mention#${data.id})`;
 * });
 * ```
 */
export class MarkdownRenderer extends BaseRenderer<string> {
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
    const firstChild = node.children[0];
    const lang = firstChild ? resolveCodeBlockLanguage(firstChild) : '';

    const lines = node.children.map((child) => {
      return child.children.map((c) => String(c.data ?? '')).join('');
    });

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

  // ─── BaseRenderer Abstract Methods ────────────────────────────────────────

  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    return text;
  }

  protected emptyAttrs(): unknown {
    return undefined;
  }

  protected mergeAttrs(_target: unknown, source: unknown): unknown {
    return source;
  }

  protected hasAttrs(_attrs: unknown): boolean {
    return false;
  }

  protected wrapWithAttrs(content: string, _attrs: unknown): string {
    return content;
  }

  protected renderSimpleTag(_tag: string, content: string, _collectedAttrs?: unknown): string {
    return content;
  }

  protected renderBlockFromDescriptor(
    _descriptor: BlockDescriptor,
    _node: TNode,
    childrenOutput: string,
    _resolvedAttrs: unknown,
  ): string {
    return childrenOutput;
  }
}
