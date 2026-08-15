import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("subquery")!;

export const faq = [
  {
    q: "IN と EXISTS はどちらを使ってもよいですか？",
    a: "NULL が絡まない限り結果は同じです。ただし NOT IN は候補に NULL が 1 つでも混ざると 1 行も返らなくなるのに対し、NOT EXISTS は期待どおりに動きます。この違いが試験でも実務でも重要です。",
  },
  {
    q: "相関副問合せとは何ですか？",
    a: "内側の SELECT が外側の行の列を参照しているものです。外側の行が変わるたびに内側が評価し直されるため、外側の行数だけ実行されます。EXISTS と組み合わせて使うのが典型です。",
  },
  {
    q: "副問合せは WHERE 以外にも書けますか？",
    a: "書けます。SELECT の列として 1 つの値を返す形（スカラ副問合せ）や、FROM に書いて仮の表として使う形もあります。基本情報では WHERE に書く形が中心です。",
  },
];

export default function SubqueryBody() {
  return (
    <>
      <h2>副問合せは SQL の中の SQL</h2>
      <p>
        <strong>副問合せ（サブクエリ）</strong>は、SQL の中に入れ子で書く SELECT 文です。
        「他の表に存在しないものを探す」「平均より上のものを探す」といった、
        1 回の問合せでは書けない条件を表現できます。
      </p>

      <h2>IN — 値のリストとして使う</h2>
      <pre>
        <code>{`SELECT 商品番号 FROM 商品
WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)`}</code>
      </pre>
      <p>
        内側の SELECT が「在庫のある商品番号の一覧」を返し、
        外側はその中に<strong>含まれない</strong>商品を探します。
        結果は「在庫が 1 件も無い商品」です。
      </p>

      <SqlLessonPlayground
        caption="試す: NOT IN の NOT を消すと「在庫のある商品」になる"
        sql={`SELECT 商品番号, 商品名 FROM 商品
WHERE 商品番号 NOT IN (SELECT 商品番号 FROM 在庫)`}
        datasetKey={lesson.datasetKey}
      />

      <h2>EXISTS — 行が存在するかどうかだけを見る</h2>
      <pre>
        <code>{`SELECT 商品番号 FROM 商品
WHERE NOT EXISTS (
  SELECT 1 FROM 在庫 WHERE 在庫.商品番号 = 商品.商品番号
)`}</code>
      </pre>
      <p>
        内側の <code>WHERE 在庫.商品番号 = 商品.商品番号</code> が
        <strong>外側の行を参照している</strong>点に注目してください。
        これが<strong>相関副問合せ</strong>です。外側の商品 1 行ごとに
        内側が実行し直され、結果が 1 行でもあれば <code>EXISTS</code> が真になります。
      </p>
      <p>
        <code>SELECT 1</code> と書いているのは、
        <strong>EXISTS は行があるかどうかしか見ない</strong>ためです。
        何を選んでも結果は変わりません。
      </p>

      <SqlLessonPlayground
        caption="試す: SELECT 1 を SELECT 倉庫 に変えても結果は同じ (EXISTS は行の有無だけを見る)"
        sql={`SELECT 商品番号, 商品名 FROM 商品
WHERE NOT EXISTS (
  SELECT 1 FROM 在庫 WHERE 在庫.商品番号 = 商品.商品番号
)`}
        datasetKey={lesson.datasetKey}
      />

      <h2>スカラ副問合せ — 1 つの値として使う</h2>
      <pre>
        <code>{`SELECT 商品名 FROM 商品
WHERE 単価 = (SELECT MAX(単価) FROM 商品)`}</code>
      </pre>
      <p>
        内側が 1 行 1 列だけを返す場合、その値をそのまま比較に使えます。
        <strong>2 行以上返るとエラー</strong>になるので、
        集約関数で 1 行にまとめるのが定石です。
      </p>

      <SqlLessonPlayground
        caption="試す: MAX を MIN や AVG に変える / 集約を外すとエラーになる"
        sql={`SELECT 商品名, 単価 FROM 商品
WHERE 単価 = (SELECT MAX(単価) FROM 商品)`}
        datasetKey={lesson.datasetKey}
      />

      <h2>NOT IN に NULL が混ざると 1 行も返らない</h2>
      <p>
        これは SQL で最も有名な罠のひとつで、試験でも狙われます。
      </p>
      <pre>
        <code>{`-- 在庫数に NULL の行があると、これは 0 行になる
SELECT 商品番号 FROM 商品
WHERE 単価 NOT IN (SELECT 在庫数 FROM 在庫)`}</code>
      </pre>
      <p>
        <code>NOT IN</code> は「どれとも等しくない」を意味しますが、
        <Link href="/fe/sql/lessons/where">NULL との比較は不定 (UNKNOWN)</Link>{" "}
        になります。1 つでも NULL があると
        「等しくないと言い切れない」状態になり、条件が真になりません。
      </p>
      <p>
        <strong>同じことを NOT EXISTS で書けばこの問題は起きません。</strong>
        NOT IN と NOT EXISTS が「同じ結果になる／ならない」を問う問題は頻出です。
      </p>

      <SqlLessonPlayground
        caption="試す: 在庫数に NULL があるので 0 行になる。NOT EXISTS で書き直すと取れる"
        sql={`SELECT 商品番号, 商品名 FROM 商品
WHERE 単価 NOT IN (SELECT 在庫数 FROM 在庫)`}
        datasetKey={lesson.datasetKey}
      />

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>NOT IN と NOT EXISTS が同じ結果になるか</strong>を問う問題</li>
        <li><strong>相関副問合せがどの行を参照しているか</strong>を追えること</li>
        <li>スカラ副問合せが 2 行以上返すと成立しないこと</li>
        <li>EXISTS は「行の有無」だけを見る（選ぶ列は無関係）こと</li>
      </ul>
    </>
  );
}
