import type { TNode } from '../../../core/ast-types';
import type { InlineStyleConverter } from './types/semantic-html-config';

/** Default inline style converters used when `inlineStyles: true`. */
export const DEFAULT_INLINE_STYLES: Record<string, InlineStyleConverter> = {
  font: {
    serif: 'font-family: Georgia, Times New Roman, serif',
    monospace: 'font-family: Monaco, Courier New, monospace',
  },
  size: {
    small: 'font-size: 0.75em',
    large: 'font-size: 1.5em',
    huge: 'font-size: 2.5em',
  },
  indent: (value: string, node: TNode) => {
    const indentSize = parseInt(value, 10) * 3;
    const side = node.attributes.direction === 'rtl' ? 'right' : 'left';
    return `padding-${side}: ${indentSize}em`;
  },
  align: (value: string) => `text-align: ${value}`,
  direction: (value: string, node: TNode) => {
    if (value === 'rtl') {
      return `direction: rtl${node.attributes.align ? '' : '; text-align: inherit'}`;
    }
    return undefined;
  },
};
