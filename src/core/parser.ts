import type { Attributes, Delta, ParserConfig, TNode, Transformer } from './ast-types';
import { applyTransformers } from './transformer';

// ─── Internal Accumulator ───────────────────────────────────────────────────

/** Immutable parse state threaded through each op handler. */
interface ParseState {
  /** Completed block-level nodes. */
  blocks: TNode[];
  /** Inline nodes waiting for a newline to flush into a block. */
  buffer: TNode[];
}

const EMPTY_STATE: ParseState = { blocks: [], buffer: [] };

// ─── Pure Function API ──────────────────────────────────────────────────────

/**
 * Parse a Quill Delta into a raw AST tree of TNode objects.
 *
 * This is the pure-function equivalent of `new DeltaParser(delta, config).toAST()`.
 * Block attribute recognition is driven by the `ParserConfig`, keeping
 * the parser free of Quill-specific knowledge.
 *
 * Returns a raw AST — apply transformers separately via {@link applyTransformers}
 * or use {@link parseQuillDelta} for a batteries-included pipeline.
 *
 * @example
 * ```ts
 * import { parseDelta, applyTransformers } from 'quill-delta-render/core';
 * import { listGrouper, tableGrouper } from 'quill-delta-render/common';
 *
 * const raw = parseDelta(delta, { blockAttributes: DEFAULT_BLOCK_ATTRIBUTES });
 * const ast = applyTransformers(raw, [listGrouper, tableGrouper]);
 * ```
 */
export function parseDelta(delta: Delta, config: ParserConfig): TNode {
  if (!delta?.ops || !Array.isArray(delta.ops)) {
    throw new TypeError(
      'parseDelta: expected a Delta object with an ops array, received ' +
        (delta === null ? 'null' : typeof delta),
    );
  }

  const blockAttributes = config.blockAttributes;
  const blockEmbeds = new Set(config.blockEmbeds ?? []);

  let state: ParseState = EMPTY_STATE;

  for (const op of delta.ops) {
    if (op.insert === undefined) continue;

    if (typeof op.insert === 'string') {
      state = processTextOp(state, op.insert, op.attributes ?? {}, blockAttributes);
    } else {
      state = processEmbedOp(state, op.insert, op.attributes ?? {}, blockEmbeds);
    }
  }

  // Flush any remaining inline content as a trailing paragraph
  if (state.buffer.length > 0) {
    state = {
      blocks: [...state.blocks, createBlock('paragraph', {}, state.buffer)],
      buffer: [],
    };
  }

  return {
    type: 'root',
    attributes: {},
    children: state.blocks,
    isInline: false,
  };
}

// ─── Class API (delegates to parseDelta) ────────────────────────────────────

/**
 * Parses a Quill Delta into a tree of TNode objects.
 *
 * Provides a fluent builder API for registering transformers.
 * For a simpler functional approach, use {@link parseDelta} directly.
 *
 * @example
 * ```ts
 * const ast = new DeltaParser(delta, { blockAttributes: DEFAULT_BLOCK_ATTRIBUTES })
 *   .use(listGrouper)
 *   .use(tableGrouper)
 *   .toAST();
 * ```
 */
export class DeltaParser {
  private readonly delta: Delta;
  private readonly config: ParserConfig;
  private readonly transformers: Transformer[] = [];

  constructor(delta: Delta, config: ParserConfig) {
    this.delta = delta;
    this.config = config;
  }

  /**
   * Register a transformer (middleware) to be applied after initial parsing.
   * Transformers run in the order they are registered.
   */
  use(transformer: Transformer): this {
    this.transformers.push(transformer);
    return this;
  }

  /**
   * Parse the delta into a raw AST, then apply all registered transformers.
   */
  toAST(): TNode {
    return applyTransformers(parseDelta(this.delta, this.config), this.transformers);
  }
}

// ─── Op Processors (pure — return new state) ────────────────────────────────

function processTextOp(
  state: ParseState,
  text: string,
  attrs: Attributes,
  blockAttributes: ParserConfig['blockAttributes'],
): ParseState {
  const lines = text.split('\n');
  let { blocks, buffer } = state;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.length > 0) {
      buffer = [...buffer, createTextNode(line, attrs, blockAttributes)];
    }

    const isNewline = i < lines.length - 1;
    if (isNewline) {
      const { blockType, blockAttrs } = extractBlockInfo(attrs, blockAttributes);
      blocks = [...blocks, createBlock(blockType, blockAttrs, buffer)];
      buffer = [];
    }
  }

  return { blocks, buffer };
}

function processEmbedOp(
  state: ParseState,
  insert: Record<string, unknown>,
  attrs: Attributes,
  blockEmbeds: Set<string>,
): ParseState {
  const embed = parseEmbedOp(insert, attrs);

  if (blockEmbeds.has(embed.type)) {
    const blocks =
      state.buffer.length > 0
        ? [...state.blocks, createBlock('paragraph', {}, state.buffer), embed]
        : [...state.blocks, embed];
    return { blocks, buffer: [] };
  }

  return { blocks: state.blocks, buffer: [...state.buffer, embed] };
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function extractBlockInfo(
  attrs: Attributes,
  blockAttributes: ParserConfig['blockAttributes'],
): { blockType: string; blockAttrs: Attributes } {
  const blockAttrs: Attributes = {};
  let blockType = 'paragraph';

  for (const [key, value] of Object.entries(attrs)) {
    const handler = blockAttributes[key];
    if (handler) {
      const result = handler(value);
      if (result.blockType) {
        blockType = result.blockType;
      }
      Object.assign(blockAttrs, result.blockAttrs);
    }
  }

  return { blockType, blockAttrs };
}

function createTextNode(
  text: string,
  attrs: Attributes,
  blockAttributes: ParserConfig['blockAttributes'],
): TNode {
  const inlineAttrs: Attributes = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (!blockAttributes[key]) {
      inlineAttrs[key] = value;
    }
  }

  return {
    type: 'text',
    attributes: inlineAttrs,
    children: [],
    data: text,
    isInline: true,
  };
}

function parseEmbedOp(insert: Record<string, unknown>, attrs: Attributes): TNode {
  const entries = Object.entries(insert);
  if (entries.length === 0) {
    throw new TypeError('parseEmbedOp: received an empty embed object with no type key');
  }

  const [embedType, embedData] = entries[0]!;

  return {
    type: embedType,
    attributes: attrs,
    children: [],
    data: embedData as Record<string, unknown>,
    isInline: false,
  };
}

function createBlock(type: string, attrs: Attributes, children: TNode[]): TNode {
  return {
    type,
    attributes: attrs,
    children: [...children],
    isInline: false,
  };
}
