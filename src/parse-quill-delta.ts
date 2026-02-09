import { DEFAULT_BLOCK_ATTRIBUTES } from './common/default-block-attributes';
import { codeBlockGrouper } from './common/transformers/code-block-grouper';
import { listGrouper } from './common/transformers/list-grouper';
import { tableGrouper } from './common/transformers/table-grouper';
import type { Delta, ParserConfig, TNode, Transformer } from './core/ast-types';
import { parseDelta } from './core/parser';
import { applyTransformers } from './core/transformer';

/**
 * Options for {@link parseQuillDelta}.
 */
export interface ParseQuillDeltaOptions {
  /**
   * Additional block attribute handlers merged on top of the defaults.
   * Use this to support custom block-level formats.
   */
  extraBlockAttributes?: ParserConfig['blockAttributes'];

  /**
   * Embed types that are block-level (rendered as standalone blocks
   * instead of being placed inside a paragraph).
   * @default ['video']
   */
  blockEmbeds?: string[];

  /**
   * When `true`, newlines within a single text insert that would create
   * plain paragraphs become inline `line-break` nodes instead of paragraph
   * boundaries.
   *
   * This matches `quill-delta-to-html` behavior where `{ insert: 'A\nB\n' }`
   * produces `<p>A<br/>B</p>` instead of `<p>A</p><p>B</p>`.
   *
   * @default false
   */
  softLineBreaks?: boolean;

  /**
   * Additional transformers appended after the standard ones
   * (listGrouper, tableGrouper, codeBlockGrouper).
   */
  extraTransformers?: Transformer[];

  /**
   * Replace the standard transformer pipeline entirely.
   * When provided, `extraTransformers` is ignored.
   */
  transformers?: Transformer[];
}

const STANDARD_TRANSFORMERS: Transformer[] = [listGrouper, tableGrouper, codeBlockGrouper];

/**
 * One-call convenience function: parses a Quill Delta into a fully
 * transformed AST ready for rendering.
 *
 * Bundles `DEFAULT_BLOCK_ATTRIBUTES`, `listGrouper`, `tableGrouper`,
 * and `codeBlockGrouper` so the 80% use case is a single function call.
 *
 * @example
 * ```ts
 * import { parseQuillDelta } from 'quill-delta-render';
 * import { SemanticHtmlRenderer } from 'quill-delta-render/renderers/html';
 *
 * const ast = parseQuillDelta(delta);
 * const html = new SemanticHtmlRenderer().render(ast);
 * ```
 *
 * @example
 * ```ts
 * // With custom block attributes and extra transformers
 * const ast = parseQuillDelta(delta, {
 *   extraBlockAttributes: {
 *     'my-widget': (value) => ({ blockType: 'widget', blockAttrs: { widgetId: value } }),
 *   },
 *   extraTransformers: [myCustomGrouper],
 * });
 * ```
 */
export function parseQuillDelta(delta: Delta, options?: ParseQuillDeltaOptions): TNode {
  const config: ParserConfig = {
    blockAttributes: {
      ...DEFAULT_BLOCK_ATTRIBUTES,
      ...options?.extraBlockAttributes,
    },
    blockEmbeds: options?.blockEmbeds ?? ['video'],
    softLineBreaks: options?.softLineBreaks,
  };

  const rawAst = parseDelta(delta, config);

  const transformers = options?.transformers ?? [
    ...STANDARD_TRANSFORMERS,
    ...(options?.extraTransformers ?? []),
  ];

  return applyTransformers(rawAst, transformers);
}
