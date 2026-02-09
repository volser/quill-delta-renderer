import { describe, expect, it } from 'vitest';
import type { Delta } from '../../core/ast-types';
import { DeltaParser } from '../../core/parser';
import { listGrouper } from './list-grouper';

function parseWithListGrouper(delta: Delta) {
  return new DeltaParser(delta).use(listGrouper).toAST();
}

describe('listGrouper', () => {
  describe('flat lists', () => {
    it('should group adjacent bullet list items into a list container', () => {
      const ast = parseWithListGrouper({
        ops: [
          { insert: 'Item 1' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Item 2' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'Item 3' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const list = ast.children[0]!;
      expect(list.type).toBe('list');
      expect(list.attributes.list).toBe('bullet');
      expect(list.children).toHaveLength(3);
      expect(list.children[0]!.type).toBe('list-item');
      expect(list.children[0]!.children[0]!.data).toBe('Item 1');
    });

    it('should group adjacent ordered list items into a list container', () => {
      const ast = parseWithListGrouper({
        ops: [
          { insert: 'First' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'Second' },
          { insert: '\n', attributes: { list: 'ordered' } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const list = ast.children[0]!;
      expect(list.type).toBe('list');
      expect(list.attributes.list).toBe('ordered');
      expect(list.children).toHaveLength(2);
    });
  });

  describe('different list types are separate', () => {
    it('should not merge different list types into one container', () => {
      const ast = parseWithListGrouper({
        ops: [
          { insert: 'ordered item' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'bullet item 1' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'bullet item 2' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ],
      });

      expect(ast.children).toHaveLength(2);
      expect(ast.children[0]!.type).toBe('list');
      expect(ast.children[0]!.attributes.list).toBe('ordered');
      expect(ast.children[0]!.children).toHaveLength(1);

      expect(ast.children[1]!.type).toBe('list');
      expect(ast.children[1]!.attributes.list).toBe('bullet');
      expect(ast.children[1]!.children).toHaveLength(2);
    });
  });

  describe('lists interleaved with other content', () => {
    it('should keep non-list content between list groups', () => {
      const ast = parseWithListGrouper({
        ops: [
          { insert: 'Item 1' },
          { insert: '\n', attributes: { list: 'bullet' } },
          { insert: 'A paragraph' },
          { insert: '\n' },
          { insert: 'Item 2' },
          { insert: '\n', attributes: { list: 'bullet' } },
        ],
      });

      expect(ast.children).toHaveLength(3);
      expect(ast.children[0]!.type).toBe('list');
      expect(ast.children[1]!.type).toBe('paragraph');
      expect(ast.children[2]!.type).toBe('list');
    });
  });

  describe('checked / unchecked lists', () => {
    it('should merge checked and unchecked items into a single list', () => {
      const ast = parseWithListGrouper({
        ops: [
          { insert: 'Done' },
          { insert: '\n', attributes: { list: 'checked' } },
          { insert: 'Not done' },
          { insert: '\n', attributes: { list: 'unchecked' } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const list = ast.children[0]!;
      expect(list.type).toBe('list');
      expect(list.children).toHaveLength(2);
    });
  });

  describe('indentation nesting', () => {
    it('should nest indented items under their parent', () => {
      const ast = parseWithListGrouper({
        ops: [
          { insert: 'Item 1' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'Item 1a' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
          { insert: 'Item 1b' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
          { insert: 'Item 2' },
          { insert: '\n', attributes: { list: 'ordered' } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const list = ast.children[0]!;
      expect(list.children).toHaveLength(2);

      // Item 1 should have an inner list with 2 items
      const item1 = list.children[0]!;
      expect(item1.children[0]!.data).toBe('Item 1');
      // Last child should be the nested list
      const innerList = item1.children[item1.children.length - 1]!;
      expect(innerList.type).toBe('list');
      expect(innerList.children).toHaveLength(2);
      expect(innerList.children[0]!.children[0]!.data).toBe('Item 1a');
      expect(innerList.children[1]!.children[0]!.data).toBe('Item 1b');

      // Item 2 should have no inner list
      const item2 = list.children[1]!;
      expect(item2.children[0]!.data).toBe('Item 2');
      expect(item2.children.every((c) => c.type !== 'list')).toBe(true);
    });

    it('should handle deeply nested items', () => {
      const ast = parseWithListGrouper({
        ops: [
          { insert: 'Level 0' },
          { insert: '\n', attributes: { list: 'ordered' } },
          { insert: 'Level 1' },
          { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
          { insert: 'Level 3' },
          { insert: '\n', attributes: { list: 'ordered', indent: 3 } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const rootList = ast.children[0]!;
      expect(rootList.children).toHaveLength(1);

      // Level 0 has inner list
      const level0 = rootList.children[0]!;
      const level0Inner = level0.children.find((c) => c.type === 'list')!;
      expect(level0Inner).toBeDefined();
      expect(level0Inner.children).toHaveLength(1);

      // Level 1 has inner list containing Level 3
      const level1 = level0Inner.children[0]!;
      const level1Inner = level1.children.find((c) => c.type === 'list')!;
      expect(level1Inner).toBeDefined();
      expect(level1Inner.children[0]!.children[0]!.data).toBe('Level 3');
    });
  });

  describe('empty list items', () => {
    it('should handle list items with no text content', () => {
      const ast = parseWithListGrouper({
        ops: [{ insert: '\n', attributes: { list: 'bullet' } }],
      });

      expect(ast.children).toHaveLength(1);
      const list = ast.children[0]!;
      expect(list.type).toBe('list');
      expect(list.children).toHaveLength(1);
      expect(list.children[0]!.type).toBe('list-item');
      expect(list.children[0]!.children).toHaveLength(0);
    });
  });
});
