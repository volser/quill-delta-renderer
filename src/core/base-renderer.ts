import type { BlockHandler, MarkHandler, RendererConfig, TNode } from './ast-types';
import { MARK_PRIORITIES } from './ast-types';

/**
 * Abstract base class for all renderers.
 *
 * Handles:
 * - Recursive AST traversal
 * - Mark (inline formatting) priority sorting
 * - Runtime extension via `extendBlock()` / `extendMark()`
 *
 * Subclasses must implement:
 * - `joinChildren()` — how to combine rendered children into a single output
 * - `renderText()` — how to render a plain text leaf node
 *
 * @typeParam Output - The rendered output type (string, ReactNode, etc.)
 */
export abstract class BaseRenderer<Output> {
  protected blocks: Record<string, BlockHandler<Output>>;
  protected marks: Record<string, MarkHandler<Output>>;
  protected markPriorities: Record<string, number>;

  constructor(config: RendererConfig<Output>) {
    this.blocks = { ...config.blocks };
    this.marks = { ...config.marks };
    this.markPriorities = { ...MARK_PRIORITIES };
  }

  /**
   * Render a full AST tree (typically starting from the root node).
   */
  render(node: TNode): Output {
    return this.renderNode(node);
  }

  /**
   * Override or add a block handler at runtime.
   *
   * @example
   * ```ts
   * renderer.extendBlock('image', (node) => `<figure>...</figure>`);
   * ```
   */
  extendBlock(type: string, handler: BlockHandler<Output>): void {
    this.blocks[type] = handler;
  }

  /**
   * Override or add a mark handler at runtime.
   *
   * @example
   * ```ts
   * renderer.extendMark('mention', (content, userId) => `<a>@${content}</a>`);
   * ```
   */
  extendMark(name: string, handler: MarkHandler<Output>): void {
    this.marks[name] = handler;
  }

  /**
   * Set or override the priority for a mark.
   * Higher priority = wraps outer (applied first).
   */
  setMarkPriority(name: string, priority: number): void {
    this.markPriorities[name] = priority;
  }

  // ─── Abstract Methods (must be implemented by subclasses) ───────────────

  /**
   * Combine an array of rendered children into a single output value.
   * For strings: concatenation. For React: array of elements.
   */
  protected abstract joinChildren(children: Output[]): Output;

  /**
   * Render a plain text string as the output type.
   * This is the leaf-level conversion (e.g., escaping HTML entities for HTML renderers).
   */
  protected abstract renderText(text: string): Output;

  // ─── Tree Traversal ────────────────────────────────────────────────────

  protected renderNode(node: TNode): Output {
    // Root node: just render children
    if (node.type === 'root') {
      return this.renderChildren(node);
    }

    // Inline text leaf
    if (node.type === 'text') {
      return this.renderTextNode(node);
    }

    // Block-level node — use the block handler if available
    const blockHandler = this.blocks[node.type];
    if (blockHandler) {
      const childrenOutput = this.renderChildren(node);
      return blockHandler(node, childrenOutput);
    }

    // Fallback: render children only (transparent wrapper)
    return this.renderChildren(node);
  }

  protected renderChildren(node: TNode): Output {
    const renderedChildren = node.children.map((child) => this.renderNode(child));
    return this.joinChildren(renderedChildren);
  }

  /**
   * Render a text node, applying all inline marks sorted by priority.
   * Marks are applied from lowest priority (innermost) to highest (outermost).
   */
  protected renderTextNode(node: TNode): Output {
    let output = this.renderText(node.data as string);

    // Collect applicable marks from the node's attributes
    const applicableMarks = this.getApplicableMarks(node);

    // Sort by priority ascending — lowest priority wraps innermost
    applicableMarks.sort((a, b) => a.priority - b.priority);

    // Apply marks from innermost to outermost
    for (const { handler, value } of applicableMarks) {
      output = handler(output, value, node);
    }

    return output;
  }

  private getApplicableMarks(node: TNode): Array<{
    name: string;
    handler: MarkHandler<Output>;
    value: unknown;
    priority: number;
  }> {
    const result: Array<{
      name: string;
      handler: MarkHandler<Output>;
      value: unknown;
      priority: number;
    }> = [];

    for (const [attrName, attrValue] of Object.entries(node.attributes)) {
      const handler = this.marks[attrName];
      if (handler) {
        const priority = this.markPriorities[attrName] ?? 0;
        result.push({
          name: attrName,
          handler,
          value: attrValue,
          priority,
        });
      }
    }

    return result;
  }
}
