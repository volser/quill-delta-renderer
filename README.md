# quill-delta-render

A framework-agnostic, AST-based engine for converting Quill Deltas into HTML, Markdown, React components, or any other format.

## Install

```bash
pnpm add quill-delta-render
```

## Quick Start

```typescript
import { DeltaParser, SemanticHtmlRenderer } from 'quill-delta-render';

const delta = {
  ops: [
    { insert: 'Hello ' },
    { insert: 'World', attributes: { bold: true } },
    { insert: '\n', attributes: { header: 1 } },
  ],
};

const ast = new DeltaParser(delta).toAST();
const html = new SemanticHtmlRenderer().render(ast);

// Output: <h1>Hello <strong>World</strong></h1>
```

## Architecture

The library uses a three-stage pipeline:

1. **Parse** — `DeltaParser` converts flat Delta ops into a raw AST
2. **Transform** — Middleware functions restructure the tree (e.g., grouping list items)
3. **Render** — A `BaseRenderer` subclass walks the AST and produces output

```
Delta  -->  Parser  -->  Raw AST  -->  Transformers  -->  Final AST  -->  Renderer  -->  Output
```

## Transformers

Register middleware to restructure the AST before rendering:

```typescript
import { DeltaParser } from 'quill-delta-render';
import { listGrouper } from 'quill-delta-render/common';

const ast = new DeltaParser(delta)
  .use(listGrouper)
  .toAST();
```

## Custom Renderers

Extend `BaseRenderer<T>` to support any output format:

```typescript
import { BaseRenderer } from 'quill-delta-render/core';

class MyRenderer extends BaseRenderer<string> {
  protected joinChildren(children: string[]): string {
    return children.join('');
  }

  protected renderText(text: string): string {
    return text;
  }
}
```

## Runtime Overrides

```typescript
const renderer = new SemanticHtmlRenderer();

renderer.extendBlock('image', (node) =>
  `<figure><img src="${node.data}" loading="lazy" /></figure>`
);

renderer.extendMark('bold', (content) => `<b>${content}</b>`);
```

## Development

```bash
pnpm install
pnpm test          # run tests
pnpm test:watch    # watch mode
pnpm lint          # type check
pnpm build         # build ESM + CJS
```
