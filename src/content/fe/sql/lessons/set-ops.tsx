import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("set-ops")!;

export const faq = [
  {
    q: "UNION と UNION ALL の違いは何ですか？",
    a: "UNION は結果から重複行を取り除きますが、UNION ALL は取り除きません。重複を消す処理が不要な分 UNION ALL のほうが速いため、重複しないと分かっている場合は ALL を付けます。",
  },
  {
    q: "集合演算と結合はどう違いますか？",
    a: "集合演算は結果を縦に足したり引いたりする操作で、列数と型が揃っている必要があります。結合は横につなぐ操作で、列は増えます。「行が増えるのが集合演算、列が増えるのが結合」と覚えると混同しません。",
  },
  {
    q: "直積も集合演算ですか？",
    a: "はい。シラバスでは集合演算として和・差・積・直積の 4 つが挙げられています。直積は SQL では FROM に表を並べる（または CROSS JOIN）ことで得られ、すべての行の組み合わせになります。",
  },
];

export default function SetOpsBody() {
  return (
    <>
      <h2>問合せの結果どうしを足し引きする</h2>
      <p>
        <strong>集合演算</strong>は、2 つの SELECT の結果を集合として扱い、
        和・差・積を求める操作です。関係代数の集合演算がそのまま SQL になっています。
      </p>
      <table>
        <thead>
          <tr>
            <th>SQL</th>
            <th>関係代数</th>
            <th>意味</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>UNION</code></td>
            <td>和</td>
            <td>どちらかにある行（重複は 1 つに）</td>
          </tr>
          <tr>
            <td><code>EXCEPT</code></td>
            <td>差</td>
            <td>左にあって右に無い行</td>
          </tr>
          <tr>
            <td><code>INTERSECT</code></td>
            <td>積</td>
            <td>両方にある行</td>
          </tr>
        </tbody>
      </table>
      <p>
        製品によっては <code>EXCEPT</code> を <code>MINUS</code> と書きます
        （Oracle 系）。試験では <code>EXCEPT</code> が使われます。
      </p>

      <h2>列数と型を揃える必要がある</h2>
      <pre>
        <code>{`-- OK: どちらも 1 列
SELECT 商品番号 FROM 商品
UNION
SELECT 商品番号 FROM 在庫

-- エラー: 左が 1 列、右が 2 列
SELECT 商品番号 FROM 商品
UNION
SELECT 商品番号, 倉庫 FROM 在庫`}</code>
      </pre>
      <p>
        <strong>列名が違っていても構いません</strong>が、
        <strong>列数と対応する位置の型は揃っている</strong>必要があります。
        結果の列名は左側の SELECT のものが使われます。
      </p>

      <SqlLessonPlayground
        caption="試す: UNION を EXCEPT / INTERSECT に書き換えて結果を見比べる"
        sql={`SELECT 商品番号 FROM 商品
UNION
SELECT 商品番号 FROM 在庫`}
        datasetKey={lesson.datasetKey}
      />

      <h2>UNION は重複を消す</h2>
      <p>
        <code>UNION</code> は結果から重複行を取り除きます。
        重複を残したい（または重複が無いと分かっている）場合は
        <code>UNION ALL</code> を使います。
        <strong>ALL を付けないと重複が消える</strong>のがポイントで、
        行数を問う問題で狙われます。
      </p>

      <SqlLessonPlayground
        caption="試す: ALL を消すと重複が消えて 5 行になる"
        sql={`SELECT 商品番号 FROM 商品
UNION ALL
SELECT 商品番号 FROM 在庫
ORDER BY 商品番号`}
        datasetKey={lesson.datasetKey}
      />

      <h2>直積も集合演算のひとつ</h2>
      <p>
        シラバスでは集合演算として<strong>和・差・積・直積</strong>の 4 つが挙がっています。
        直積は<Link href="/fe/sql/lessons/join">結合</Link>のレッスンで見た
        「すべての行の組み合わせ」で、SQL では <code>FROM 商品, 在庫</code> と
        書くと得られます。
      </p>

      <h2>結合との違い</h2>
      <p>
        混同しやすいので整理しておきます。
      </p>
      <ul>
        <li><strong>集合演算</strong>は<strong>縦</strong>に足し引きする。列数は変わらない</li>
        <li><strong>結合</strong>は<strong>横</strong>につなぐ。列が増える</li>
      </ul>

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>UNION と UNION ALL の行数の違い</strong></li>
        <li><strong>和・差・積という日本語と SQL の対応</strong>。用語で問われます</li>
        <li>列数が揃っていない選択肢は誤りだと見抜けること</li>
        <li>EXCEPT は<strong>左から右を引く</strong>（順番を入れ替えると結果が変わる）こと</li>
      </ul>
    </>
  );
}
