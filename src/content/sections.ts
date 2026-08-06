import { site } from "@/lib/site";

export type SectionKey =
  | "why-need-rdb"
  | "rdb-index"
  | "data-modeling"
  | "fe";

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
  },
  fe: {
    key: "fe",
    label: "基本情報技術者試験 擬似言語 実行シミュレーター",
    shortLabel: "基本情報技術者試験 擬似言語 実行シミュレーター",
    path: "/fe",
    description:
      "基本情報技術者試験 (FE) 科目B で使われる擬似言語をブラウザで動かせる実行シミュレーター。一行ずつ実行して変数の変化を目で追ったり、Python / TypeScript に変換して読み比べたりできる。",
    ogImageAlt: "基本情報技術者試験 擬似言語 実行シミュレーター",
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
