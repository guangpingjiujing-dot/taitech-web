/**
 * 書籍の対象領域。ページ側は自分の領域だけを表示する
 * (FE 擬似言語のレッスンに DB 設計本が並ばないようにするため)。
 */
export type BookDomain = "rdb" | "fe" | "joho1";

export type Book = {
  id: string;
  domain: BookDomain;
  title: string;
  author: string;
  asin?: string;
  amazonUrl: string;
  cover?: string;
  description: string;
  topics: string[];
  recommended?: boolean;
};

export const books: Book[] = [
  {
    id: "tatsujin-db-design",
    domain: "rdb",
    title: "達人に学ぶDB設計徹底指南書 第2版",
    author: "ミック",
    amazonUrl: "https://www.amazon.co.jp/dp/4798186627?tag=taitech-22",
    description:
      "テーブル設計と正規化、パフォーマンス考慮のインデックス設計まで実務レベルで学べる定番書。第2版ではクラウド対応も強化。",
    recommended: true,
    topics: [
      "btree",
      "clustered",
      "composite",
      "cost",
      "covering",
      "why",
      "functional-dependency",
      "keys",
      "1nf",
      "2nf",
      "3nf",
      "denormalization",
      "entity",
      "relationship",
      "cardinality",
      "optionality",
      "many-to-many",
      "weak-entity",
      "notation",
      "atomicity",
      "concurrency",
      "uniqueness",
      "referential-integrity",
      "durability",
      "recap",
    ],
  },
  {
    id: "raku-erd-lesson",
    domain: "rdb",
    title: "楽々ERDレッスン (CodeZine BOOKS)",
    author: "羽生章洋",
    asin: "4798110663",
    amazonUrl: "https://www.amazon.co.jp/dp/4798110663?tag=taitech-22",
    description:
      "ER 図をどう「使える設計」に落とすか、実務の判断まで踏み込んだ入門書。エンティティの切り出しから多対多の扱いまで具体例が豊富。",
    recommended: true,
    topics: [
      "entity",
      "relationship",
      "cardinality",
      "optionality",
      "many-to-many",
      "weak-entity",
      "notation",
      "keys",
      "1nf",
    ],
  },
  {
    id: "tatsujin-sql",
    domain: "rdb",
    title: "達人に学ぶSQL徹底指南書 第2版",
    author: "ミック",
    amazonUrl: "https://www.amazon.co.jp/dp/4798157821?tag=taitech-22",
    description:
      "SQLの本質的な使い方と、インデックスが効くクエリの書き方を学べる。ウィンドウ関数など現代SQLも網羅。",
    topics: ["btree", "composite", "explain"],
  },
  {
    id: "sql-antipatterns",
    domain: "rdb",
    title: "SQLアンチパターン 第2版",
    author: "Bill Karwin",
    amazonUrl: "https://www.amazon.co.jp/dp/4814400748?tag=taitech-22",
    description:
      "実務でやりがちなSQL・DB設計のアンチパターンとその回避策を体系的に学べる。",
    topics: [
      "btree",
      "composite",
      "unique",
      "cost",
      "denormalization",
      "uniqueness",
      "referential-integrity",
      "recap",
    ],
  },
  {
    id: "postgres-internals",
    domain: "rdb",
    title: "[改訂3版]内部構造から学ぶPostgreSQL",
    author: "勝俣智成 ほか",
    amazonUrl: "https://www.amazon.co.jp/dp/4297132060?tag=taitech-22",
    description:
      "PostgreSQLの内部構造・ストレージ・インデックス機構を丁寧に解説。設計と運用計画の鉄則が学べる。",
    topics: [
      "btree",
      "hash",
      "clustered",
      "partial",
      "statistics",
      "atomicity",
      "durability",
      "concurrency",
    ],
  },
  {
    id: "ipa-db-specialist",
    domain: "rdb",
    title: "情報処理教科書 データベーススペシャリスト 2025年版",
    author: "三好康之",
    amazonUrl: "https://www.amazon.co.jp/dp/4798190934?tag=taitech-22",
    description:
      "IPAデータベーススペシャリスト試験の総合対策書。インデックス関連は本サイトと合わせて学ぶと理解が深まる。",
    topics: [
      "explain",
      "statistics",
      "cost",
      "covering",
      "partial",
      "functional-dependency",
      "keys",
      "1nf",
      "2nf",
      "3nf",
      "entity",
      "relationship",
      "cardinality",
      "optionality",
      "many-to-many",
      "weak-entity",
      "notation",
      "atomicity",
      "concurrency",
      "uniqueness",
      "referential-integrity",
      "durability",
      "recap",
    ],
  },
  {
    id: "db-jissen-nyumon",
    domain: "rdb",
    title: "理論から学ぶデータベース実践入門",
    author: "奥野幹也",
    amazonUrl: "https://www.amazon.co.jp/dp/4774171972?tag=taitech-22",
    description:
      "リレーショナルモデルの理論から、インデックス設計を含む実務で使えるSQLまで解説。",
    topics: [
      "clustered",
      "composite",
      "unique",
      "why",
      "functional-dependency",
      "1nf",
      "2nf",
      "3nf",
      "entity",
      "relationship",
      "cardinality",
      "weak-entity",
      "atomicity",
      "concurrency",
      "recap",
    ],
  },

  // --- 基本情報技術者試験 (FE) ---
  // topics の slug は `fe-playground` (/fe) / `fe-transpile` (/fe/transpile)
  // / `fe-lessons` (レッスン一覧) / `fe-{lesson slug}` (各レッスン)
  // / `fe-quiz` (練習問題)。
  {
    id: "fe-algo-pseudo-training",
    domain: "fe",
    title:
      "［改訂新版］基本情報技術者【科目B】アルゴリズム×擬似言語 トレーニングブック",
    author: "大滝みや子",
    asin: "4297142716",
    amazonUrl: "https://www.amazon.co.jp/dp/4297142716?tag=taitech-22",
    description:
      "擬似言語の記法の読み方から、トレースして答えを出すまでを一冊で通せる科目B特化本。手を動かして追う練習量を確保したいときの定番。",
    recommended: true,
    topics: [
      "fe-playground",
      "fe-transpile",
      "fe-lessons",
      "fe-quiz",
      "fe-variable",
      "fe-if",
      "fe-while",
      "fe-for",
      "fe-array",
      "fe-function",
    ],
  },
  {
    id: "fe-zero-algo-pseudo",
    domain: "fe",
    title: "基本情報技術者【科目B】ゼロからわかるアルゴリズムと擬似言語",
    author: "イエローテールコンピュータ／角谷一成",
    asin: "4297134470",
    amazonUrl: "https://www.amazon.co.jp/dp/4297134470?tag=taitech-22",
    description:
      "プログラミング未経験を前提に、記号の意味とアルゴリズムの考え方を最小単位から積み上げる入門書。変数や条件分岐で手が止まる段階に向く。",
    recommended: true,
    topics: [
      "fe-playground",
      "fe-lessons",
      "fe-variable",
      "fe-if",
      "fe-while",
      "fe-for",
      "fe-array",
      "fe-function",
    ],
  },
  {
    id: "fe-kamoku-b-juten",
    domain: "fe",
    title: "2025-2026 基本情報技術者 科目Bの重点対策",
    author: "富田良治",
    asin: "4865753273",
    amazonUrl: "https://www.amazon.co.jp/dp/4865753273?tag=taitech-22",
    description:
      "科目Bの出題パターンを網羅的に演習できる対策書。構文を理解した後、解法の型を身につける段階で効く。",
    topics: [
      "fe-playground",
      "fe-lessons",
      "fe-quiz",
      "fe-if",
      "fe-while",
      "fe-for",
      "fe-array",
      "fe-function",
    ],
  },
  {
    id: "fe-deru-tokodake-b",
    domain: "fe",
    title: "情報処理教科書 出るとこだけ！基本情報技術者［科目B］第4版",
    author: "橋本祐史",
    asin: "4798182524",
    amazonUrl: "https://www.amazon.co.jp/dp/4798182524?tag=taitech-22",
    description:
      "科目Bの出題範囲を絞り込んだ薄型の対策書。頻出アルゴリズムと情報セキュリティを短期間で一周したいときに。",
    topics: [
      "fe-playground",
      "fe-lessons",
      "fe-quiz",
      "fe-if",
      "fe-while",
      "fe-for",
      "fe-array",
      "fe-function",
    ],
  },
  {
    id: "fe-kitami-r08",
    domain: "fe",
    title: "キタミ式イラストIT塾 基本情報技術者 令和08年",
    author: "きたみりゅうじ",
    asin: "4297153017",
    amazonUrl: "https://www.amazon.co.jp/dp/4297153017?tag=taitech-22",
    description:
      "イラスト主体で科目Aの全範囲を通読できる入門書。用語の土台を作ってから科目Bのアルゴリズムに入ると理解が速い。",
    topics: ["fe-playground", "fe-lessons", "fe-transpile", "fe-variable"],
  },
  {
    id: "fe-kayanoki-r08",
    domain: "fe",
    title:
      "令和08年 イメージ＆クレバー方式でよくわかる かやのき先生の基本情報技術者教室",
    author: "栢木厚",
    asin: "4297152452",
    amazonUrl: "https://www.amazon.co.jp/dp/4297152452?tag=taitech-22",
    description:
      "科目Aの頻出テーマを図と語呂で押さえる入門書。参考書と問題集を兼ねるので初受験の一冊目に選びやすい。",
    topics: ["fe-playground", "fe-lessons", "fe-variable"],
  },
  {
    id: "fe-perfect-learning-r08",
    domain: "fe",
    title: "令和08年 基本情報技術者 パーフェクトラーニング過去問題集",
    author: "山本三雄",
    asin: "4297151340",
    amazonUrl: "https://www.amazon.co.jp/dp/4297151340?tag=taitech-22",
    description:
      "公開問題を大量に解いて仕上げるための問題集。擬似言語の読解に慣れた後、本番形式で時間配分を試す段階で使う。",
    topics: ["fe-playground", "fe-lessons", "fe-transpile", "fe-quiz"],
  },

  // --- 大学入学共通テスト「情報I」(joho1) ---
  // topics の slug は `joho1-playground` (/joho1) / `joho1-dncl` / `joho1-lessons`
  // / `joho1-{lesson slug}` / `joho1-quiz` / `joho1-transpile`。
  //
  // **数学・国語など他教科の共通テスト対策本は載せない**。アソシエイトは
  // クリック後 24 時間の購入が対象になるので、他教科の本は「並べなくても
  // 買われれば計上される」。並べて得られるのは収益ではなく、
  // 関連性の低下による CTR 減とトピックの薄まりだけ。
  // 情報I 以外に広げない方針そのものは 00-overview.md §4-4 と同じ。
  {
    id: "joho1-programming-drill",
    domain: "joho1",
    title:
      "情報Ⅰ 大学入学共通テスト プログラミング問題対策 ステップアップで身に付く練習帳",
    author: "植垣新一",
    asin: "4297142406",
    amazonUrl: "https://www.amazon.co.jp/dp/4297142406?tag=taitech-22",
    description:
      "共通テストのプログラミング問題だけを切り出して、易しい順に手を動かして解く練習帳。本サイトのシミュレーターで動かしながら読むと、紙の上で止まっていた処理の流れが追えるようになる。",
    recommended: true,
    topics: [
      "joho1-playground",
      "joho1-dncl",
      "joho1-lessons",
      "joho1-quiz",
      "joho1-transpile",
      "joho1-variable",
      "joho1-if",
      "joho1-loop",
      "joho1-loop-while",
      "joho1-array",
      "joho1-function",
    ],
  },
  {
    id: "joho1-kimeru",
    domain: "joho1",
    title: "きめる!共通テスト 情報I (きめる!共通テストシリーズ)",
    author: "藤原進之介",
    asin: "4053058031",
    amazonUrl: "https://www.amazon.co.jp/dp/4053058031?tag=taitech-22",
    description:
      "会話形式で情報Iの全範囲を通読できる講義型の参考書。プログラミングだけでなく情報デザインやデータ活用まで一冊で押さえたいときの土台になる。",
    recommended: true,
    topics: [
      "joho1-playground",
      "joho1-dncl",
      "joho1-lessons",
      "joho1-variable",
      "joho1-if",
      "joho1-loop",
      "joho1-loop-while",
      "joho1-array",
      "joho1-function",
    ],
  },
  {
    id: "joho1-kakomon-2027",
    domain: "joho1",
    title:
      "2027年版 情報Ⅰ 大学入学共通テスト対策 演習&過去問題集 動画付きでよくわかる",
    author: "植垣新一",
    asin: "4295024074",
    amazonUrl: "https://www.amazon.co.jp/dp/4295024074?tag=taitech-22",
    description:
      "試作問題と本試験を収録した過去問演習書。構文が読めるようになった後、本番の分量と時間配分に慣れる段階で効く。",
    topics: [
      "joho1-playground",
      "joho1-quiz",
      "joho1-lessons",
      "joho1-transpile",
    ],
  },
  {
    id: "joho1-jissen-taisaku",
    domain: "joho1",
    title: "大学入学共通テスト情報Ⅰ実戦対策問題集",
    author: "嶋田香",
    asin: "4010352620",
    amazonUrl: "https://www.amazon.co.jp/dp/4010352620?tag=taitech-22",
    description:
      "テーマ別に問題を積み上げる実戦形式の問題集。分野ごとに弱点を潰していきたいときに使いやすい。",
    topics: ["joho1-quiz", "joho1-lessons", "joho1-array", "joho1-loop"],
  },
  {
    id: "joho1-ichimon-ittou",
    domain: "joho1",
    title: "大学入学共通テスト 情報Iの点数が面白いほどとれる一問一答",
    author: "植垣新一",
    asin: "4046073888",
    amazonUrl: "https://www.amazon.co.jp/dp/4046073888?tag=taitech-22",
    description:
      "用語と知識を一問一答で高速に確認できる副読本。プログラム表記の読解とは別に、暗記で取れる部分を切り離して固めたいときに。",
    topics: ["joho1-dncl", "joho1-lessons", "joho1-quiz"],
  },
  {
    id: "joho1-kougi-keishiki",
    domain: "joho1",
    title: "講義形式で学ぶ「情報Ⅰ」大学入学共通テスト問題集",
    author: "能城茂雄",
    asin: "4469273015",
    amazonUrl: "https://www.amazon.co.jp/dp/4469273015?tag=taitech-22",
    description:
      "問題を解いた後に講義で考え方を補う構成の問題集。解答の丸暗記ではなく「なぜそう読むか」を残したい人向け。",
    topics: ["joho1-quiz", "joho1-playground", "joho1-function"],
  },
];

/**
 * topic に関連する書籍を「マッチしたもの → それ以外」の順で返す。
 * domain は必ず絞る (RDB のページに FE 参考書が混ざるのを防ぐ)。
 * limit を渡すと先頭 n 件だけに切り詰める。
 */
export function booksForTopic(
  slug: string,
  { domain = "rdb", limit }: { domain?: BookDomain; limit?: number } = {},
): Book[] {
  const byRecommended = (a: Book, b: Book) =>
    Number(Boolean(b.recommended)) - Number(Boolean(a.recommended));
  const pool = books.filter((b) => b.domain === domain);
  const matching = pool.filter((b) => b.topics.includes(slug)).sort(byRecommended);
  const rest = pool.filter((b) => !b.topics.includes(slug)).sort(byRecommended);
  const ordered = [...matching, ...rest];
  return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
}
