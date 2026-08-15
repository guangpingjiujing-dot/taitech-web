import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("aggregate")!;

export const faq = [
  {
    q: "COUNT(*) と COUNT(列) はどう違いますか？",
    a: "COUNT(*) は行数をそのまま数えるので NULL も含みます。COUNT(列) はその列が NULL でない行だけを数えます。NULL を含む列で両者の値がずれることを問う問題が頻出です。",
  },
  {
    q: "対象が 1 行も無いとき、集約関数は何を返しますか？",
    a: "COUNT は 0 を返しますが、SUM・AVG・MAX・MIN は NULL を返します。0 ではありません。「合計が 0 円」と「合計が計算できない」を区別するためです。",
  },
  {
    q: "AVG は NULL を 0 として平均しますか？",
    a: "しません。NULL の行は分母からも除かれます。3 行のうち 1 行が NULL なら、残り 2 行の合計を 2 で割ります。0 として扱うと平均が下がってしまうため、この違いは重要です。",
  },
];

export default function AggregateBody() {
  return (
    <>
      <h2>集約関数は複数行を 1 つの値にする</h2>
      <p>
        ここまでの SQL は「行を絞って列を取り出す」だけでした。
        <strong>集約関数</strong>は、複数の行をまとめて 1 つの値を計算します。
      </p>
      <table>
        <thead>
          <tr>
            <th>関数</th>
            <th>意味</th>
            <th>NULL の扱い</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>COUNT(*)</code></td>
            <td>行数</td>
            <td><strong>NULL も数える</strong></td>
          </tr>
          <tr>
            <td><code>COUNT(列)</code></td>
            <td>その列が NULL でない行数</td>
            <td>NULL を除く</td>
          </tr>
          <tr>
            <td><code>SUM(列)</code></td>
            <td>合計</td>
            <td>NULL を除く</td>
          </tr>
          <tr>
            <td><code>AVG(列)</code></td>
            <td>平均</td>
            <td>NULL を除く（<strong>分母からも除く</strong>）</td>
          </tr>
          <tr>
            <td><code>MAX(列)</code> / <code>MIN(列)</code></td>
            <td>最大 / 最小</td>
            <td>NULL を除く</td>
          </tr>
        </tbody>
      </table>

      <h2>NULL の扱いが試験の狙いどころ</h2>
      <p>
        サンプルの従業員表には、給与が未設定（NULL）の行が 1 行あります。
        7 行のうち 1 行が NULL なので:
      </p>
      <ul>
        <li><code>COUNT(*)</code> は <strong>7</strong>（NULL も数える）</li>
        <li><code>COUNT(給与)</code> は <strong>6</strong>（NULL を除く）</li>
        <li><code>AVG(給与)</code> は <strong>6 行の合計 ÷ 6</strong>（7 では割らない）</li>
      </ul>
      <p>
        <strong>「NULL を 0 とみなすか」ではなく「集計の対象から外す」</strong>のが
        SQL の規則です。平均を出すときに分母が変わる点が特に狙われます。
      </p>

      <SqlLessonPlayground
        caption="試す: COUNT(*) と COUNT(給与) の差が、給与が NULL の 1 行分"
        sql={`SELECT COUNT(*), COUNT(給与), SUM(給与), AVG(給与)
FROM 従業員`}
        datasetKey={lesson.datasetKey}
      />

      <h2>対象が 0 件のときの戻り値</h2>
      <pre>
        <code>{`SELECT COUNT(*), SUM(給与) FROM 従業員 WHERE 部門コード = 'D99'
-- COUNT は 0、SUM は NULL`}</code>
      </pre>
      <p>
        <strong>COUNT だけが 0 を返し、他は NULL</strong> です。
        「該当が無い」ことと「合計が 0」は違う、という考え方です。
      </p>

      <SqlLessonPlayground
        caption="試す: COUNT だけが 0 を返し、SUM と AVG は NULL になる"
        sql={`SELECT COUNT(*), SUM(給与), AVG(給与)
FROM 従業員
WHERE 部門コード = 'D99'`}
        datasetKey={lesson.datasetKey}
      />

      <h2>集約関数は WHERE には書けない</h2>
      <p>
        <code>WHERE COUNT(*) &gt; 1</code> はエラーになります。
        WHERE は 1 行ずつの絞り込みで、集約より前に評価されるからです。
        グループに対する条件は
        <Link href="/fe/sql/lessons/group-by">HAVING</Link> に書きます。
        次のレッスンで詳しく扱います。
      </p>

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>COUNT(*) と COUNT(列) の値のずれ</strong>。NULL を含む列で必ず問われます</li>
        <li><strong>AVG が NULL を分母から除く</strong>こと</li>
        <li><strong>0 件のときに SUM が NULL</strong>（0 ではない）こと</li>
        <li>集約関数を WHERE に書いた選択肢は誤りだと見抜けること</li>
      </ul>
    </>
  );
}
