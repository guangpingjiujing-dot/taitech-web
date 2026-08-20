/**
 * 書籍の対象領域。ページ側は自分の領域だけを表示する
 * (FE 擬似言語のレッスンに DB 設計本が並ばないようにするため)。
 *
 * `itpassport` / `python` は **まだ対応するトピックページが無い領域**。
 * `booksForTopic` からは呼ばれず、`/books` (書籍まとめページ) からのみ参照される。
 * 領域を作らず既存の domain に混ぜると、RDB や FE のページに畑違いの本が
 * 並ぶことになるので、ページが無い段階でも領域は分けておく。
 */
export type BookDomain = "rdb" | "fe" | "joho1" | "itpassport" | "python";

/**
 * `/books` の詳細紹介。**棚に載せる本だけが持つ。**
 *
 * `description` はカード 1 枚に収まる 1 行サマリ (トピックページでも使う) で、
 * こちらは「買う前に知りたいこと」を書く場所。**両者で同じことを書かない。**
 *
 * `caution` は必ず埋める。**弱点を書かない紹介文は信用されない**し、
 * 「向かない人」を先に弾いた方が、結果的に読んだ人の満足度も転換率も上がる。
 */
export type BookDetail = {
  publisher: string;
  /** 判型 (A5 / B5変形 など)。オライリーのように判型を出していない版元では省略 */
  format?: string;
  pages: number;
  /** ISO 8601 の日付。表示は呼び出し側で整形する */
  published: string;
  /** 付属アプリ・特典・訳者など、購入判断に効く補足 */
  extras?: string;
  /** こんな人向け */
  forWho: string;
  /** 何が載っているか (章構成) */
  contents: string;
  /** どう使うか */
  howToUse: string;
  /** 注意点・向かないケース */
  caution: string;
};

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
  detail?: BookDetail;
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
    detail: {
      publisher: "翔泳社",
      format: "A5",
      pages: 392,
      published: "2024-08-28",
      forWho:
        "SQL は書けるようになったが、テーブルの切り方に自信がない人。DB エンジニアを目指す人、入門レベルから一歩進みたい若手 DBA・アプリ開発者を想定して書かれている。",
      contents:
        "全 9 章 + 付録。データベースとシステム → 論理設計と物理設計 → 正規化の基礎 → ER 図 → 正規化とパフォーマンスのトレードオフ → パフォーマンス → 設計のアンチパターン → グレーゾーンの設計 → 木構造の扱い。付録に演習問題の解答。",
      howToUse:
        "正規化・ER 図・トレードオフを扱う 3〜5 章が本体で、ここだけ先に読んでも元は取れる。アンチパターンの章は、自分が実際に書いたテーブル定義を横に置いて読むと刺さり方が変わる。",
      caution:
        "SQL の書き方そのものは扱わない。SELECT や JOIN が書けない段階で開くと前提知識が足りず、読み進められずに止まる。",
    },
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
      "isolation-levels",
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
      "isolation-levels",
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
      "isolation-levels",
      "recap",
    ],
  },
  {
    id: "sukkiri-sql",
    domain: "rdb",
    title: "スッキリわかるSQL入門 第4版 ドリル256問付き！",
    author: "中山清喬／飯田理恵子",
    asin: "4295018465",
    amazonUrl: "https://www.amazon.co.jp/dp/4295018465?tag=taitech-22",
    description:
      "ドリル 256 問を実際に打ちながら進める SQL の入門書。付属のブラウザ環境で演習できるので、SELECT から結合・集約までを環境構築で止まらずに通せる。",
    recommended: true,
    topics: ["why", "recap"],
    detail: {
      publisher: "インプレス",
      format: "A5",
      pages: 528,
      published: "2024-02-05",
      extras: "ドリル 256 問 / 購入者特典のクラウド演習環境「dokoQL」",
      forWho:
        "これから SQL を書き始める人。とくに、環境構築でつまずいて学習が止まった経験がある人。",
      contents:
        "Chapter 0 でデータベースの前提を押さえたうえで、第I部「SQL を始めよう」→ 第II部「SQL を使いこなそう」→ 第III部「データベースの知識を深めよう」→ 第IV部「データベースで実現しよう」の 4 部構成。付録に簡易リファレンス、エラー解決、ドリル、第4版で追加された「SQL によるデータ分析入門」。",
      howToUse:
        "読むだけで終わらせず、dokoQL に同じ SQL を打ち込みながら進める。ドリルは 1 周目で全問やる必要はなく、詰まった構文だけ後から戻って潰す使い方でよい。",
      caution:
        "入門書なので、実行計画やインデックス設計といったパフォーマンスの話はほとんど出てこない。速い SQL を書く話は次の段階の本で補う。",
    },
  },
  {
    id: "sql-jissen-nyumon",
    domain: "rdb",
    title: "SQL実践入門 ── 高速でわかりやすいクエリの書き方",
    author: "ミック",
    asin: "4774173010",
    amazonUrl: "https://www.amazon.co.jp/dp/4774173010?tag=taitech-22",
    description:
      "「なぜこの書き方が速いのか」を実行計画から説明する一冊。条件分岐・集約・結合・更新のそれぞれで、良い書き方と悪い書き方を対比しながら読める。",
    topics: ["explain", "cost", "statistics", "btree", "composite", "covering"],
  },

  // --- 基本情報技術者試験 (FE) ---
  // topics の slug は `fe-playground` (/fe ハブ と /fe/algorithm で共用)
  // / `fe-transpile` (/fe/algorithm/transpile)
  // / `fe-lessons` (レッスン一覧) / `fe-{lesson slug}` (各レッスン)
  // / `fe-quiz` (練習問題) / `fe-sql` (/fe/sql)。
  //
  // **`fe-sql` を付けるのは科目 A も扱う総合対策書だけ。** 科目 B 特化の
  // アルゴリズム本に付けると、SQL のページに擬似言語の本が並ぶ。
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
    // 2023 年の初版 (4297134470) を指していたのを 2025-02 の改訂新版に差し替え。
    // 表紙が似ていて取り違えやすいので、detail.caution でも読者に注意喚起している
    title: "［改訂新版］基本情報技術者【科目B】ゼロからわかるアルゴリズムと擬似言語",
    author: "イエローテールコンピュータ／角谷一成",
    asin: "4297147548",
    amazonUrl: "https://www.amazon.co.jp/dp/4297147548?tag=taitech-22",
    description:
      "プログラミング未経験を前提に、記号の意味とアルゴリズムの考え方を最小単位から積み上げる入門書。変数や条件分岐で手が止まる段階に向く。",
    recommended: true,
    detail: {
      publisher: "技術評論社",
      format: "A5",
      pages: 304,
      published: "2025-02-12",
      extras: "フルカラー",
      forWho:
        "プログラミング言語を書いた経験がないまま科目B に入る人。科目B の大半を占めるアルゴリズム・プログラミング（擬似言語）領域に特化している。",
      contents:
        "全 9 章。アルゴリズム・はじめの一歩 → 擬似言語のルール → 擬似言語プログラムの基本 → 試験問題への対応 → 仕様があいまいな擬似言語文法 → オブジェクト指向プログラミング → データ構造とアルゴリズム → 探索と整列 → 数理と情報に関するアルゴリズム、と積み上げる。",
      howToUse:
        "1〜3 章で記法を身につけ、4 章以降で試験問題の形に慣れる。紙の上で処理を追いきれない章は、同じプログラムを実行シミュレーターに写して 1 行ずつ動かすと、どこで認識がずれていたかがはっきりする。",
      caution:
        "2023 年の初版ではなく、2025 年 2 月の［改訂新版］を選ぶこと。タイトルも表紙も似ているので取り違えやすい。",
    },
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
    recommended: true,
    topics: ["fe-playground", "fe-lessons", "fe-transpile", "fe-variable", "fe-sql"],
    detail: {
      publisher: "技術評論社",
      format: "A5",
      pages: 888,
      published: "2025-12-03",
      extras: "過去問アプリ「DEKIDAS.WEB」/ 令和08年版から科目B対策の項目を追加",
      forWho:
        "科目A の広い出題範囲を、用語の暗記ではなく仕組みの理解で押さえたい人。プログラミング未経験でも読み進められる。",
      contents:
        "すべての解説がイラストベースで進む。2 進数や CPU の動きのように、文章だけでは像を結びにくい部分を図で見せる構成。令和08年版では科目B 対策の項目も追加された。",
      howToUse:
        "1 冊目として通読し、科目A の土台を作る。ここを済ませてから科目B のアルゴリズムに入ると、擬似言語そのもの以前に問題文の用語で引っかかる回数が目に見えて減る。",
      caution:
        "888 ページある。分厚さで挫折しそうなら、同じ版元の「かやのき先生の基本情報技術者教室」のような薄い入門書に替えてもよい。",
    },
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
    topics: ["fe-playground", "fe-lessons", "fe-variable", "fe-sql"],
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
    topics: ["fe-playground", "fe-lessons", "fe-transpile", "fe-quiz", "fe-sql"],
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

  // --- IT パスポート試験 ---
  // 対応するトピックページはまだ無く、`/books` からのみ参照される (BookDomain のコメント参照)。
  //
  // **年度表記のある本は、年度が変わったら差し替える。** 旧年度版はシラバス改訂
  // (生成AI・データサイエンス分野の追加など) に追従しておらず、すすめると実害が出る。
  {
    id: "ipa-pass-goukaku-kyohon-r08",
    domain: "itpassport",
    title: "令和08年 ITパスポート 合格教本",
    author: "岡嶋裕史",
    asin: "4297152355",
    amazonUrl: "https://www.amazon.co.jp/dp/4297152355?tag=taitech-22",
    description:
      "試験範囲を文章で通して理解したい人向けの定番テキスト。用語を身近な例に置き換えて説明し、各項目に試験でのポイントが付く。過去問アプリつき。",
    recommended: true,
    topics: [],
    detail: {
      publisher: "技術評論社",
      format: "A5",
      pages: 512,
      published: "2025-11-25",
      extras: "シラバス Ver.6.4 対応 / 過去問アプリ「DEKIDAS-WEB」(2,800 問)",
      forWho:
        "講義を聞くように、文章で最初から最後まで理解しながら進めたい人。用語を丸暗記するのが苦手なタイプに向く。",
      contents:
        "全 6 章。企業活動 → 経営戦略 → システム開発 → コンピュータのしくみ → ネットワークとセキュリティ → データベースと表計算ソフト。ストラテジ系から入ってテクノロジ系で終わる並び。",
      howToUse:
        "まず 6 章を通読して全体像を作り、そのあとは付属の DEKIDAS-WEB で演習する。紙面は解説に寄せてあるぶん、2,800 問のアプリが実質の問題集になる。",
      caution:
        "512 ページを読み切る前提の本。試験まで 2〜3 週間しかない状態から始めるなら、下の「いちばんやさしい」の方が現実的。",
    },
  },
  {
    id: "ipa-pass-ichiban-yasashii-r08",
    domain: "itpassport",
    title: "【令和8年度】いちばんやさしい ITパスポート 絶対合格の教科書＋出る順問題集",
    author: "高橋京介",
    asin: "4815638209",
    amazonUrl: "https://www.amazon.co.jp/dp/4815638209?tag=taitech-22",
    description:
      "教科書と出る順の問題集が 1 冊にまとまっていて、読む → 解くを行き来しやすい。IT の前提知識ゼロから始める人が 1 冊目に選びやすい構成。",
    recommended: true,
    topics: [],
    detail: {
      publisher: "SBクリエイティブ",
      format: "A5",
      pages: 608,
      published: "2025-11-28",
      extras: "頻出過去問 257 問収録 / 赤シート付属 / 読者専用サイトの質問サポート",
      forWho:
        "1 冊で教科書と問題演習を完結させたい人。IT の知識がまったくない学生・新社会人が最初に開く本として作られている。",
      contents:
        "序章 + 全 15 章。企業活動・法務・経営戦略・システム戦略・開発技術・プロジェクトマネジメント・サービスマネジメント・基礎理論・コンピュータシステム・ハードウェア・ソフトウェア・データベース・ネットワーク・情報セキュリティを、頻出の過去問 257 問と対応させて並べている。生成 AI 関連の用語にも対応。",
      howToUse:
        "章を読んだらその場で出る順の問題を解く、を 15 章ぶん繰り返す。赤シートで用語を隠せるので、2 周目以降は暗記チェックとして回せる。",
      caution:
        "イラストと図を厚く使って読みやすくしているぶん、一つひとつの仕組みの掘り下げは合格教本より控えめ。技術の背景まで理解したいなら合格教本を選ぶ。",
    },
  },

  // --- Python ---
  // 対応するトピックページはまだ無く、`/books` からのみ参照される。
  {
    id: "python-1nensei",
    domain: "python",
    title: "Python1年生 第2版 体験してわかる！会話でまなべる！プログラミングのしくみ",
    author: "森巧尚",
    asin: "4798170380",
    amazonUrl: "https://www.amazon.co.jp/dp/4798170380?tag=taitech-22",
    description:
      "会話形式で進む超入門書。プログラミング自体が初めてで、環境構築や用語の段階で止まってしまう人が最初に手を付けやすい。",
    recommended: true,
    topics: [],
    detail: {
      publisher: "翔泳社",
      format: "B5変形",
      pages: 200,
      published: "2022-08-04",
      extras: "Windows 11 / Python 3.10 に対応",
      forWho:
        "プログラミング自体が初めての人。過去に用語や環境構築の段階で止まった経験がある人。",
      contents:
        "ヤギ博士とふたばちゃんの会話で進む全 5 章。Python で何ができるか → Python を触ってみよう → プログラムの基本を知ろう → アプリを作ってみよう → 人工知能と遊んでみよう。よくあるエラーの対処も載っている。",
      howToUse:
        "200 ページと薄いので、まず 1 週間で通す。目的は「自分の書いたコードが動いた」状態を作ることで、文法を覚え切ることではない。",
      caution:
        "2022 年の本で、扱う Python は 3.10 世代。入門の範囲では困らないが、最新の文法や周辺ツールの情報は期待しない方がよい。",
    },
  },
  {
    id: "python-taikutsu",
    domain: "python",
    title: "退屈なことはPythonにやらせよう 第2版 ―ノンプログラマーにもできる自動化処理プログラミング",
    author: "Al Sweigart",
    asin: "4873119278",
    amazonUrl: "https://www.amazon.co.jp/dp/4873119278?tag=taitech-22",
    description:
      "Excel・PDF・Web・メールなどの手作業を自動化しながら文法を覚える構成。作りたいものが具体的にある人ほど手が止まりにくい。",
    recommended: true,
    topics: [],
    detail: {
      publisher: "オライリー・ジャパン",
      pages: 744,
      published: "2023-03-25",
      extras: "訳: 相川愛三 / 第2版で Gmail・Google スプレッドシートの操作を追加",
      forWho:
        "自動化したい手作業が具体的にある人。Python を職業プログラマーの道具としてではなく、自分の作業を減らす道具として使いたい人。",
      contents:
        "2 部構成。第I部の 6 章で Python の基本・フロー制御・関数・リスト・辞書・文字列操作を押さえ、第II部の 14 章で正規表現・入力検証・ファイル操作・Web スクレイピング・Excel・PDF・Word・メール送信・画像処理・GUI 自動化まで進む。",
      howToUse:
        "第I部は通して読み、第II部は自分が自動化したい章だけ拾う。744 ページを頭から順に読み切る本ではない。",
      caution:
        "「動けばよい」方向に振った本で、設計やコードの書き方の作法は扱わない。読みやすいコードを書きたくなった段階では別の本が要る。",
    },
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
