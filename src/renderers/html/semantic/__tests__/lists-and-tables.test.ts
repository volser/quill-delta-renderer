import { describe, expect, it } from 'vitest';
import { renderDelta } from './test-helpers';

describe('SemanticHtmlRenderer integration: lists', () => {
  it('should render a bullet list', () => {
    const html = renderDelta({
      ops: [
        { insert: 'Item 1' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item 2' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
    expect(html).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
  });

  it('should render an ordered list', () => {
    const html = renderDelta({
      ops: [
        { insert: 'First' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Second' },
        { insert: '\n', attributes: { list: 'ordered' } },
      ],
    });
    expect(html).toBe('<ol><li>First</li><li>Second</li></ol>');
  });

  it('should render checked items with data-checked="true"', () => {
    const html = renderDelta({
      ops: [{ insert: 'Done' }, { insert: '\n', attributes: { list: 'checked' } }],
    });
    expect(html).toContain('data-checked="true"');
  });

  it('should render unchecked items with data-checked="false"', () => {
    const html = renderDelta({
      ops: [{ insert: 'Not done' }, { insert: '\n', attributes: { list: 'unchecked' } }],
    });
    expect(html).toContain('data-checked="false"');
  });
});

describe('SemanticHtmlRenderer integration: tables', () => {
  it('should render a table with data-row', () => {
    const html = renderDelta({
      ops: [{ insert: 'A' }, { insert: '\n', attributes: { table: 'row-1' } }],
    });
    expect(html).toContain('<table><tbody>');
    expect(html).toContain('data-row="row-1"');
    expect(html).toContain('>A</td>');
  });
});
