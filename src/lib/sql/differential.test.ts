import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { parse } from "./parser";
import { evaluate } from "./evaluator";
import { shohinZaikoDb } from "./testFixtures";
import { totalOrder, type SqlValue } from "./values";
import type { Database } from "./database";

/**
 * 自作エンジンの結果を **SQLite と突き合わせる差分テスト**。
 *
 * 自作を選んだ唯一のリスクは「正しさ」なので、SQLite をオラクルとして使って潰す。
 * **sql.js は devDependency で、本番バンドルには載らない**
 * (docs/wip/20260815-fe-sql/00-overview.md §4)。
 *
 * ## 一致を期待してはいけないケース
 *
 * 意図的に SQLite と挙動を変えている箇所があるので、全件一致は成り立たない
 * (01-implementation-design.md §5-1)。ここで扱うのは両者が一致すべき範囲だけ:
 *
 * - `GROUP BY` の非集約列 — 自作はエラー、SQLite は黙って通す。**対象外**
 * - `ORDER BY` を書かないときの行順 — どちらも保証しない。**順序非依存で比較する**
 * - 型の厳しさ — 自作は `単価 = '100'` をエラーにする。SQLite は通す。**対象外**
 */

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const distDir = path.dirname(require.resolve("sql.js"));
  // Node には fetch 経由の解決が無いので wasm をファイルから直接読ませる。
  // Buffer をそのまま渡すと ArrayBuffer 型と合わないので実体をコピーする
  const wasm = readFileSync(path.join(distDir, "sql-wasm.wasm"));
  SQL = await initSqlJs({
    locateFile: (file: string) => path.join(distDir, file),
    wasmBinary: wasm.buffer.slice(
      wasm.byteOffset,
      wasm.byteOffset + wasm.byteLength,
    ) as ArrayBuffer,
  });
});

/** フィクスチャを SQLite 側にも同じ形で作る */
function loadIntoSqlite(fixture: Database): SqlJsDatabase {
  const db = new SQL.Database();
  for (const table of fixture.tables) {
    const columns = table.schema.columns
      .map((c) => {
        const type =
          c.type === "数値型" ? "NUMERIC" : c.type === "日付型" ? "TEXT" : "TEXT";
        return `"${c.name}" ${type}`;
      })
      .join(", ");
    db.run(`CREATE TABLE "${table.schema.name}" (${columns})`);
    for (const row of table.rows) {
      const placeholders = row.map(() => "?").join(", ");
      // sql.js のバインドは真理値を受けないので数値に落とす (フィクスチャには出てこない)
      const bound = row.map((v) => (typeof v === "boolean" ? Number(v) : v));
      db.run(`INSERT INTO "${table.schema.name}" VALUES (${placeholders})`, bound);
    }
  }
  return db;
}

function sqliteRows(db: SqlJsDatabase, sql: string): SqlValue[][] {
  const result = db.exec(sql);
  if (result.length === 0) return [];
  return result[0].values.map((row) =>
    row.map((v) => (v === null || v === undefined ? null : (v as SqlValue))),
  );
}

function ownRows(sql: string, fixture: Database): SqlValue[][] {
  const result = evaluate(parse(sql), fixture).results[0];
  if (result.kind !== "select") throw new Error("SELECT ではありません");
  return result.table.rows;
}

/** 行順を保証しないケースのために、行の集合として正規化する */
function sortRows(rows: SqlValue[][]): SqlValue[][] {
  return [...rows].sort((a, b) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const cmp = totalOrder(a[i] ?? null, b[i] ?? null);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

/**
 * SQLite は数値を integer/real で返し、自作エンジンは JS の number で持つ。
 * `2` と `2.0` のような差は本質ではないので、数値は数値として比べる。
 */
function normalize(rows: SqlValue[][]): SqlValue[][] {
  return rows.map((row) =>
    row.map((v) => (typeof v === "number" ? Number(v.toFixed(6)) : v)),
  );
}

/** ORDER BY があるかどうかで、順序を見るかを切り替える */
function expectSameAsSqlite(sql: string, fixture: Database = shohinZaikoDb()) {
  const sqlite = loadIntoSqlite(fixture);
  try {
    const expected = normalize(sqliteRows(sqlite, sql));
    const actual = normalize(ownRows(sql, fixture));
    if (/order\s+by/i.test(sql)) {
      expect(actual, `SQL: ${sql}`).toEqual(expected);
    } else {
      expect(sortRows(actual), `SQL: ${sql}`).toEqual(sortRows(expected));
    }
  } finally {
    sqlite.close();
  }
}

describe("SQLite と結果が一致すること", () => {
  it("日本語の識別子を SQLite 側も同じに解釈する (前提の確認)", () => {
    const sqlite = loadIntoSqlite(shohinZaikoDb());
    expect(sqliteRows(sqlite, "SELECT 商品番号 FROM 商品")).toHaveLength(5);
    sqlite.close();
  });

  describe("射影と選択", () => {
    it.each([
      "SELECT * FROM 商品",
      "SELECT 商品番号, 単価 FROM 商品",
      "SELECT DISTINCT 分類 FROM 商品",
      "SELECT * FROM 商品 WHERE 単価 > 100",
      "SELECT * FROM 商品 WHERE 単価 >= 100 AND 分類 = 'A'",
      "SELECT * FROM 商品 WHERE 分類 = 'A' OR 分類 = 'C'",
      "SELECT * FROM 商品 WHERE NOT 分類 = 'A'",
      "SELECT * FROM 商品 WHERE 単価 BETWEEN 100 AND 200",
      "SELECT * FROM 商品 WHERE 単価 NOT BETWEEN 100 AND 200",
      "SELECT * FROM 商品 WHERE 分類 IN ('A', 'C')",
      "SELECT * FROM 商品 WHERE 分類 NOT IN ('A', 'C')",
      "SELECT * FROM 商品 WHERE 商品名 LIKE '%ゴム'",
      "SELECT * FROM 商品 WHERE 商品番号 LIKE 'P0_'",
      "SELECT * FROM 商品 WHERE 商品名 NOT LIKE '%ゴム'",
      "SELECT 単価 * 2 FROM 商品",
      "SELECT 単価 + 10, 単価 - 10 FROM 商品",
    ])("%s", (sql) => expectSameAsSqlite(sql));
  });

  describe("結合", () => {
    it.each([
      "SELECT * FROM 商品, 在庫",
      "SELECT 商品.商品名, 在庫.倉庫 FROM 商品, 在庫 WHERE 商品.商品番号 = 在庫.商品番号",
      "SELECT 商品.商品名, 在庫.倉庫 FROM 商品 INNER JOIN 在庫 ON 商品.商品番号 = 在庫.商品番号",
      "SELECT 商品.商品番号, 在庫.倉庫 FROM 商品 LEFT OUTER JOIN 在庫 ON 商品.商品番号 = 在庫.商品番号",
      "SELECT S.商品名, Z.在庫数 FROM 商品 S, 在庫 Z WHERE S.商品番号 = Z.商品番号",
      "SELECT 商品.商品名 FROM 商品, 在庫 WHERE 商品.商品番号 = 在庫.商品番号 AND 在庫.在庫数 > 0",
    ])("%s", (sql) => expectSameAsSqlite(sql));
  });

  describe("集約とグループ化", () => {
    it.each([
      "SELECT COUNT(*) FROM 商品",
      "SELECT SUM(単価), MAX(単価), MIN(単価) FROM 商品",
      "SELECT AVG(単価) FROM 商品",
      "SELECT COUNT(DISTINCT 分類) FROM 商品",
      "SELECT 分類, COUNT(*) FROM 商品 GROUP BY 分類",
      "SELECT 分類, SUM(単価) FROM 商品 GROUP BY 分類",
      "SELECT 分類, COUNT(*) FROM 商品 GROUP BY 分類 HAVING COUNT(*) >= 2",
      "SELECT 分類, AVG(単価) FROM 商品 GROUP BY 分類 HAVING AVG(単価) > 150",
      "SELECT 商品番号, COUNT(*) FROM 在庫 GROUP BY 商品番号",
      "SELECT COUNT(*) FROM 商品 WHERE 分類 = 'Z'",
    ])("%s", (sql) => expectSameAsSqlite(sql));
  });

  describe("副問合せ", () => {
    it.each([
      "SELECT 商品番号 FROM 商品 WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)",
      "SELECT 商品番号 FROM 商品 WHERE 商品番号 IN (SELECT 商品番号 FROM 在庫)",
      "SELECT 商品番号 FROM 商品 WHERE NOT EXISTS (SELECT 1 FROM 在庫 WHERE 在庫.商品番号 = 商品.商品番号)",
      "SELECT 商品番号 FROM 商品 WHERE EXISTS (SELECT 1 FROM 在庫 WHERE 在庫.商品番号 = 商品.商品番号)",
      "SELECT 商品番号 FROM 商品 WHERE 単価 = (SELECT MAX(単価) FROM 商品)",
      "SELECT 商品番号 FROM 商品 WHERE 単価 > (SELECT AVG(単価) FROM 商品)",
    ])("%s", (sql) => expectSameAsSqlite(sql));
  });

  describe("集合演算", () => {
    it.each([
      "SELECT 商品番号 FROM 商品 UNION SELECT 商品番号 FROM 在庫",
      "SELECT 商品番号 FROM 商品 UNION ALL SELECT 商品番号 FROM 在庫",
      "SELECT 商品番号 FROM 商品 EXCEPT SELECT 商品番号 FROM 在庫",
      "SELECT 商品番号 FROM 商品 INTERSECT SELECT 商品番号 FROM 在庫",
    ])("%s", (sql) => expectSameAsSqlite(sql));
  });

  describe("ORDER BY (ここだけは行順まで一致すること)", () => {
    it.each([
      "SELECT 商品番号 FROM 商品 ORDER BY 単価",
      "SELECT 商品番号 FROM 商品 ORDER BY 単価 DESC",
      "SELECT 商品番号, 分類 FROM 商品 ORDER BY 分類, 単価 DESC",
      "SELECT 分類, COUNT(*) FROM 商品 GROUP BY 分類 ORDER BY COUNT(*) DESC, 分類",
    ])("%s", (sql) => expectSameAsSqlite(sql));
  });

  describe("NULL の扱い", () => {
    const withNull = () => {
      const db = shohinZaikoDb();
      db.tables[1].rows.push(["P04", "W1", null]);
      return db;
    };

    it.each([
      "SELECT * FROM 在庫 WHERE 在庫数 IS NULL",
      "SELECT * FROM 在庫 WHERE 在庫数 IS NOT NULL",
      "SELECT * FROM 在庫 WHERE 在庫数 > 0",
      "SELECT * FROM 在庫 WHERE 在庫数 = NULL",
      "SELECT COUNT(*), COUNT(在庫数) FROM 在庫",
      "SELECT SUM(在庫数), AVG(在庫数) FROM 在庫",
      "SELECT 商品番号, COUNT(在庫数) FROM 在庫 GROUP BY 商品番号",
      "SELECT 倉庫 FROM 在庫 ORDER BY 在庫数",
    ])("%s", (sql) => expectSameAsSqlite(sql, withNull()));
  });

  describe("DML の実行後の表", () => {
    /** DML は結果表を返さないので、実行後に SELECT した内容で突き合わせる */
    function expectSameAfterDml(dml: string, check: string) {
      const fixture = shohinZaikoDb();
      const sqlite = loadIntoSqlite(fixture);
      try {
        sqlite.run(dml);
        const expected = normalize(sqliteRows(sqlite, check));

        const after = evaluate(parse(dml), fixture).database;
        const actual = normalize(ownRows(check, after));

        expect(sortRows(actual), `${dml} → ${check}`).toEqual(sortRows(expected));
      } finally {
        sqlite.close();
      }
    }

    it.each([
      ["INSERT INTO 商品 VALUES ('P06', 'クリップ', 'C', 60)", "SELECT * FROM 商品"],
      ["INSERT INTO 商品 (商品番号, 商品名) VALUES ('P07', 'テープ')", "SELECT * FROM 商品"],
      ["UPDATE 商品 SET 単価 = 単価 * 2 WHERE 分類 = 'B'", "SELECT * FROM 商品"],
      ["UPDATE 商品 SET 単価 = 単価 + 10", "SELECT 商品番号, 単価 FROM 商品"],
      ["DELETE FROM 在庫 WHERE 在庫数 = 0", "SELECT * FROM 在庫"],
      ["DELETE FROM 在庫", "SELECT * FROM 在庫"],
    ])("%s", (dml, check) => expectSameAfterDml(dml, check));
  });
});

describe("意図的に SQLite と違う挙動 (差分テストの対象外)", () => {
  it("GROUP BY の非集約列: SQLite は通すが、自作は標準 SQL どおりエラーにする", () => {
    const fixture = shohinZaikoDb();
    const sql = "SELECT 商品名, COUNT(*) FROM 商品 GROUP BY 分類";

    const sqlite = loadIntoSqlite(fixture);
    expect(() => sqliteRows(sqlite, sql)).not.toThrow();
    sqlite.close();

    expect(() => ownRows(sql, fixture)).toThrow(/GROUP BY に含まれていない/);
  });

  it("型の比較: SQLite は通すが、自作は型の不一致として落とす", () => {
    const fixture = shohinZaikoDb();
    const sql = "SELECT * FROM 商品 WHERE 単価 = '100'";

    const sqlite = loadIntoSqlite(fixture);
    expect(() => sqliteRows(sqlite, sql)).not.toThrow();
    sqlite.close();

    expect(() => ownRows(sql, fixture)).toThrow(/比較できません/);
  });
});
