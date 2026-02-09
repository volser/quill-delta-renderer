import { DEFAULT_MARK_PRIORITIES } from '../../common/default-mark-priorities';
import type { BlockDescriptor, RendererConfig, TNode } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';
import type { MarkdownConfig, ResolvedMarkdownConfig } from './types/markdown-config';
import { resolveMarkdownConfig } from './types/markdown-config';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract the programming language from a code-block node's attributes.
 *
 * Handles both string values (`'javascript'`) and nested objects
 * (`{ 'code-block': 'javascript' }`).
 *
 * Returns `''` for generic / `'plain'` / `true` code blocks.
 */
function resolveCodeBlockLanguage(node: TNode): string {
  const lang = node.attributes['code-block'];

  if (typeof lang === 'string' && lang !== 'true' && lang !== 'plain') {
    return lang;
  }

  if (typeof lang === 'object' && lang !== null) {
    const inner = (lang as Record<string, unknown>)['code-block'];
    if (typeof inner === 'string' && inner !== 'true' && inner !== 'plain') {
      return inner;
    }
  }

  return '';
}

/**
 * Resolve the list type from a list-item node's attributes.
 *
 * Supports both simple (`'bullet'`) and nested (`{ list: 'bullet' }`) formats.
 */
function resolveListType(node: TNode): string {
  const listAttr = node.attributes.list;
  if (typeof listAttr === 'string') return listAttr;

  if (typeof listAttr === 'object' && listAttr !== null) {
    const inner = (listAttr as Record<string, unknown>).list;
    if (typeof inner === 'string') return inner;
  }

  return 'bullet';
}

/**
 * Handle multi-line list item content by padding continuation lines.
 *
 * Matches the behavior of the existing `getContentForListItem()` function.
 */
function padListItemContent(content: string, padding: string): string {
  const lines = content.split(/\r?\n/);

  return lines.reduce((text, line, idx) => {
    if (line.trim()) {
      text += (idx > 0 ? padding : '') + line;
    }
    return text;
  }, '');
}

// ─── Renderer ───────────────────────────────────────────────────────────────

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
    const cfg = resolveMarkdownConfig(config);

    const rendererConfig: RendererConfig<string> = {
      markPriorities: DEFAULT_MARK_PRIORITIES,

      blocks: {
        paragraph: (_node, children) => {
          return children || '';
        },

        header: (node, children) => {
          const level = node.attributes.header as number;
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
          // Within a code-block-container this is handled by the override.
          const lang = resolveCodeBlockLanguage(node);
          return `${cfg.fenceChar}${lang}\n${children}\n${cfg.fenceChar}`;
        },

        image: (node) => {
          const data = node.data;
          const src =
            typeof data === 'string'
              ? data
              : String((data as Record<string, unknown>)?.url ?? data ?? '');
          const alt = (node.attributes.alt as string) ?? '';
          return `![${alt}](${src})`;
        },

        video: (node) => {
          const data = node.data;
          return typeof data === 'string'
            ? data
            : String((data as Record<string, unknown>)?.url ?? data ?? '');
        },

        divider: () => cfg.hrString,

        formula: (node) => {
          const data = node.data as string | Record<string, unknown>;
          return typeof data === 'string' ? data : String(data);
        },

        // Table blocks — basic passthrough rendering.
        // A full table→markdown converter can be added via extendBlock().
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

    super(rendererConfig);
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

  /**
   * Render a `code-block-container` produced by the `codeBlockGrouper` transformer.
   *
   * Collects the raw text of each child `code-block` node and wraps them
   * in a fenced code block with an optional language tag.
   */
  private renderCodeBlockContainer(node: TNode): string {
    const firstChild = node.children[0];
    const lang = firstChild ? resolveCodeBlockLanguage(firstChild) : '';

    const lines = node.children.map((child) => {
      // Extract raw text from code-block children — skip mark processing
      return child.children.map((c) => String(c.data ?? '')).join('');
    });

    return `${this.cfg.fenceChar}${lang}\n${lines.join('\n')}\n${this.cfg.fenceChar}`;
  }

  // ─── Lists ────────────────────────────────────────────────────────────────

  /**
   * Render a `list` node and all of its children recursively.
   *
   * Each list-item determines its own prefix based on its `list` attribute
   * (not the parent container's type), allowing mixed-type lists.
   *
   * Ordered items are numbered sequentially within each list container.
   */
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

    // Separate inline content from nested sub-lists
    const inlineChildren = node.children.filter((c) => c.type !== 'list');
    const nestedLists = node.children.filter((c) => c.type === 'list');

    // Render inline content and pad continuation lines
    const rawContent = inlineChildren.map((c) => this.renderNode(c)).join('');
    const content = padListItemContent(rawContent, indent + this.cfg.indentString);

    let result = `${indent}${prefix}${content}`;

    // Render nested sub-lists at the next depth level
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
    // Markdown has no inline attribute styling — return content as-is
    return content;
  }

  protected renderSimpleTag(_tag: string, content: string, _collectedAttrs?: unknown): string {
    // Markdown doesn't use HTML tags — return content as-is
    return content;
  }

  protected renderBlockFromDescriptor(
    _descriptor: BlockDescriptor,
    _node: TNode,
    childrenOutput: string,
    _resolvedAttrs: unknown,
  ): string {
    // No declarative block descriptors used in markdown — return children
    return childrenOutput;
  }
}
