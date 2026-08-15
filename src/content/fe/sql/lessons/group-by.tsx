import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("group-by")!;

export const faq = [
  {
    q: "WHERE と HAVING はどう使い分けますか？",
    a: "WHERE は 1 行ずつの絞り込み、HAVING はグループ単位の絞り込みです。評価順が WHERE → GROUP BY → HAVING なので、WHERE の時点ではまだグループが存在せず、集約関数も使えません。「集約した結果で絞る」なら HAVING です。",
  },
  {
    q: "GROUP BY に書いていない列を SELECT に書けないのはなぜですか？",
    a: "1 つのグループに複数の行がまとまるため、その列のどの行の値を出すべきかが決まらないからです。標準 SQL ではエラーになります（一部の製品は黙って通しますが、試験では誤りです）。GROUP BY に加えるか、MAX などの集約関数で包んでください。",
  },
  {
    q: "GROUP BY を書かずに集約関数だけを書いたらどうなりますか？",
    a: "表全体が 1 つのグループとして扱われ、結果は 1 行になります。該当する行が 0 件でも 1 行返る（COUNT は 0）点に注意してください。",
  },
];

export default function GroupByBody() {
  return (
    <>
      <h2>GROUP BY は行をグループにまとめる</h2>
      <p>
        <Link href="/fe/sql/lessons/aggregate">集約関数</Link>は
        表全体を 1 つの値にまとめました。
        <code>GROUP BY</code> を付けると、
        <strong>指定した列の値が同じ行ごと</strong>に集計されます。
      </p>
      <pre>
        <code>{`SELECT 部門コード, COUNT(*), AVG(給与)
FROM 従業員
GROUP BY 部門コード`}</code>
      </pre>
      <p>
        部門コードが同じ行が 1 グループになり、
        <strong>グループの数だけ結果の行ができます</strong>。
      </p>

      <h2>HAVING はグループを絞り込む</h2>
      <p>
        「2 人以上いる部門だけ」のように、
        <strong>集計した結果で絞り込みたい</strong>ときに <code>HAVING</code> を使います。
      </p>
      <pre>
        <code>{`GROUP BY 部門コード
HAVING COUNT(*) >= 2`}</code>
      </pre>

      <h2>WHERE と HAVING の違いは「評価順」で決まる</h2>
      <p>
        この 2 つの違いは、暗記ではなく<strong>評価順</strong>で理解できます。
      </p>
      <ol>
        <li><code>FROM</code> — 表を読み込む</li>
        <li><code>WHERE</code> — <strong>1 行ずつ</strong>絞り込む</li>
        <li><code>GROUP BY</code> — 残った行をグループにまとめる</li>
        <li><code>HAVING</code> — <strong>グループ単位で</strong>絞り込む</li>
        <li><code>SELECT</code> — 列を取り出す</li>
      </ol>
      <p>
        <code>WHERE</code> は 2 番目、グループができるのは 3 番目です。
        つまり <strong>WHERE の時点ではまだグループが存在しない</strong>ので、
        <code>WHERE COUNT(*) &gt; 1</code> は書けません。これが理由のすべてです。
      </p>
      <p>
        逆に「D01 部門の中で平均を出したい」のように
        <strong>グループ化する前に行を減らす</strong>のは WHERE の仕事です。
        両方書くこともできます。
      </p>

      <h2>GROUP BY に無い列は取り出せない</h2>
      <pre>
        <code>{`SELECT 氏名, COUNT(*) FROM 従業員 GROUP BY 部門コード
-- エラー: 氏名 は GROUP BY に無い`}</code>
      </pre>
      <p>
        D01 部門には青木・井上・上田の 3 人がいます。
        このグループの「氏名」は<strong>どれを出せばよいか決まりません</strong>。
        だから標準 SQL ではエラーになります。
      </p>
      <p>
        一部のデータベース製品は黙って通してしまいますが、
        <strong>試験では誤り</strong>です。この実行シミュレーターも
        標準 SQL に合わせてエラーにしています。
      </p>

      <h2>ブラウザで動かしてみる</h2>
      <p>
        <strong>段階を追う</strong>を押してください。GROUP BY の段階で、
        <strong>行の集合ではなくグループの集合</strong>が表示されます。
        HAVING がそのグループをどう減らすかも次の段階で見えます。
        WHERE と HAVING の違いが一番はっきり分かる場所です。
      </p>

      <SqlLessonPlayground
        sql={lesson.sampleSql!}
        datasetKey={lesson.datasetKey}
      />

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>WHERE と HAVING のどちらに書くか</strong>。最頻出です</li>
        <li><strong>結果が何行になるか</strong>＝グループがいくつできるか</li>
        <li>GROUP BY に無い列を SELECT に書いた選択肢は誤りだと見抜けること</li>
        <li>WHERE と HAVING を両方書いたときの評価順</li>
      </ul>
    </>
  );
}
