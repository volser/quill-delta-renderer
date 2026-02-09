import { describe, expect, it } from 'vitest';
import type { TNode, Transformer } from '../../src/core/ast-types';
import { applyTransformers, composeTransformers } from '../../src/core/transformer';

function makeRoot(children: TNode[]): TNode {
  return {
    type: 'root',
    attributes: {},
    children,
    isInline: false,
  };
}

function makeTextBlock(text: string): TNode {
  return {
    type: 'paragraph',
    attributes: {},
    children: [
      {
        type: 'text',
        attributes: {},
        children: [],
        data: text,
        isInline: true,
      },
    ],
    isInline: false,
  };
}

describe('applyTransformers', () => {
  it('should return the root unchanged when no transformers are given', () => {
    const root = makeRoot([makeTextBlock('hello')]);
    const result = applyTransformers(root, []);

    expect(result).toBe(root);
  });

  it('should apply a single transformer', () => {
    const root = makeRoot([makeTextBlock('hello')]);

    const addBlock: Transformer = (r) => ({
      ...r,
      children: [...r.children, makeTextBlock('world')],
    });

    const result = applyTransformers(root, [addBlock]);

    expect(result.children).toHaveLength(2);
    expect(result.children[1]!.children[0]!.data).toBe('world');
  });

  it('should pipe transformers left to right', () => {
    const root = makeRoot([]);

    const addFirst: Transformer = (r) => ({
      ...r,
      children: [...r.children, makeTextBlock('first')],
    });
    const addSecond: Transformer = (r) => ({
      ...r,
      children: [...r.children, makeTextBlock('second')],
    });

    const result = applyTransformers(root, [addFirst, addSecond]);

    expect(result.children).toHaveLength(2);
    expect(result.children[0]!.children[0]!.data).toBe('first');
    expect(result.children[1]!.children[0]!.data).toBe('second');
  });
});

describe('composeTransformers', () => {
  it('should compose multiple transformers into one', () => {
    const addA: Transformer = (r) => ({
      ...r,
      children: [...r.children, makeTextBlock('A')],
    });
    const addB: Transformer = (r) => ({
      ...r,
      children: [...r.children, makeTextBlock('B')],
    });

    const composed = composeTransformers(addA, addB);
    const result = composed(makeRoot([]));

    expect(result.children).toHaveLength(2);
    expect(result.children[0]!.children[0]!.data).toBe('A');
    expect(result.children[1]!.children[0]!.data).toBe('B');
  });
});
