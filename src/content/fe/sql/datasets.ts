import type { Database } from "@/lib/sql";

/**
 * SQL 実行シミュレーターで使う表。
 *
 * **JSON にしない。** TypeScript で持てば `satisfies` で列定義と行の要素数の
 * 不整合をコンパイル時に検出できるうえ、fetch の非同期も要らない。
 * 最大でも数十行なのでバンドル負荷は無視できる
 * (docs/wip/20260815-fe-sql/00-overview.md §3)。
 *
 * **過去問そのものは転載しない** (IPA の著作物)。表の構造だけを借りて
 * 値は作り直している (§6 の非スコープ)。
 */

export type DatasetKey = "shohin-zaiko" | "jugyoin";

export interface Dataset {
  key: DatasetKey;
  label: string;
  /** データセット選択の説明。どんな SQL の練習に向くか */
  summary: string;
  /** 出典の注記。過去問を「もとにした」ことを明示する */
  source: string;
  build: () => Database;
}

const shohinZaiko: Dataset = {
  key: "shohin-zaiko",
  label: "商品・在庫",
  summary:
    "2 つの表を結合する練習に。在庫の無い商品があるので、外部結合や NOT EXISTS の違いが見える。",
  source: "平成26年春 問28 の表の構造をもとにした（値は作り直しています）",
  build: () => ({
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
          // P04 / P05 は在庫なし。NOT IN と NOT EXISTS の題材になる
        ],
      },
    ],
    views: [],
  }),
};

const jugyoin: Dataset = {
  key: "jugyoin",
  label: "従業員・部門",
  summary:
    "GROUP BY と HAVING の練習に。部門ごとの人数と給与の集計、NULL を含む列の集約が試せる。",
  source: "集計問題でよく出る「従業員と部門」の形をもとにした架空データ",
  build: () => ({
    tables: [
      {
        schema: {
          name: "部門",
          columns: [
            { name: "部門コード", type: "文字型", length: 3 },
            { name: "部門名", type: "文字型", length: 20 },
          ],
          constraints: [{ kind: "PrimaryKey", columns: ["部門コード"] }],
        },
        rows: [
          ["D01", "営業部"],
          ["D02", "開発部"],
          ["D03", "総務部"],
          ["D04", "監査室"],
        ],
      },
      {
        schema: {
          name: "従業員",
          columns: [
            { name: "社員番号", type: "文字型", length: 4 },
            { name: "氏名", type: "文字型", length: 20 },
            { name: "部門コード", type: "文字型", length: 3 },
            { name: "給与", type: "数値型", length: null },
            { name: "入社日", type: "日付型", length: null },
          ],
          constraints: [
            { kind: "PrimaryKey", columns: ["社員番号"] },
            { kind: "NotNull", column: "氏名" },
            {
              kind: "ForeignKey",
              columns: ["部門コード"],
              refTable: "部門",
              refColumns: ["部門コード"],
            },
          ],
        },
        rows: [
          ["E01", "青木", "D01", 320000, "2019-04-01"],
          ["E02", "井上", "D01", 280000, "2021-04-01"],
          ["E03", "上田", "D01", 410000, "2015-04-01"],
          ["E04", "遠藤", "D02", 380000, "2018-10-01"],
          ["E05", "大野", "D02", 450000, "2013-04-01"],
          ["E06", "加藤", "D03", 300000, "2022-04-01"],
          // 給与が未設定の行。COUNT(給与) と COUNT(*) の違いが見える
          ["E07", "木村", "D03", null, "2026-04-01"],
          // D04 監査室には従業員がいない。外部結合の題材になる
        ],
      },
    ],
    views: [],
  }),
};

export const datasets: Dataset[] = [shohinZaiko, jugyoin];

export const defaultDatasetKey: DatasetKey = shohinZaiko.key;

export function findDataset(key: string): Dataset {
  return datasets.find((d) => d.key === key) ?? shohinZaiko;
}

export function isDatasetKey(key: string): key is DatasetKey {
  return datasets.some((d) => d.key === key);
}

/** データセットごとの初期 SQL。開いた直後に「動くもの」が入っている状態にする */
export const initialSql: Record<DatasetKey, string> = {
  "shohin-zaiko": `-- 実行ボタンを押すか、「段階を追う」で評価順を 1 つずつ確認できます
SELECT 分類, COUNT(*), AVG(単価)
FROM 商品
WHERE 単価 >= 100
GROUP BY 分類
HAVING COUNT(*) >= 2
ORDER BY 分類`,
  jugyoin: `-- 部門ごとの人数と平均給与
SELECT 部門コード, COUNT(*), AVG(給与)
FROM 従業員
GROUP BY 部門コード
ORDER BY 部門コード`,
};
