import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("select")!;

export const faq = [
  {
    q: "SELECT * と列を並べて書くのはどちらがよいですか？",
    a: "試験では表の全列を見たいときに * を使い、必要な列だけを問われている場合は列名を並べます。実務では * を避けるのが基本です。表に列が追加されたときに結果の形が変わってしまい、プログラム側が壊れるためです。",
  },
  {
    q: "DISTINCT はどの時点で効きますか？",
    a: "SELECT で列が確定した後です。つまり「取り出した列の組み合わせ」が同じ行が重複と見なされます。元の表で違う行でも、取り出した列だけを見ると同じになる場合は 1 行にまとまります。",
  },
  {
    q: "AS は省略できますか？",
    a: "省略できます。SELECT 単価 価格 のように列名の後ろに名前を続けるだけでも別名になります。ただし読みにくく、列の書き忘れ（カンマ落ち）と見分けが付かなくなるので、試験でも実務でも AS を書くことが推奨されます。",
  },
];

export default function SelectBody() {
  return (
    <>
      <h2>SELECT 文は 3 つの部品でできている</h2>
      <p>
        SQL の問合せは、最小構成では次の 2 行です。
      </p>
      <pre>
        <code>{`SELECT 商品名, 単価   -- どの列を取り出すか
FROM 商品             -- どの表から取り出すか`}</code>
      </pre>
      <p>
        <code>SELECT</code> に書いた列だけが結果に出ます。この
        「必要な列だけを取り出す」操作を、関係代数では
        <strong>射影</strong>と呼びます。行を絞り込む
        <Link href="/fe/sql/lessons/where">選択（WHERE）</Link>
        と対になる概念で、用語として問われることがあります。
      </p>

      <SqlLessonPlayground
        caption="試す: SELECT に書く列を減らしたり増やしたりしてみる"
        sql={`SELECT 商品名, 単価
FROM 商品`}
        datasetKey={lesson.datasetKey}
      />

      <h2>* は「その表の全列」に展開される</h2>
      <p>
        <code>*</code> は表の全列を順番に並べたのと同じ意味です。
        表が複数あるときは <code>商品.*</code> のように表名で修飾すると、
        その表の列だけを展開できます。
      </p>

      <SqlLessonPlayground
        caption="試す: * を 商品.* や 在庫.* に書き換えると、どちらの表の列が出るか"
        sql={`SELECT *
FROM 商品, 在庫
WHERE 商品.商品番号 = 在庫.商品番号`}
        datasetKey={lesson.datasetKey}
      />

      <h2>AS で別名を付ける（相関名）</h2>
      <p>
        <code>AS</code> は列や表に別の名前を付けます。シラバスでは
        <strong>相関名</strong>という用語で登場します。
      </p>
      <pre>
        <code>{`SELECT 単価 AS 価格 FROM 商品        -- 列に別名
SELECT S.商品名 FROM 商品 AS S       -- 表に別名`}</code>
      </pre>
      <p>
        表の別名は、同じ表を 2 回使う自己結合や、長い表名を何度も書きたくないときに使います。
        <strong>表に別名を付けたら、その後は元の表名では参照できません。</strong>
        <code>FROM 商品 AS S</code> と書いたら <code>商品.商品名</code> ではなく
        <code>S.商品名</code> と書きます。
      </p>

      <SqlLessonPlayground
        caption="試す: 相関名を S から別の名前に変える / 商品.商品名 に戻すとどうなるか"
        sql={`SELECT S.商品名, S.単価 AS 価格
FROM 商品 AS S`}
        datasetKey={lesson.datasetKey}
      />

      <h2>DISTINCT で重複を取り除く</h2>
      <p>
        <code>DISTINCT</code> を付けると、結果から重複した行が取り除かれます。
        下のエディタで <code>DISTINCT</code> を消してみてください。
        5 行に増えます。
      </p>

      <SqlLessonPlayground
        caption="試す: DISTINCT を消すと 3 行 → 5 行"
        sql={`SELECT DISTINCT 分類
FROM 商品`}
        datasetKey={lesson.datasetKey}
      />

      <h2>SELECT はいつ評価されるのか</h2>
      <p>
        <strong>一つ進める</strong>を押していくと、FROM で表を読み込んでから
        SELECT で列が絞られるまでの流れが 1 段階ずつ見られます。
        <strong>SELECT が最後に評価される</strong>ことがここで確認できます。
      </p>

      <SqlLessonPlayground
        caption="試す: 一つ進める を押して、FROM → SELECT の順に見る"
        sql={lesson.sampleSql!}
        datasetKey={lesson.datasetKey}
      />

      <h2>試験で問われるポイント</h2>
      <ul>
        <li>
          <strong>射影と選択の区別</strong>。列を選ぶのが射影（SELECT）、
          行を選ぶのが選択（WHERE）。用語をそのまま問う問題が出ます
        </li>
        <li>
          <strong>DISTINCT を付けたときの行数</strong>。
          「この SQL の結果は何行か」を問う形で頻出します
        </li>
        <li>
          <strong>相関名を付けた後の参照方法</strong>。
          別名を付けたのに元の表名で書いている選択肢は誤りです
        </li>
      </ul>
    </>
  );
}
