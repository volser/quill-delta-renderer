import { describe, expect, it } from 'vitest';
import { renderDelta } from './test-helpers';

describe('QuillHtmlRenderer integration: lists', () => {
  it('should render a bullet list with <ol> and data-list="bullet"', () => {
    const html = renderDelta({
      ops: [
        { insert: 'Item 1' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Item 2' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
    expect(html).toBe(
      '<ol><li data-list="bullet">Item 1</li><li data-list="bullet">Item 2</li></ol>',
    );
  });

  it('should render an ordered list with <ol> and data-list="ordered"', () => {
    const html = renderDelta({
      ops: [
        { insert: 'First' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'Second' },
        { insert: '\n', attributes: { list: 'ordered' } },
      ],
    });
    expect(html).toBe(
      '<ol><li data-list="ordered">First</li><li data-list="ordered">Second</li></ol>',
    );
  });

  it('should render checked items with data-list="checked"', () => {
    const html = renderDelta({
      ops: [{ insert: 'Done' }, { insert: '\n', attributes: { list: 'checked' } }],
    });
    expect(html).toContain('<li data-list="checked">Done</li>');
  });

  it('should render unchecked items with data-list="unchecked"', () => {
    const html = renderDelta({
      ops: [{ insert: 'Not done' }, { insert: '\n', attributes: { list: 'unchecked' } }],
    });
    expect(html).toContain('<li data-list="unchecked">Not done</li>');
  });

  it('should render mixed checked and unchecked list items', () => {
    const html = renderDelta({
      ops: [
        { insert: 'Done' },
        { insert: '\n', attributes: { list: 'checked' } },
        { insert: 'Not done' },
        { insert: '\n', attributes: { list: 'unchecked' } },
      ],
    });
    expect(html).toBe(
      '<ol><li data-list="checked">Done</li><li data-list="unchecked">Not done</li></ol>',
    );
  });

  it('should render flat list with ql-indent class (no nesting)', () => {
    const html = renderDelta({
      ops: [
        { insert: 'Parent' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: 'Child' },
        { insert: '\n', attributes: { list: 'bullet', indent: 1 } },
      ],
    });
    expect(html).toBe(
      '<ol><li data-list="bullet">Parent</li><li class="ql-indent-1" data-list="bullet">Child</li></ol>',
    );
  });

  it('should render empty list item with <br/>', () => {
    const html = renderDelta({
      ops: [{ insert: '\n', attributes: { list: 'bullet' } }],
    });
    expect(html).toContain('<li data-list="bullet"><br/></li>');
  });

  it('should render list item with align class', () => {
    const html = renderDelta({
      ops: [
        { insert: 'centered' },
        { insert: '\n', attributes: { list: 'bullet', align: 'center' } },
      ],
    });
    expect(html).toContain('ql-align-center');
    expect(html).toContain('data-list="bullet"');
    expect(html).toContain('centered');
  });

  it('should render list item with align and indent classes (Quill order)', () => {
    const html = renderDelta({
      ops: [
        { insert: 'item' },
        { insert: '\n', attributes: { list: 'ordered', indent: 1, align: 'right' } },
      ],
    });
    expect(html).toContain('class="ql-align-right ql-indent-1"');
    expect(html).toContain('data-list="ordered"');
  });

  it('should keep all consecutive list items in one <ol> (flat, like Quill)', () => {
    const html = renderDelta({
      ops: [
        { insert: 'ordered' },
        { insert: '\n', attributes: { list: 'ordered' } },
        { insert: 'bullet' },
        { insert: '\n', attributes: { list: 'bullet' } },
      ],
    });
    expect(html).toBe(
      '<ol><li data-list="ordered">ordered</li><li data-list="bullet">bullet</li></ol>',
    );
  });
});

describe('QuillHtmlRenderer integration: tables', () => {
  it('should render a basic table', () => {
    const html = renderDelta({
      ops: [{ insert: 'A' }, { insert: '\n', attributes: { table: 'row-1' } }],
    });
    expect(html).toBe('<table><tbody><tr><td data-row="row-1">A</td></tr></tbody></table>');
  });

  it('should render a 2x2 table with data-row', () => {
    const html = renderDelta({
      ops: [
        { insert: 'A' },
        { insert: '\n', attributes: { table: 'row-1' } },
        { insert: 'B' },
        { insert: '\n', attributes: { table: 'row-1' } },
        { insert: 'C' },
        { insert: '\n', attributes: { table: 'row-2' } },
        { insert: 'D' },
        { insert: '\n', attributes: { table: 'row-2' } },
      ],
    });
    expect(html).toContain('<td data-row="row-1">A</td>');
    expect(html).toContain('<td data-row="row-1">B</td>');
    expect(html).toContain('<td data-row="row-2">C</td>');
    expect(html).toContain('<td data-row="row-2">D</td>');
    expect(html).toContain('<table><tbody>');
    expect(html).toContain('</tbody></table>');
  });

  it('should render a filled 3x3 table', () => {
    const html = renderDelta({
      ops: [
        { insert: '11' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: '12' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: '13' },
        { insert: '\n', attributes: { table: 'r1' } },
        { insert: '21' },
        { insert: '\n', attributes: { table: 'r2' } },
        { insert: '22' },
        { insert: '\n', attributes: { table: 'r2' } },
        { insert: '23' },
        { insert: '\n', attributes: { table: 'r2' } },
        { insert: '31' },
        { insert: '\n', attributes: { table: 'r3' } },
        { insert: '32' },
        { insert: '\n', attributes: { table: 'r3' } },
        { insert: '33' },
        { insert: '\n', attributes: { table: 'r3' } },
        { insert: '\n' },
      ],
    });
    expect(html).toContain('<td data-row="r1">11</td>');
    expect(html).toContain('<td data-row="r2">22</td>');
    expect(html).toContain('<td data-row="r3">33</td>');
  });
});
