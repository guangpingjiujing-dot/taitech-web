import type { Database } from "./database";

/**
 * テスト用のデータベース。
 *
 * **過去問そのものは転載していない** (IPA の著作物)。H26春問28 の「商品」「在庫」という
 * 表の構造だけを借りて、値は作り直している (00-overview.md §6 の非スコープ)。
 * 本番で使うデータセットは `src/content/fe/sql/` 側に置く。
 */
export function shohinZaikoDb(): Database {
  return {
    tables: [
      {
        schema: {
          name: "商品",
          columns: [
            { name: "商品番号", type: "文字型", length: 4 },
            { name: "商品名", type: "文字型", length: 20 },
            { name: "分類", type: "文字型", length: 1 },
            { name: "単価", type: "数値型", length: null },
          ],
          constraints: [
            { kind: "PrimaryKey", columns: ["商品番号"] },
            { kind: "NotNull", column: "商品名" },
          ],
        },
        rows: [
          ["P01", "ボールペン", "A", 120],
          ["P02", "ノート", "A", 200],
          ["P03", "消しゴム", "B", 80],
          ["P04", "定規", "B", 150],
          ["P05", "ホチキス", "C", 500],
        ],
      },
      {
        schema: {
          name: "在庫",
          columns: [
            { name: "商品番号", type: "文字型", length: 4 },
            { name: "倉庫", type: "文字型", length: 2 },
            { name: "在庫数", type: "数値型", length: null },
          ],
          constraints: [
            { kind: "PrimaryKey", columns: ["商品番号", "倉庫"] },
            {
              kind: "ForeignKey",
              columns: ["商品番号"],
              refTable: "商品",
              refColumns: ["商品番号"],
            },
          ],
        },
        rows: [
          ["P01", "W1", 30],
          ["P01", "W2", 10],
          ["P02", "W1", 0],
          ["P03", "W2", 25],
          // P04 / P05 は在庫なし。NOT IN / NOT EXISTS の題材になる
        ],
      },
    ],
    views: [],
  };
}
