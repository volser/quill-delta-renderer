import type { Attributes, Delta, ParserConfig, TNode, Transformer } from './ast-types';

/**
 * Parses a Quill Delta into a tree of TNode objects.
 *
 * The parser is generic — block attribute recognition is driven by
 * the `ParserConfig` passed to the constructor. This keeps the core
 * parser free of Quill-specific knowledge.
 *
 * Usage:
 * ```ts
 * import { DEFAULT_BLOCK_ATTRIBUTES } from 'quill-delta-render/common';
 *
 * const ast = new DeltaParser(delta, { blockAttributes: DEFAULT_BLOCK_ATTRIBUTES })
 *   .use(listGrouper)
 *   .use(tableGrouper)
 *   .toAST();
 * ```
 */
export class DeltaParser {
  private readonly delta: Delta;
  private readonly transformers: Transformer[] = [];
  private readonly blockAttributes: ParserConfig['blockAttributes'];
  private readonly blockEmbeds: Set<string>;

  constructor(delta: Delta, config: ParserConfig) {
    this.delta = delta;
    this.blockAttributes = config.blockAttributes;
    this.blockEmbeds = new Set(config.blockEmbeds ?? []);
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
    const root = this.parse();
    return this.applyTransformers(root);
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  private parse(): TNode {
    const root: TNode = {
      type: 'root',
      attributes: {},
      children: [],
      isInline: false,
    };

    const ops = this.delta.ops;
    // Accumulate inline nodes until we hit a block-defining newline
    let inlineBuffer: TNode[] = [];

    for (const op of ops) {
      if (op.insert === undefined) continue;

      if (typeof op.insert === 'string') {
        this.parseTextOp(op.insert, op.attributes ?? {}, inlineBuffer, root);
      } else {
        // Embed (image, video, mention, etc.)
        const embed = this.parseEmbedOp(op.insert, op.attributes ?? {});

        if (this.blockEmbeds.has(embed.type)) {
          // Block-level embed: flush any pending inline content first,
          // then add the embed as a standalone root-level block.
          if (inlineBuffer.length > 0) {
            root.children.push(this.createBlock('paragraph', {}, inlineBuffer));
            inlineBuffer.length = 0;
          }
          root.children.push(embed);
        } else {
          inlineBuffer.push(embed);
        }
      }
    }

    // Flush any remaining inline content as a paragraph
    if (inlineBuffer.length > 0) {
      root.children.push(this.createBlock('paragraph', {}, inlineBuffer));
      inlineBuffer = [];
    }

    return root;
  }

  /**
   * Parse a text insert operation.
   * Text may contain multiple newlines — each one potentially terminates a block.
   */
  private parseTextOp(text: string, attrs: Attributes, inlineBuffer: TNode[], root: TNode): void {
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      // Add non-empty text as an inline text node
      if (line.length > 0) {
        inlineBuffer.push(this.createTextNode(line, attrs));
      }

      // Each newline (except the last segment if no trailing \n) ends a block
      const isNewline = i < lines.length - 1;
      if (isNewline) {
        const { blockType, blockAttrs } = this.extractBlockInfo(attrs);
        root.children.push(this.createBlock(blockType, blockAttrs, inlineBuffer));
        // Reset buffer — move to a new empty array
        inlineBuffer.length = 0;
      }
    }
  }

  /**
   * Determine the block type and attributes from a newline's attributes
   * by consulting the configured block attribute handlers.
   */
  private extractBlockInfo(attrs: Attributes): {
    blockType: string;
    blockAttrs: Attributes;
  } {
    const blockAttrs: Attributes = {};
    let blockType = 'paragraph';

    for (const [key, value] of Object.entries(attrs)) {
      const handler = this.blockAttributes[key];
      if (handler) {
        const result = handler(value);
        // A non-empty blockType overrides the current type
        if (result.blockType) {
          blockType = result.blockType;
        }
        Object.assign(blockAttrs, result.blockAttrs);
      }
    }

    return { blockType, blockAttrs };
  }

  private createTextNode(text: string, attrs: Attributes): TNode {
    // Separate inline formatting attributes (not block-level ones)
    const inlineAttrs: Attributes = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (!this.blockAttributes[key]) {
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

  private parseEmbedOp(insert: Record<string, unknown>, attrs: Attributes): TNode {
    // Embeds are stored as { image: "url" } or { video: "url" }, etc.
    const [embedType, embedData] = Object.entries(insert)[0] ?? ['unknown', null];

    return {
      type: embedType!,
      attributes: attrs,
      children: [],
      data: embedData as Record<string, unknown>,
      isInline: false,
    };
  }

  private createBlock(type: string, attrs: Attributes, children: TNode[]): TNode {
    return {
      type,
      attributes: attrs,
      children: [...children],
      isInline: false,
    };
  }

  private applyTransformers(root: TNode): TNode {
    return this.transformers.reduce((currentRoot, transformer) => transformer(currentRoot), root);
  }
}
