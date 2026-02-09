import type { Attributes, Delta, ParserConfig, TNode, Transformer } from './ast-types';

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

  const root: TNode = {
    type: 'root',
    attributes: {},
    children: [],
    isInline: false,
  };

  let inlineBuffer: TNode[] = [];

  for (const op of delta.ops) {
    if (op.insert === undefined) continue;

    if (typeof op.insert === 'string') {
      parseTextOp(op.insert, op.attributes ?? {}, inlineBuffer, root, blockAttributes);
    } else {
      const embed = parseEmbedOp(op.insert, op.attributes ?? {});

      if (blockEmbeds.has(embed.type)) {
        if (inlineBuffer.length > 0) {
          root.children.push(createBlock('paragraph', {}, inlineBuffer));
          inlineBuffer.length = 0;
        }
        root.children.push(embed);
      } else {
        inlineBuffer.push(embed);
      }
    }
  }

  if (inlineBuffer.length > 0) {
    root.children.push(createBlock('paragraph', {}, inlineBuffer));
    inlineBuffer = [];
  }

  return root;
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
    const root = parseDelta(this.delta, this.config);
    const children = this.transformers.reduce(
      (currentChildren, transformer) => transformer(currentChildren),
      root.children,
    );
    return { ...root, children };
  }
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function parseTextOp(
  text: string,
  attrs: Attributes,
  inlineBuffer: TNode[],
  root: TNode,
  blockAttributes: ParserConfig['blockAttributes'],
): void {
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.length > 0) {
      inlineBuffer.push(createTextNode(line, attrs, blockAttributes));
    }

    const isNewline = i < lines.length - 1;
    if (isNewline) {
      const { blockType, blockAttrs } = extractBlockInfo(attrs, blockAttributes);
      root.children.push(createBlock(blockType, blockAttrs, inlineBuffer));
      inlineBuffer.length = 0;
    }
  }
}

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
  const [embedType, embedData] = Object.entries(insert)[0] ?? ['unknown', null];

  return {
    type: embedType!,
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
