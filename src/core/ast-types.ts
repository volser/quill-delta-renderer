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
 * The universal AST node. Decouples Quill's flat delta format from
 * the tree structure needed for rendering.
 */
export interface TNode {
  /** Node type identifier, e.g. 'paragraph', 'header', 'list', 'list-item', 'video', 'text' */
  type: string;
  /** Quill attributes (formatting, ids, custom data) */
  attributes: Attributes;
  /** Child nodes */
  children: TNode[];
  /** Leaf payload — text content for text nodes, embed data for embeds */
  data?: string | Record<string, unknown>;
  /** Whether this node represents inline content (text, inline embeds) */
  isInline: boolean;
}

// ─── Transformer Types ───────────────────────────────────────────────────────

/**
 * A transformer function receives the root TNode and returns a new (or mutated) root.
 * Used as middleware in the parsing pipeline.
 *
 * @example
 * ```ts
 * const ListGrouper: Transformer = (root) => {
 *   // group adjacent list-item children into list containers
 *   return newRoot;
 * };
 * ```
 */
export type Transformer = (root: TNode) => TNode;

// ─── Renderer Types ─────────────────────────────────────────────────────────

/**
 * Handles rendering of a block-level node (paragraph, header, list, etc.).
 *
 * @param node - The AST node being rendered
 * @param childrenOutput - The already-rendered children content
 * @returns The rendered output for this block
 */
export type BlockHandler<Output> = (
  node: TNode,
  childrenOutput: Output,
) => Output;

/**
 * Handles rendering of an inline mark (bold, italic, link, etc.).
 *
 * @param content - The already-rendered inner content
 * @param value - The attribute value (e.g. href for links, color hex for color)
 * @param node - The full AST node for additional context
 * @returns The wrapped/decorated output
 */
export type MarkHandler<Output> = (
  content: Output,
  value: unknown,
  node: TNode,
) => Output;

/**
 * Configuration for a renderer — maps node types to block handlers
 * and attribute names to mark handlers.
 */
export interface RendererConfig<Output> {
  /** How to render block-level nodes (paragraph, header, list, etc.) */
  blocks: Record<string, BlockHandler<Output>>;
  /** How to render inline marks (bold, link, color, etc.) */
  marks: Record<string, MarkHandler<Output>>;
}

// ─── Mark Priorities ────────────────────────────────────────────────────────

/**
 * Default mark nesting priorities.
 * Higher value = wraps outer (applied first in nesting order).
 *
 * Example with priorities: link(100) > color(40) > bold(10)
 * Result: `<a><span style="color:red"><b>text</b></span></a>`
 */
export const MARK_PRIORITIES: Record<string, number> = {
  link: 100,
  background: 50,
  color: 40,
  bold: 10,
  italic: 10,
  underline: 10,
  strike: 10,
  script: 5,
};
