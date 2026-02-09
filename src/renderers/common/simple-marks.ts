import type { SimpleTagMark } from '../../core/ast-types';

/**
 * Standard HTML mark descriptors shared across all renderers
 * (Quill HTML, Semantic HTML, React).
 *
 * These are declarative — the renderer auto-handles tag rendering
 * and injection of collected attributor attrs.
 */

export const boldMark: SimpleTagMark = { tag: 'strong' };

export const italicMark: SimpleTagMark = { tag: 'em' };

export const underlineMark: SimpleTagMark = { tag: 'u' };

export const strikeMark: SimpleTagMark = { tag: 's' };

export const codeMark: SimpleTagMark = { tag: 'code' };

export const scriptMark: SimpleTagMark = {
  tag: (value) => (value === 'super' ? 'sup' : 'sub'),
};
