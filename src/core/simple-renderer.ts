import type { BlockDescriptor, BlockHandler, MarkHandler, TNode } from './ast-types';
import { BaseRenderer } from './base-renderer';

/**
 * Configuration for a {@link SimpleRenderer}.
 *
 * Omits `attributors` and `blockAttributeResolvers` since
 * SimpleRenderer does not support the attributor system.
 *
 * **Note:** `marks` only accepts function-based `MarkHandler` entries.
 * Declarative `SimpleTagMark` descriptors are not supported because
 * `SimpleRenderer` has no tag-rendering mechanism. Use {@link BaseRenderer}
 * directly if you need declarative tag marks.
 *
 * @typeParam Output - The rendered output type (string, etc.)
 */
export interface SimpleRendererConfig<Output> {
  /** How to render block-level nodes (paragraph, header, list, etc.) */
  blocks: Record<string, BlockHandler<Output> | BlockDescriptor>;
  /**
   * How to render inline element marks (bold, link, etc.).
   * Only function-based handlers are supported — `SimpleTagMark` descriptors
   * are silently ignored by SimpleRenderer. Use `BaseRenderer` if you need them.
   */
  marks: Record<string, MarkHandler<Output>>;
  /** Optional mark nesting priorities. Higher value = wraps outer. */
  markPriorities?: Record<string, number>;
}

/**
 * Simplified base class for renderers that don't need the attributor system.
 *
 * Provides default no-op implementations for all `Attrs`-related abstract
 * methods from {@link BaseRenderer}, reducing the abstract method count
 * from 8 to 2:
 * - `joinChildren()` — how to combine rendered children into a single output
 * - `renderText()` — how to render a plain text leaf node
 *
 * Use this for output formats that don't have a concept of "collected
 * inline attributes" (Markdown, plain text, SSML, ADF, etc.).
 *
 * For renderers that need attributor support (HTML, React), extend
 * {@link BaseRenderer} directly instead.
 *
 * @typeParam Output - The rendered output type (string, etc.)
 *
 * @example
 * ```ts
 * class PlainTextRenderer extends SimpleRenderer<string> {
 *   constructor(config: SimpleRendererConfig<string>) {
 *     super(config);
 *   }
 *   protected joinChildren(children: string[]): string {
 *     return children.join('');
 *   }
 *   protected renderText(text: string): string {
 *     return text;
 *   }
 * }
 * ```
 */
export abstract class SimpleRenderer<Output> extends BaseRenderer<Output, unknown> {
  constructor(config: SimpleRendererConfig<Output>) {
    super({
      blocks: config.blocks,
      marks: config.marks,
      markPriorities: config.markPriorities,
    });
  }

  // ─── Default no-op implementations for Attrs protocol ─────────────────

  protected emptyAttrs(): unknown {
    return undefined;
  }

  protected mergeAttrs(_target: unknown, source: unknown): unknown {
    return source;
  }

  protected hasAttrs(_attrs: unknown): boolean {
    return false;
  }

  protected wrapWithAttrs(content: Output, _attrs: unknown): Output {
    return content;
  }

  protected renderSimpleTag(_tag: string, content: Output, _collectedAttrs?: unknown): Output {
    return content;
  }

  protected renderBlockFromDescriptor(
    _descriptor: BlockDescriptor,
    _node: TNode,
    childrenOutput: Output,
    _resolvedAttrs: unknown,
  ): Output {
    return childrenOutput;
  }
}
