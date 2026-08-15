import { describe, expect, it } from "vitest";
import { datasets, findDataset, initialSql, isDatasetKey } from "./datasets";
import { parse } from "@/lib/sql/parser";
import { evaluate } from "@/lib/sql/evaluator";
import { sameName } from "@/lib/sql/database";

/**
 * データセットの整合性検査。
 *
 * **`satisfies` では足りない。** `01-implementation-design.md` §4 は
 * 「`satisfies` で列定義と行の要素数の不整合をコンパイル時に検出する」と書いていたが、
 * `TableData.rows` の型は `SqlValue[][]` なので **列数は型では縛れない**。
 * 行の要素数を 1 つ間違えると `undefined` が黙って NULL 扱いになり、
 * 練習問題の期待値まで巻き添えで狂う。ここで実行時に検査する。
 */

describe("SQL データセット", () => {
  it.each(datasets.map((d) => [d.key, d] as const))(
    "%s: 各行の要素数が列定義と一致する",
    (_key, dataset) => {
      for (const table of dataset.build().tables) {
        const expected = table.schema.columns.length;
        table.rows.forEach((row, i) => {
          expect(
            row.length,
            `${table.schema.name} の ${i + 1} 行目: ${expected} 列のはずが ${row.length} 個`,
          ).toBe(expected);
        });
      }
    },
  );

  it.each(datasets.map((d) => [d.key, d] as const))(
    "%s: 制約が参照している列が実在する",
    (_key, dataset) => {
      const db = dataset.build();
      for (const table of db.tables) {
        const names = table.schema.columns.map((c) => c.name);
        const has = (col: string) => names.some((n) => sameName(n, col));

        for (const c of table.schema.constraints) {
          const cols =
            c.kind === "NotNull" ? [c.column] : "columns" in c ? c.columns : [];
          for (const col of cols) {
            expect(has(col), `${table.schema.name}.${col} が存在しない`).toBe(true);
          }
          if (c.kind === "ForeignKey") {
            const parent = db.tables.find((t) =>
              sameName(t.schema.name, c.refTable),
            );
            expect(parent, `参照先の表 ${c.refTable} が無い`).toBeTruthy();
            for (const col of c.refColumns) {
              expect(
                parent!.schema.columns.some((pc) => sameName(pc.name, col)),
                `${c.refTable}.${col} が存在しない`,
              ).toBe(true);
            }
          }
        }
      }
    },
  );

  it.each(datasets.map((d) => [d.key, d] as const))(
    "%s: 初期データが自分の制約に違反していない",
    (_key, dataset) => {
      // 何もしない UPDATE を通すと validate() が全表を検査する
      const db = dataset.build();
      const first = db.tables[0];
      const col = first.schema.columns[0].name;
      expect(() =>
        evaluate(
          parse(`UPDATE ${first.schema.name} SET ${col} = ${col}`),
          db,
        ),
      ).not.toThrow();
    },
  );

  it.each(datasets.map((d) => [d.key, d] as const))(
    "%s: 既定の SQL がそのまま実行できる",
    (_key, dataset) => {
      expect(initialSql[dataset.key], `${dataset.key} の初期 SQL が無い`).toBeTruthy();
      expect(() =>
        evaluate(parse(initialSql[dataset.key]), dataset.build()),
      ).not.toThrow();
    },
  );

  it("key が重複していない", () => {
    const keys = datasets.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("isDatasetKey が未知のキーを弾く", () => {
    expect(isDatasetKey("shohin-zaiko")).toBe(true);
    expect(isDatasetKey("shohin-zaiko-typo")).toBe(false);
    // findDataset の既定へのフォールバックは、この関門を通った後しか呼ばれない
    expect(findDataset("shohin-zaiko-typo").key).toBe("shohin-zaiko");
  });
});
