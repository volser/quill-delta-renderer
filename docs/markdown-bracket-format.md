# Bracket Markdown Format

Bracket markdown is standard Markdown extended with **bracket tags** for formats that have no native Markdown syntax. Tags use the form `[TAG attr=value ...]content[/TAG]`. Use it when you need a portable, HTML-free way to preserve styling (e.g. for custom parsers or round-trip storage).

## Renderer

```ts
import { parseQuillDelta } from 'quill-delta-renderer';
import { BracketMarkdownRenderer } from 'quill-delta-renderer/markdown';

const ast = parseQuillDelta(delta);
const md = new BracketMarkdownRenderer().render(ast);
```

## What is rendered

- All **standard Markdown** (blocks and inline): paragraphs, headers, lists, blockquotes, code blocks, **bold**, *italic*, ~~strike~~, `code`, [links](url).
- **Non-standard inline formats** are emitted as `[STYLE ...]...[/STYLE]`:

| Format     | Attribute(s)     | Example input  | Example output                          |
| ---------- | ---------------- | -------------- | --------------------------------------- |
| Underline  | `underline=true` | underlined     | `[STYLE underline=true]underlined[/STYLE]` |
| Subscript  | `sub=true`       | H₂O            | `H[STYLE sub=true]2[/STYLE]O`          |
| Superscript| `sup=true`       | E=mc²          | `E=mc[STYLE sup=true]2[/STYLE]`         |
| Color      | `color=<value>`  | red text       | `[STYLE color=#e60000]red text[/STYLE]` |
| Background | `bg=<value>`     | highlighted    | `[STYLE bg=#ffebcc]highlighted[/STYLE]`  |
| Font       | `font=<value>`   | mono           | `[STYLE font=monospace]mono[/STYLE]`    |
| Size       | `size=<value>`   | large          | `[STYLE size=large]large[/STYLE]`       |

Content inside `[STYLE]` can include standard Markdown: **bold**, *italic*, `code`. Multiple styles on the same run produce nested or adjacent `[STYLE]` tags.

### Example

Input (conceptual): red bold text and code.

Output (conceptual):

```text
[STYLE color=red]**bold** and `code`[/STYLE]
```

## Tag syntax

- Opening tag: `[STYLE key=value ...]` — space-separated attributes; values are stringified (avoid `]` in values).
- Closing tag: `[/STYLE]`.
- Other tag types (e.g. `[MENTION]`, `[LINK]`) can be added by extending the bracket renderer config.

## When to use

- **Use BracketMarkdownRenderer** when you need to preserve color, background, font, size, underline, and script without using HTML (e.g. custom display pipeline or storage format).
- **Use HtmlMarkdownRenderer** when the consumer is a standard Markdown engine that allows inline HTML.
- **Use MarkdownRenderer** when you need strict standard Markdown only.

## Configuration

`BracketMarkdownRenderer` accepts the same optional config as `MarkdownRenderer` (e.g. `bulletChar`, `fenceChar`, `hrString`). See the main [README](../README.md#markdownrenderer) for options.
