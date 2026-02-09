import { cloneElement, createElement, isValidElement, type ReactNode } from 'react';
import type { BlockDescriptor, TNode } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';
import { buildCodeBlockClassName } from '../common/resolve-block-meta';
import { resolveCodeBlockLines } from '../common/resolve-code-block-lines';
import { buildRendererConfig } from './functions/build-renderer-config';
import { resolveConfig } from './functions/resolve-config';
import type { ReactRendererConfig, ResolvedReactConfig } from './types/react-config';
import type { ReactProps } from './types/react-props';
import { EMPTY_REACT_PROPS, hasReactProps, mergeReactProps } from './types/react-props';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Assign a React key to an element. Strings and other non-element
 * children are returned as-is (React handles them natively in arrays).
 */
function withKey(child: ReactNode, index: number): ReactNode {
  return isValidElement(child) ? cloneElement(child, { key: index }) : child;
}

// ─── Renderer ───────────────────────────────────────────────────────────────

/**
 * Renders an AST into React elements (no `dangerouslySetInnerHTML`).
 *
 * Produces elements structurally equivalent to the SemanticHtmlRenderer
 * output, using standard HTML tag names and React conventions
 * (`className`, camelCase styles).
 *
 * Requires `react` as a peer dependency.
 *
 * @example
 * ```tsx
 * import { ReactRenderer } from 'quill-delta-render/renderers/react';
 *
 * const renderer = new ReactRenderer();
 * const element = renderer.render(ast);
 * return <div>{element}</div>;
 * ```
 *
 * @example
 * ```tsx
 * // With custom components
 * const renderer = new ReactRenderer({
 *   components: {
 *     paragraph: ({ children }) => <div className="my-p">{children}</div>,
 *     image: ({ node }) => <CustomImage src={node.data} />,
 *   },
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Extend with custom embed
 * const renderer = new ReactRenderer().withBlock('user_mention', (node) => {
 *   const data = node.data as Record<string, unknown>;
 *   return createElement('a', { href: `#user_mention#${data.id}` }, `@${data.name}`);
 * });
 * ```
 */
export class ReactRenderer extends BaseRenderer<ReactNode, ReactProps> {
  private readonly cfg: ResolvedReactConfig;

  constructor(config?: ReactRendererConfig) {
    const cfg = resolveConfig(config);
    super(buildRendererConfig(cfg));
    this.cfg = cfg;
  }

  // ─── Tree Traversal Overrides ───────────────────────────────────────────

  protected override renderNode(node: TNode): ReactNode {
    if (node.type === 'root') {
      return this.renderChildren(node);
    }

    if (node.type === 'code-block-container') {
      return this.renderCodeBlockContainer(node);
    }

    return super.renderNode(node);
  }

  // ─── Code Blocks ──────────────────────────────────────────────────────────

  /**
   * Render a `code-block-container` produced by the `codeBlockGrouper` transformer.
   *
   * Collects the raw text of each child `code-block` node and wraps them
   * in `<pre><code>...</code></pre>` with an optional language class.
   */
  private renderCodeBlockContainer(node: TNode): ReactNode {
    const { language, lines } = resolveCodeBlockLines(node);
    const className = buildCodeBlockClassName(language, this.cfg.classPrefix);

    const linesWithNewlines = lines.map((text, i) => (i < lines.length - 1 ? `${text}\n` : text));

    const codeElement = createElement('code', { className }, ...linesWithNewlines);
    return createElement('pre', null, codeElement);
  }

  // ─── BaseRenderer Abstract Methods ────────────────────────────────────────

  protected joinChildren(children: ReactNode[]): ReactNode {
    if (children.length === 0) return null;
    if (children.length === 1) return children[0]!;

    // Assign keys to React elements in arrays to avoid React warnings
    return children.map(withKey);
  }

  protected renderText(text: string): ReactNode {
    // React handles text escaping natively
    return text;
  }

  protected emptyAttrs(): ReactProps {
    return EMPTY_REACT_PROPS;
  }

  protected mergeAttrs(target: ReactProps, source: ReactProps): ReactProps {
    return mergeReactProps(target, source);
  }

  protected hasAttrs(attrs: ReactProps): boolean {
    return hasReactProps(attrs);
  }

  protected wrapWithAttrs(content: ReactNode, attrs: ReactProps): ReactNode {
    return createElement('span', attrs, content);
  }

  protected renderSimpleTag(
    tag: string,
    content: ReactNode,
    collectedAttrs?: ReactProps,
  ): ReactNode {
    const props = collectedAttrs && hasReactProps(collectedAttrs) ? collectedAttrs : null;
    return createElement(tag, props, content);
  }

  protected renderBlockFromDescriptor(
    descriptor: BlockDescriptor,
    node: TNode,
    childrenOutput: ReactNode,
    resolvedAttrs: ReactProps,
  ): ReactNode {
    const tag = typeof descriptor.tag === 'function' ? descriptor.tag(node) : descriptor.tag;
    const props = hasReactProps(resolvedAttrs) ? resolvedAttrs : null;

    if (descriptor.selfClosing) {
      return createElement(tag, props);
    }

    return createElement(tag, props, childrenOutput || null);
  }
}
