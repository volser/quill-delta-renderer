import type { TNode } from '../../../../core/ast-types';

// ─── Inline Style Types ─────────────────────────────────────────────────────

/**
 * A lookup table mapping attribute values to CSS style strings,
 * or a function that returns a CSS style string.
 */
export type InlineStyleConverter =
  | Record<string, string>
  | ((value: string, node: TNode) => string | undefined);

/**
 * Override individual inline style converters.
 * Keys are attribute names (font, size, indent, align, direction, background).
 */
export type InlineStyleOverrides = Partial<Record<string, InlineStyleConverter>>;

// ─── Rendering Hooks ────────────────────────────────────────────────────────

/**
 * Group types for beforeRender/afterRender callbacks.
 */
export type RenderGroupType = 'block' | 'inline-group' | 'list' | 'video' | 'table';

/**
 * Called before rendering a group. Return a string to replace default rendering,
 * or a falsy value to use default rendering.
 */
export type BeforeRenderCallback = (
  groupType: RenderGroupType,
  node: TNode,
) => string | null | undefined;

/**
 * Called after rendering a group. Can modify the generated HTML.
 */
export type AfterRenderCallback = (groupType: RenderGroupType, html: string) => string;

/**
 * Called for custom embed/blot nodes that have no built-in handler.
 *
 * @param node - The custom embed node
 * @param contextNode - The parent block node, or null if inline
 * @returns The HTML string for this custom embed
 */
export type CustomBlotRenderer = (node: TNode, contextNode: TNode | null) => string;

// ─── Main Config ────────────────────────────────────────────────────────────

/**
 * Configuration for the SemanticHtmlRenderer.
 *
 * All options are optional and have sensible defaults matching
 * quill-delta-to-html output format.
 */
export interface SemanticHtmlConfig {
  // ─── Tag Customization ──────────────────────────────────────────────────

  /** Tag used for paragraphs. Default: `'p'` */
  paragraphTag?: string;
  /** Tag used for ordered lists. Default: `'ol'` */
  orderedListTag?: string;
  /** Tag used for bullet/check lists. Default: `'ul'` */
  bulletListTag?: string;
  /** Tag used for list items. Default: `'li'` */
  listItemTag?: string;

  // ─── Styling Mode ───────────────────────────────────────────────────────

  /** CSS class prefix for generated classes. Default: `'ql'` */
  classPrefix?: string;

  /**
   * When `true`, render inline styles instead of CSS classes for formatting
   * attributes like indent, align, direction, font, size.
   * When an object, provides custom inline style converters per attribute.
   * Default: `false` (use CSS classes)
   */
  inlineStyles?: boolean | InlineStyleOverrides;

  /** When `true`, render `background` as a CSS class instead of inline style. Default: `false` */
  allowBackgroundClasses?: boolean;

  // ─── Link Behavior ──────────────────────────────────────────────────────

  /** Target attribute for links. Default: `'_blank'`. Set to `''` to omit. */
  linkTarget?: string;
  /** Rel attribute for links. Optional. */
  linkRel?: string;

  // ─── Encoding ───────────────────────────────────────────────────────────

  /** Whether to HTML-encode text content. Default: `true` */
  encodeHtml?: boolean;

  // ─── Extensibility ──────────────────────────────────────────────────────

  /** Custom URL sanitizer. Return a string to use as URL, or undefined for default behavior. */
  urlSanitizer?: (url: string) => string | undefined;

  /** Provide a custom HTML tag for a given format. */
  customTag?: (format: string, node: TNode) => string | undefined;

  /** Provide custom HTML attributes for a node. */
  customTagAttributes?: (node: TNode) => Record<string, string> | undefined;

  /** Provide custom CSS classes for a node. */
  customCssClasses?: (node: TNode) => string | string[] | undefined;

  /** Provide custom CSS styles for a node. */
  customCssStyles?: (node: TNode) => string | string[] | undefined;

  // ─── Rendering Hooks ──────────────────────────────────────────────────

  /**
   * Called before rendering each block-level group.
   * If the callback returns a non-empty string, it replaces the default output.
   */
  beforeRender?: BeforeRenderCallback;

  /**
   * Called after rendering each block-level group.
   * The callback receives the generated HTML and can modify it.
   */
  afterRender?: AfterRenderCallback;

  /**
   * Called for custom embed/blot nodes that have no built-in handler.
   * Return the HTML string for this custom embed.
   */
  customBlotRenderer?: CustomBlotRenderer;
}
