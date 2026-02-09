// Core

export { DEFAULT_BLOCK_ATTRIBUTES } from './common/default-block-attributes';
export { DEFAULT_MARK_PRIORITIES } from './common/default-mark-priorities';
export type { BlockMergerConfig } from './common/transformers/block-merger';
export { blockMerger } from './common/transformers/block-merger';

// Sanitization utilities (opt-in)
export {
  isValidColor,
  isValidColorLiteral,
  isValidFontFamily,
  isValidSize,
  isValidWidth,
} from './common/utils/attribute-sanitizer';
export type { SanitizedMention } from './common/utils/mention-sanitizer';
export { sanitizeMention } from './common/utils/mention-sanitizer';
export type { UrlSanitizerConfig } from './common/utils/url-sanitizer';
export { createUrlSanitizer } from './common/utils/url-sanitizer';
export type {
  Attributes,
  AttributorHandler,
  BlockAttributeHandler,
  BlockAttributeResolver,
  BlockHandler,
  Delta,
  DeltaOp,
  MarkHandler,
  ParserConfig,
  RendererConfig,
  TNode,
  Transformer,
} from './core/ast-types';
export { BaseRenderer } from './core/base-renderer';
export { DeltaParser } from './core/parser';
export { applyTransformers, composeTransformers } from './core/transformer';

// Renderers
export {
  BaseHtmlRenderer,
  escapeHtml,
  serializeResolvedAttrs,
} from './renderers/html/base-html-renderer';
export type { ResolvedAttrs } from './renderers/html/common/resolved-attrs';
export {
  EMPTY_RESOLVED_ATTRS,
  hasResolvedAttrs,
  mergeResolvedAttrs,
} from './renderers/html/common/resolved-attrs';
export { QuillHtmlRenderer } from './renderers/html/quill/quill-html-renderer';
export { DEFAULT_INLINE_STYLES } from './renderers/html/semantic/consts/default-inline-styles';
export { SemanticHtmlRenderer } from './renderers/html/semantic/semantic-html-renderer';
export type {
  AfterRenderCallback,
  BeforeRenderCallback,
  CustomBlotRenderer,
  InlineStyleConverter,
  InlineStyleOverrides,
  RenderGroupType,
  SemanticHtmlConfig,
} from './renderers/html/semantic/types/semantic-html-config';
