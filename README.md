# quill-delta-renderer

A framework-agnostic, AST-based engine for converting [Quill](https://quilljs.com/) Deltas into HTML, Markdown, React components, or any custom format.

## Features

- **Three-stage pipeline** -- Parse, Transform, Render -- each stage is independent and extensible
- **Multiple output formats** -- HTML, Markdown, and React out of the box
- **Tree-shakeable** -- subpath exports let you import only what you need
- **Zero required dependencies** -- React is an optional peer dependency
- **Fully typed** -- written in TypeScript with strict types throughout

## Install

```bash
npm install quill-delta-renderer
```

If you use the React renderer, also install React:

```bash
npm install react react-dom
```

## Quick Start

### One-liner (recommended)

The fastest way to get started -- `parseQuillDelta` bundles the standard parser config and transformers:

```ts
import { parseQuillDelta } from 'quill-delta-renderer';
import { SemanticHtmlRenderer } from 'quill-delta-renderer/html';

const delta = { ops: [{ insert: 'Hello, world!\n' }] };

const ast = parseQuillDelta(delta);
const html = new SemanticHtmlRenderer().render(ast);
// => '<p>Hello, world!</p>'
```

### Step-by-step (full control)

Use the individual pieces when you need custom parser config or transformers:

```ts
import { parseDelta, applyTransformers } from 'quill-delta-renderer/core';
import {
  DEFAULT_BLOCK_ATTRIBUTES,
  listGrouper,
  codeBlockGrouper,
  tableGrouper,
} from 'quill-delta-renderer/common';
import { SemanticHtmlRenderer } from 'quill-delta-renderer/html';

const delta = { ops: [{ insert: 'Hello, world!\n' }] };

const rawAst = parseDelta(delta, { blockAttributes: DEFAULT_BLOCK_ATTRIBUTES });
const ast = applyTransformers(rawAst, [
  listGrouper,
  codeBlockGrouper,
  tableGrouper,
]);

const html = new SemanticHtmlRenderer().render(ast);
// => '<p>Hello, world!</p>'
```

### Markdown

```ts
import { parseQuillDelta } from 'quill-delta-renderer';
import { MarkdownRenderer } from 'quill-delta-renderer/markdown';

const ast = parseQuillDelta(delta);
const md = new MarkdownRenderer().render(ast);
```

Three Markdown variants are available depending on how you need to handle non-standard formats (underline, script, color, etc.):

| Renderer                 | Use case |
| ------------------------ | -------- |
| **MarkdownRenderer**     | Strict standard Markdown only (non-standard formats stripped). |
| **HtmlMarkdownRenderer** | Standard Markdown + inline HTML for underline/script (`<u>`, `<sub>`, `<sup>`). See [HTML Markdown format](docs/markdown-html-format.md). |
| **BracketMarkdownRenderer** | Standard Markdown + bracket tags (e.g. `[STYLE]...[/STYLE]`) for underline, script, color, background, font, size. See [Bracket Markdown format](docs/markdown-bracket-format.md). |

### React

```tsx
import { parseQuillDelta } from 'quill-delta-renderer';
import { ReactRenderer } from 'quill-delta-renderer/react';

const ast = parseQuillDelta(delta);
const element = new ReactRenderer().render(ast);
// Returns a ReactNode tree you can use directly in JSX
```

## Architecture

```
Delta ops  ──▶  parseDelta()  ──▶  Raw AST  ──▶  Transformers  ──▶  Semantic AST  ──▶  Renderer  ──▶  Output
```

1. **Parsing** -- `parseDelta()` converts flat Delta operations into a raw AST of `TNode` objects.
2. **Transformation** -- Transformer functions reorganize the children array (e.g., grouping list items into lists, wrapping table cells into rows).
3. **Rendering** -- A renderer walks the AST and produces the final output using its configured block/mark handlers.

Each stage is decoupled. You can swap renderers, add custom transformers, or use a different parser independently.

## Subpath Exports

Import only what you need -- unused renderers are never bundled:

| Import path                             | Contents                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `quill-delta-renderer`                    | Everything (barrel) including `parseQuillDelta`                                           |
| `quill-delta-renderer/core`               | `parseDelta`, `DeltaParser`, `BaseRenderer`, `SimpleRenderer`, `applyTransformers`, types |
| `quill-delta-renderer/common`             | Transformers, sanitizers, shared utilities                                                |
| `quill-delta-renderer/html`     | `SemanticHtmlRenderer`, `QuillHtmlRenderer`                                               |
| `quill-delta-renderer/markdown` | `MarkdownRenderer`, `HtmlMarkdownRenderer`, `BracketMarkdownRenderer`                     |
| `quill-delta-renderer/react`    | `ReactRenderer`                                                                           |

## Configuration

All renderers accept an optional config object. Every option has a sensible default.

### SemanticHtmlRenderer

```ts
new SemanticHtmlRenderer({
  classPrefix: 'ql', // CSS class prefix (default: 'ql')
  paragraphTag: 'p', // Tag for paragraphs (default: 'p')
  linkTarget: '_blank', // Link target attribute (default: '_blank')
  linkRel: 'noopener', // Link rel attribute
  inlineStyles: false, // Use inline styles instead of classes
  encodeHtml: true, // HTML-encode text content (default: true)
  customTag: (fmt, node) => {
    /* return custom tag or undefined */
  },
});
```

### ReactRenderer

```tsx
new ReactRenderer({
  classPrefix: 'ql', // CSS class prefix (default: 'ql')
  linkTarget: '_blank', // Link target attribute (default: '_blank')
  linkRel: 'noopener', // Link rel attribute
  customTag: (fmt, node) => {
    /* return custom tag or undefined */
  },
  components: {
    // Override block-level rendering with custom components
    paragraph: ({ children }) => <div>{children}</div>,
    image: ({ node }) => <CustomImage src={node.data} />,
  },
});
```

### MarkdownRenderer

````ts
new MarkdownRenderer({
  singleLineBreakForPTag: false, // Single \n between paragraphs (default: false)
  bulletChar: '*', // Unordered list character (default: '*')
  fenceChar: '```', // Fenced code block delimiter (default: '```')
});
````

### parseQuillDelta

```ts
parseQuillDelta(delta, {
  extraBlockAttributes: { ... },   // Additional block attribute handlers
  blockEmbeds: ['video'],          // Block-level embed types (default: ['video'])
  extraTransformers: [myGrouper],  // Appended after standard transformers
  transformers: [...],             // Replace standard transformers entirely
});
```

## Extensibility

### Custom Transformers

A transformer is a function that receives the root's children array and returns a new array. Use `applyTransformers` to run them against an AST:

```ts
import type { TNode, Transformer } from 'quill-delta-renderer/core';

const imageGrouper: Transformer = (children: TNode[]) => {
  // group adjacent images into a gallery container
  return groupImages(children);
};

const ast = applyTransformers(rawAst, [listGrouper, imageGrouper]);
```

Or pass them to `parseQuillDelta` via `extraTransformers`:

```ts
const ast = parseQuillDelta(delta, {
  extraTransformers: [imageGrouper],
});
```

### Custom Renderer

For output formats that need HTML-style attribute collection (styles, classes, props), extend `BaseRenderer`:

```ts
import { BaseRenderer } from 'quill-delta-renderer/core';

class JsonRenderer extends BaseRenderer<object, MyAttrs> {
  // implement abstract methods for your output format
}
```

For simpler formats without attribute collection (plain text, Markdown-like), extend `SimpleRenderer` which requires only 2 abstract methods (`joinChildren` and `renderText`):

```ts
import { SimpleRenderer } from 'quill-delta-renderer/core';

class PlainTextRenderer extends SimpleRenderer<string> {
  protected joinChildren(children: string[]) {
    return children.join('');
  }
  protected renderText(text: string) {
    return text;
  }
}
```

## HTML Renderers

The library ships two HTML renderers:

- **`SemanticHtmlRenderer`** -- produces clean semantic HTML with full configuration. Recommended for new projects.
- **`QuillHtmlRenderer`** -- produces HTML matching `quill-delta-to-html` output. Use for backward compatibility.

## Performance

**2-5x faster** than `quill-delta-to-html` across all scenarios. For a realistic mixed-content document the renderer is **3.65x faster**.

See [BENCHMARKS.md](./BENCHMARKS.md) for full results and methodology.

## License

MIT
