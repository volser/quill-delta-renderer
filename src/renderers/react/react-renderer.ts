import type { BlockDescriptor, RendererConfig, TNode } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';

// TODO: Replace with actual React types when implementing
// For now, use a generic type to avoid hard React dependency at the type level
type ReactNode = unknown;

// TODO: Define React-specific attrs type (e.g. React.HTMLAttributes or a props object)
type ReactAttrs = Record<string, unknown>;

/**
 * Renders an AST into React elements (no `dangerouslySetInnerHTML`).
 *
 * Requires `react` as a peer dependency.
 *
 * @example
 * ```tsx
 * import { ReactRenderer } from 'quill-delta-render/renderers/react';
 *
 * const MyPost = ({ content }) => {
 *   const renderer = new ReactRenderer();
 *   return <div>{renderer.render(content)}</div>;
 * };
 * ```
 */
export class ReactRenderer extends BaseRenderer<ReactNode, ReactAttrs> {
  constructor() {
    // TODO: Implement React-specific block and mark handlers
    // Blocks should return React.createElement() calls
    // Marks should wrap content in appropriate React elements
    const config: RendererConfig<ReactNode, ReactAttrs> = {
      blocks: {
        // TODO: paragraph, header, blockquote, code-block, list, list-item, image, video
      },
      marks: {
        // TODO: bold, italic, underline, strike, link, color, background, script, code
      },
    };

    super(config);
  }

  protected joinChildren(children: ReactNode[]): ReactNode {
    // TODO: Return children array (React can render arrays)
    return children;
  }

  protected renderText(text: string): ReactNode {
    // React handles text escaping natively
    return text;
  }

  protected emptyAttrs(): ReactAttrs {
    return {};
  }

  protected mergeAttrs(target: ReactAttrs, source: ReactAttrs): ReactAttrs {
    return { ...target, ...source };
  }

  protected hasAttrs(attrs: ReactAttrs): boolean {
    return Object.keys(attrs).length > 0;
  }

  protected wrapWithAttrs(content: ReactNode, _attrs: ReactAttrs): ReactNode {
    // TODO: Use React.createElement('span', attrs, content)
    return content;
  }

  protected renderSimpleTag(
    tag: string,
    content: ReactNode,
    _collectedAttrs?: ReactAttrs,
  ): ReactNode {
    // TODO: Use React.createElement(tag, collectedAttrsToProps, content)
    return [tag, content];
  }

  protected renderBlockFromDescriptor(
    _descriptor: BlockDescriptor,
    _node: TNode,
    childrenOutput: ReactNode,
    _resolvedAttrs: ReactAttrs,
  ): ReactNode {
    // TODO: Use React.createElement(tag, resolvedAttrsToProps, children)
    return childrenOutput;
  }
}
