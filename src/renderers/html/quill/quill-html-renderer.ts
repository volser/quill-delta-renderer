import { BaseHtmlRenderer } from '../base-html-renderer';
import { buildQuillConfig } from './functions/build-quill-config';

/**
 * Renders an AST into Quill's native HTML format.
 *
 * Produces markup that exactly matches Quill editor's output, including:
 * - `ql-*` CSS classes for indentation, alignment, direction, fonts, and sizes
 * - `<br>` for empty blocks
 * - `spellcheck="false"` on code blocks
 * - `rel="noopener noreferrer"` on links
 * - `data-row` on table cells
 * - `data-list` attribute for checked/unchecked list items
 * - Formula and video embed support
 *
 * For a configurable HTML renderer (with custom class prefix, inline styles,
 * hooks, etc.), use `SemanticHtmlRenderer` instead.
 *
 * Use `withBlock()` and `withMark()` to override specific handlers
 * without subclassing.
 *
 * @example
 * ```ts
 * const renderer = new QuillHtmlRenderer();
 * const html = renderer.render(ast);
 * ```
 */
export class QuillHtmlRenderer extends BaseHtmlRenderer {
  constructor() {
    super(buildQuillConfig());
  }
}
