# HTML Markdown Format

HTML markdown is standard Markdown extended with **inline HTML** for formats that have no native Markdown syntax. Use it when your output is rendered by a processor that allows raw HTML (e.g. GitHub Flavored Markdown, CommonMark).

## Renderer

```ts
import { parseQuillDelta } from 'quill-delta-renderer';
import { HtmlMarkdownRenderer } from 'quill-delta-renderer/markdown';

const ast = parseQuillDelta(delta);
const md = new HtmlMarkdownRenderer().render(ast);
```

## What is rendered

- All **standard Markdown** (blocks and inline): paragraphs, headers, lists, blockquotes, code blocks, **bold**, *italic*, ~~strike~~, `code`, [links](url).
- **Non-standard inline formats** are emitted as HTML so they are preserved:

| Format           | Output            | Example input | Example output              |
| --------------- | ----------------- | ------------- | --------------------------- |
| Underline       | `<u>...</u>`      | underlined    | `<u>underlined</u>`         |
| Subscript       | `<sub>...</sub>`  | H₂O           | `H<sub>2</sub>O`            |
| Superscript     | `<sup>...</sup>`  | E=mc²         | `E=mc<sup>2</sup>`          |

Formats such as color, background, font, and size have no HTML equivalent in this renderer and are **stripped** (same as in standard Markdown).

## When to use

- **Use HtmlMarkdownRenderer** when the Markdown will be rendered by a viewer that supports inline HTML (most modern Markdown engines do).
- **Use MarkdownRenderer** when you need strict standard Markdown only (e.g. for a spec-compliant export or a processor that strips HTML).

## Configuration

`HtmlMarkdownRenderer` accepts the same optional config as `MarkdownRenderer` (e.g. `bulletChar`, `fenceChar`, `hrString`). See the main [README](../README.md#markdownrenderer) for options.
