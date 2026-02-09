import type { RendererConfig } from '../../core/ast-types';
import { BaseRenderer } from '../../core/base-renderer';

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SEMANTIC_HTML_CONFIG: RendererConfig<string> = {
  blocks: {
    paragraph: (_node, children) => {
      if (!children) return '';
      return `<p>${children}</p>`;
    },

    header: (node, children) => {
      const level = node.attributes['header'] as number;
      const tag = `h${level}`;
      return `<${tag}>${children}</${tag}>`;
    },

    blockquote: (_node, children) => {
      return `<blockquote>${children}</blockquote>`;
    },

    'code-block': (_node, children) => {
      return `<pre><code>${children}</code></pre>`;
    },

    'list-item': (_node, children) => {
      return `<li>${children}</li>`;
    },

    list: (node, children) => {
      const listType = node.attributes['list'];
      const tag = listType === 'ordered' ? 'ol' : 'ul';
      return `<${tag}>${children}</${tag}>`;
    },

    image: (node) => {
      const src = node.data as string;
      const alt = (node.attributes['alt'] as string) ?? '';
      return `<img src="${escapeHtml(String(src))}" alt="${escapeHtml(alt)}" />`;
    },

    video: (node) => {
      const src = node.data as string;
      return `<iframe src="${escapeHtml(String(src))}" frameborder="0" allowfullscreen></iframe>`;
    },
  },

  marks: {
    bold: (content) => `<strong>${content}</strong>`,
    italic: (content) => `<em>${content}</em>`,
    underline: (content) => `<u>${content}</u>`,
    strike: (content) => `<s>${content}</s>`,

    link: (content, value) => {
      const href = escapeHtml(String(value));
      return `<a href="${href}">${content}</a>`;
    },

    color: (content, value) => {
      return `<span style="color: ${escapeHtml(String(value))}">${content}</span>`;
    },

    background: (content, value) => {
      return `<span style="background-color: ${escapeHtml(String(value))}">${content}</span>`;
    },

    script: (content, value) => {
      const tag = value === 'super' ? 'sup' : 'sub';
      return `<${tag}>${content}</${tag}>`;
    },

    code: (content) => `<code>${content}</code>`,
  },
};

/**
 * Renders an AST into clean, semantic HTML.
 *
 * @example
 * ```ts
 * const renderer = new SemanticHtmlRenderer();
 * const html = renderer.render(ast);
 * ```
 */
export class SemanticHtmlRenderer extends BaseRenderer<string> {
  constructor() {
    super(SEMANTIC_HTML_CONFIG);
  }

  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    return escapeHtml(text);
  }
}
