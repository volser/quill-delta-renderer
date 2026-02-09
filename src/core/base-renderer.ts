import type {
  AttributorHandler,
  BlockDescriptor,
  BlockHandler,
  MarkHandler,
  RendererConfig,
  SimpleTagMark,
  TNode,
} from './ast-types';

/**
 * Type guard — check if a mark config is a {@link SimpleTagMark} descriptor.
 */
function isSimpleTagMark<Output, Attrs>(
  mark: MarkHandler<Output, Attrs> | SimpleTagMark,
): mark is SimpleTagMark {
  return typeof mark === 'object' && 'tag' in mark;
}

/**
 * Type guard — check if a block config is a {@link BlockDescriptor}.
 */
function isBlockDescriptor<Output, Attrs>(
  block: BlockHandler<Output, Attrs> | BlockDescriptor,
): block is BlockDescriptor {
  return typeof block === 'object' && 'tag' in block;
}

/**
 * Abstract base class for all renderers.
 *
 * Handles:
 * - Recursive AST traversal
 * - Mark (inline formatting) priority sorting with attributor support
 * - Block attribute resolution
 * - Declarative block/mark descriptors
 * - Immutable extension via `withBlock()` / `withMark()` / `withAttributor()`
 *
 * Subclasses must implement:
 * - `joinChildren()` — how to combine rendered children into a single output
 * - `renderText()` — how to render a plain text leaf node
 * - `emptyAttrs()` — return the identity/empty value for the Attrs type
 * - `mergeAttrs()` — merge two Attrs objects into one
 * - `hasAttrs()` — check whether an Attrs object has any content
 * - `wrapWithAttrs()` — how to wrap content in a default element with collected attrs
 * - `renderSimpleTag()` — how to render a simple tag mark with optional collected attrs
 * - `renderBlockFromDescriptor()` — how to render a declarative block descriptor
 *
 * @typeParam Output - The rendered output type (string, ReactNode, etc.)
 * @typeParam Attrs - The collected attribute type. Each renderer defines
 *   its own shape (e.g., HTML uses `ResolvedAttrs` with style/classes/attrs;
 *   React could use a props object; Markdown uses `never`).
 */
export abstract class BaseRenderer<Output, Attrs = unknown> {
  protected blocks: Record<string, BlockHandler<Output, Attrs> | BlockDescriptor>;
  protected marks: Record<string, MarkHandler<Output, Attrs> | SimpleTagMark>;
  protected attributors: Record<string, AttributorHandler<Attrs>>;
  protected markPriorities: Record<string, number>;
  protected blockAttributeResolvers: Array<(node: TNode) => Attrs>;

  constructor(config: RendererConfig<Output, Attrs>) {
    this.blocks = { ...config.blocks };
    this.marks = { ...config.marks };
    this.attributors = { ...config.attributors };
    this.markPriorities = { ...config.markPriorities };
    this.blockAttributeResolvers = [...(config.blockAttributeResolvers ?? [])];
  }

  /**
   * Render a full AST tree (typically starting from the root node).
   */
  render(node: TNode): Output {
    return this.renderNode(node);
  }

  // ─── Immutable Extension API ────────────────────────────────────────

  /**
   * Return a shallow clone of this renderer with a block handler added or replaced.
   * The original renderer is not modified.
   */
  withBlock(type: string, handler: BlockHandler<Output, Attrs> | BlockDescriptor): this {
    const clone = this.shallowClone();
    clone.blocks = { ...this.blocks, [type]: handler };
    return clone;
  }

  /**
   * Return a shallow clone of this renderer with a mark handler added or replaced.
   * The original renderer is not modified.
   */
  withMark(name: string, handler: MarkHandler<Output, Attrs> | SimpleTagMark): this {
    const clone = this.shallowClone();
    clone.marks = { ...this.marks, [name]: handler };
    return clone;
  }

  /**
   * Return a shallow clone of this renderer with an attributor added or replaced.
   * The original renderer is not modified.
   */
  withAttributor(name: string, handler: AttributorHandler<Attrs>): this {
    const clone = this.shallowClone();
    clone.attributors = { ...this.attributors, [name]: handler };
    return clone;
  }

  /**
   * Return a shallow clone of this renderer with a mark priority set or replaced.
   * The original renderer is not modified.
   */
  withMarkPriority(name: string, priority: number): this {
    const clone = this.shallowClone();
    clone.markPriorities = { ...this.markPriorities, [name]: priority };
    return clone;
  }

  /**
   * Return a shallow clone of this renderer with an additional block attribute resolver.
   * The original renderer is not modified.
   */
  withBlockAttributeResolver(resolver: (node: TNode) => Attrs): this {
    const clone = this.shallowClone();
    clone.blockAttributeResolvers = [...this.blockAttributeResolvers, resolver];
    return clone;
  }

  /**
   * Create a shallow clone of this renderer instance, preserving the
   * prototype chain so that subclass overrides remain intact.
   */
  private shallowClone(): this {
    const clone = Object.create(Object.getPrototypeOf(this)) as this;
    Object.assign(clone, this);
    // Deep-copy mutable collections so the clone doesn't share references
    clone.blocks = { ...this.blocks };
    clone.marks = { ...this.marks };
    clone.attributors = { ...this.attributors };
    clone.markPriorities = { ...this.markPriorities };
    clone.blockAttributeResolvers = [...this.blockAttributeResolvers];
    return clone;
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

  /**
   * Return the empty/identity value for the `Attrs` type.
   * Used as the starting point for attribute collection.
   */
  protected abstract emptyAttrs(): Attrs;

  /**
   * Merge two `Attrs` objects into one. Source values take precedence
   * over target values on conflict.
   */
  protected abstract mergeAttrs(target: Attrs, source: Attrs): Attrs;

  /**
   * Check whether an `Attrs` object has any meaningful content.
   * Returns false for the empty/identity value.
   */
  protected abstract hasAttrs(attrs: Attrs): boolean;

  /**
   * Wrap content in a default element (e.g. `<span>`) with the given
   * collected attributor attrs. Used when there are attributor marks
   * but no element marks on a text node.
   */
  protected abstract wrapWithAttrs(content: Output, attrs: Attrs): Output;

  /**
   * Render a simple tag mark. For HTML: `<tag [attrs]>content</tag>`.
   *
   * @param tag - The resolved tag name
   * @param content - The already-rendered inner content
   * @param collectedAttrs - Optional attrs from attributors (only for innermost mark)
   */
  protected abstract renderSimpleTag(tag: string, content: Output, collectedAttrs?: Attrs): Output;

  /**
   * Render a block from a declarative {@link BlockDescriptor}.
   * For HTML: `<tag [resolvedAttrs]>{children || emptyContent}</tag>`.
   */
  protected abstract renderBlockFromDescriptor(
    descriptor: BlockDescriptor,
    node: TNode,
    childrenOutput: Output,
    resolvedAttrs: Attrs,
  ): Output;

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

    // Block-level node
    const blockConfig = this.blocks[node.type];
    if (blockConfig) {
      const childrenOutput = this.renderChildren(node);
      const resolvedAttrs = this.resolveBlockAttributes(node);

      if (isBlockDescriptor(blockConfig)) {
        return this.renderBlockFromDescriptor(blockConfig, node, childrenOutput, resolvedAttrs);
      }

      return blockConfig(node, childrenOutput, resolvedAttrs);
    }

    // Fallback: render children only (transparent wrapper)
    return this.renderChildren(node);
  }

  protected renderChildren(node: TNode): Output {
    const renderedChildren = node.children.map((child) => this.renderNode(child));
    return this.joinChildren(renderedChildren);
  }

  /**
   * Render a text node with two-phase mark application:
   * 1. Collect attributor contributions into a single `Attrs`
   * 2. Apply element marks from innermost to outermost
   *    - The innermost element mark receives the collected attrs
   *    - If no element marks, wrap in a default element with collected attrs
   */
  protected renderTextNode(node: TNode): Output {
    let output = this.renderText(node.data as string);

    // Phase 1: Collect attributor contributions
    const collectedAttrs = this.collectAttributorAttrs(node);

    // Phase 2: Collect and sort element marks
    const elementMarks = this.getApplicableElementMarks(node);
    elementMarks.sort((a, b) => a.priority - b.priority);

    const hasCollected = this.hasAttrs(collectedAttrs);

    if (elementMarks.length > 0) {
      // Apply element marks from innermost to outermost
      for (const [i, entry] of elementMarks.entries()) {
        const { mark, value } = entry;
        // Only the innermost mark (i === 0) receives collected attrs
        const attrs = i === 0 && hasCollected ? collectedAttrs : undefined;

        if (isSimpleTagMark(mark)) {
          const tag = typeof mark.tag === 'function' ? mark.tag(value) : mark.tag;
          output = this.renderSimpleTag(tag, output, attrs);
        } else {
          output = mark(output, value, node, attrs);
        }
      }
    } else if (hasCollected) {
      // No element marks, but attributors contributed attrs — wrap in default element
      output = this.wrapWithAttrs(output, collectedAttrs);
    }

    return output;
  }

  /**
   * Resolve block attributes by running all configured resolvers
   * and merging their results.
   */
  protected resolveBlockAttributes(node: TNode): Attrs {
    let result = this.emptyAttrs();

    for (const resolver of this.blockAttributeResolvers) {
      const contribution = resolver(node);
      if (this.hasAttrs(contribution)) {
        result = this.hasAttrs(result) ? this.mergeAttrs(result, contribution) : contribution;
      }
    }

    return result;
  }

  /**
   * Collect inline attributor contributions from a node's attributes.
   */
  private collectAttributorAttrs(node: TNode): Attrs {
    let result = this.emptyAttrs();

    for (const [attrName, attrValue] of Object.entries(node.attributes)) {
      const handler = this.attributors[attrName];
      if (handler) {
        const contribution = handler(attrValue, node);
        if (this.hasAttrs(contribution)) {
          result = this.hasAttrs(result) ? this.mergeAttrs(result, contribution) : contribution;
        }
      }
    }

    return result;
  }

  /**
   * Get applicable element marks (from `marks` config) for a text node.
   * Excludes attributes handled by `attributors`.
   */
  private getApplicableElementMarks(node: TNode): Array<{
    name: string;
    mark: MarkHandler<Output, Attrs> | SimpleTagMark;
    value: unknown;
    priority: number;
  }> {
    const result: Array<{
      name: string;
      mark: MarkHandler<Output, Attrs> | SimpleTagMark;
      value: unknown;
      priority: number;
    }> = [];

    for (const [attrName, attrValue] of Object.entries(node.attributes)) {
      const mark = this.marks[attrName];
      if (mark) {
        const priority = this.markPriorities[attrName] ?? 0;
        result.push({
          name: attrName,
          mark,
          value: attrValue,
          priority,
        });
      }
    }

    return result;
  }
}
