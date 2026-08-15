import Link from "next/link";
import { SqlLessonPlayground } from "@/components/sql/SqlLessonPlayground";
import { findSqlLesson } from "@/content/fe/sql/lessons";

const lesson = findSqlLesson("ddl-constraints")!;

export const faq = [
  {
    q: "主キーと一意性制約 (UNIQUE) は何が違いますか？",
    a: "どちらも重複を許しませんが、主キーは NULL も許しません。UNIQUE は NULL を許し、NULL どうしは重複と見なされません。また主キーは 1 つの表に 1 つだけですが、UNIQUE は複数付けられます。",
  },
  {
    q: "参照制約があると、親の行はいつ消せなくなりますか？",
    a: "その行を参照している子の行が 1 つでも残っている間は消せません。先に子を消すか、参照を別の行に付け替える必要があります。子を残したまま親を消そうとすると参照制約違反になります。",
  },
  {
    q: "DDL と DML の違いは何ですか？",
    a: "DDL はデータ定義言語で、表やビューといった入れ物の構造を定義します (CREATE / DROP / ALTER)。DML はデータ操作言語で、入れ物の中身を読み書きします (SELECT / INSERT / UPDATE / DELETE)。",
  },
];

export default function DdlConstraintsBody() {
  return (
    <>
      <h2>CREATE TABLE で表の構造を決める</h2>
      <p>
        表を作る命令が <code>CREATE TABLE</code> です。
        表やビューの構造を定義するこうした命令を<strong>DDL（データ定義言語）</strong>、
        中身を読み書きする命令を<strong>DML（データ操作言語）</strong>と呼びます。
      </p>
      <pre>
        <code>{`CREATE TABLE 在庫 (
  商品番号 CHAR(4) NOT NULL,
  倉庫     CHAR(2) NOT NULL,
  在庫数   INT CHECK (在庫数 >= 0),
  PRIMARY KEY (商品番号, 倉庫),
  FOREIGN KEY (商品番号) REFERENCES 商品(商品番号)
)`}</code>
      </pre>

      <SqlLessonPlayground
        caption="試す: 作った表に INSERT してから SELECT で確かめる"
        sql={`CREATE TABLE 発注 (
  発注番号 CHAR(4) PRIMARY KEY,
  商品番号 CHAR(4) REFERENCES 商品(商品番号),
  数量 INT CHECK (数量 > 0)
);

INSERT INTO 発注 VALUES ('R01', 'P01', 5);

SELECT * FROM 発注`}
        datasetKey={lesson.datasetKey}
      />

      <h2>4 つの制約</h2>
      <p>
        制約は「この表に入ってよい値の条件」を宣言しておく仕組みです。
        違反する操作は<strong>実行時に拒否</strong>されます。
      </p>
      <table>
        <thead>
          <tr>
            <th>制約</th>
            <th>書き方</th>
            <th>拒否するもの</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>一意性制約</td>
            <td><code>PRIMARY KEY</code> / <code>UNIQUE</code></td>
            <td>重複する値</td>
          </tr>
          <tr>
            <td>参照制約</td>
            <td><code>FOREIGN KEY ... REFERENCES</code></td>
            <td>参照先に存在しない値</td>
          </tr>
          <tr>
            <td>検査制約</td>
            <td><code>CHECK (条件)</code></td>
            <td>条件を満たさない値</td>
          </tr>
          <tr>
            <td>非NULL制約</td>
            <td><code>NOT NULL</code></td>
            <td>NULL</td>
          </tr>
        </tbody>
      </table>

      <h2>主キーと UNIQUE の違い</h2>
      <ul>
        <li><strong>主キーは NULL を許さない</strong>が、UNIQUE は許す</li>
        <li>UNIQUE では <strong>NULL どうしは重複と見なされない</strong>（何個でも入る）</li>
        <li>主キーは 1 表に 1 つだけ、UNIQUE は複数付けられる</li>
      </ul>
      <p>
        なお、複数の列をまとめて主キーにすることもできます
        （上の例の <code>PRIMARY KEY (商品番号, 倉庫)</code>）。
        この場合は<strong>組み合わせが重複しなければよい</strong>ので、
        商品番号が同じ行が複数あっても倉庫が違えば入ります。
      </p>

      <SqlLessonPlayground
        caption="試す: 商品番号 を P01 に変えると主キーの重複で弾かれる"
        sql={`INSERT INTO 商品 VALUES ('P06', 'クリップ', 'C', 60)`}
        datasetKey={lesson.datasetKey}
      />

      <h2>参照制約は「両方向」に効く</h2>
      <p>
        参照制約はよく「子に変な値を入れさせない」と説明されますが、
        <strong>親を消せなくする</strong>効果もあります。
      </p>
      <ul>
        <li>子に、親に存在しない値を <code>INSERT</code> できない</li>
        <li>子から参照されている親の行を <code>DELETE</code> できない</li>
        <li>子から参照されている親のキーを <code>UPDATE</code> できない</li>
      </ul>
      <p>
        制約が「なぜ必要なのか」は
        <Link href="/why-need-rdb/referential-integrity">参照整合性の解説</Link>
        で扱っています。
      </p>

      <h2>ブラウザで壊してみる</h2>
      <p>
        下の SQL は<strong>参照制約に違反する INSERT</strong> です。
        実行すると、どの制約に違反したかと、
        <strong>表のどの行が問題なのか</strong>が表示されます。
      </p>
      <p>
        次の SQL も試してみてください（表はリセットで元に戻ります）。
      </p>
      <ul>
        <li><code>INSERT INTO 商品 VALUES (&apos;P01&apos;, &apos;重複&apos;, &apos;A&apos;, 1)</code> — 主キーの重複</li>
        <li><code>INSERT INTO 商品 VALUES (&apos;P06&apos;, NULL, &apos;A&apos;, 1)</code> — 非NULL制約</li>
        <li><code>DELETE FROM 商品 WHERE 商品番号 = &apos;P01&apos;</code> — 子から参照されている親</li>
      </ul>

      <SqlLessonPlayground
        caption="試す: 上の 3 つの SQL に書き換えて、それぞれどの制約で弾かれるか見る"
        sql={lesson.sampleSql!}
        datasetKey={lesson.datasetKey}
      />

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>主キーと UNIQUE の違い</strong>（NULL を許すかどうか）</li>
        <li><strong>参照制約が親の DELETE / UPDATE も止める</strong>こと</li>
        <li>複合主キーで「重複」と見なされる条件</li>
        <li>DDL と DML の分類（どの命令がどちらか）</li>
      </ul>
    </>
  );
}
