import { DEFAULT_BLOCK_ATTRIBUTES } from '../../../common/default-block-attributes';
import { codeBlockGrouper } from '../../../common/transformers/code-block-grouper';
import { listGrouper } from '../../../common/transformers/list-grouper';
import { tableGrouper } from '../../../common/transformers/table-grouper';
import type { Delta } from '../../../core/ast-types';
import { DeltaParser } from '../../../core/parser';
import { MarkdownRenderer } from '../markdown-renderer';
import type { MarkdownConfig } from '../types/markdown-config';

export const PARSER_CONFIG = {
  blockAttributes: DEFAULT_BLOCK_ATTRIBUTES,
  blockEmbeds: ['video', 'divider'],
};

/**
 * End-to-end helper: Delta → parse → transform → render Markdown.
 */
export function renderDelta(delta: Delta, config?: MarkdownConfig): string {
  const ast = new DeltaParser(delta, PARSER_CONFIG)
    .use(listGrouper)
    .use(tableGrouper)
    .use(codeBlockGrouper)
    .toAST();

  const renderer = new MarkdownRenderer(config);
  return renderer.render(ast);
}

/**
 * End-to-end helper with a pre-configured renderer instance.
 * Useful for testing `extendBlock()` / `extendMark()`.
 */
export function renderDeltaWith(delta: Delta, renderer: MarkdownRenderer): string {
  const ast = new DeltaParser(delta, PARSER_CONFIG)
    .use(listGrouper)
    .use(tableGrouper)
    .use(codeBlockGrouper)
    .toAST();

  return renderer.render(ast);
}
