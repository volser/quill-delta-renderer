import { describe, expect, it } from 'vitest';
import type { Delta } from '../../core/ast-types';
import { DeltaParser } from '../../core/parser';
import { tableGrouper } from './table-grouper';

function parseWithTableGrouper(delta: Delta) {
  return new DeltaParser(delta).use(tableGrouper).toAST();
}

describe('tableGrouper', () => {
  describe('empty table (cells with no content)', () => {
    it('should create a table with 3 rows and 3 cells each', () => {
      const ast = parseWithTableGrouper({
        ops: [
          { insert: '\n', attributes: { table: 'row-1' } },
          { insert: '\n', attributes: { table: 'row-1' } },
          { insert: '\n', attributes: { table: 'row-1' } },
          { insert: '\n', attributes: { table: 'row-2' } },
          { insert: '\n', attributes: { table: 'row-2' } },
          { insert: '\n', attributes: { table: 'row-2' } },
          { insert: '\n', attributes: { table: 'row-3' } },
          { insert: '\n', attributes: { table: 'row-3' } },
          { insert: '\n', attributes: { table: 'row-3' } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const table = ast.children[0]!;
      expect(table.type).toBe('table');

      expect(table.children).toHaveLength(3);
      for (const row of table.children) {
        expect(row.type).toBe('table-row');
        expect(row.children).toHaveLength(3);
        for (const cell of row.children) {
          expect(cell.type).toBe('table-cell');
        }
      }
    });
  });

  describe('single row table', () => {
    it('should create a table with 1 row and 2 cells', () => {
      const ast = parseWithTableGrouper({
        ops: [
          { insert: 'cell1' },
          { insert: '\n', attributes: { table: 'row-1' } },
          { insert: 'cell2' },
          { insert: '\n', attributes: { table: 'row-1' } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const table = ast.children[0]!;
      expect(table.type).toBe('table');
      expect(table.children).toHaveLength(1);

      const row = table.children[0]!;
      expect(row.type).toBe('table-row');
      expect(row.children).toHaveLength(2);
      expect(row.children[0]!.children[0]!.data).toBe('cell1');
      expect(row.children[1]!.children[0]!.data).toBe('cell2');
    });
  });

  describe('single column table', () => {
    it('should create a table with 2 rows and 1 cell each', () => {
      const ast = parseWithTableGrouper({
        ops: [
          { insert: 'cell1' },
          { insert: '\n', attributes: { table: 'row-1' } },
          { insert: 'cell2' },
          { insert: '\n', attributes: { table: 'row-2' } },
        ],
      });

      expect(ast.children).toHaveLength(1);
      const table = ast.children[0]!;
      expect(table.type).toBe('table');
      expect(table.children).toHaveLength(2);

      expect(table.children[0]!.children).toHaveLength(1);
      expect(table.children[0]!.children[0]!.children[0]!.data).toBe('cell1');
      expect(table.children[1]!.children).toHaveLength(1);
      expect(table.children[1]!.children[0]!.children[0]!.data).toBe('cell2');
    });
  });

  describe('table mixed with other content', () => {
    it('should keep non-table content outside the table', () => {
      const ast = parseWithTableGrouper({
        ops: [
          { insert: 'A paragraph' },
          { insert: '\n' },
          { insert: 'cell1' },
          { insert: '\n', attributes: { table: 'row-1' } },
          { insert: 'cell2' },
          { insert: '\n', attributes: { table: 'row-1' } },
          { insert: 'After table' },
          { insert: '\n' },
        ],
      });

      expect(ast.children).toHaveLength(3);
      expect(ast.children[0]!.type).toBe('paragraph');
      expect(ast.children[1]!.type).toBe('table');
      expect(ast.children[2]!.type).toBe('paragraph');
    });
  });

  describe('single cell table', () => {
    it('should wrap a single table-cell in table > row > cell', () => {
      const ast = parseWithTableGrouper({
        ops: [{ insert: 'only cell' }, { insert: '\n', attributes: { table: 'row-1' } }],
      });

      expect(ast.children).toHaveLength(1);
      const table = ast.children[0]!;
      expect(table.type).toBe('table');
      expect(table.children).toHaveLength(1);
      expect(table.children[0]!.type).toBe('table-row');
      expect(table.children[0]!.children).toHaveLength(1);
      expect(table.children[0]!.children[0]!.type).toBe('table-cell');
    });
  });
});
