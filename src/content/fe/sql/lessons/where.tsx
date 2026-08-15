import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("where")!;

export const faq = [
  {
    q: "BETWEEN は境界の値を含みますか？",
    a: "含みます。単価 BETWEEN 100 AND 300 は「100 以上 300 以下」で、100 と 300 の両方が対象です。境界を含むかどうかは頻出の引っかけなので、閉区間だと覚えてください。",
  },
  {
    q: "LIKE の % と _ の違いは何ですか？",
    a: "% は 0 文字以上の任意の文字列、_ はちょうど 1 文字にマッチします。'A%' は A で始まる任意の長さ、'A_' は A の後にちょうど 1 文字あるものだけです。",
  },
  {
    q: "= NULL と書いても NULL の行が取れないのはなぜですか？",
    a: "NULL は「値が不明」を意味するため、NULL との比較結果は真でも偽でもなく不定 (UNKNOWN) になります。WHERE が行を残すのは条件が真のときだけなので、不定の行は残りません。NULL を判定するには IS NULL を使います。",
  },
];

export default function WhereBody() {
  return (
    <>
      <h2>WHERE は 1 行ずつ判定する</h2>
      <p>
        <code>WHERE</code> は表の各行を 1 行ずつ見て、条件が真になる行だけを残します。
        行を絞り込むこの操作を関係代数では<strong>選択</strong>と呼び、
        列を絞る<Link href="/fe/sql/lessons/select">射影（SELECT）</Link>と対になります。
      </p>

      <h2>条件の組み合わせ</h2>
      <pre>
        <code>{`WHERE 単価 >= 100 AND 分類 = 'A'    -- 両方を満たす
WHERE 分類 = 'A' OR 分類 = 'C'      -- どちらかを満たす
WHERE NOT 分類 = 'A'                -- 満たさない`}</code>
      </pre>
      <p>
        <strong>AND は OR より先に評価されます。</strong>
        <code>A OR B AND C</code> は <code>A OR (B AND C)</code> の意味です。
        意図した順序にするには括弧を書きます。試験ではこの優先順位を突いた選択肢が出ます。
      </p>

      <SqlLessonPlayground
        caption="試す: AND を OR に変える / 括弧を付けて優先順位を変える"
        sql={`SELECT 商品名, 分類, 単価
FROM 商品
WHERE 分類 = 'A' OR 分類 = 'B' AND 単価 >= 150`}
        datasetKey={lesson.datasetKey}
      />

      <h2>よく使う述語</h2>
      <table>
        <thead>
          <tr>
            <th>書き方</th>
            <th>意味</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>単価 BETWEEN 100 AND 300</code></td>
            <td>100 以上 300 以下（<strong>両端を含む</strong>）</td>
          </tr>
          <tr>
            <td><code>分類 IN (&apos;A&apos;, &apos;C&apos;)</code></td>
            <td>列挙したどれかに一致</td>
          </tr>
          <tr>
            <td><code>商品名 LIKE &apos;%ゴム&apos;</code></td>
            <td>「ゴム」で終わる（% は 0 文字以上）</td>
          </tr>
          <tr>
            <td><code>商品番号 LIKE &apos;P0_&apos;</code></td>
            <td>P0 の後にちょうど 1 文字（_ は 1 文字）</td>
          </tr>
          <tr>
            <td><code>在庫数 IS NULL</code></td>
            <td>値が入っていない</td>
          </tr>
        </tbody>
      </table>
      <p>
        <code>LIKE</code> に渡す <code>&apos;%ゴム&apos;</code> のような文字列を、
        シラバスでは<strong>パターン文字列</strong>と呼びます。
        <code>NOT BETWEEN</code> / <code>NOT IN</code> / <code>NOT LIKE</code>{" "}
        のように、それぞれ否定形も書けます。
      </p>

      <SqlLessonPlayground
        caption="試す: BETWEEN の値を 120 AND 150 にして、境界が含まれるか確かめる"
        sql={`SELECT 商品名, 単価
FROM 商品
WHERE 単価 BETWEEN 100 AND 200`}
        datasetKey={lesson.datasetKey}
      />

      <SqlLessonPlayground
        caption="試す: LIKE の % と _ を入れ替える ('P0_' / 'P%' / '%ート')"
        sql={`SELECT 商品番号, 商品名
FROM 商品
WHERE 商品名 LIKE '%ル%'`}
        datasetKey={lesson.datasetKey}
      />

      <h2>NULL は「比較できない」</h2>
      <p>
        SQL で最もつまずくのがここです。<strong>NULL は値ではなく「不明」</strong>なので、
        比較した結果は真でも偽でもなく<strong>不定 (UNKNOWN)</strong> になります。
      </p>
      <pre>
        <code>{`WHERE 在庫数 = NULL     -- 1 行も返らない
WHERE 在庫数 <> NULL    -- これも 1 行も返らない
WHERE 在庫数 IS NULL    -- これが正解`}</code>
      </pre>
      <p>
        <code>WHERE</code> が行を残すのは<strong>条件が真のときだけ</strong>で、
        不定の行は残りません。だから <code>= NULL</code> も <code>&lt;&gt; NULL</code> も
        両方とも 0 行になります。「NULL でない行を取りたい」なら
        <code>IS NOT NULL</code> と書きます。
      </p>

      <SqlLessonPlayground
        caption="試す: IS NULL を = NULL や <> NULL に書き換えると 0 行になる"
        sql={`SELECT 商品番号, 倉庫, 在庫数
FROM 在庫
WHERE 在庫数 IS NOT NULL`}
        datasetKey={lesson.datasetKey}
      />

      <h2>何行に絞られたかを段階で見る</h2>
      <p>
        <strong>一つ進める</strong>を押すと、FROM で 5 行読み込んだあと
        WHERE で何行に減ったかが数字で出ます。条件を書き換えて、
        絞り込みの効き方を見比べてください。
      </p>

      <SqlLessonPlayground
        caption="試す: 一つ進める で FROM → WHERE の行数の変化を見る"
        sql={lesson.sampleSql!}
        datasetKey={lesson.datasetKey}
      />

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>BETWEEN が両端を含む</strong>こと</li>
        <li><strong>AND が OR より優先される</strong>こと</li>
        <li><strong>NULL は = では判定できない</strong>こと。ほぼ毎回どこかで問われます</li>
        <li><code>_</code> が「ちょうど 1 文字」であること（0 文字にはマッチしない）</li>
      </ul>
    </>
  );
}
