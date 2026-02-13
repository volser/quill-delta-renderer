import { SimpleRenderer } from '../../core/simple-renderer';
import { buildBracketRendererConfig } from './functions/build-bracket-renderer-config';
import { resolveConfig } from './functions/resolve-config';
import type { MarkdownConfig } from './types/markdown-config';

/**
 * Bracket markdown renderer: uses [STYLE]...[/STYLE] and other [TAG]...[/TAG]
 * formats for content with no standard Markdown syntax. Same blocks and standard
 * marks as {@link MarkdownRenderer}, plus non-standard formats as bracket tags
 * (e.g. [STYLE underline=true], [STYLE color=red]). Content inside can include
 * **bold**, *italic*, `code`.
 *
 * Currently supports [STYLE] with: underline, sub, sup, color, bg, font, size.
 * Additional bracket tag types can be added via the bracket renderer config.
 *
 * @example
 * ```ts
 * const renderer = new BracketMarkdownRenderer();
 * const md = renderer.render(ast);
 * // e.g. [STYLE color=red]**bold**[/STYLE]
 * ```
 */
export class BracketMarkdownRenderer extends SimpleRenderer<string> {
  constructor(config?: MarkdownConfig) {
    const cfg = resolveConfig(config);
    super(buildBracketRendererConfig(cfg));
  }

  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    return text;
  }
}
