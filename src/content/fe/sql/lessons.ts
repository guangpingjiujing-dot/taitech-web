export type SqlLessonSlug =
  | "select"
  | "where"
  | "join"
  | "aggregate"
  | "group-by"
  | "subquery"
  | "set-ops"
  | "dml"
  | "ddl-constraints"
  | "view"
  | "grant"
  | "cursor";

export interface SqlLessonMeta {
  slug: SqlLessonSlug;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  /** 一覧カード用の 1 行要約 */
  cardSummary: string;
  definition: string;
  keywords: string[];
  /** 埋め込み Playground の初期 SQL。解説のみのレッスンは null */
  sampleSql: string | null;
  /** 埋め込み Playground が使うデータセット */
  datasetKey: "shohin-zaiko" | "jugyoin";
  /**
   * 実行できるか。GRANT とカーソルは試験範囲だが実行対象外なので false
   * (docs/wip/20260815-fe-sql/00-overview.md §5-5)。
   */
  runnable: boolean;
}

export const sqlLessons: readonly SqlLessonMeta[] = [
  {
    slug: "select",
    order: 1,
    title: "SELECT 文の基本 — 射影と重複の除去",
    shortTitle: "SELECT の基本",
    description:
      "基本情報技術者試験で問われる SELECT 文の基本。列の取り出し（射影）、* の意味、AS による相関名、DISTINCT による重複除去を、ブラウザで実行しながら理解する。",
    cardSummary: "列の取り出し・* の展開・AS による別名・DISTINCT",
    definition:
      "SELECT 文は「どの表から (FROM)、どの行を (WHERE)、どの列を (SELECT) 取り出すか」を書く。列を選ぶ操作を関係代数では射影と呼ぶ。DISTINCT を付けると結果から重複行が取り除かれる。",
    keywords: ["基本情報", "SQL", "SELECT", "射影", "DISTINCT", "相関名", "AS"],
    sampleSql: `SELECT 商品番号, 商品名, 単価
FROM 商品`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "where",
    order: 2,
    title: "WHERE 句 — 条件で行を絞り込む",
    shortTitle: "WHERE で絞り込む",
    description:
      "SQL の WHERE 句で行を絞り込む方法。AND・OR・NOT、BETWEEN、IN、LIKE のパターン文字列、IS NULL による NULL の判定までを実行しながら確認する。",
    cardSummary: "AND / OR / NOT・BETWEEN・IN・LIKE・IS NULL",
    definition:
      "WHERE 句は表の各行を 1 行ずつ評価し、条件が真になる行だけを残す。行を選ぶこの操作を関係代数では選択と呼ぶ。NULL との比較は真でも偽でもなく不定 (UNKNOWN) になり、行は残らない。",
    keywords: [
      "基本情報", "SQL", "WHERE", "選択", "BETWEEN", "IN", "LIKE",
      "パターン文字列", "IS NULL", "NULL",
    ],
    sampleSql: `SELECT 商品名, 単価
FROM 商品
WHERE 単価 BETWEEN 100 AND 300`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "join",
    order: 3,
    title: "表の結合 — 内部結合と外部結合",
    shortTitle: "表の結合",
    description:
      "複数の表を組み合わせる結合の書き方。過去問で最も多い FROM A, B WHERE の旧式結合と INNER JOIN の対応、LEFT / RIGHT OUTER JOIN で消える行と残る行の違いを実行して確かめる。",
    cardSummary: "旧式のカンマ結合・INNER JOIN・外部結合で残る行",
    definition:
      "結合は複数の表を共通する列の値で組み合わせる操作。条件を書かないとすべての組み合わせ（直積）になる。内部結合は両方に対応する行がある組だけを返し、外部結合は片方にしか無い行も NULL を補って残す。",
    keywords: [
      "基本情報", "SQL", "結合", "JOIN", "内部結合", "外部結合", "直積",
      "INNER JOIN", "LEFT OUTER JOIN",
    ],
    sampleSql: `SELECT 商品.商品名, 在庫.倉庫, 在庫.在庫数
FROM 商品, 在庫
WHERE 商品.商品番号 = 在庫.商品番号`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "aggregate",
    order: 4,
    title: "集約関数 — COUNT・SUM・AVG・MAX・MIN",
    shortTitle: "集約関数",
    description:
      "SQL の集約関数 5 種の使い方。COUNT(*) と COUNT(列) の違い、NULL が集計から除かれる規則、対象が 0 件のときの戻り値をブラウザで実行して確認する。",
    cardSummary: "COUNT(*) と COUNT(列) の違い・NULL の扱い",
    definition:
      "集約関数は複数の行を 1 つの値にまとめる関数。COUNT は件数、SUM は合計、AVG は平均、MAX と MIN は最大・最小を返す。COUNT(*) 以外は NULL を無視して集計する。",
    keywords: [
      "基本情報", "SQL", "集約関数", "COUNT", "SUM", "AVG", "MAX", "MIN", "NULL",
    ],
    sampleSql: `SELECT COUNT(*), COUNT(給与), SUM(給与), AVG(給与)
FROM 従業員`,
    datasetKey: "jugyoin",
    runnable: true,
  },
  {
    slug: "group-by",
    order: 5,
    title: "GROUP BY と HAVING — WHERE との違い",
    shortTitle: "GROUP BY と HAVING",
    description:
      "GROUP BY でグループごとに集計する方法と、HAVING が WHERE と何が違うのか。評価順を段階ごとに見て、WHERE に集約関数を書けない理由と GROUP BY に無い列を取り出せない理由を理解する。",
    cardSummary: "グループ化と、WHERE では書けない条件をどこに書くか",
    definition:
      "GROUP BY は指定した列の値が等しい行を 1 つのグループにまとめ、集約関数はグループごとに計算される。HAVING はグループに対する絞り込みで、行に対する絞り込みである WHERE より後に評価される。",
    keywords: [
      "基本情報", "SQL", "GROUP BY", "HAVING", "WHERE", "グループ化", "集約",
    ],
    sampleSql: `SELECT 部門コード, COUNT(*), AVG(給与)
FROM 従業員
GROUP BY 部門コード
HAVING COUNT(*) >= 2`,
    datasetKey: "jugyoin",
    runnable: true,
  },
  {
    slug: "subquery",
    order: 6,
    title: "副問合せ — IN・EXISTS・相関副問合せ",
    shortTitle: "副問合せ",
    description:
      "SELECT の中に SELECT を書く副問合せ。IN と EXISTS の違い、外側の行を参照する相関副問合せ、そして NOT IN に NULL が混ざると 1 行も返らない有名な罠を実行して確認する。",
    cardSummary: "IN と EXISTS・相関副問合せ・NOT IN と NULL の罠",
    definition:
      "副問合せは SQL の中に入れ子で書く SELECT 文。外側の行の値を参照するものを相関副問合せと呼び、行ごとに評価し直される。EXISTS は結果が 1 行以上あれば真を返す。",
    keywords: [
      "基本情報", "SQL", "副問合せ", "サブクエリ", "IN", "EXISTS",
      "NOT EXISTS", "相関副問合せ",
    ],
    sampleSql: `SELECT 商品番号, 商品名
FROM 商品
WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "set-ops",
    order: 7,
    title: "集合演算 — UNION・EXCEPT・INTERSECT",
    shortTitle: "集合演算",
    description:
      "2 つの問合せ結果を集合として扱う演算。和 (UNION)、差 (EXCEPT)、積 (INTERSECT) と、関係代数の集合演算との対応、UNION と UNION ALL の違いを実行して確かめる。",
    cardSummary: "和・差・積と、UNION / UNION ALL の違い",
    definition:
      "集合演算は 2 つの問合せ結果を集合として組み合わせる。UNION は和、EXCEPT は差、INTERSECT は積を返す。列数と対応する列の型が揃っている必要があり、UNION ALL 以外は重複を取り除く。",
    keywords: [
      "基本情報", "SQL", "集合演算", "UNION", "EXCEPT", "INTERSECT", "和", "差", "積",
    ],
    sampleSql: `SELECT 商品番号 FROM 商品
EXCEPT
SELECT 商品番号 FROM 在庫`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "dml",
    order: 8,
    title: "INSERT・UPDATE・DELETE — 表を書き換える",
    shortTitle: "INSERT / UPDATE / DELETE",
    description:
      "データを追加・変更・削除する 3 つの命令。WHERE を書き忘れると全行が対象になること、UPDATE の右辺が更新前の値で評価されることを、実行前後の差分を見ながら確認する。",
    cardSummary: "3 つの DML と、WHERE を忘れたときの破壊力",
    definition:
      "INSERT は行の追加、UPDATE は既存行の値の変更、DELETE は行の削除を行う。UPDATE と DELETE で WHERE を省略すると、表のすべての行が対象になる。",
    keywords: [
      "基本情報", "SQL", "INSERT", "UPDATE", "DELETE", "DML", "データ操作言語",
    ],
    sampleSql: `UPDATE 商品
SET 単価 = 単価 * 2
WHERE 分類 = 'B'`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "ddl-constraints",
    order: 9,
    title: "CREATE TABLE と 4 つの制約",
    shortTitle: "表定義と制約",
    description:
      "CREATE TABLE による表の定義と、一意性制約・参照制約・検査制約・非NULL制約の 4 つ。制約に違反する操作を実際に実行して、どの行が弾かれるかを目で確認する。",
    cardSummary: "一意性・参照・検査・非NULL の 4 制約を実際に破ってみる",
    definition:
      "制約は表に入る値が満たすべき条件を宣言しておく仕組み。一意性制約は重複を、参照制約は存在しない親への参照を、検査制約は条件を満たさない値を、非NULL制約は NULL を、それぞれ拒否する。",
    keywords: [
      "基本情報", "SQL", "CREATE TABLE", "制約", "一意性制約", "参照制約",
      "検査制約", "非NULL制約", "主キー", "外部キー",
    ],
    sampleSql: `INSERT INTO 在庫 VALUES ('P99', 'W1', 5)`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "view",
    order: 10,
    title: "ビュー — 実表との違い",
    shortTitle: "ビュー",
    description:
      "CREATE VIEW で定義するビューと、実際にデータを持つ実表の違い。元の表を更新するとビューの内容も変わることを実行して確認し、ビューを使う利点を整理する。",
    cardSummary: "ビューはデータを持たない。元の表が変われば結果も変わる",
    definition:
      "ビューは問合せに名前を付けたもので、実際のデータは持たない仮想的な表。参照されるたびに定義された問合せが実行されるため、元の実表が変わるとビューの内容も変わる。",
    keywords: ["基本情報", "SQL", "ビュー", "VIEW", "実表", "CREATE VIEW"],
    sampleSql: `CREATE VIEW 高額商品 AS
  SELECT 商品番号, 商品名, 単価 FROM 商品 WHERE 単価 >= 200;

SELECT * FROM 高額商品`,
    datasetKey: "shohin-zaiko",
    runnable: true,
  },
  {
    slug: "grant",
    order: 11,
    title: "GRANT と REVOKE — アクセス権の制御",
    shortTitle: "GRANT とアクセス権",
    description:
      "データベースの利用者にアクセス権を与える GRANT と、取り消す REVOKE。基本情報で問われる書式と、権限の種類、WITH GRANT OPTION の意味を整理する。",
    cardSummary: "権限を与える・取り消す。実行はできないが出題は多い",
    definition:
      "GRANT は表やビューに対する操作の権限を利用者に与える命令。REVOKE はそれを取り消す。WITH GRANT OPTION を付けると、権限を与えられた利用者がさらに他の利用者へ同じ権限を与えられる。",
    keywords: [
      "基本情報", "SQL", "GRANT", "REVOKE", "アクセス権", "権限", "WITH GRANT OPTION",
    ],
    sampleSql: null,
    datasetKey: "shohin-zaiko",
    runnable: false,
  },
  {
    slug: "cursor",
    order: 12,
    title: "埋込みSQL とカーソル",
    shortTitle: "埋込みSQL とカーソル",
    description:
      "他のプログラム言語から SQL を使う親言語方式と、複数行の結果を 1 行ずつ処理するカーソル。DECLARE・OPEN・FETCH・CLOSE の流れと、なぜカーソルが必要になるのかを理解する。",
    cardSummary: "なぜ 1 行ずつ取り出す仕組みが必要になるのか",
    definition:
      "埋込みSQL は他のプログラム言語のソースに SQL を直接書く方式。カーソルは複数行の問合せ結果に位置を持たせ、FETCH で 1 行ずつ取り出して変数に受け取る仕組み。",
    keywords: [
      "基本情報", "SQL", "埋込みSQL", "カーソル", "CURSOR", "FETCH",
      "親言語方式", "会話型SQL", "モジュール言語",
    ],
    sampleSql: null,
    datasetKey: "shohin-zaiko",
    runnable: false,
  },
];

export function findSqlLesson(slug: string): SqlLessonMeta | undefined {
  return sqlLessons.find((l) => l.slug === slug);
}

export function sqlLessonNeighbors(slug: SqlLessonSlug): {
  prev: SqlLessonMeta | null;
  next: SqlLessonMeta | null;
} {
  const index = sqlLessons.findIndex((l) => l.slug === slug);
  return {
    prev: index > 0 ? sqlLessons[index - 1] : null,
    next: index >= 0 && index < sqlLessons.length - 1 ? sqlLessons[index + 1] : null,
  };
}
