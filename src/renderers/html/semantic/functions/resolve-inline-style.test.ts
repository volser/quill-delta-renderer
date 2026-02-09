import { describe, expect, it } from 'vitest';
import type { TNode } from '../../../../core/ast-types';
import { resolveInlineStyle } from './resolve-inline-style';

const node: TNode = { type: 'text', attributes: {}, children: [], isInline: true };

describe('resolveInlineStyle', () => {
  it('should look up value in a record converter', () => {
    const converter = { small: 'font-size: 0.75em', large: 'font-size: 1.5em' };
    expect(resolveInlineStyle(converter, 'small', node)).toBe('font-size: 0.75em');
  });

  it('should return undefined for missing record key', () => {
    const converter = { small: 'font-size: 0.75em' };
    expect(resolveInlineStyle(converter, 'huge', node)).toBeUndefined();
  });

  it('should call function converter with value and node', () => {
    const converter = (v: string, n: TNode) => `padding-left: ${parseInt(v, 10) * 3}em`;
    expect(resolveInlineStyle(converter, '2', node)).toBe('padding-left: 6em');
  });

  it('should return undefined when function converter returns undefined', () => {
    const converter = () => undefined;
    expect(resolveInlineStyle(converter, 'x', node)).toBeUndefined();
  });
});
