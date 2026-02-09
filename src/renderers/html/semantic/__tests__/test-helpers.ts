import { DEFAULT_BLOCK_ATTRIBUTES } from '../../../../common/default-block-attributes';
import { listGrouper } from '../../../../common/transformers/list-grouper';
import { tableGrouper } from '../../../../common/transformers/table-grouper';
import type { Delta } from '../../../../core/ast-types';
import { DeltaParser } from '../../../../core/parser';
import { SemanticHtmlRenderer } from '../semantic-html-renderer';
import type { SemanticHtmlConfig } from '../types/semantic-html-config';

export const QUILL_CONFIG = { blockAttributes: DEFAULT_BLOCK_ATTRIBUTES };

export function renderDelta(delta: Delta, config?: SemanticHtmlConfig): string {
  const ast = new DeltaParser(delta, QUILL_CONFIG).use(listGrouper).use(tableGrouper).toAST();
  const renderer = new SemanticHtmlRenderer(config);
  return renderer.render(ast);
}
