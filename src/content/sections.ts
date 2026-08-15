import { site } from "@/lib/site";

export type SectionKey =
  | "why-need-rdb"
  | "rdb-index"
  | "data-modeling"
  | "fe"
  | "joho1";

export type Section = {
  key: SectionKey;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
  ogImageAlt: string;
  /**
   * SEO 用: 指定時は `<title>` と OG title に使用（未指定なら label にフォールバック）。
   * `label` はナビ / JSON-LD の headline に使う「セクションの名前」なので短いまま維持し、
   * 狙うクエリを含む長い文言はこちらに分離する（`topics.*.ts` の metaTitle と同じ設計）。
   */
  metaTitle?: string;
  /** SEO 用: 指定時は `<meta description>` と OG description に使用（未指定なら description） */
  metaDescription?: string;
};

export const sections: Record<SectionKey, Section> = {
  "why-need-rdb": {
    key: "why-need-rdb",
    label: "もしもこの世界にRDBがなかったら",
    shortLabel: "もしRDBがなかったら",
    path: "/why-need-rdb",
    description:
      "Excel をバックエンドに使ったら何が壊れるかを起点に、トランザクション・制約・同時実行制御・永続性など RDB の根本価値を体系的に理解するセクション。",
    ogImageAlt: "もしもこの世界にRDBがなかったら",
  },
  "rdb-index": {
    key: "rdb-index",
    label: "RDBインデックス図解",
    shortLabel: "RDBインデックス図解",
    path: "/rdb-index",
    description:
      "B-tree、ハッシュ、クラスタ化、複合インデックスなど、RDBのインデックスの仕組みを図解で理解するセクション。",
    ogImageAlt: "RDBインデックス図解",
    metaTitle: "RDBインデックスとは｜種類と仕組みを図解で一覧",
    metaDescription:
      "RDB のインデックスの種類と仕組みを図解で一覧。B-tree・ハッシュ・クラスタ化・複合・カバリング・部分インデックスの違いと使い分けから、実行計画と統計情報の読み方まで、12 本の記事で体系的に理解できる。",
  },
  "data-modeling": {
    key: "data-modeling",
    label: "データモデリング体系",
    shortLabel: "データモデリング体系",
    path: "/data-modeling",
    description:
      "関数従属性と正規化を中心に、リレーショナルデータベースの設計体系を厳密な定義と図解で整理するセクション。",
    ogImageAlt: "データモデリング体系",
    /*
     * label ("データモデリング体系") には **正規化 / ER 図 という頭の検索語が 1 つも入っていない**。
     * 実際に流入があるのは「データベース 正規化」「関数従属」「er図 正規化」なので、
     * ハブの title はそちらに寄せる。「わかりやすく」は具体語を押し出さない範囲で末尾に添える。
     */
    metaTitle: "正規化とER図をわかりやすく｜データモデリング体系",
    metaDescription:
      "データベースの正規化と ER 図を、図解と厳密な定義でわかりやすく整理。更新時異常・関数従属性・候補キーから第1〜第3正規形と非正規化まで、ER 図はエンティティ・関連・カーディナリティ・弱エンティティまでを 20 本の記事で体系的に理解できる。",
  },
  joho1: {
    key: "joho1",
    label: "共通テスト 情報I プログラム表記 実行シミュレーター",
    shortLabel: "情報I プログラム表記",
    path: "/joho1",
    description:
      "大学入学共通テスト「情報I」で出題されるプログラム表記を、ブラウザで 1 行ずつ実行できるシミュレーター。変数の値の変化を見ながら、繰り返しと条件分岐の追い方を身につけられる。",
    ogImageAlt: "共通テスト 情報I プログラム表記 実行シミュレーター",
    metaTitle: "情報Iのプログラム表記を実行｜共通テスト対策",
    metaDescription:
      "共通テスト「情報I」のプログラム表記をブラウザで 1 行ずつ実行できる。変数の値の変化を目で追いながら、繰り返し・条件分岐・配列の動きをわかりやすく確認できる。プログラミング未経験からでも読めるよう構文別レッスン 6 本つき。配列の添字は 0 始まり / 1 始まりを切り替え可能。",
  },
  fe: {
    key: "fe",
    /*
     * 2026-08-15: `/fe` を擬似言語 Playground からハブに変更したのに伴う改名
     * (docs/wip/20260815-fe-sql/00-overview.md §5)。擬似言語ツールは /fe/algorithm へ移設し、
     * SQL 実行シミュレーター (/fe/sql) が 2 つ目のツールとして並ぶ。
     *
     * **label をツール名として使わないこと。** 改名前は `/fe` = 擬似言語ツールだったので
     * JSON-LD の SoftwareApplication.name に label を渡していたが、ハブ化した今それをやると
     * 「ツールの名前 = 基本情報技術者試験 対策ツール」という嘘になる。各ツールページが
     * 自分の名前を明示的に持つ (src/app/fe/algorithm/page.tsx の PAGE_TITLE)。
     */
    label: "基本情報技術者試験 対策ツール",
    shortLabel: "基本情報技術者試験",
    path: "/fe",
    description:
      "基本情報技術者試験 (FE) の出題範囲を、読むだけでなくブラウザ上で動かして対策できるツール群。科目B の擬似言語は一行ずつ実行して変数の変化を追え、科目A の SQL は評価される順番どおりに途中の表を見ながら確かめられる。",
    ogImageAlt: "基本情報技術者試験 対策ツール",
    metaTitle: "基本情報技術者試験をわかりやすく｜動かして覚える",
    metaDescription:
      "基本情報技術者試験 (FE) を、初学者にもわかりやすく「読む」ではなく「動かす」で対策するツール集。科目B の擬似言語は 1 行ずつ実行して変数の変化を追え、科目A の SQL は評価順に途中の表を見ながら確かめられる。レッスンと練習問題つきで、すべて無料・登録不要。",
  },
};

export type DataModelingCategoryKey = "er-diagram" | "normalization";

export type DataModelingCategory = {
  key: DataModelingCategoryKey;
  label: string;
  path: string;
  description: string;
};

export const dataModelingCategories: Record<DataModelingCategoryKey, DataModelingCategory> = {
  normalization: {
    key: "normalization",
    label: "正規化",
    path: "/data-modeling/normalization",
    description:
      "更新時異常を排除するためにテーブルを関数従属性に基づいて分割する、正規化の基礎から実務判断まで。",
  },
  "er-diagram": {
    key: "er-diagram",
    label: "ER図",
    path: "/data-modeling/er-diagram",
    description:
      "エンティティ・関連・カーディナリティ・弱エンティティなど ER 図の基礎を、身近な例と静的な図解で理解するカテゴリ。「変なER図」の間違い探しから入り、9 つの違和感を一つずつ ER 概念で言語化する。",
  },
};

export function sectionUrl(key: SectionKey): string {
  return `${site.url}${sections[key].path}`;
}
