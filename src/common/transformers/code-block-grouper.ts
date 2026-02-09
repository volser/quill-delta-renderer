import type { TNode, Transformer } from '../../core/ast-types';
import { groupConsecutiveElementsWhile } from '../utils/group-consecutive';

/**
 * Wraps adjacent `code-block` nodes into a `code-block-container` parent.
 *
 * Quill stores each code line as a separate block with a `code-block` attribute.
 * This transformer groups consecutive code-block nodes into a single
 * `code-block-container` node, mirroring Quill's editor DOM structure:
 *
 * ```html
 * <div class="ql-code-block-container" spellcheck="false">
 *   <div class="ql-code-block">line 1</div>
 *   <div class="ql-code-block">line 2</div>
 * </div>
 * ```
 *
 * @example
 * ```ts
 * const ast = new DeltaParser(delta).use(codeBlockGrouper).toAST();
 * ```
 */
export const codeBlockGrouper: Transformer = (root: TNode): TNode => {
  return {
    ...root,
    children: groupCodeBlocks(root.children),
  };
};

function isCodeBlock(node: TNode): boolean {
  return node.type === 'code-block';
}

function groupCodeBlocks(children: TNode[]): TNode[] {
  const grouped = groupConsecutiveElementsWhile(children, (curr, prev) => {
    return isCodeBlock(curr) && isCodeBlock(prev);
  });

  return grouped.map((item): TNode => {
    if (!Array.isArray(item)) {
      if (isCodeBlock(item)) {
        return createContainer([item]);
      }
      return item;
    }
    return createContainer(item);
  });
}

function createContainer(codeBlocks: TNode[]): TNode {
  return {
    type: 'code-block-container',
    attributes: {},
    children: codeBlocks,
    isInline: false,
  };
}
