export type WhyNeedRdbTopic = {
  section: "why-need-rdb";
  slug: string;
  path: string;
  title: string;
  shortTitle: string;
  level: "basic" | "advanced";
  summary: string;
  definition: string;
  keywords: string[];
  /** SEO 用: 指定時は <title> と OG title に使用（未指定なら shortTitle にフォールバック） */
  metaTitle?: string;
  /** SEO 用: 指定時は <meta description> と OG description に使用（未指定なら summary にフォールバック） */
  metaDescription?: string;
};

export const whyNeedRdbTopics: WhyNeedRdbTopic[] = [
  {
    section: "why-need-rdb",
    slug: "atomicity",
    path: "/why-need-rdb/atomicity",
    title: "注文だけが残った夜 (原子性)",
    shortTitle: "原子性",
    level: "basic",
    summary:
      "受注時に「注文追加 → 在庫減算」の 2 段階マクロを実行する Excel で、途中で止まって注文は記録されたが在庫が減らないままの中途半端な状態が積み重なった。この事故から、RDB のトランザクションが提供する「原子性 (atomicity)」を体系的に理解する。",
    definition:
      "原子性 (atomicity) とは、トランザクションに含まれる複数の更新操作が全て成功して確定される、または全てなかったことにされるのいずれかしか取らないという性質であり、部分的な適用による矛盾状態の発生を防ぐ ACID 特性の一つである。",
    keywords: [
      "原子性",
      "atomicity",
      "トランザクション",
      "ACID",
      "コミット",
      "ロールバック",
      "BEGIN",
      "COMMIT",
      "部分適用",
    ],
    metaTitle: "原子性とは｜Excel で注文だけが残った夜から理解",
    metaDescription:
      "受注マクロが途中で止まり注文だけ記録されて在庫が減らないままになった事故を題材に、RDB のトランザクションが提供する「原子性 (atomicity)」を解説。BEGIN/COMMIT/ROLLBACK と部分適用の防止を図解で理解する。",
  },
  {
    section: "why-need-rdb",
    slug: "concurrency",
    path: "/why-need-rdb/concurrency",
    title: "2 人が同時に書いて修正が消えた (同時実行制御)",
    shortTitle: "同時実行制御",
    level: "basic",
    summary:
      "経理担当 A と担当 B が同じ売上シートを開いて別々の修正を保存した結果、後に保存した側が先の修正を上書きして消してしまった (Lost Update)。RDB のロックと分離レベルによる同時実行制御を、この事故から学ぶ。",
    definition:
      "同時実行制御 (concurrency control) とは、複数のトランザクションが同時に実行される場合に、それらが直列に実行された時と同等の結果を保証するため、ロック・タイムスタンプ・多版同時実行制御 (MVCC) などの手法によって競合を調停する仕組みである。",
    /*
     * `分離レベル` / `isolation level` は **意図的に外してある**。
     * `/why-need-rdb/isolation-levels` を新設した際に、狙うクエリが混ざって
     * 自サイト内でカニバるのを防ぐため (判断は docs/wip/20260818-isolation-levels §2)。
     * このページは「事故ストーリー (Lost Update)」担当で、分離レベルの本体は向こうが持つ。
     * MVCC は同時実行制御の手段の話なのでここに残す。
     */
    keywords: [
      "同時実行制御",
      "排他制御",
      "concurrency control",
      "ロック",
      "MVCC",
      "Lost Update",
      "デッドロック",
    ],
    metaTitle: "同時実行制御とは｜Excel で修正が消えた事故で理解",
    metaDescription:
      "同じシートを 2 人が同時に編集した結果、後保存が先を上書きした事故 (Lost Update) を起点に、RDB のロック / 分離レベル / MVCC による同時実行制御を図解で解説。",
  },
  {
    section: "why-need-rdb",
    slug: "isolation-levels",
    path: "/why-need-rdb/isolation-levels",
    title: "トランザクション分離レベルと 3 つの読み取り異常",
    shortTitle: "分離レベル",
    level: "advanced",
    summary:
      "READ UNCOMMITTED / READ COMMITTED / REPEATABLE READ / SERIALIZABLE の 4 段階が、ダーティリード・ノンリピータブルリード・ファントムリードのどれを防ぐのか。2 つのトランザクションをステップ実行し、分離レベルを切り替えると同じ操作列で見え方が変わる様子を確かめながら理解する。",
    definition:
      "トランザクション分離レベル (isolation level) とは、並行実行されるトランザクションが互いの未確定・確定済みの変更をどこまで観測しうるかを規定する設定であり、SQL 標準では許容する読み取り異常の種類によって READ UNCOMMITTED / READ COMMITTED / REPEATABLE READ / SERIALIZABLE の 4 段階が定義されている。",
    keywords: [
      "トランザクション分離レベル",
      "分離レベル",
      "isolation level",
      "ダーティリード",
      "ノンリピータブルリード",
      "ファントムリード",
      "phantom read",
      "READ COMMITTED",
      "REPEATABLE READ",
      "SERIALIZABLE",
    ],
    metaTitle: "トランザクション分離レベルとは｜4 段階を図解",
    metaDescription:
      "分離レベルの 4 段階が、ダーティリード / ノンリピータブルリード / ファントムリードのどれを防ぐのかを、2 つのトランザクションのステップ実行で確かめられる。SQL 標準の定義と PostgreSQL・MySQL の実挙動の違いまで解説。",
  },
  {
    section: "why-need-rdb",
    slug: "uniqueness",
    path: "/why-need-rdb/uniqueness",
    title: "「山田太郎」の行が 4 つある (一意性)",
    shortTitle: "一意性",
    level: "basic",
    summary:
      "顧客管理シートに「山田太郎」の行が 4 つできてしまい、しかもそれぞれ違う連絡先。同一人物の再登録なのか、同姓同名の別人なのかシステム的に判定できない。この事故から、RDB の主キーと UNIQUE 制約による一意性の保証を理解する。",
    definition:
      "一意性制約 (unique constraint) とは、指定した列 (または列の組) の値がテーブル内で重複しないことを DBMS が構造的に保証する制約であり、主キーは NOT NULL と一意性を組み合わせた特殊な一意性制約として位置付けられる。",
    keywords: [
      "一意性",
      "unique 制約",
      "UNIQUE",
      "主キー",
      "primary key",
      "重複",
      "自然キー",
      "代理キー",
      "サロゲートキー",
    ],
    metaTitle: "UNIQUE 制約と主キーとは｜同名 4 行問題で理解する一意性",
    metaDescription:
      "同名顧客が 4 行できて同一人物の再登録か別人か判定できなくなった事故を題材に、RDB の主キー / UNIQUE 制約と代理キー (サロゲートキー) の選定基準を図解で解説。",
  },
  {
    section: "why-need-rdb",
    slug: "referential-integrity",
    path: "/why-need-rdb/referential-integrity",
    title: "顧客 ID が消えた注文シート (参照整合性)",
    shortTitle: "参照整合性",
    level: "basic",
    summary:
      "顧客シートで顧客 ID「C-999」の行を削除したのに、注文シートには「C-999」の注文が残ったまま。宛先が不明になった。この事故から、RDB の外部キー制約と CASCADE / RESTRICT / SET NULL の挙動を学ぶ。",
    definition:
      "参照整合性 (referential integrity) とは、あるテーブルの外部キー列の値が、参照先テーブルの主キーとして必ず存在すること (または NULL であること) を DBMS が保証する制約であり、孤立した参照や不整合な関連を構造的に排除する仕組みである。",
    keywords: [
      "参照整合性",
      "referential integrity",
      "外部キー",
      "foreign key",
      "FK",
      "CASCADE",
      "RESTRICT",
      "SET NULL",
      "孤立行",
    ],
    metaTitle: "外部キーと参照整合性とは｜顧客 ID 消失事故で理解",
    metaDescription:
      "顧客シートから顧客 ID を削除したら注文の宛先が不明になった事故を題材に、RDB の外部キー制約と CASCADE / RESTRICT / SET NULL による参照整合性の保証を図解で解説。",
  },
  {
    section: "why-need-rdb",
    slug: "durability",
    path: "/why-need-rdb/durability",
    title: "停電で全部消えた (永続性)",
    shortTitle: "永続性",
    level: "basic",
    summary:
      "深夜の停電から復電後、Excel を開くと当日の受注データがまるごと消えていた (最終保存は朝、以降 8 時間分が全滅)。この事故から、RDB の Write-Ahead Logging (WAL) と COMMIT 時のディスク同期による永続性を理解する。",
    definition:
      "永続性 (durability) とは、コミット済みトランザクションによる変更がシステム障害の発生後も失われずに保持される性質であり、多くの DBMS では変更操作のログを永続ストレージへ先行して同期書き込みする Write-Ahead Logging (WAL) によって実現される。",
    keywords: [
      "永続性",
      "durability",
      "WAL",
      "Write-Ahead Logging",
      "同期書き込み",
      "REDO",
      "UNDO",
      "ロールフォワード",
      "ロールバック",
      "クラッシュリカバリ",
      "ACID",
    ],
    metaTitle: "永続性と WAL とは｜停電で 8 時間消えた事故で理解",
    metaDescription:
      "停電で当日の作業がまるごと消えた事故を題材に、RDB の Write-Ahead Logging (WAL) と COMMIT 時の同期書き込みによる永続性 (durability) の保証、ロールフォワード / ロールバックの役割を図解で解説。",
  },
  {
    section: "why-need-rdb",
    slug: "recap",
    path: "/why-need-rdb/recap",
    title: "RDB が黙って守ってくれている 5 つの根本価値 (総括)",
    shortTitle: "RDB の 5 つの根本価値",
    level: "basic",
    summary:
      "5 つの事故から見えた「Excel には無くて RDB には有る」5 つの根本価値 (原子性 / 同時実行制御 / 一意性 / 参照整合性 / 永続性) を横断的にまとめる。ACID と宣言的制約が「なぜ RDB なのか」の答えである。",
    definition:
      "リレーショナルデータベース管理システム (RDBMS) とは、リレーショナルモデルに基づいてデータを表形式で管理し、トランザクションによる ACID 特性 (原子性・一貫性・分離性・永続性) と一意性・参照整合性などの宣言的制約を通じて、複数ユーザー環境でのデータ整合性を構造的に保証するデータ管理システムである。",
    keywords: [
      "RDBMS",
      "RDB とは",
      "リレーショナルデータベース",
      "ACID",
      "宣言的制約",
      "データ整合性",
      "なぜRDB",
      "RDB 必要性",
      "NoSQL 違い",
    ],
    metaTitle: "RDB とは｜ACID と制約が守る 5 つの根本価値を総括",
    metaDescription:
      "原子性・同時実行制御・一意性・参照整合性・永続性の 5 概念を横断的にまとめ、「なぜ RDB を選ぶのか」の答えを提示。NoSQL や表計算との使い分け判断の起点にもなる総括ページ。",
  },
];
