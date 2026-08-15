import type { ColumnDef, Constraint, CreateViewStmt, Query } from "./ast";
import type { SqlValue } from "./values";

/**
 * データセットは `src/content/fe/sql/` に TypeScript で持つ (JSON にしない)。
 * 理由は docs/wip/20260815-fe-sql/00-overview.md §3。
 */

export interface TableSchema {
  name: string;
  columns: ColumnDef[];
  constraints: Constraint[];
}

export interface TableData {
  schema: TableSchema;
  rows: SqlValue[][];
}

export interface ViewDef {
  name: string;
  /** `CREATE VIEW v (a, b) AS ...` の列名。省略時は null */
  columns: string[] | null;
  query: Query;
}

export interface Database {
  tables: TableData[];
  views: ViewDef[];
}

/**
 * 識別子の比較。SQL の識別子は大文字小文字を区別しない。
 * 日本語の識別子には大小が無いので、実質 ASCII 部分にだけ効く。
 */
export function sameName(a: string, b: string): boolean {
  return a.toUpperCase() === b.toUpperCase();
}

export function findTable(db: Database, name: string): TableData | undefined {
  return db.tables.find((t) => sameName(t.schema.name, name));
}

export function findView(db: Database, name: string): ViewDef | undefined {
  return db.views.find((v) => sameName(v.name, name));
}

export function emptyDatabase(): Database {
  return { tables: [], views: [] };
}

/**
 * 実行のたびに元データへ戻せるようにディープコピーする。
 * DML が表を書き換えるので、**Playground のリセットはこれで実現する**
 * (docs/wip/20260815-fe-sql/01-implementation-design.md §3-3)。
 */
export function cloneDatabase(db: Database): Database {
  return {
    tables: db.tables.map((t) => ({
      schema: t.schema,
      rows: t.rows.map((r) => [...r]),
    })),
    views: db.views.map((v) => ({ ...v })),
  };
}

export function viewFromStatement(stmt: CreateViewStmt): ViewDef {
  return { name: stmt.name, columns: stmt.columns, query: stmt.query };
}
