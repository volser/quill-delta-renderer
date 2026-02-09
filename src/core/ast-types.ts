// ─── Quill Delta Types ───────────────────────────────────────────────────────

/**
 * A single Quill Delta operation.
 * Can be an insert (text or embed), delete, or retain.
 */
export interface DeltaOp {
  insert?: string | Record<string, unknown>;
  delete?: number;
  retain?: number;
  attributes?: Attributes;
}

/**
 * A Quill Delta document — an ordered list of operations.
 */
export interface Delta {
  ops: DeltaOp[];
}

// ─── AST Types ───────────────────────────────────────────────────────────────

/**
 * A bag of key-value attributes from Quill (bold, color, header level, etc.).
 */
export type Attributes = Record<string, unknown>;

/**
 * Known built-in node types produced by the parser and standard transformers.
 *
 * Custom embed types (e.g. `'my-widget'`) are also valid — the type field
 * accepts any string. This union exists to provide IDE autocomplete for the
 * common cases.
 */
export type KnownNodeType =
  | 'root'
  | 'text'
  | 'paragraph'
  | 'header'
  | 'blockquote'
  | 'code-block'
  | 'code-block-container'
  | 'list'
  | 'list-item'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'image'
  | 'video'
  | 'formula'
  | 'mention';

/**
 * The universal AST node. Decouples Quill's flat delta format from
 * the tree structure needed for rendering.
 */
export interface TNode {
  /**
   * Node type identifier (e.g. `'paragraph'`, `'header'`, `'list-item'`, `'video'`, `'text'`).
   *
   * Standard types are listed in {@link KnownNodeType}. Custom string types
   * are also accepted for embed/extension use cases.
   */
  type: KnownNodeType | (string & {});
  /** Quill attributes (formatting, ids, custom data) */
  attributes: Attributes;
  /** Child nodes */
  children: TNode[];
  /** Leaf payload — text content for text nodes, embed data for embeds */
  data?: string | Record<string, unknown>;
  /** Whether this node represents inline content (text, inline embeds) */
  isInline: boolean;
}

// ─── Type Guards ─────────────────────────────────────────────────────────────

/**
 * Check whether a node is a text leaf node.
 * Narrows `node.data` to `string` and `node.type` to `'text'`.
 */
export function isTextNode(node: TNode): node is TNode & { type: 'text'; data: string } {
  return node.type === 'text' && typeof node.data === 'string';
}

/**
 * Check whether a node is an embed node with object data.
 * Excludes text nodes — only matches nodes whose `data` is a non-null object.
 * Narrows `node.data` to `Record<string, unknown>`.
 */
export function isEmbedNode(node: TNode): node is TNode & { data: Record<string, unknown> } {
  return node.type !== 'text' && typeof node.data === 'object' && node.data !== null;
}

// ─── Transformer Types ───────────────────────────────────────────────────────

/**
 * A transformer function receives the root's children array and returns
 * a new (or mutated) children array. Used as middleware in the parsing pipeline.
 *
 * Transformers operate on the children array rather than the root node,
 * eliminating the boilerplate of unwrapping/rewrapping the root.
 * The `applyTransformers` utility handles root node management.
 *
 * @example
 * ```ts
 * const imageGrouper: Transformer = (children) => {
 *   // group adjacent image nodes into a gallery container
 *   return groupImages(children);
 * };
 * ```
 */
export type Transformer = (children: TNode[]) => TNode[];

// ─── Parser Types ────────────────────────────────────────────────────────────

/**
 * Describes how a block-level attribute maps to an AST node type.
 *
 * @param value - The attribute value from the delta
 * @returns The node type and any attributes to set on the block
 */
export type BlockAttributeHandler = (value: unknown) => {
  blockType: string;
  blockAttrs: Attributes;
};

/**
 * Configuration for the DeltaParser.
 * Maps Quill attribute names to their block-level parsing behavior.
 */
export interface ParserConfig {
  /** Block attribute handlers keyed by attribute name */
  blockAttributes: Record<string, BlockAttributeHandler>;
  /**
   * Embed types that are block-level (e.g. `['video']`).
   * Block embeds are rendered as standalone blocks instead of being
   * placed inside a paragraph.
   */
  blockEmbeds?: string[];
}

// ─── Renderer Types ─────────────────────────────────────────────────────────

/**
 * Handles rendering of a block-level node (paragraph, header, list, etc.).
 *
 * @typeParam Output - The rendered output type (string, ReactNode, etc.)
 * @typeParam Attrs - The collected attribute type (defined by the renderer)
 *
 * @param node - The AST node being rendered
 * @param childrenOutput - The already-rendered children content
 * @param resolvedAttrs - Pre-computed attributes from block attribute resolvers
 * @returns The rendered output for this block
 */
export type BlockHandler<Output, Attrs = unknown> = (
  node: TNode,
  childrenOutput: Output,
  resolvedAttrs: Attrs,
) => Output;

/**
 * Declarative descriptor for simple blocks that follow the pattern
 * `<tag [attrs]>{children || emptyContent}</tag>`.
 *
 * The renderer auto-applies resolved attributes and handles empty content.
 */
export interface BlockDescriptor {
  /** The tag name, or a function that resolves it from the node */
  tag: string | ((node: TNode) => string);
  /** Whether the tag is self-closing (e.g. `<br>`, `<hr>`). Defaults to false. */
  selfClosing?: boolean;
}

/**
 * Handles rendering of an inline mark (bold, italic, link, etc.)
 * that creates a wrapper element.
 *
 * @typeParam Output - The rendered output type (string, ReactNode, etc.)
 * @typeParam Attrs - The collected attribute type (defined by the renderer)
 *
 * @param content - The already-rendered inner content
 * @param value - The attribute value (e.g. href for links, color hex for color)
 * @param node - The full AST node for additional context
 * @param collectedAttrs - Attributes collected from attributor marks.
 *   Only provided to the **innermost** element mark.
 * @returns The wrapped/decorated output
 */
export type MarkHandler<Output, Attrs = unknown> = (
  content: Output,
  value: unknown,
  node: TNode,
  collectedAttrs?: Attrs,
) => Output;

/**
 * Declarative descriptor for simple marks that just wrap content in a tag.
 * The renderer auto-handles collected attrs injection.
 *
 * @example
 * ```ts
 * const boldMark: SimpleTagMark = { tag: 'strong' };
 * const scriptMark: SimpleTagMark = { tag: (v) => v === 'super' ? 'sup' : 'sub' };
 * ```
 */
export interface SimpleTagMark {
  /** The tag name, or a function that resolves it from the mark value */
  tag: string | ((value: unknown) => string);
}

/**
 * An inline attributor mark — contributes renderer-specific attributes
 * to the nearest parent element mark instead of creating a wrapper element.
 *
 * Mirrors Quill's Parchment Attributor concept.
 *
 * @typeParam Attrs - The collected attribute type (defined by the renderer)
 *
 * @example
 * ```ts
 * // For an HTML renderer where Attrs = ResolvedAttrs:
 * const colorAttributor: AttributorHandler<ResolvedAttrs> = (value) => ({
 *   style: { color: String(value) },
 * });
 * ```
 */
export type AttributorHandler<Attrs> = (value: unknown, node: TNode) => Attrs;

/**
 * Resolves block-level attributes from a node. Multiple resolvers
 * can be composed, and their results are merged by the renderer.
 *
 * @typeParam Attrs - The collected attribute type (defined by the renderer)
 *
 * @example
 * ```ts
 * const layoutResolver: BlockAttributeResolver<ResolvedAttrs> = (node) => ({
 *   classes: getLayoutClasses(node, 'ql'),
 * });
 * ```
 */
export type BlockAttributeResolver<Attrs> = (node: TNode) => Attrs;

/**
 * Context object passed to node override handlers, providing access to
 * the renderer's traversal methods.
 */
export interface NodeOverrideContext<Output> {
  /** Invoke the standard block/children rendering for the current node. */
  defaultRender: () => Output;
  /** Render an arbitrary child node through the full rendering pipeline. */
  renderNode: (child: TNode) => Output;
  /** Render all children of a node and join them into a single output. */
  renderChildren: (node: TNode) => Output;
}

/**
 * Handles rendering of a specific node type, with access to the default
 * rendering path and child-rendering utilities as a fallback.
 *
 * @typeParam Output - The rendered output type (string, ReactNode, etc.)
 *
 * @param node - The AST node being rendered
 * @param ctx - Context with `defaultRender`, `renderNode`, and `renderChildren`
 * @returns The rendered output for this node
 */
export type NodeOverrideHandler<Output> = (node: TNode, ctx: NodeOverrideContext<Output>) => Output;

/**
 * Configuration for a renderer — maps node types to block handlers
 * and attribute names to mark handlers.
 *
 * @typeParam Output - The rendered output type (string, ReactNode, etc.)
 * @typeParam Attrs - The collected attribute type (defined by the renderer).
 *   Defaults to `unknown` for renderers that don't use attributors.
 */
export interface RendererConfig<Output, Attrs = unknown> {
  /** How to render block-level nodes (paragraph, header, list, etc.) */
  blocks: Record<string, BlockHandler<Output, Attrs> | BlockDescriptor>;
  /** How to render inline element marks (bold, link, etc.) that create wrapper elements */
  marks: Record<string, MarkHandler<Output, Attrs> | SimpleTagMark>;
  /** Inline attributor marks that contribute attrs to the parent element */
  attributors?: Record<string, AttributorHandler<Attrs>>;
  /** Optional mark nesting priorities. Higher value = wraps outer. */
  markPriorities?: Record<string, number>;
  /** Block attribute resolvers — compute generic attrs for all blocks */
  blockAttributeResolvers?: BlockAttributeResolver<Attrs>[];
  /**
   * Override rendering for specific node types. Checked before the standard
   * block handler lookup. The handler receives a `defaultRender` thunk
   * for falling back to the standard rendering path.
   */
  nodeOverrides?: Record<string, NodeOverrideHandler<Output>>;

  /**
   * Called when the renderer encounters a node type with no block handler
   * and no nodeOverride. Useful for diagnostics, logging, or rendering
   * custom/unknown embed types.
   *
   * If the callback returns a value, it is used as the rendered output
   * for the node. If it returns `undefined`, the default fallback
   * (rendering children only) is used.
   */
  onUnknownNode?: (node: TNode) => Output | undefined;
}
