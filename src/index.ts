// Convenience
export type { ParseQuillDeltaOptions } from './parse-quill-delta';
export { parseQuillDelta } from './parse-quill-delta';

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
  KnownNodeType,
  MarkHandler,
  ParserConfig,
  RendererConfig,
  TNode,
  Transformer,
} from './core/ast-types';
export { isEmbedNode, isTextNode } from './core/ast-types';
export { BaseRenderer } from './core/base-renderer';
export { DeltaParser, parseDelta } from './core/parser';
export type { SimpleRendererConfig } from './core/simple-renderer';
export { SimpleRenderer } from './core/simple-renderer';
export { applyTransformers, composeTransformers } from './core/transformer';

// ─── Renderers ─────────────────────────────────────────────────────────────
//
// Renderers are NOT re-exported from the root barrel to enable proper
// tree-shaking. Import them from their dedicated subpath exports:
//
//   import { SemanticHtmlRenderer, QuillHtmlRenderer } from 'quill-delta-render/renderers/html';
//   import { ReactRenderer }          from 'quill-delta-render/renderers/react';
//   import { MarkdownRenderer }       from 'quill-delta-render/renderers/markdown';
//
// Shared HTML utilities (escapeHtml, ResolvedAttrs, etc.) are available from
// the 'quill-delta-render/renderers/html' subpath as well.
