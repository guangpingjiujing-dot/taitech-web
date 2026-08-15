import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("view")!;

export const faq = [
  {
    q: "ビューにデータは保存されますか？",
    a: "保存されません。ビューは問合せに名前を付けたものなので、参照するたびに定義された SELECT が実行されます。だから元の表が変われば、ビューの内容も自動的に変わります。",
  },
  {
    q: "ビューは更新できますか？",
    a: "条件を満たせば更新できますが、集約や結合を含むビューは一般に更新できません。どの行を書き換えるべきかが一意に決まらないためです。この実行シミュレーターではビューの更新は行えません。",
  },
  {
    q: "ビューを使う利点は何ですか？",
    a: "複雑な問合せに名前を付けて再利用できること、見せたくない列を隠して必要な列だけを公開できること（アクセス権と組み合わせる）、そして元の表の構造が変わってもビューの定義で吸収できることです。",
  },
];

export default function ViewBody() {
  return (
    <>
      <h2>ビューは「名前を付けた問合せ」</h2>
      <p>
        <code>CREATE VIEW</code> は、SELECT 文に名前を付けて、
        あたかも表のように扱えるようにします。
      </p>
      <pre>
        <code>{`CREATE VIEW 高額商品 AS
  SELECT 商品番号, 商品名, 単価
  FROM 商品
  WHERE 単価 >= 200`}</code>
      </pre>
      <p>
        これ以降 <code>SELECT * FROM 高額商品</code> と書けます。
        使う側からは表と区別が付きません。
      </p>

      <h2>実表とビューの違い</h2>
      <p>
        実際にデータを持っている表を<strong>実表</strong>と呼び、
        ビューと区別します。
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>実表</th>
            <th>ビュー</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>データの実体</td>
            <td>持つ</td>
            <td><strong>持たない</strong></td>
          </tr>
          <tr>
            <td>参照したとき</td>
            <td>そのまま読む</td>
            <td>定義された SELECT を実行する</td>
          </tr>
          <tr>
            <td>元の表が変わると</td>
            <td>—</td>
            <td><strong>内容も変わる</strong></td>
          </tr>
          <tr>
            <td>更新</td>
            <td>できる</td>
            <td>条件を満たせばできる</td>
          </tr>
        </tbody>
      </table>

      <h2>元の表を変えるとビューも変わる</h2>
      <p>
        これがビューの本質です。下の Playground では:
      </p>
      <ol>
        <li>ビューを作る（単価 200 以上の商品）</li>
        <li>ビューを見る → 2 行</li>
        <li>ボールペンの単価を 1000 に更新する</li>
        <li>もう一度ビューを見る → <strong>3 行に増えている</strong></li>
      </ol>
      <p>
        ビューがデータを持っていたら、こうはなりません。
        <strong>参照のたびに問合せが実行し直されている</strong>証拠です。
      </p>

      <h2>ビューの使いどころ</h2>
      <ul>
        <li>
          <strong>複雑な問合せの再利用</strong>。長い結合を毎回書かずに済む
        </li>
        <li>
          <strong>列を隠す</strong>。給与の列を含まないビューだけを見せて、
          <Link href="/fe/sql/lessons/grant">アクセス権</Link>をビューに与える
        </li>
        <li>
          <strong>変更の吸収</strong>。元の表の構造が変わっても、
          ビューの定義側で調整すれば利用者側は書き換えなくてよい
        </li>
      </ul>

      <h2>ブラウザで動かしてみる</h2>
      <p>
        3 文をまとめて実行します。結果が文ごとに表示されるので、
        ビューの内容がどう変わるかを見比べてください。
      </p>

      <SqlLessonPlayground
        sql={`CREATE VIEW 高額商品 AS
  SELECT 商品番号, 商品名, 単価 FROM 商品 WHERE 単価 >= 200;

SELECT * FROM 高額商品;

UPDATE 商品 SET 単価 = 1000 WHERE 商品番号 = 'P01';

SELECT * FROM 高額商品`}
        datasetKey={lesson.datasetKey}
      />

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>ビューはデータを持たない</strong>こと（最頻出）</li>
        <li><strong>実表という用語</strong>とビューの対比</li>
        <li>ビューとアクセス権を組み合わせて列を隠す使い方</li>
        <li>集約や結合を含むビューが更新できない理由</li>
      </ul>
    </>
  );
}
