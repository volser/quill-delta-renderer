import { DEFAULT_BLOCK_ATTRIBUTES } from '../../../common/default-block-attributes';
import { codeBlockGrouper } from '../../../common/transformers/code-block-grouper';
import { listGrouper } from '../../../common/transformers/list-grouper';
import { tableGrouper } from '../../../common/transformers/table-grouper';
import type { Delta } from '../../../core/ast-types';
import { DeltaParser } from '../../../core/parser';
import { ExtendedMarkdownRenderer } from '../extended-markdown-renderer';
import { MarkdownRenderer } from '../markdown-renderer';
import type { MarkdownConfig } from '../types/markdown-config';

export const PARSER_CONFIG = {
  blockAttributes: DEFAULT_BLOCK_ATTRIBUTES,
  blockEmbeds: ['video', 'divider'],
};

/** Shorthand: create a Delta from ops. */
export function d(...ops: Delta['ops']): Delta {
  return { ops };
}

function parseDelta(delta: Delta) {
  return new DeltaParser(delta, PARSER_CONFIG)
    .use(listGrouper)
    .use(tableGrouper)
    .use(codeBlockGrouper)
    .toAST();
}

/** Delta → parse → transform → render Markdown. */
export function renderDelta(delta: Delta, config?: MarkdownConfig): string {
  return new MarkdownRenderer(config).render(parseDelta(delta));
}

/** Same as {@link renderDelta} but with a pre-configured renderer instance. */
export function renderDeltaWith(
  delta: Delta,
  renderer: MarkdownRenderer | ExtendedMarkdownRenderer,
): string {
  return renderer.render(parseDelta(delta));
}

/** Delta → parse → render with {@link ExtendedMarkdownRenderer} (underline/script as HTML). */
export function renderDeltaExtended(delta: Delta, config?: MarkdownConfig): string {
  return new ExtendedMarkdownRenderer(config).render(parseDelta(delta));
}
