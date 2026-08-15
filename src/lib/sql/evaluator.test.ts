import { describe, expect, it } from "vitest";
import { parse } from "./parser";
import { evaluate, type Stage, type StatementResult } from "./evaluator";
import { SqlRuntimeError } from "./errors";
import { shohinZaikoDb } from "./testFixtures";
import type { Database } from "./database";
import type { SqlValue } from "./values";

function run(sql: string, db: Database = shohinZaikoDb()): StatementResult[] {
  return evaluate(parse(sql), db).results;
}

/** 単文 SELECT の結果行を取り出す */
function rowsOf(sql: string, db?: Database): SqlValue[][] {
  const result = run(sql, db)[0];
  if (result.kind !== "select") throw new Error("SELECT ではありません");
  return result.table.rows;
}

function columnsOf(sql: string, db?: Database): string[] {
  const result = run(sql, db)[0];
  if (result.kind !== "select") throw new Error("SELECT ではありません");
  return result.table.columns.map((c) => c.name);
}

function stagesOf(sql: string, db?: Database): Stage[] {
  const result = run(sql, db)[0];
  if (result.kind !== "select") throw new Error("SELECT ではありません");
  return result.stages;
}

describe("基本の SELECT", () => {
  it("射影 (列の取り出し)", () => {
    expect(rowsOf("SELECT 商品番号, 単価 FROM 商品 WHERE 分類 = 'B'")).toEqual([
      ["P03", 80],
      ["P04", 150],
    ]);
  });

  it("* は表の全列に展開される", () => {
    expect(columnsOf("SELECT * FROM 商品")).toEqual([
      "商品番号", "商品名", "分類", "単価",
    ]);
  });

  it("AS で列に別名を付けられる", () => {
    expect(columnsOf("SELECT 単価 AS 価格 FROM 商品")).toEqual(["価格"]);
  });

  it("DISTINCT が重複を消す", () => {
    expect(rowsOf("SELECT DISTINCT 分類 FROM 商品")).toEqual([["A"], ["B"], ["C"]]);
  });

  it("FROM が無くても定数は評価できる", () => {
    expect(rowsOf("SELECT 1 + 2")).toEqual([[3]]);
  });
});

describe("結合", () => {
  it("旧式のカンマ結合 + WHERE の結合条件", () => {
    const rows = rowsOf(`
      SELECT 商品.商品名, 在庫.倉庫, 在庫.在庫数
      FROM 商品, 在庫
      WHERE 商品.商品番号 = 在庫.商品番号 AND 在庫.在庫数 > 0
    `);
    expect(rows).toEqual([
      ["ボールペン", "W1", 30],
      ["ボールペン", "W2", 10],
      ["消しゴム", "W2", 25],
    ]);
  });

  it("INNER JOIN は旧式のカンマ結合と同じ結果になる", () => {
    const a = rowsOf(
      "SELECT 商品名, 倉庫 FROM 商品, 在庫 WHERE 商品.商品番号 = 在庫.商品番号",
    );
    const b = rowsOf(
      "SELECT 商品名, 倉庫 FROM 商品 INNER JOIN 在庫 ON 商品.商品番号 = 在庫.商品番号",
    );
    expect(a).toEqual(b);
  });

  it("LEFT OUTER JOIN は相手のいない左の行を NULL で残す", () => {
    const rows = rowsOf(`
      SELECT 商品.商品番号, 在庫.倉庫
      FROM 商品 LEFT OUTER JOIN 在庫 ON 商品.商品番号 = 在庫.商品番号
    `);
    expect(rows).toContainEqual(["P04", null]);
    expect(rows).toContainEqual(["P05", null]);
    expect(rows).toContainEqual(["P01", "W1"]);
  });

  it("結合条件を書かないと直積になる (5 × 4 = 20 行)", () => {
    expect(rowsOf("SELECT * FROM 商品, 在庫")).toHaveLength(20);
  });

  it("修飾なしの曖昧な列は名指しで落ちる", () => {
    expect(() => rowsOf("SELECT 商品番号 FROM 商品, 在庫")).toThrow(
      /どの表のものか決まりません/,
    );
  });
});

describe("集約とグループ化", () => {
  it("COUNT(*) は全行、COUNT(列) は NULL を除いて数える", () => {
    const db = shohinZaikoDb();
    db.tables[0].rows.push(["P06", "クリップ", null, 60]);
    expect(rowsOf("SELECT COUNT(*), COUNT(分類) FROM 商品", db)).toEqual([[6, 5]]);
  });

  it("SUM / AVG / MAX / MIN", () => {
    expect(
      rowsOf("SELECT SUM(単価), AVG(単価), MAX(単価), MIN(単価) FROM 商品"),
    ).toEqual([[1050, 210, 500, 80]]);
  });

  it("GROUP BY で分類ごとに集計する", () => {
    expect(
      rowsOf("SELECT 分類, COUNT(*), SUM(単価) FROM 商品 GROUP BY 分類"),
    ).toEqual([
      ["A", 2, 320],
      ["B", 2, 230],
      ["C", 1, 500],
    ]);
  });

  it("HAVING はグループを絞り込む (R01秋問26)", () => {
    expect(
      rowsOf("SELECT 分類, COUNT(*) FROM 商品 GROUP BY 分類 HAVING COUNT(*) >= 2"),
    ).toEqual([
      ["A", 2],
      ["B", 2],
    ]);
  });

  it("GROUP BY 無しの集約は表全体が 1 グループ", () => {
    expect(rowsOf("SELECT COUNT(*) FROM 商品 WHERE 分類 = 'Z'")).toEqual([[0]]);
  });

  it("集約対象が空なら COUNT は 0、他は NULL", () => {
    expect(rowsOf("SELECT COUNT(単価), SUM(単価), AVG(単価) FROM 商品 WHERE 1 = 2"))
      .toEqual([[0, null, null]]);
  });

  it("COUNT(DISTINCT 列)", () => {
    expect(rowsOf("SELECT COUNT(DISTINCT 分類) FROM 商品")).toEqual([[3]]);
  });
});

describe("標準 SQL の厳密さ (SQLite と意図的に違う点)", () => {
  it("GROUP BY に無い非集約列を SELECT に書くとエラー", () => {
    // SQLite は黙って通すが、標準 SQL ではエラー。試験で×になる書き方を×にする
    expect(() => rowsOf("SELECT 商品名, COUNT(*) FROM 商品 GROUP BY 分類")).toThrow(
      /GROUP BY に含まれていない/,
    );
  });

  it("エラーは理由と直し方を伝える", () => {
    try {
      rowsOf("SELECT 商品名, COUNT(*) FROM 商品 GROUP BY 分類");
    } catch (e) {
      const err = e as SqlRuntimeError;
      expect(err.kind).toBe("NOT_GROUPED");
      expect(err.hint).toMatch(/GROUP BY に加えるか、MAX\(\.\.\.\) などの集約関数で包/);
    }
  });

  it("WHERE に集約関数は書けない (グループ化より前に評価されるため)", () => {
    expect(() => rowsOf("SELECT 分類 FROM 商品 WHERE COUNT(*) > 1 GROUP BY 分類"))
      .toThrow(/WHERE では集約関数は使えません/);
  });

  it("GROUP BY したキーの列は取り出せる", () => {
    expect(rowsOf("SELECT 分類 FROM 商品 GROUP BY 分類")).toEqual([["A"], ["B"], ["C"]]);
  });
});

describe("NULL の三値論理", () => {
  const dbWithNull = () => {
    const db = shohinZaikoDb();
    db.tables[1].rows.push(["P04", "W1", null]);
    return db;
  };

  it("NULL との比較は UNKNOWN になり、行は通らない", () => {
    expect(rowsOf("SELECT 倉庫 FROM 在庫 WHERE 在庫数 > 0", dbWithNull())).toEqual([
      ["W1"],
      ["W2"],
      ["W2"],
    ]);
    // `= NULL` でも `<> NULL` でも取れない
    expect(rowsOf("SELECT * FROM 在庫 WHERE 在庫数 = NULL", dbWithNull())).toEqual([]);
    expect(rowsOf("SELECT * FROM 在庫 WHERE 在庫数 <> NULL", dbWithNull())).toEqual([]);
  });

  it("IS NULL でだけ取り出せる", () => {
    expect(rowsOf("SELECT 商品番号 FROM 在庫 WHERE 在庫数 IS NULL", dbWithNull()))
      .toEqual([["P04"]]);
  });

  it("NOT IN に NULL が混ざると 1 行も返らない (有名な罠)", () => {
    const db = shohinZaikoDb();
    db.tables[1].rows.push(["P04", "W9", null]);
    expect(
      rowsOf(
        "SELECT 商品番号 FROM 商品 WHERE 単価 NOT IN (SELECT 在庫数 FROM 在庫)",
        db,
      ),
    ).toEqual([]);
  });
});

describe("副問合せ (H26春問28)", () => {
  it("NOT IN で在庫の無い商品を取り出す", () => {
    expect(
      rowsOf("SELECT 商品番号 FROM 商品 WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)"),
    ).toEqual([["P04"], ["P05"]]);
  });

  it("NOT EXISTS の相関副問合せは NOT IN と同じ結果になる (問 28 の正解)", () => {
    const notIn = rowsOf(
      "SELECT 商品番号 FROM 商品 WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)",
    );
    const notExists = rowsOf(`
      SELECT 商品番号 FROM 商品
      WHERE NOT EXISTS (SELECT 1 FROM 在庫 WHERE 在庫.商品番号 = 商品.商品番号)
    `);
    expect(notExists).toEqual(notIn);
  });

  it("スカラ副問合せを値として使える", () => {
    expect(rowsOf("SELECT 商品番号 FROM 商品 WHERE 単価 = (SELECT MAX(単価) FROM 商品)"))
      .toEqual([["P05"]]);
  });

  it("スカラ副問合せが複数行を返すとエラー", () => {
    expect(() => rowsOf("SELECT 商品番号 FROM 商品 WHERE 単価 = (SELECT 単価 FROM 商品)"))
      .toThrow(/副問合せが 5 行を返しました/);
  });
});

describe("集合演算", () => {
  it("UNION は重複を消し、UNION ALL は残す", () => {
    expect(
      rowsOf("SELECT 分類 FROM 商品 WHERE 分類 = 'A' UNION SELECT 分類 FROM 商品 WHERE 分類 = 'A'"),
    ).toEqual([["A"]]);
    expect(
      rowsOf("SELECT 分類 FROM 商品 WHERE 分類 = 'A' UNION ALL SELECT 分類 FROM 商品 WHERE 分類 = 'A'"),
    ).toHaveLength(4);
  });

  it("EXCEPT は差、INTERSECT は積", () => {
    expect(
      rowsOf("SELECT 商品番号 FROM 商品 EXCEPT SELECT 商品番号 FROM 在庫"),
    ).toEqual([["P04"], ["P05"]]);
    expect(
      rowsOf("SELECT 商品番号 FROM 商品 INTERSECT SELECT 商品番号 FROM 在庫"),
    ).toEqual([["P01"], ["P02"], ["P03"]]);
  });

  it("列数が違うとエラー", () => {
    expect(() => rowsOf("SELECT 商品番号 FROM 商品 UNION SELECT 商品番号, 倉庫 FROM 在庫"))
      .toThrow(/列数を揃える/);
  });
});

describe("ORDER BY", () => {
  it("DESC と複数キー", () => {
    expect(rowsOf("SELECT 商品番号 FROM 商品 ORDER BY 単価 DESC")).toEqual([
      ["P05"], ["P02"], ["P04"], ["P01"], ["P03"],
    ]);
  });

  it("SELECT の別名で並べ替えできる (ORDER BY は SELECT のあとに評価されるため)", () => {
    expect(rowsOf("SELECT 単価 AS 価格 FROM 商品 ORDER BY 価格")).toEqual([
      [80], [120], [150], [200], [500],
    ]);
  });

  it("集約した結果で並べ替えできる", () => {
    expect(
      rowsOf("SELECT 分類 FROM 商品 GROUP BY 分類 ORDER BY COUNT(*) DESC, 分類"),
    ).toEqual([["A"], ["B"], ["C"]]);
  });
});

describe("LIKE (パターン文字列)", () => {
  it("% は 0 文字以上、_ は 1 文字", () => {
    expect(rowsOf("SELECT 商品番号 FROM 商品 WHERE 商品名 LIKE '%ゴム'")).toEqual([["P03"]]);
    expect(rowsOf("SELECT 商品番号 FROM 商品 WHERE 商品番号 LIKE 'P0_'")).toHaveLength(5);
    expect(rowsOf("SELECT 商品番号 FROM 商品 WHERE 商品番号 LIKE 'P0'")).toEqual([]);
  });

  it("パターン内の正規表現メタ文字はただの文字として扱う", () => {
    const db = shohinZaikoDb();
    db.tables[0].rows.push(["P06", "A.B", "C", 10]);
    expect(rowsOf("SELECT 商品番号 FROM 商品 WHERE 商品名 LIKE 'A.B'", db))
      .toEqual([["P06"]]);
    expect(rowsOf("SELECT 商品番号 FROM 商品 WHERE 商品名 LIKE 'AxB'", db)).toEqual([]);
  });
});

describe("評価順の段階 (このツールの存在理由)", () => {
  it("FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY の順に段階が並ぶ", () => {
    const stages = stagesOf(`
      SELECT 分類, COUNT(*) FROM 商品
      WHERE 単価 >= 100
      GROUP BY 分類
      HAVING COUNT(*) >= 1
      ORDER BY 分類
    `);
    expect(stages.map((s) => s.kind)).toEqual([
      "from", "where", "group-by", "having", "select", "order-by",
    ]);
  });

  it("書かれていない句の段階は作られない", () => {
    expect(stagesOf("SELECT * FROM 商品").map((s) => s.kind)).toEqual([
      "from", "select",
    ]);
  });

  it("各段階が行数の変化をラベルに持つ", () => {
    const stages = stagesOf("SELECT * FROM 商品 WHERE 分類 = 'A'");
    expect(stages[0].label).toMatch(/FROM: 商品 を読み込み \(5 行\)/);
    expect(stages[1].label).toBe("WHERE: 5 行 → 2 行");
  });

  it("GROUP BY の段階はグループの集合を持つ", () => {
    const stages = stagesOf("SELECT 分類, COUNT(*) FROM 商品 GROUP BY 分類");
    const groupStage = stages.find((s) => s.kind === "group-by")!;
    expect(groupStage.groups).toHaveLength(3);
    expect(groupStage.groups![0]).toEqual({
      key: [{ column: "分類", value: "A" }],
      rows: [
        ["P01", "ボールペン", "A", 120],
        ["P02", "ノート", "A", 200],
      ],
    });
  });

  it("段階はハイライト用の範囲を持つ", () => {
    const sql = "SELECT * FROM 商品 WHERE 分類 = 'A'";
    const stages = stagesOf(sql);
    const where = stages.find((s) => s.kind === "where")!;
    expect(sql.slice(where.clauseRange!.from, where.clauseRange!.to)).toBe(
      "WHERE 分類 = 'A'",
    );
  });

  it("JOIN は結合ごとに段階を作る", () => {
    const stages = stagesOf(
      "SELECT * FROM 商品 INNER JOIN 在庫 ON 商品.商品番号 = 在庫.商品番号",
    );
    expect(stages.map((s) => s.kind)).toEqual(["from", "join", "select"]);
    expect(stages[1].label).toBe("INNER JOIN 在庫: 5 行 → 4 行");
  });

  it("DISTINCT も独立した段階になる", () => {
    const stages = stagesOf("SELECT DISTINCT 分類 FROM 商品");
    const distinct = stages.find((s) => s.kind === "distinct")!;
    expect(distinct.label).toBe("DISTINCT: 5 行 → 3 行 (重複を除去)");
  });
});

describe("DML の差分 (実行前後で見せる)", () => {
  it("INSERT は追加行が inserted になる", () => {
    const result = run("INSERT INTO 商品 VALUES ('P06', 'クリップ', 'C', 60)")[0];
    if (result.kind !== "dml") throw new Error("dml ではありません");
    expect(result.affected).toBe(1);
    expect(result.diff.rows.filter((r) => r.change === "inserted")).toHaveLength(1);
    expect(result.diff.rows.filter((r) => r.change === "unchanged")).toHaveLength(5);
  });

  it("UPDATE は変わった列を changedColumns で指す", () => {
    const result = run("UPDATE 商品 SET 単価 = 単価 * 2 WHERE 分類 = 'B'")[0];
    if (result.kind !== "dml") throw new Error("dml ではありません");
    expect(result.affected).toBe(2);
    const updated = result.diff.rows.filter((r) => r.change === "updated");
    expect(updated).toHaveLength(2);
    // 単価は 4 列目 (添字 3)
    expect(updated[0].changedColumns).toEqual([3]);
    expect(updated[0].before).toEqual(["P03", "消しゴム", "B", 80]);
    expect(updated[0].values).toEqual(["P03", "消しゴム", "B", 160]);
  });

  it("UPDATE の右辺は更新前の値で評価される", () => {
    const result = run("UPDATE 商品 SET 単価 = 単価 + 10, 分類 = 分類 WHERE 商品番号 = 'P01'")[0];
    if (result.kind !== "dml") throw new Error("dml ではありません");
    expect(result.diff.rows[0].values).toEqual(["P01", "ボールペン", "A", 130]);
  });

  it("DELETE は消える行を deleted として残す (詰めた後の位置で誤判定しない)", () => {
    const result = run("DELETE FROM 在庫 WHERE 在庫数 = 0")[0];
    if (result.kind !== "dml") throw new Error("dml ではありません");
    expect(result.affected).toBe(1);
    const deleted = result.diff.rows.filter((r) => r.change === "deleted");
    expect(deleted).toEqual([{ change: "deleted", values: ["P02", "W1", 0] }]);
    expect(result.diff.rows.filter((r) => r.change === "unchanged")).toHaveLength(3);
  });

  it("WHERE の無い UPDATE / DELETE は全行が対象になる", () => {
    const result = run("DELETE FROM 在庫")[0];
    if (result.kind !== "dml") throw new Error("dml ではありません");
    expect(result.affected).toBe(4);
    expect(result.stages[0].label).toMatch(/WHERE が無いので全 4 行が削除対象/);
  });

  it("DML も WHERE の段階で対象行を見せる", () => {
    const result = run("UPDATE 商品 SET 単価 = 0 WHERE 分類 = 'A'")[0];
    if (result.kind !== "dml") throw new Error("dml ではありません");
    expect(result.stages[0].kind).toBe("where");
    expect(result.stages[0].label).toBe("WHERE: 5 行のうち 2 行が対象");
    expect(result.stages[0].table.rows).toHaveLength(2);
  });
});

describe("制約 (シラバス 17〜20 番)", () => {
  it("主キーの重複は一意性制約違反になる", () => {
    expect(() => run("INSERT INTO 商品 VALUES ('P01', '重複', 'A', 1)")).toThrow(
      /一意性制約に違反/,
    );
  });

  it("非NULL制約", () => {
    expect(() => run("INSERT INTO 商品 VALUES ('P06', NULL, 'A', 1)")).toThrow(
      /非NULL制約に違反/,
    );
  });

  it("参照制約: 親に無い値は子に入れられない", () => {
    expect(() => run("INSERT INTO 在庫 VALUES ('P99', 'W1', 5)")).toThrow(
      /参照制約に違反/,
    );
  });

  it("参照制約: 子から参照されている親は消せない (H22秋問31 の主題)", () => {
    expect(() => run("DELETE FROM 商品 WHERE 商品番号 = 'P01'")).toThrow(
      /参照制約に違反/,
    );
    // 参照されていない商品は消せる
    expect(() => run("DELETE FROM 商品 WHERE 商品番号 = 'P05'")).not.toThrow();
  });

  it("参照制約: 親の主キーを書き換えても違反になる", () => {
    expect(() => run("UPDATE 商品 SET 商品番号 = 'X01' WHERE 商品番号 = 'P01'")).toThrow(
      /参照制約に違反/,
    );
  });

  it("違反した行の位置を持っている (表の上で指すため)", () => {
    try {
      run("INSERT INTO 在庫 VALUES ('P99', 'W1', 5)");
    } catch (e) {
      const err = e as SqlRuntimeError;
      expect(err.kind).toBe("FOREIGN_KEY_VIOLATION");
      expect(err.offendingRowIndex).toBe(4);
    }
  });

  it("検査制約", () => {
    const sql = `
      CREATE TABLE 発注 (数量 INT CHECK (数量 > 0));
      INSERT INTO 発注 VALUES (0);
    `;
    expect(() => run(sql)).toThrow(/検査制約に違反/);
  });
});

describe("DDL", () => {
  it("CREATE TABLE してから INSERT できる", () => {
    const results = run(`
      CREATE TABLE 社員 (社員番号 CHAR(4) PRIMARY KEY, 氏名 VARCHAR(20) NOT NULL);
      INSERT INTO 社員 VALUES ('E01', '山田');
      SELECT * FROM 社員;
    `);
    expect(results[0]).toMatchObject({ kind: "ddl", op: "CREATE TABLE" });
    const select = results[2];
    if (select.kind !== "select") throw new Error("SELECT ではありません");
    expect(select.table.rows).toEqual([["E01", "山田"]]);
  });

  it("CREATE VIEW は実表ではないので、元の表の変更が反映される", () => {
    const results = run(`
      CREATE VIEW 高額商品 AS SELECT 商品番号, 単価 FROM 商品 WHERE 単価 >= 200;
      SELECT * FROM 高額商品;
      UPDATE 商品 SET 単価 = 1000 WHERE 商品番号 = 'P01';
      SELECT * FROM 高額商品;
    `);
    const first = results[1];
    const second = results[3];
    if (first.kind !== "select" || second.kind !== "select") {
      throw new Error("SELECT ではありません");
    }
    expect(first.table.rows).toEqual([["P02", 200], ["P05", 500]]);
    expect(second.table.rows).toEqual([
      ["P01", 1000], ["P02", 200], ["P05", 500],
    ]);
  });

  it("ビューは直接更新できないと伝える", () => {
    expect(() =>
      run(`
        CREATE VIEW v AS SELECT 商品番号 FROM 商品;
        DELETE FROM v;
      `),
    ).toThrow(/ビューなので、直接は更新できません/);
  });
});

describe("エラーが直し方まで伝える", () => {
  it("存在しない表は候補を挙げる", () => {
    try {
      rowsOf("SELECT * FROM 商店");
    } catch (e) {
      const err = e as SqlRuntimeError;
      expect(err.kind).toBe("UNKNOWN_TABLE");
      expect(err.hint).toContain("商品");
      expect(err.hint).toContain("在庫");
    }
  });

  it("存在しない列は使える列を挙げる", () => {
    try {
      rowsOf("SELECT 値段 FROM 商品");
    } catch (e) {
      const err = e as SqlRuntimeError;
      expect(err.kind).toBe("UNKNOWN_COLUMN");
      expect(err.hint).toContain("単価");
    }
  });

  it("0 除算", () => {
    expect(() => rowsOf("SELECT 単価 / 0 FROM 商品")).toThrow(/0 で割ることはできません/);
  });

  it("文字列と数値の比較は型の不一致として落ちる", () => {
    expect(() => rowsOf("SELECT * FROM 商品 WHERE 単価 = '100'")).toThrow(
      /比較できません/,
    );
  });
});

describe("元のデータベースを壊さない", () => {
  it("DML を実行しても引数の Database は変わらない", () => {
    const db = shohinZaikoDb();
    evaluate(parse("DELETE FROM 在庫"), db);
    expect(db.tables[1].rows).toHaveLength(4);
  });

  it("戻り値の database には結果が反映されている", () => {
    const db = shohinZaikoDb();
    const result = evaluate(parse("DELETE FROM 在庫"), db);
    expect(result.database.tables[1].rows).toHaveLength(0);
  });
});
