import type { ComponentType, CSSProperties, ReactNode } from 'react';
import type { TNode } from '../../../core/ast-types';

/**
 * Props passed to custom block components provided via the `components` map.
 *
 * Custom components receive the computed props the default element would get,
 * plus the raw AST `node` for advanced use cases.
 */
export interface BlockComponentProps {
  /** The raw AST node being rendered. */
  node: TNode;
  /** Pre-rendered children content. */
  children?: ReactNode;
  /** Computed CSS class name. */
  className?: string;
  /** Computed inline styles. */
  style?: CSSProperties;
  /** Any additional computed props. */
  [key: string]: unknown;
}

/**
 * Configuration options for the {@link ReactRenderer}.
 *
 * All options are optional and have sensible defaults that produce
 * output structurally equivalent to the SemanticHtmlRenderer.
 */
export interface ReactRendererConfig {
  /**
   * CSS class prefix for generated class names.
   * @default 'ql'
   */
  classPrefix?: string;

  /**
   * Target attribute for links.
   * @default '_blank'
   * Set to `''` to omit.
   */
  linkTarget?: string;

  /**
   * Rel attribute for links.
   * @default undefined
   */
  linkRel?: string;

  /**
   * Map of block types to custom React components.
   *
   * When a component override exists for a block type, the renderer
   * uses the custom component instead of the default HTML element.
   *
   * @example
   * ```tsx
   * const renderer = new ReactRenderer({
   *   components: {
   *     paragraph: ({ children, className }) => <div className={className}>{children}</div>,
   *     image: ({ node }) => <CustomImage src={node.data} />,
   *   },
   * });
   * ```
   */
  components?: Record<string, ComponentType<BlockComponentProps>>;

  /**
   * Provide a custom HTML tag name for a given format.
   * Return `undefined` to use the default tag.
   */
  customTag?: (format: string, node: TNode) => string | undefined;

  /**
   * Custom URL sanitizer. Return a sanitized URL string to allow it,
   * or `undefined` to suppress the link entirely.
   *
   * When set, all URLs in links and image link wrappers are passed through
   * this function before being rendered. This is the recommended way to
   * prevent `javascript:` and other dangerous URL schemes.
   *
   * @example
   * ```tsx
   * import { createUrlSanitizer } from 'quill-delta-render/common';
   *
   * const renderer = new ReactRenderer({
   *   urlSanitizer: createUrlSanitizer(),
   * });
   * ```
   */
  urlSanitizer?: (url: string) => string | undefined;
}

/**
 * Fully resolved configuration with all defaults applied.
 * @internal
 */
export interface ResolvedReactConfig {
  classPrefix: string;
  linkTarget: string;
  linkRel: string | undefined;
  components: Record<string, ComponentType<BlockComponentProps>>;
  customTag: ((format: string, node: TNode) => string | undefined) | undefined;
  urlSanitizer: ((url: string) => string | undefined) | undefined;
}
