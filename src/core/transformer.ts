import type { TNode, Transformer } from './ast-types';

/**
 * Runs a sequence of transformers against an AST root node.
 * Each transformer receives the output of the previous one.
 *
 * This is the standalone utility version — `DeltaParser.use()` calls
 * transformers internally via the same pattern.
 *
 * @example
 * ```ts
 * const finalAst = applyTransformers(rawAst, [ListGrouper, TableGrouper]);
 * ```
 */
export function applyTransformers(root: TNode, transformers: Transformer[]): TNode {
  return transformers.reduce((currentRoot, transformer) => transformer(currentRoot), root);
}

/**
 * Composes multiple transformers into a single transformer function.
 *
 * @example
 * ```ts
 * const combined = composeTransformers(ListGrouper, TableGrouper);
 * const finalAst = combined(rawAst);
 * ```
 */
export function composeTransformers(...transformers: Transformer[]): Transformer {
  return (root: TNode) => applyTransformers(root, transformers);
}
