import type { RendererConfig } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';

/**
 * Renders an AST into Markdown text.
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
          const level = node.attributes['header'] as number;
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
        bold: (content) => `**${content}**`,
        italic: (content) => `_${content}_`,
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
}
