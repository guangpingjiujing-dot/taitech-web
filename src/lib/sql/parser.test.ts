import { describe, expect, it } from "vitest";
import { parse } from "./parser";
import { SqlParseError, SqlUnsupportedError } from "./errors";
import type { SelectCore, SelectStmt, SetOperation } from "./ast";

/**
 * 過去問に実際に出た構文を読めることを最優先で確認する。
 * 出典は docs/wip/20260815-fe-sql/00-overview.md §2-2 の構文別内訳。
 */

function selectOf(sql: string): SelectCore {
  const program = parse(sql);
  const stmt = program.statements[0] as SelectStmt;
  expect(stmt.kind).toBe("SelectStmt");
  expect(stmt.query.kind).toBe("SelectCore");
  return stmt.query as SelectCore;
}

describe("識別子", () => {
  it("日本語の表名・列名をそのまま読める (H26春問28)", () => {
    const select = selectOf("SELECT 商品番号 FROM 商品");
    expect(select.from[0].name).toBe("商品");
    expect(select.columns[0].expr).toMatchObject({
      kind: "ColumnRef",
      name: "商品番号",
      qualifier: null,
    });
  });

  it("表名で修飾した列を読める", () => {
    const select = selectOf("SELECT 商品.商品番号 FROM 商品");
    expect(select.columns[0].expr).toMatchObject({
      qualifier: "商品",
      name: "商品番号",
    });
  });

  it("キーワードは大文字小文字を区別しない", () => {
    const select = selectOf("select 商品番号 from 商品 where 単価 > 100");
    expect(select.where).not.toBeNull();
  });

  it("全角の括弧は打ち間違いとして名指しされる", () => {
    expect(() => parse("SELECT COUNT（*） FROM 商品")).toThrow(/全角/);
  });
});

describe("結合", () => {
  it("旧式のカンマ結合を読める (過去問で最頻出)", () => {
    const select = selectOf(
      "SELECT 商品名 FROM 商品, 在庫 WHERE 商品.商品番号 = 在庫.商品番号",
    );
    expect(select.from.map((t) => t.name)).toEqual(["商品", "在庫"]);
    expect(select.joins).toHaveLength(0);
    expect(select.where).not.toBeNull();
  });

  it("INNER JOIN ... ON を読める", () => {
    const select = selectOf(
      "SELECT 商品名 FROM 商品 INNER JOIN 在庫 ON 商品.商品番号 = 在庫.商品番号",
    );
    expect(select.joins[0].type).toBe("INNER");
    expect(select.joins[0].on).not.toBeNull();
  });

  it("LEFT OUTER JOIN の OUTER は省略できる", () => {
    const a = selectOf("SELECT * FROM 商品 LEFT OUTER JOIN 在庫 ON 1 = 1");
    const b = selectOf("SELECT * FROM 商品 LEFT JOIN 在庫 ON 1 = 1");
    expect(a.joins[0].type).toBe("LEFT");
    expect(b.joins[0].type).toBe("LEFT");
  });

  it("相関名を読める (シラバス 25 番)", () => {
    const select = selectOf("SELECT S.商品番号 FROM 商品 AS S, 在庫 Z");
    expect(select.from[0].alias).toBe("S");
    expect(select.from[1].alias).toBe("Z");
  });

  it("ON の無い JOIN は理由つきで落ちる", () => {
    expect(() => parse("SELECT * FROM 商品 JOIN 在庫")).toThrow(
      /ON で結合条件が必要/,
    );
  });

  it("FULL OUTER JOIN は範囲外だと明示して落ちる", () => {
    expect(() => parse("SELECT * FROM 商品 FULL OUTER JOIN 在庫 ON 1 = 1")).toThrow(
      /FULL OUTER JOIN には対応していません/,
    );
  });
});

describe("WHERE の述語", () => {
  it("AND / OR / NOT", () => {
    const select = selectOf(
      "SELECT * FROM 商品 WHERE 単価 >= 100 AND NOT 単価 > 500 OR 分類 = 'A'",
    );
    expect(select.where?.kind).toBe("BinaryExpr");
  });

  it("BETWEEN と NOT BETWEEN", () => {
    expect(selectOf("SELECT * FROM 商品 WHERE 単価 BETWEEN 100 AND 500").where)
      .toMatchObject({ kind: "BetweenExpr", negated: false });
    expect(
      selectOf("SELECT * FROM 商品 WHERE 単価 NOT BETWEEN 100 AND 500").where,
    ).toMatchObject({ kind: "BetweenExpr", negated: true });
  });

  it("IN の値リストと副問合せ (H26春問28)", () => {
    expect(selectOf("SELECT * FROM 商品 WHERE 分類 IN ('A', 'B')").where)
      .toMatchObject({ kind: "InExpr", negated: false, subquery: null });

    const notIn = selectOf(
      "SELECT 商品番号 FROM 商品 WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)",
    ).where;
    expect(notIn).toMatchObject({ kind: "InExpr", negated: true, list: null });
  });

  it("LIKE (パターン文字列。シラバス 24 番)", () => {
    expect(selectOf("SELECT * FROM 商品 WHERE 商品名 LIKE '%ボール%'").where)
      .toMatchObject({ kind: "LikeExpr", negated: false });
    expect(selectOf("SELECT * FROM 商品 WHERE 商品名 NOT LIKE 'A_'").where)
      .toMatchObject({ kind: "LikeExpr", negated: true });
  });

  it("IS NULL / IS NOT NULL", () => {
    expect(selectOf("SELECT * FROM 在庫 WHERE 在庫数 IS NULL").where)
      .toMatchObject({ kind: "IsNullExpr", negated: false });
    expect(selectOf("SELECT * FROM 在庫 WHERE 在庫数 IS NOT NULL").where)
      .toMatchObject({ kind: "IsNullExpr", negated: true });
  });

  it("EXISTS / NOT EXISTS の相関副問合せ (H26春問28 の正解肢)", () => {
    const where = selectOf(
      "SELECT 商品番号 FROM 商品 WHERE NOT EXISTS (SELECT 1 FROM 在庫 WHERE 在庫.商品番号 = 商品.商品番号)",
    ).where;
    // NOT は UnaryExpr として外側に付く
    expect(where).toMatchObject({ kind: "UnaryExpr", op: "NOT" });
  });

  it("`!=` は `<>` に正規化される", () => {
    const where = selectOf("SELECT * FROM 商品 WHERE 分類 != 'A'").where;
    expect(where).toMatchObject({ kind: "BinaryExpr", op: "<>" });
  });
});

describe("集約とグループ化", () => {
  it("COUNT(*) と集約関数 4 種", () => {
    const select = selectOf(
      "SELECT COUNT(*), SUM(単価), AVG(単価), MAX(単価), MIN(単価) FROM 商品",
    );
    expect(select.columns[0].expr).toMatchObject({
      kind: "FuncCall",
      name: "COUNT",
      star: true,
    });
    expect(select.columns.map((c) => (c.expr as { name: string }).name)).toEqual([
      "COUNT", "SUM", "AVG", "MAX", "MIN",
    ]);
  });

  it("COUNT(DISTINCT 列)", () => {
    const select = selectOf("SELECT COUNT(DISTINCT 分類) FROM 商品");
    expect(select.columns[0].expr).toMatchObject({ distinct: true });
  });

  it("COUNT 以外に * は渡せない", () => {
    expect(() => parse("SELECT SUM(*) FROM 商品")).toThrow(/SUM\(\*\) とは書けません/);
  });

  it("GROUP BY と HAVING (R01秋問26)", () => {
    const select = selectOf(
      "SELECT 分類, COUNT(*) FROM 商品 GROUP BY 分類 HAVING COUNT(*) > 2",
    );
    expect(select.groupBy).toHaveLength(1);
    expect(select.having).not.toBeNull();
  });

  it("ORDER BY の ASC / DESC", () => {
    const select = selectOf("SELECT * FROM 商品 ORDER BY 単価 DESC, 商品番号");
    expect(select.orderBy).toEqual([
      { expr: expect.objectContaining({ name: "単価" }), direction: "DESC" },
      { expr: expect.objectContaining({ name: "商品番号" }), direction: "ASC" },
    ]);
  });
});

describe("集合演算 (シラバス 2 番)", () => {
  it("UNION / UNION ALL / EXCEPT / INTERSECT", () => {
    for (const [sql, op] of [
      ["SELECT 商品番号 FROM 商品 UNION SELECT 商品番号 FROM 在庫", "UNION"],
      ["SELECT 商品番号 FROM 商品 UNION ALL SELECT 商品番号 FROM 在庫", "UNION ALL"],
      ["SELECT 商品番号 FROM 商品 EXCEPT SELECT 商品番号 FROM 在庫", "EXCEPT"],
      ["SELECT 商品番号 FROM 商品 INTERSECT SELECT 商品番号 FROM 在庫", "INTERSECT"],
    ] as const) {
      const stmt = parse(sql).statements[0] as SelectStmt;
      expect((stmt.query as SetOperation).op).toBe(op);
    }
  });

  it("左結合になる", () => {
    const stmt = parse(
      "SELECT a FROM t1 UNION SELECT a FROM t2 EXCEPT SELECT a FROM t3",
    ).statements[0] as SelectStmt;
    const top = stmt.query as SetOperation;
    expect(top.op).toBe("EXCEPT");
    expect(top.left.kind).toBe("SetOperation");
  });
});

describe("句の Span", () => {
  it("各句の開始位置がキーワードの位置になっている", () => {
    const sql = "SELECT 商品番号 FROM 商品 WHERE 単価 > 100 GROUP BY 分類";
    const select = selectOf(sql);
    expect(sql.slice(select.spans.select!.from, select.spans.select!.to)).toBe(
      "SELECT 商品番号",
    );
    expect(sql.slice(select.spans.where!.from, select.spans.where!.to)).toBe(
      "WHERE 単価 > 100",
    );
    expect(sql.slice(select.spans.groupBy!.from, select.spans.groupBy!.to)).toBe(
      "GROUP BY 分類",
    );
  });

  it("書かれていない句の Span は undefined", () => {
    const select = selectOf("SELECT * FROM 商品");
    expect(select.spans.where).toBeUndefined();
    expect(select.spans.having).toBeUndefined();
  });
});

describe("DML", () => {
  it("INSERT (列指定あり / なし / 複数行)", () => {
    expect(parse("INSERT INTO 商品 (商品番号, 単価) VALUES ('P1', 100)").statements[0])
      .toMatchObject({ kind: "InsertStmt", table: "商品", columns: ["商品番号", "単価"] });
    expect(parse("INSERT INTO 商品 VALUES ('P1', 100)").statements[0])
      .toMatchObject({ columns: null });
    expect(parse("INSERT INTO 商品 VALUES ('P1', 100), ('P2', 200)").statements[0])
      .toMatchObject({ values: [[expect.anything(), expect.anything()], [expect.anything(), expect.anything()]] });
  });

  it("UPDATE (H22秋問31 / H24秋問29)", () => {
    const stmt = parse("UPDATE 商品 SET 単価 = 単価 * 2 WHERE 分類 = 'A'").statements[0];
    expect(stmt).toMatchObject({
      kind: "UpdateStmt",
      table: "商品",
      assignments: [{ column: "単価" }],
    });
  });

  it("DELETE (H25秋問31)", () => {
    expect(parse("DELETE FROM 在庫 WHERE 在庫数 = 0").statements[0]).toMatchObject({
      kind: "DeleteStmt",
      table: "在庫",
    });
  });

  it("WHERE の無い UPDATE / DELETE も構文としては通る (全行が対象になる)", () => {
    expect(parse("DELETE FROM 在庫").statements[0]).toMatchObject({ where: null });
    expect(parse("UPDATE 商品 SET 単価 = 0").statements[0]).toMatchObject({ where: null });
  });
});

describe("DDL", () => {
  it("CREATE TABLE と 4 つの制約 (シラバス 17〜20 番)", () => {
    const stmt = parse(`
      CREATE TABLE 在庫 (
        商品番号 CHAR(4) NOT NULL PRIMARY KEY REFERENCES 商品(商品番号),
        倉庫 VARCHAR(20) UNIQUE,
        在庫数 INT CHECK (在庫数 >= 0)
      )
    `).statements[0];
    expect(stmt.kind).toBe("CreateTableStmt");
    const kinds = (stmt as { constraints: { kind: string }[] }).constraints.map(
      (c) => c.kind,
    );
    expect(kinds).toEqual(
      expect.arrayContaining(["NotNull", "PrimaryKey", "ForeignKey", "Unique", "Check"]),
    );
  });

  it("表制約としての PRIMARY KEY / FOREIGN KEY", () => {
    const stmt = parse(`
      CREATE TABLE 在庫 (
        商品番号 CHAR(4),
        倉庫 CHAR(2),
        PRIMARY KEY (商品番号, 倉庫),
        FOREIGN KEY (商品番号) REFERENCES 商品(商品番号)
      )
    `).statements[0] as { constraints: { kind: string; columns: string[] }[] };
    expect(stmt.constraints).toEqual(
      expect.arrayContaining([
        { kind: "PrimaryKey", columns: ["商品番号", "倉庫"] },
        {
          kind: "ForeignKey",
          columns: ["商品番号"],
          refTable: "商品",
          refColumns: ["商品番号"],
        },
      ]),
    );
  });

  it("型名は 文字型 / 数値型 / 日付型 の 3 つに寄せて読む", () => {
    const stmt = parse(
      "CREATE TABLE t (a CHAR(4), b INT, c DATE, d DECIMAL(5,2))",
    ).statements[0] as { columns: { name: string; type: string }[] };
    expect(stmt.columns.map((c) => c.type)).toEqual([
      "文字型", "数値型", "日付型", "数値型",
    ]);
  });

  it("範囲外の型は名指しで落ちる", () => {
    expect(() => parse("CREATE TABLE t (a BLOB)")).toThrow(/型「BLOB」には対応していません/);
  });

  it("CREATE VIEW (H21春問33 / H24秋問29)", () => {
    const stmt = parse(
      "CREATE VIEW 高額商品 AS SELECT 商品番号, 単価 FROM 商品 WHERE 単価 > 1000",
    ).statements[0];
    expect(stmt).toMatchObject({ kind: "CreateViewStmt", name: "高額商品" });
  });
});

describe("実行対象外の構文は解説へ誘導する", () => {
  it.each([
    ["GRANT SELECT ON 商品 TO PUBLIC", "grant", "/fe/sql/lessons/grant"],
    ["REVOKE SELECT ON 商品 FROM PUBLIC", "grant", "/fe/sql/lessons/grant"],
    ["DECLARE C CURSOR FOR SELECT * FROM 商品", "cursor", "/fe/sql/lessons/cursor"],
    ["FETCH C INTO x", "cursor", "/fe/sql/lessons/cursor"],
  ])("%s は SqlUnsupportedError になる", (sql, topic, path) => {
    try {
      parse(sql);
      throw new Error("エラーが投げられなかった");
    } catch (e) {
      expect(e).toBeInstanceOf(SqlUnsupportedError);
      const err = e as SqlUnsupportedError;
      expect(err.topic).toBe(topic);
      expect(err.lessonPath).toBe(path);
      // 「構文が間違っている」ではなく「試験範囲だが動かせない」と伝える
      expect(err.detail).toMatch(/試験範囲|動かせません/);
    }
  });

  it("SqlUnsupportedError は SqlParseError ではない (UI が出し分けるため)", () => {
    try {
      parse("GRANT SELECT ON 商品 TO PUBLIC");
    } catch (e) {
      expect(e).not.toBeInstanceOf(SqlParseError);
    }
  });
});

describe("コメントと複数文", () => {
  it("行コメントとブロックコメントを飛ばす", () => {
    const select = selectOf(`
      -- 単価が高い商品
      SELECT 商品番号 /* 主キー */ FROM 商品
    `);
    expect(select.columns).toHaveLength(1);
  });

  it("セミコロンで複数の文を並べられる", () => {
    const program = parse("SELECT * FROM 商品; SELECT * FROM 在庫;");
    expect(program.statements).toHaveLength(2);
  });

  it("区切りの無い 2 文はヒントつきで落ちる", () => {
    expect(() => parse("SELECT * FROM 商品 SELECT * FROM 在庫")).toThrow(
      /セミコロン/,
    );
  });

  it("閉じていないコメント・文字列は名指しで落ちる", () => {
    expect(() => parse("SELECT * FROM 商品 /* 閉じ忘れ")).toThrow(/閉じられていません/);
    expect(() => parse("SELECT * FROM 商品 WHERE a = '閉じ忘れ")).toThrow(
      /閉じられていません/,
    );
  });
});
