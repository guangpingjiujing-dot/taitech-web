import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("dml")!;

export const faq = [
  {
    q: "UPDATE で WHERE を書き忘れるとどうなりますか？",
    a: "表のすべての行が更新されます。エラーにはならず、静かに全行が書き換わります。DELETE も同じで、WHERE の無い DELETE は全行削除です。実務で最も恐ろしい書き忘れです。",
  },
  {
    q: "UPDATE の SET で 単価 = 単価 * 2 と書くと、連鎖して増え続けませんか？",
    a: "増えません。右辺は更新前の値で評価されます。複数の列を同時に更新する場合も、すべての右辺が更新前の行に対して評価されるため、SET の書き順で結果が変わることはありません。",
  },
  {
    q: "INSERT で列名を省略できますか？",
    a: "省略できます。その場合は表を定義したときの列の順番どおりに値を並べる必要があります。列が増減したときに壊れるので、実務では列名を明示するのが基本です。",
  },
];

export default function DmlBody() {
  return (
    <>
      <h2>データを書き換える 3 つの命令</h2>
      <p>
        ここまでは表を読むだけでした。データを変更する命令は
        <strong>DML（データ操作言語）</strong>と呼ばれ、3 つあります。
      </p>

      <h3>INSERT — 行を追加する</h3>
      <pre>
        <code>{`INSERT INTO 商品 (商品番号, 商品名, 分類, 単価)
VALUES ('P06', 'クリップ', 'C', 60)

-- 列名は省略できる（表定義の順に並べる）
INSERT INTO 商品 VALUES ('P06', 'クリップ', 'C', 60)`}</code>
      </pre>
      <p>
        列名を指定した場合、<strong>書かなかった列は NULL</strong> になります。
        その列に非NULL制約が付いていればエラーです。
      </p>

      <SqlLessonPlayground
        caption="試す: 列名の指定を消すと、表定義の順に値を並べる必要がある"
        sql={`INSERT INTO 商品 (商品番号, 商品名, 分類, 単価)
VALUES ('P06', 'クリップ', 'C', 60)`}
        datasetKey={lesson.datasetKey}
      />

      <h3>UPDATE — 既存の行を変更する</h3>
      <pre>
        <code>{`UPDATE 商品
SET 単価 = 単価 * 2
WHERE 分類 = 'B'`}</code>
      </pre>
      <p>
        <code>SET</code> の右辺は<strong>更新前の値</strong>で評価されます。
        <code>単価 = 単価 * 2</code> は「更新前の単価の 2 倍」であり、
        連鎖して増え続けることはありません。
      </p>

      <SqlLessonPlayground
        caption="試す: 単価 = 単価 * 2 を 2 回実行しても 4 倍にはならない (右辺は更新前の値)"
        sql={`UPDATE 商品
SET 単価 = 単価 * 2
WHERE 分類 = 'B'`}
        datasetKey={lesson.datasetKey}
      />

      <h3>DELETE — 行を削除する</h3>
      <pre>
        <code>{`DELETE FROM 在庫 WHERE 在庫数 = 0`}</code>
      </pre>
      <p>
        <code>DELETE FROM 表名</code> の後に列は書きません。
        行ごと消す命令なので、「この列だけ消す」はできません
        （それは <code>UPDATE ... SET 列 = NULL</code> です）。
      </p>

      <SqlLessonPlayground
        caption="試す: WHERE の行を消すと全行が削除対象になる (リセットで戻せます)"
        sql={`DELETE FROM 在庫
WHERE 在庫数 = 0`}
        datasetKey={lesson.datasetKey}
      />

      <h2>WHERE を忘れると全行が対象になる</h2>
      <p>
        <strong>これが DML で最も重要な一点です。</strong>
      </p>
      <pre>
        <code>{`UPDATE 商品 SET 単価 = 0     -- 全商品の単価が 0 になる
DELETE FROM 在庫             -- 在庫が全部消える`}</code>
      </pre>
      <p>
        どちらも<strong>エラーになりません</strong>。文法的に正しいからです。
        下の Playground で <code>WHERE</code> の行を消して実行してみてください。
        差分表示で全行が対象になることが一目で分かります。
        （表はリセットボタンで元に戻るので、安心して試せます。）
      </p>

      <SqlLessonPlayground
        caption="試す: WHERE の行を消すと全 5 行が更新される"
        sql={`UPDATE 商品
SET 単価 = 0
WHERE 商品番号 = 'P01'`}
        datasetKey={lesson.datasetKey}
      />

      <h2>制約に違反する変更は拒否される</h2>
      <p>
        DML は<Link href="/fe/sql/lessons/ddl-constraints">制約</Link>の
        検査を受けます。主キーの重複、参照先の無い外部キー、
        非NULL 列への NULL などは実行時に拒否されます。
        次のレッスンで詳しく扱います。
      </p>

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>WHERE の無い UPDATE / DELETE が全行を対象にする</strong>こと</li>
        <li><strong>UPDATE の右辺が更新前の値</strong>で評価されること</li>
        <li>INSERT で列名を省略したときの並び順</li>
        <li>DELETE は行単位でしか消せないこと</li>
      </ul>
    </>
  );
}
