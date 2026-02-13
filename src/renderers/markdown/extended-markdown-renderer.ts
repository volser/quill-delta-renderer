import { SimpleRenderer } from '../../core/simple-renderer';
import { buildExtendedRendererConfig } from './functions/build-extended-renderer-config';
import { resolveConfig } from './functions/resolve-config';
import type { MarkdownConfig } from './types/markdown-config';

/**
 * Extended Markdown renderer that preserves formats with no standard Markdown
 * syntax by emitting HTML. Same blocks and standard marks as {@link MarkdownRenderer},
 * plus:
 *
 * - **Underline** → `<u>...</u>`
 * - **Script (subscript)** → `<sub>...</sub>`
 * - **Script (superscript)** → `<sup>...</sup>`
 *
 * Use this when the output will be rendered by a Markdown processor that
 * allows inline HTML (e.g. GitHub Flavored Markdown, CommonMark). Use
 * {@link MarkdownRenderer} for strict standard Markdown only.
 *
 * @example
 * ```ts
 * const renderer = new ExtendedMarkdownRenderer();
 * const md = renderer.render(ast);
 * // Underline and script appear as <u>, <sub>, <sup>
 * ```
 */
export class ExtendedMarkdownRenderer extends SimpleRenderer<string> {
  constructor(config?: MarkdownConfig) {
    const cfg = resolveConfig(config);
    super(buildExtendedRendererConfig(cfg));
  }

  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    return text;
  }
}
