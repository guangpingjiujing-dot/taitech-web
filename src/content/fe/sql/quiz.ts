import type { SqlLessonSlug } from "@/content/fe/sql/lessons";
import type { ResultTable } from "@/lib/sql";
import { formatValue } from "@/lib/sql";

/**
 * 基本情報技術者試験 科目A データベース分野の SQL 練習問題。
 *
 * すべて **オリジナル問題**（IPA 公式過去問は転載しない）。
 * 過去問に出た構文パターンを踏まえつつ、表と値は作り直している
 * (docs/wip/20260815-fe-sql/00-overview.md §6)。
 *
 * **`expectedResult` を手で書かないこと。** `quiz.test.ts` が実際にエンジンへ
 * 通して検証している。問題を足すときはテストを走らせて確定させる。
 * （擬似言語の練習問題と同じ方針。`src/content/fe/quiz.ts` 参照）
 */

export type SqlQuizChoiceId = "ア" | "イ" | "ウ" | "エ";

export interface SqlQuizChoice {
  id: SqlQuizChoiceId;
  text: string;
}

export interface SqlQuizMeta {
  slug: string;
  order: number;
  lesson: SqlLessonSlug;
  /** result = 実行結果を答える / fill = 空欄に入る記述を選ぶ */
  kind: "result" | "fill";
  /** basic = レッスンを読めば解ける / exam = 本番の科目A 相当 */
  tier: "basic" | "exam";
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  /** 一覧カード用。答えを明かさずに「何を問うか」だけ書く */
  challenge: string;
  prompt: string;
  datasetKey: "shohin-zaiko" | "jugyoin";
  /** 出題する SQL。fill では空欄を [   ] で示す */
  sql: string;
  choices: SqlQuizChoice[];
  answer: SqlQuizChoiceId;
  explanation: string[];
  /** 誤答を誘う仕掛けの正体。1 行で言い切る */
  trap: string;
  /** fill のとき、正解で空欄を埋めた SQL */
  verifySql?: string;
  /** 実行結果を `formatSqlResult` で文字列化したもの */
  expectedResult: string;
}

/**
 * 結果表を選択肢と同じ形の文字列にする。
 * **テストと選択肢の両方がこの形式に依存している**ので、変えるときは両方を直す。
 */
export function formatSqlResult(table: ResultTable): string {
  const header = table.columns.map((c) => c.name).join(" | ");
  const rows = table.rows.map((r) => r.map(formatValue).join(" | "));
  return [header, ...rows].join("\n");
}

export const sqlQuizzes: readonly SqlQuizMeta[] = [
  {
    slug: "select-projection",
    order: 1,
    tier: "basic",
    lesson: "select",
    kind: "result",
    title: "WHERE で絞った結果を答える｜基本情報 SQL",
    shortTitle: "射影と選択",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。WHERE で行を絞り、SELECT で列を取り出す基本の形の実行結果を答える。",
    keywords: ["基本情報", "SQL", "練習問題", "SELECT", "WHERE", "射影"],
    challenge: "分類で絞って 2 列だけ取り出す",
    prompt: "「商品」表に対して次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: "SELECT 商品番号, 単価 FROM 商品 WHERE 分類 = 'B'",
    choices: [
      { id: "ア", text: "商品番号 | 単価\nP03 | 80\nP04 | 150" },
      { id: "イ", text: "商品番号 | 単価\nP01 | 120\nP02 | 200" },
      { id: "ウ", text: "商品番号 | 商品名 | 分類 | 単価\nP03 | 消しゴム | B | 80\nP04 | 定規 | B | 150" },
      { id: "エ", text: "商品番号 | 単価\nP03 | 80\nP04 | 150\nP05 | 500" },
    ],
    answer: "ア",
    explanation: [
      "WHERE 分類 = 'B' で、分類が B の行だけが残ります。「商品」表では消しゴム (P03) と定規 (P04) の 2 行です。",
      "SELECT に書いた列だけが結果に出るので、商品番号と単価の 2 列になります。ウは全列を出しているので誤りです。",
      "この「列を選ぶ」操作を射影、「行を選ぶ」操作を選択と呼びます。用語としてそのまま問われることがあります。",
    ],
    trap: "SELECT に書いていない列まで結果に含めてしまう",
    expectedResult: "商品番号 | 単価\nP03 | 80\nP04 | 150",
  },
  {
    slug: "between-boundary",
    order: 2,
    tier: "basic",
    lesson: "where",
    kind: "result",
    title: "BETWEEN は境界を含むか｜基本情報 SQL",
    shortTitle: "BETWEEN の境界",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。BETWEEN が指定した両端の値を含むかどうかを、実行結果から確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "BETWEEN", "WHERE", "境界"],
    challenge: "単価がちょうど境界の値の商品が含まれるか",
    prompt: "「商品」表に対して次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: "SELECT 商品名 FROM 商品 WHERE 単価 BETWEEN 100 AND 200",
    choices: [
      { id: "ア", text: "商品名\nボールペン\n定規" },
      { id: "イ", text: "商品名\nボールペン\nノート\n定規" },
      { id: "ウ", text: "商品名\nボールペン\nノート\n消しゴム\n定規" },
      { id: "エ", text: "商品名\nノート\n定規" },
    ],
    answer: "イ",
    explanation: [
      "BETWEEN 100 AND 200 は「100 以上 200 以下」で、両端を含みます。",
      "単価は ボールペン 120 / ノート 200 / 消しゴム 80 / 定規 150 / ホチキス 500 です。",
      "ノートはちょうど 200 なので含まれます。ここを「未満」と読むと ア を選んでしまいます。",
    ],
    trap: "BETWEEN の上限を「未満」と読み違える",
    expectedResult: "商品名\nボールペン\nノート\n定規",
  },
  {
    slug: "like-underscore",
    order: 3,
    tier: "basic",
    lesson: "where",
    kind: "result",
    title: "LIKE の _ と % の違い｜基本情報 SQL",
    shortTitle: "LIKE のワイルドカード",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。パターン文字列の _ が「ちょうど 1 文字」、% が「0 文字以上」であることを実行結果で確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "LIKE", "パターン文字列", "ワイルドカード"],
    challenge: "2 つの LIKE を AND でつないだときに残る行",
    prompt: "「商品」表に対して次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: "SELECT 商品番号 FROM 商品 WHERE 商品番号 LIKE 'P0_' AND 商品名 LIKE '%ル%'",
    choices: [
      { id: "ア", text: "商品番号\nP01" },
      { id: "イ", text: "商品番号\nP01\nP04" },
      { id: "ウ", text: "商品番号\nP01\nP02\nP03\nP04\nP05" },
      { id: "エ", text: "商品番号" },
    ],
    answer: "ア",
    explanation: [
      "'P0_' は「P0 の後にちょうど 1 文字」なので、P01〜P05 のすべてが該当します。ここだけでは絞り込めません。",
      "'%ル%' は「ル を含む」です。商品名は ボールペン / ノート / 消しゴム / 定規 / ホチキス で、「ル」を含むのはボールペン (P01) だけです。",
      "AND で両方を満たす必要があるので、結果は P01 の 1 行です。",
    ],
    trap: "「ノート」の長音符「ー」を「ル」と取り違える",
    expectedResult: "商品番号\nP01",
  },
  {
    slug: "join-matching-rows",
    order: 4,
    tier: "basic",
    lesson: "join",
    kind: "result",
    title: "結合と条件で残る行｜基本情報 SQL",
    shortTitle: "結合で残る行",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。FROM に 2 つの表を並べる旧式の結合で、結合条件と絞り込み条件の両方を満たす行を答える。",
    keywords: ["基本情報", "SQL", "練習問題", "結合", "内部結合", "JOIN"],
    challenge: "2 表を結合し、さらに在庫数で絞る",
    prompt:
      "「商品」表と「在庫」表に対して次の SQL を実行したとき、得られる結果は何行か。",
    datasetKey: "shohin-zaiko",
    sql: `SELECT 商品.商品名, 在庫.倉庫
FROM 商品, 在庫
WHERE 商品.商品番号 = 在庫.商品番号
  AND 在庫.在庫数 > 0`,
    choices: [
      { id: "ア", text: "2 行" },
      { id: "イ", text: "3 行" },
      { id: "ウ", text: "4 行" },
      { id: "エ", text: "20 行" },
    ],
    answer: "イ",
    explanation: [
      "まず結合条件で「商品」と「在庫」が対応する組だけが残ります。在庫表は 4 行なので、この時点で 4 行です。",
      "次に 在庫数 > 0 で絞ります。在庫表の P02/W1 は在庫数が 0 なので落ちます。",
      "結果は ボールペン/W1、ボールペン/W2、消しゴム/W2 の 3 行です。",
      "エの 20 行は、結合条件を書かなかった場合の直積 (5 × 4) の行数です。",
    ],
    trap: "在庫数 0 の行を「在庫がある」と数えてしまう",
    expectedResult: "商品.商品名 | 在庫.倉庫\nボールペン | W1\nボールペン | W2\n消しゴム | W2",
  },
  {
    slug: "cross-product-rows",
    order: 5,
    tier: "exam",
    lesson: "join",
    kind: "result",
    title: "結合条件を書き忘れると何行になるか｜基本情報 SQL",
    shortTitle: "直積の行数",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。FROM に表を並べただけで結合条件を書かないと直積になり、行数が積になることを確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "直積", "結合", "集合演算"],
    challenge: "結合条件の無い 2 表の問合せ",
    prompt:
      "「商品」表 (5 行) と「在庫」表 (4 行) に対して次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: "SELECT COUNT(*) FROM 商品, 在庫",
    choices: [
      { id: "ア", text: "COUNT(*)\n4" },
      { id: "イ", text: "COUNT(*)\n5" },
      { id: "ウ", text: "COUNT(*)\n9" },
      { id: "エ", text: "COUNT(*)\n20" },
    ],
    answer: "エ",
    explanation: [
      "FROM に表を並べただけで結合条件が無いので、すべての行の組み合わせ (直積) になります。",
      "5 行 × 4 行 = 20 行です。ウの 9 は足し算 (5 + 4) にしてしまった場合の値です。",
      "結合とは「直積を作ってから条件で絞ったもの」です。条件の書き忘れで行数が急に増えたら直積を疑ってください。",
    ],
    trap: "直積を「和」だと思って足してしまう",
    expectedResult: "COUNT(*)\n20",
  },
  {
    slug: "outer-join-null",
    order: 6,
    tier: "exam",
    lesson: "join",
    kind: "result",
    title: "外部結合で NULL になる行｜基本情報 SQL",
    shortTitle: "外部結合と NULL",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。LEFT OUTER JOIN で対応する行が無い場合に、どちら側の列が NULL になるかを実行結果で確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "外部結合", "LEFT OUTER JOIN", "NULL"],
    challenge: "在庫が登録されていない商品はどう出るか",
    prompt: "次の SQL を実行したとき、得られる結果は何行か。",
    datasetKey: "shohin-zaiko",
    sql: `SELECT 商品.商品番号, 在庫.倉庫
FROM 商品 LEFT OUTER JOIN 在庫
  ON 商品.商品番号 = 在庫.商品番号`,
    choices: [
      { id: "ア", text: "4 行" },
      { id: "イ", text: "5 行" },
      { id: "ウ", text: "6 行" },
      { id: "エ", text: "20 行" },
    ],
    answer: "ウ",
    explanation: [
      "在庫表と対応する行は 4 行あります (P01 が 2 件、P02 と P03 が 1 件ずつ)。",
      "LEFT OUTER JOIN は左の表の行を必ず残すので、在庫が無い P04 と P05 も倉庫を NULL にして残ります。",
      "4 + 2 = 6 行です。内部結合なら 4 行、商品表の行数なら 5 行ですが、P01 が 2 件に分かれるためどちらとも一致しません。",
    ],
    trap: "「左の表の行数と同じになる」と考えて 5 行を選ぶ",
    expectedResult:
      "商品.商品番号 | 在庫.倉庫\nP01 | W1\nP01 | W2\nP02 | W1\nP03 | W2\nP04 | NULL\nP05 | NULL",
  },
  {
    slug: "count-star-vs-column",
    order: 7,
    tier: "basic",
    lesson: "aggregate",
    kind: "result",
    title: "COUNT(*) と COUNT(列) の違い｜基本情報 SQL",
    shortTitle: "COUNT(*) と COUNT(列)",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。COUNT(*) は NULL を含む行数、COUNT(列) はその列が NULL でない行数であることを確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "COUNT", "集約関数", "NULL"],
    challenge: "給与が未設定の社員が 1 人いる表での件数",
    prompt:
      "「従業員」表 (7 行、うち 1 行は給与が NULL) に対して次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "jugyoin",
    sql: "SELECT COUNT(*), COUNT(給与) FROM 従業員",
    choices: [
      { id: "ア", text: "COUNT(*) | COUNT(給与)\n7 | 7" },
      { id: "イ", text: "COUNT(*) | COUNT(給与)\n7 | 6" },
      { id: "ウ", text: "COUNT(*) | COUNT(給与)\n6 | 6" },
      { id: "エ", text: "COUNT(*) | COUNT(給与)\n6 | 7" },
    ],
    answer: "イ",
    explanation: [
      "COUNT(*) は行数をそのまま数えるので、給与が NULL の行も含めて 7 です。",
      "COUNT(給与) は給与が NULL でない行だけを数えるので 6 です。",
      "「NULL を 0 として数える」のではなく「集計の対象から外す」のが SQL の規則です。",
    ],
    trap: "COUNT(列) が NULL も数えると思い込む",
    expectedResult: "COUNT(*) | COUNT(給与)\n7 | 6",
  },
  {
    slug: "avg-with-null",
    order: 8,
    tier: "exam",
    lesson: "aggregate",
    kind: "result",
    title: "AVG は NULL を分母に含めるか｜基本情報 SQL",
    shortTitle: "AVG と NULL",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。AVG が NULL の行を分母からも除くことを、COUNT(*) と並べた実行結果で確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "AVG", "集約関数", "NULL", "平均"],
    challenge: "2 人の部門で 1 人の給与が NULL のときの平均",
    prompt:
      "「従業員」表の D03 部門には 2 人が所属し、うち 1 人は給与が NULL、もう 1 人の給与は 300000 である。次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "jugyoin",
    sql: `SELECT 部門コード, COUNT(*), AVG(給与)
FROM 従業員
WHERE 部門コード = 'D03'
GROUP BY 部門コード`,
    choices: [
      { id: "ア", text: "部門コード | COUNT(*) | AVG(給与)\nD03 | 2 | 150000" },
      { id: "イ", text: "部門コード | COUNT(*) | AVG(給与)\nD03 | 2 | 300000" },
      { id: "ウ", text: "部門コード | COUNT(*) | AVG(給与)\nD03 | 1 | 300000" },
      { id: "エ", text: "部門コード | COUNT(*) | AVG(給与)\nD03 | 2 | NULL" },
    ],
    answer: "イ",
    explanation: [
      "COUNT(*) は行数なので 2 です。NULL の行も 1 行として数えます。",
      "AVG(給与) は NULL の行を集計対象から外します。**分子からも分母からも外す**ので、300000 ÷ 1 = 300000 です。",
      "アの 150000 は NULL を 0 として 2 で割った値で、SQL の挙動とは違います。ここが最も狙われる差です。",
      "エの NULL になるのは、対象の行がすべて NULL だった場合です。",
    ],
    trap: "NULL を 0 とみなして人数で割ってしまう",
    expectedResult: "部門コード | COUNT(*) | AVG(給与)\nD03 | 2 | 300000",
  },
  {
    slug: "having-group-count",
    order: 9,
    tier: "basic",
    lesson: "group-by",
    kind: "result",
    title: "HAVING で残るグループ｜基本情報 SQL",
    shortTitle: "HAVING で絞る",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。GROUP BY でできたグループを HAVING が絞り込むことを、実行結果の行数で確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "GROUP BY", "HAVING", "グループ化"],
    challenge: "2 人以上いる部門はいくつか",
    prompt:
      "「従業員」表 (7 行) に対して次の SQL を実行したとき、得られる結果は何行か。所属は D01 が 3 人、D02 が 2 人、D03 が 2 人である。",
    datasetKey: "jugyoin",
    sql: `SELECT 部門コード, COUNT(*)
FROM 従業員
GROUP BY 部門コード
HAVING COUNT(*) >= 2`,
    choices: [
      { id: "ア", text: "1 行" },
      { id: "イ", text: "3 行" },
      { id: "ウ", text: "4 行" },
      { id: "エ", text: "7 行" },
    ],
    answer: "イ",
    explanation: [
      "GROUP BY 部門コード で、従業員は D01 / D02 / D03 の 3 グループになります。",
      "HAVING COUNT(*) >= 2 はすべてのグループが満たすので、3 グループとも残ります。",
      "結果の行数は「グループの数」であって、元の行数 (7) ではありません。ウの 4 行は部門表の行数で、この SQL は部門表を参照していません。",
    ],
    trap: "結果の行数を元の表の行数だと思ってしまう",
    expectedResult: "部門コード | COUNT(*)\nD01 | 3\nD02 | 2\nD03 | 2",
  },
  {
    slug: "outer-join-count-column",
    order: 10,
    tier: "exam",
    lesson: "group-by",
    kind: "result",
    title: "外部結合と COUNT の組み合わせ｜基本情報 SQL",
    shortTitle: "外部結合と COUNT",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。外部結合で NULL が補われた行を COUNT(列) が数えないため、所属者ゼロの部門が 0 と出ることを確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "外部結合", "COUNT", "GROUP BY", "NULL"],
    challenge: "従業員が 1 人もいない部門はどう集計されるか",
    prompt:
      "「部門」表 (4 部門) と「従業員」表に対して次の SQL を実行したとき、監査室の行の値はどれか。監査室に所属する従業員はいない。",
    datasetKey: "jugyoin",
    sql: `SELECT 部門.部門名, COUNT(従業員.社員番号)
FROM 部門 LEFT OUTER JOIN 従業員
  ON 部門.部門コード = 従業員.部門コード
GROUP BY 部門.部門名`,
    choices: [
      { id: "ア", text: "監査室 | 0" },
      { id: "イ", text: "監査室 | 1" },
      { id: "ウ", text: "監査室 | NULL" },
      { id: "エ", text: "監査室 の行は出ない" },
    ],
    answer: "ア",
    explanation: [
      "LEFT OUTER JOIN なので、従業員がいない監査室も左の表の行として残ります。よってエは誤りです。",
      "このとき従業員側の列はすべて NULL になります。監査室のグループは「社員番号が NULL の 1 行」です。",
      "COUNT(社員番号) は NULL を数えないので 0 になります。ここで COUNT(*) と書くと、行としては 1 行あるので 1 になってしまいます。",
      "「所属者ゼロを 0 と出したい」ときに COUNT(*) ではなく COUNT(列) を使う理由がこれです。",
    ],
    trap: "COUNT(*) と COUNT(列) を同じだと思い、1 を選ぶ",
    expectedResult:
      "部門.部門名 | COUNT(従業員.社員番号)\n営業部 | 3\n開発部 | 2\n総務部 | 2\n監査室 | 0",
  },
  {
    slug: "not-in-subquery",
    order: 11,
    tier: "exam",
    lesson: "subquery",
    kind: "result",
    title: "NOT IN で「存在しない」を探す｜基本情報 SQL",
    shortTitle: "NOT IN の副問合せ",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。副問合せと NOT IN を使って、他方の表に存在しない行を取り出す形の実行結果を答える。",
    keywords: ["基本情報", "SQL", "練習問題", "副問合せ", "NOT IN", "NOT EXISTS"],
    challenge: "在庫が 1 件も無い商品を探す",
    prompt: "次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: `SELECT 商品番号 FROM 商品
WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)`,
    choices: [
      { id: "ア", text: "商品番号\nP01\nP02\nP03" },
      { id: "イ", text: "商品番号\nP04\nP05" },
      { id: "ウ", text: "商品番号\nP01\nP02\nP03\nP04\nP05" },
      { id: "エ", text: "商品番号" },
    ],
    answer: "イ",
    explanation: [
      "内側の SELECT は在庫表にある商品番号 (P01, P02, P03) を返します。",
      "外側はその中に含まれない商品を探すので、在庫が 1 件も無い P04 と P05 が残ります。",
      "同じことは NOT EXISTS の相関副問合せでも書けます。ただし内側の列に NULL が混ざる場合、NOT IN は 1 行も返さなくなるのに対し、NOT EXISTS は期待どおりに動きます。この違いはよく問われます。",
    ],
    trap: "NOT を見落として「在庫のある商品」を選ぶ",
    expectedResult: "商品番号\nP04\nP05",
  },
  {
    slug: "except-set-op",
    order: 12,
    tier: "basic",
    lesson: "set-ops",
    kind: "result",
    title: "EXCEPT は何を返すか｜基本情報 SQL",
    shortTitle: "集合演算の差",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。集合演算の EXCEPT（差）が左から右を引いた結果になることを確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "集合演算", "EXCEPT", "差", "UNION"],
    challenge: "2 つの問合せ結果の差をとる",
    prompt: "次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: `SELECT 商品番号 FROM 商品
EXCEPT
SELECT 商品番号 FROM 在庫`,
    choices: [
      { id: "ア", text: "商品番号\nP01\nP02\nP03" },
      { id: "イ", text: "商品番号\nP04\nP05" },
      { id: "ウ", text: "商品番号\nP01\nP02\nP03\nP04\nP05" },
      { id: "エ", text: "商品番号\nP01\nP01\nP02\nP03" },
    ],
    answer: "イ",
    explanation: [
      "EXCEPT は差集合で、左にあって右に無い行を返します。",
      "商品表には P01〜P05、在庫表には P01, P02, P03 があるので、差は P04 と P05 です。",
      "ウは UNION（和）の結果、アは INTERSECT（積）の結果です。左右を入れ替えると結果が変わる点も EXCEPT の特徴です。",
    ],
    trap: "EXCEPT と INTERSECT を取り違える",
    expectedResult: "商品番号\nP04\nP05",
  },
  {
    slug: "update-where-scope",
    order: 13,
    tier: "basic",
    lesson: "dml",
    kind: "result",
    title: "UPDATE の対象になる行｜基本情報 SQL",
    shortTitle: "UPDATE の適用範囲",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。UPDATE の WHERE が対象行を限定すること、右辺が更新前の値で評価されることを確認する。",
    keywords: ["基本情報", "SQL", "練習問題", "UPDATE", "DML", "WHERE"],
    challenge: "分類 B の単価を 2 倍にした後の表",
    prompt:
      "「商品」表に対して次の SQL を順に実行したとき、最後の SELECT で得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: `UPDATE 商品 SET 単価 = 単価 * 2 WHERE 分類 = 'B';

SELECT 商品番号, 単価 FROM 商品`,
    choices: [
      {
        id: "ア",
        text: "商品番号 | 単価\nP01 | 120\nP02 | 200\nP03 | 160\nP04 | 300\nP05 | 500",
      },
      {
        id: "イ",
        text: "商品番号 | 単価\nP01 | 240\nP02 | 400\nP03 | 160\nP04 | 300\nP05 | 1000",
      },
      {
        id: "ウ",
        text: "商品番号 | 単価\nP03 | 160\nP04 | 300",
      },
      {
        id: "エ",
        text: "商品番号 | 単価\nP01 | 120\nP02 | 200\nP03 | 320\nP04 | 600\nP05 | 500",
      },
    ],
    answer: "ア",
    explanation: [
      "WHERE 分類 = 'B' があるので、更新されるのは消しゴム (P03) と定規 (P04) の 2 行だけです。",
      "80 × 2 = 160、150 × 2 = 300 になります。他の行は変わりません。",
      "UPDATE は行を消さないので、その後の SELECT では 5 行すべてが返ります。ウのように更新した行だけになることはありません。",
      "エは 2 回適用した場合の値です。SET の右辺は更新前の値で評価されるので、連鎖して増えることはありません。",
    ],
    trap: "UPDATE した行だけが SELECT で返ると思ってしまう",
    expectedResult:
      "商品番号 | 単価\nP01 | 120\nP02 | 200\nP03 | 160\nP04 | 300\nP05 | 500",
  },
  {
    slug: "scalar-subquery-average",
    order: 14,
    tier: "exam",
    lesson: "subquery",
    kind: "result",
    title: "平均より高い商品を探す｜基本情報 SQL",
    shortTitle: "スカラ副問合せ",
    description:
      "基本情報技術者試験 科目A の SQL 練習問題。集約関数の結果を 1 つの値として比較に使うスカラ副問合せの実行結果を答える。",
    keywords: ["基本情報", "SQL", "練習問題", "副問合せ", "スカラ副問合せ", "AVG"],
    challenge: "全体の平均単価を上回る商品",
    prompt:
      "「商品」表の単価は 120, 200, 80, 150, 500 である。次の SQL を実行したとき、得られる結果はどれか。",
    datasetKey: "shohin-zaiko",
    sql: `SELECT 商品名 FROM 商品
WHERE 単価 > (SELECT AVG(単価) FROM 商品)`,
    choices: [
      { id: "ア", text: "商品名\nホチキス" },
      { id: "イ", text: "商品名\nノート\nホチキス" },
      { id: "ウ", text: "商品名\nボールペン\nノート\n定規\nホチキス" },
      { id: "エ", text: "商品名" },
    ],
    answer: "ア",
    explanation: [
      "内側の AVG(単価) は (120 + 200 + 80 + 150 + 500) ÷ 5 = 210 を返します。",
      "外側は単価が 210 より大きい商品を探すので、500 のホチキスだけが残ります。",
      "ノートは 200 で平均を下回るため含まれません。平均を暗算で 150 前後と見積もると イ を選んでしまいます。",
      "内側が 1 行 1 列を返すので、そのまま比較に使えます。これをスカラ副問合せと呼びます。",
    ],
    trap: "平均を大まかに見積もって境界の行を取り違える",
    expectedResult: "商品名\nホチキス",
  },
];

export function findSqlQuiz(slug: string): SqlQuizMeta | undefined {
  return sqlQuizzes.find((q) => q.slug === slug);
}

export function sqlQuizzesForLesson(lesson: SqlLessonSlug): SqlQuizMeta[] {
  return sqlQuizzes.filter((q) => q.lesson === lesson);
}

export function sqlQuizzesByTier(tier: SqlQuizMeta["tier"]): SqlQuizMeta[] {
  return sqlQuizzes.filter((q) => q.tier === tier);
}

export function sqlQuizNeighbors(slug: string): {
  prev: SqlQuizMeta | null;
  next: SqlQuizMeta | null;
} {
  const index = sqlQuizzes.findIndex((q) => q.slug === slug);
  return {
    prev: index > 0 ? sqlQuizzes[index - 1] : null,
    next:
      index >= 0 && index < sqlQuizzes.length - 1 ? sqlQuizzes[index + 1] : null,
  };
}

/** Playground の deep link に載せる SQL */
export function sqlQuizRunnableSql(quiz: SqlQuizMeta): string {
  return quiz.verifySql ?? quiz.sql;
}
