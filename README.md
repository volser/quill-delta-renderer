# quill-delta-render

A framework-agnostic, AST-based engine for converting [Quill](https://quilljs.com/) Deltas into HTML, Markdown, React components, or any custom format.

## Features

- **Three-stage pipeline** -- Parse, Transform, Render -- each stage is independent and extensible
- **Multiple output formats** -- HTML, Markdown, and React out of the box
- **Tree-shakeable** -- subpath exports let you import only what you need
- **Zero required dependencies** -- React is an optional peer dependency
- **Fully typed** -- written in TypeScript with strict types throughout

## Install

```bash
npm install quill-delta-render
```

If you use the React renderer, also install React:

```bash
npm install react react-dom
```

## Quick Start

### HTML

```ts
import { DeltaParser, applyTransformers } from 'quill-delta-render/core';
import { listGrouper, codeBlockGrouper, tableGrouper } from 'quill-delta-render/common';
import { SemanticHtmlRenderer } from 'quill-delta-render/renderers/html';

const delta = { ops: [{ insert: 'Hello, world!\n' }] };

const parser = new DeltaParser();
const ast = parser.parse(delta);
const transformed = applyTransformers(ast, [listGrouper, codeBlockGrouper, tableGrouper]);

const renderer = new SemanticHtmlRenderer();
const html = renderer.render(transformed);
// => '<p>Hello, world!</p>'
```

### Markdown

```ts
import { MarkdownRenderer } from 'quill-delta-render/renderers/markdown';

const renderer = new MarkdownRenderer();
const md = renderer.render(transformed);
```

### React

```tsx
import { ReactRenderer } from 'quill-delta-render/renderers/react';

const renderer = new ReactRenderer();
const element = renderer.render(transformed);
// Returns a ReactNode tree you can use directly in JSX
```

## Architecture

```
Delta ops  ──▶  DeltaParser  ──▶  Raw AST  ──▶  Transformers  ──▶  Semantic AST  ──▶  Renderer  ──▶  Output
```

1. **Parsing** -- `DeltaParser` converts flat Delta operations into a raw AST of `TNode` objects.
2. **Transformation** -- Middleware functions reorganize the tree (e.g., grouping list items into lists, wrapping table cells into rows).
3. **Rendering** -- A renderer walks the AST and produces the final output using its configured block/mark handlers.

Each stage is decoupled. You can swap renderers, add custom transformers, or extend the parser independently.

## Subpath Exports

Import only what you need -- unused renderers are never bundled:

| Import path | Contents |
|---|---|
| `quill-delta-render` | Everything (barrel) |
| `quill-delta-render/core` | `DeltaParser`, `BaseRenderer`, `applyTransformers`, types |
| `quill-delta-render/common` | Transformers, sanitizers, shared utilities |
| `quill-delta-render/renderers/html` | `SemanticHtmlRenderer`, `QuillHtmlRenderer` |
| `quill-delta-render/renderers/markdown` | `MarkdownRenderer` |
| `quill-delta-render/renderers/react` | `ReactRenderer` |

## Configuration

All renderers accept an optional config object. Every option has a sensible default.

### SemanticHtmlRenderer

```ts
new SemanticHtmlRenderer({
  classPrefix: 'ql',          // CSS class prefix (default: 'ql')
  paragraphTag: 'p',          // Tag for paragraphs (default: 'p')
  linkTarget: '_blank',       // Link target attribute (default: '_blank')
  linkRel: 'noopener',        // Link rel attribute
  inlineStyles: false,         // Use inline styles instead of classes
  encodeHtml: true,           // HTML-encode text content (default: true)
  customTag: (fmt, node) => { /* return custom tag or undefined */ },
});
```

### ReactRenderer

```tsx
new ReactRenderer({
  classPrefix: 'ql',          // CSS class prefix (default: 'ql')
  linkTarget: '_blank',       // Link target attribute (default: '_blank')
  linkRel: 'noopener',        // Link rel attribute
  customTag: (fmt, node) => { /* return custom tag or undefined */ },
  components: {               // Override block-level rendering with custom components
    paragraph: ({ children }) => <div>{children}</div>,
    image: ({ node }) => <CustomImage src={node.data} />,
  },
});
```

### MarkdownRenderer

```ts
new MarkdownRenderer({
  singleLineBreakForPTag: false, // Single \n between paragraphs (default: false)
  bulletChar: '*',               // Unordered list character (default: '*')
  fenceChar: '```',              // Fenced code block delimiter (default: '```')
});
```

## Extensibility

### Custom Transformers

Add your own middleware to reshape the AST before rendering:

```ts
import type { TNode, Transformer } from 'quill-delta-render/core';

const myTransformer: Transformer = (nodes: TNode[]) => {
  // modify, filter, or reorganize nodes
  return nodes;
};

const ast = applyTransformers(rawAst, [listGrouper, myTransformer]);
```

### Custom Renderer

Extend `BaseRenderer` to target any output format:

```ts
import { BaseRenderer } from 'quill-delta-render/core';

class JsonRenderer extends BaseRenderer<object> {
  // implement abstract methods for your output format
}
```

## HTML Renderers

The library ships two HTML renderers:

- **`SemanticHtmlRenderer`** -- produces clean semantic HTML with full configuration. Recommended for new projects.
- **`QuillHtmlRenderer`** -- produces HTML matching `quill-delta-to-html` output. Use for backward compatibility.

## License

MIT
