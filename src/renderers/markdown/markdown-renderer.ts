import type { BlockDescriptor, RendererConfig, TNode } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';

/**
 * Renders an AST into Markdown text.
 *
 * Markdown has no concept of inline attributes (styles/classes),
 * so this renderer uses `unknown` for the Attrs type parameter.
 *
 * @example
 * ```ts
 * import { MarkdownRenderer } from 'quill-delta-render/renderers/markdown';
 *
 * const renderer = new MarkdownRenderer();
 * const md = renderer.render(ast);
 * ```
 */
export class MarkdownRenderer extends BaseRenderer<string> {
  constructor() {
    // TODO: Implement Markdown-specific block and mark handlers
    const config: RendererConfig<string> = {
      blocks: {
        paragraph: (_node, children) => `${children}\n\n`,

        header: (node, children) => {
          const level = node.attributes.header as number;
          const prefix = '#'.repeat(level);
          return `${prefix} ${children}\n\n`;
        },

        blockquote: (_node, children) => {
          const lines = children.split('\n').map((line) => `> ${line}`);
          return `${lines.join('\n')}\n\n`;
        },

        'code-block': (_node, children) => {
          return `\`\`\`\n${children}\n\`\`\`\n\n`;
        },

        // TODO: list, list-item, image, video
      },

      marks: {
        bold: { tag: 'strong' }, // TODO: use markdown ** when rendering
        italic: { tag: 'em' }, // TODO: use markdown _ when rendering
        strike: (content) => `~~${content}~~`,
        code: (content) => `\`${content}\``,

        link: (content, value) => `[${content}](${String(value)})`,

        // TODO: underline (no native MD support — could use HTML or skip),
        //       color, background, script
      },
    };

    super(config);
  }

  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    // TODO: Escape markdown special characters if needed
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
    // Markdown doesn't support inline styling — just return content
    return content;
  }

  protected renderSimpleTag(_tag: string, content: string, _collectedAttrs?: unknown): string {
    // TODO: Map HTML tags to markdown syntax
    return content;
  }

  protected renderBlockFromDescriptor(
    descriptor: BlockDescriptor,
    _node: TNode,
    childrenOutput: string,
    _resolvedAttrs: unknown,
  ): string {
    // TODO: Map block descriptors to markdown syntax
    const tag = typeof descriptor.tag === 'function' ? descriptor.tag(_node) : descriptor.tag;
    return `<${tag}>${childrenOutput}</${tag}>`;
  }
}
