import { DEFAULT_BLOCK_ATTRIBUTES } from '../../../../common/default-block-attributes';
import { codeBlockGrouper } from '../../../../common/transformers/code-block-grouper';
import { flatListGrouper } from '../../../../common/transformers/flat-list-grouper';
import { tableGrouper } from '../../../../common/transformers/table-grouper';
import type { Delta } from '../../../../core/ast-types';
import { DeltaParser } from '../../../../core/parser';
import { QuillHtmlRenderer } from '../quill-html-renderer';

export const QUILL_CONFIG = {
  blockAttributes: DEFAULT_BLOCK_ATTRIBUTES,
  blockEmbeds: ['video'],
};

export function renderDelta(delta: Delta): string {
  const ast = new DeltaParser(delta, QUILL_CONFIG)
    .use(flatListGrouper)
    .use(tableGrouper)
    .use(codeBlockGrouper)
    .toAST();
  const renderer = new QuillHtmlRenderer();
  return renderer.render(ast);
}
