import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("join")!;

export const faq = [
  {
    q: "FROM A, B WHERE ... と INNER JOIN ... ON ... はどちらを使うべきですか？",
    a: "結果はまったく同じです。基本情報の過去問では FROM A, B WHERE 形式の出題が多いので、まずこちらを確実に読めるようにしてください。実務では結合条件と絞り込み条件が分かれる JOIN ... ON のほうが読みやすいとされます。",
  },
  {
    q: "結合条件を書き忘れるとどうなりますか？",
    a: "すべての行の組み合わせ（直積）になります。5 行の表と 4 行の表なら 20 行です。行数が急に増えていたら結合条件の書き忘れを疑ってください。",
  },
  {
    q: "外部結合で NULL になるのはどの列ですか？",
    a: "相手が見つからなかった側の列すべてです。LEFT OUTER JOIN なら、左の表の行は必ず残り、対応する右の表の行が無い場合は右側の列がすべて NULL になります。",
  },
];

export default function JoinBody() {
  return (
    <>
      <h2>結合とは、共通する値で表をつなぐこと</h2>
      <p>
        リレーショナルデータベースでは、データを複数の表に分けて持ちます
        （<Link href="/data-modeling/normalization/why">正規化</Link>）。
        分けたものを再び 1 つの表として見るのが<strong>結合</strong>です。
      </p>

      <h2>書き方は 2 通りある（結果は同じ）</h2>
      <pre>
        <code>{`-- 旧式のカンマ結合（過去問で最頻出）
SELECT 商品.商品名, 在庫.倉庫
FROM 商品, 在庫
WHERE 商品.商品番号 = 在庫.商品番号

-- INNER JOIN 記法
SELECT 商品.商品名, 在庫.倉庫
FROM 商品 INNER JOIN 在庫
  ON 商品.商品番号 = 在庫.商品番号`}</code>
      </pre>
      <p>
        <strong>基本情報の過去問では上の書き方が多く出ます。</strong>
        <code>JOIN</code> という単語が出てこないので結合だと気づきにくいのですが、
        <code>FROM</code> に表が 2 つ並んでいたら結合だと判断してください。
      </p>

      <SqlLessonPlayground
        caption="試す: 下の 2 つの書き方は同じ結果になる。INNER JOIN 版に書き換えてみる"
        sql={`SELECT 商品.商品名, 在庫.倉庫
FROM 商品, 在庫
WHERE 商品.商品番号 = 在庫.商品番号`}
        datasetKey={lesson.datasetKey}
      />

      <h2>結合条件を書かないと直積になる</h2>
      <p>
        <code>FROM 商品, 在庫</code> だけを書くと、
        <strong>すべての行の組み合わせ</strong>が作られます。
        商品 5 行 × 在庫 4 行 = 20 行です。これを<strong>直積</strong>と呼びます。
      </p>
      <p>
        実は結合とは「直積を作ってから、条件に合う組だけを残したもの」です。
        下の Playground で <code>SELECT * FROM 商品, 在庫</code> を
        <strong>一つ進める</strong>で追うと、FROM の段階で 20 行になり、
        WHERE で 4 行に絞られるのが目で見えます。
      </p>

      <SqlLessonPlayground
        caption="試す: 一つ進める を押すと FROM の段階で 20 行になるのが見える"
        sql={`SELECT 商品.商品番号, 在庫.倉庫
FROM 商品, 在庫`}
        datasetKey={lesson.datasetKey}
      />

      <h2>内部結合と外部結合</h2>
      <p>
        ここまでの結合は<strong>内部結合</strong>で、
        <strong>両方の表に対応する行がある組だけ</strong>が残ります。
        サンプルの表では、在庫が登録されていない商品（定規・ホチキス）は
        結果から消えます。
      </p>
      <p>
        「在庫が無い商品も一覧に出したい」場合は<strong>外部結合</strong>を使います。
      </p>
      <pre>
        <code>{`SELECT 商品.商品番号, 商品.商品名, 在庫.倉庫
FROM 商品 LEFT OUTER JOIN 在庫
  ON 商品.商品番号 = 在庫.商品番号`}</code>
      </pre>
      <p>
        <code>LEFT OUTER JOIN</code> は<strong>左の表の行を必ず残し</strong>、
        右に対応する行が無ければ右側の列を NULL で埋めます。
        <code>RIGHT OUTER JOIN</code> はその逆です。
        <code>OUTER</code> は省略できます。
      </p>

      <SqlLessonPlayground
        caption="試す: LEFT を RIGHT に、あるいは OUTER を消して INNER にすると行数が変わる"
        sql={`SELECT 商品.商品番号, 商品.商品名, 在庫.倉庫
FROM 商品 LEFT OUTER JOIN 在庫
  ON 商品.商品番号 = 在庫.商品番号`}
        datasetKey={lesson.datasetKey}
      />

      <h2>試験で問われるポイント</h2>
      <ul>
        <li>
          <strong>結果の行数</strong>。内部結合で消える行がいくつあるかを数えさせる問題が定番です
        </li>
        <li>
          <strong>直積の行数</strong>。結合条件が無い選択肢を見抜けるか
        </li>
        <li>
          <strong>外部結合で NULL になる列</strong>がどちら側かを問う問題
        </li>
        <li>
          列名が両方の表にある場合は<strong>表名で修飾しないと曖昧</strong>になること
        </li>
      </ul>
    </>
  );
}
