import Link from "next/link";
import { Playground } from "@/components/fe/Playground";
import { findFeLesson } from "@/content/fe/lessons";

const lesson = findFeLesson("variable")!;

export const faq = [
  {
    q: "整数型と実数型は何が違いますか？",
    a: "整数型は 3 や -7 のような小数点のない値、実数型は 3.14 や -0.5 のような小数点を含む値を扱う型です。基本情報の擬似言語ではどちらも数値ですが、割り算などで挙動が変わるため使い分けます。",
  },
  {
    q: "「←」はキーボードでどう入力しますか？",
    a: "多くの環境では日本語入力の「やじるし」変換で ← が出せます。この実行シミュレーターでは半角の <- でも代用できるようになっており、内部的に ← と同じ意味で扱われます。",
  },
  {
    q: "型を書かずに変数を使えますか？",
    a: "書けません。擬似言語では「型: 名前」の形で必ず宣言してから使います。宣言なしで代入すると構文エラーになります。これは Python のような動的型付けとの大きな違いです。",
  },
];

export default function VariableBody() {
  return (
    <>
      <h2>変数は「型: 名前 ← 初期値」で宣言する</h2>
      <p>
        基本情報の擬似言語では、変数を使う前に必ず宣言します。書式は
        <code>型: 名前 ← 初期値</code> の 3 点セットで、初期値は省略できます。
      </p>
      <pre>
        <code>{`整数型: 個数            // 宣言だけ (値は未定義)
整数型: 個数 ← 3       // 宣言 + 初期化
整数型: 個数, 単価     // 同じ型なら複数まとめて宣言できる`}</code>
      </pre>
      <p>
        <code>←</code> は「右辺の値を左辺に入れる」ことを表す代入演算子です。
        Python の <code>=</code>、TypeScript の <code>=</code> に相当します。
        数学の等号ではなく <strong>方向を持った矢印</strong> なので、
        <code>3 ← 個数</code> のように逆に書くことはできません。
      </p>

      <h2>使える基本の型は 4 つ</h2>
      <p>基本情報の擬似言語で頻出する基本型は以下の 4 つです。</p>
      <ul>
        <li>
          <strong>整数型</strong>: 0, 1, -42 のような小数点のない数値
        </li>
        <li>
          <strong>実数型</strong>: 3.14, -0.5 のような小数点を含む数値
        </li>
        <li>
          <strong>文字列型</strong>: <code>&quot;abc&quot;</code>{" "}
          のようにダブルクォートで囲む
        </li>
        <li>
          <strong>論理型</strong>: <code>true</code> か <code>false</code>{" "}
          のどちらか一方
        </li>
      </ul>
      <p>
        型は間違えると実行時にエラーになります。例えば整数型の変数に
        文字列を代入することはできません。まずは正しい型に正しい値を入れる、
        という基本を体に染み込ませておきましょう。
      </p>

      <h2>ブラウザで動かしてみる</h2>
      <p>
        下のエディタに <code>個数 × 単価</code>{" "}
        で合計を計算する短いコードが入っています。
        <strong>▶実行</strong> を押すと最後まで実行され、
        <strong>一行ずつ実行</strong> を押すと 1 行ずつ止まりながら
        変数の値の変化を右側の表で追えます。値を書き換えて何度も試してみてください。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={lesson.sampleCode} showOpenInFullEditor />
      </div>
      <p>
        実行後、右側の変数テーブルに <code>個数</code>, <code>単価</code>,{" "}
        <code>合計</code> の 3 つが並び、出力コンソールに{" "}
        <code>{lesson.sampleOutput}</code> と表示されれば成功です。
      </p>

      <h2>初期化しないと「未定義」のまま</h2>
      <p>
        宣言だけして初期値を与えないと、その変数は「未定義の値」を持ちます。
        未定義の値を計算に使うと実行時エラーになるので、
        <strong>宣言と同時に初期値を与える</strong>{" "}
        のがおすすめです。特に足し込み用の変数は 0 で初期化するのが定石です。
      </p>
      <pre>
        <code>{`整数型: 合計 ← 0       // 0 で初期化して足し込む
整数型: 積 ← 1         // 1 で初期化して掛け込む`}</code>
      </pre>

      <h2>試験でつまずきやすいポイント</h2>
      <ul>
        <li>
          <strong>← と = の混同</strong>:
          比較は <code>=</code>、代入は <code>←</code>{" "}
          です。C 言語や JavaScript とは記号が逆に見えるので注意
        </li>
        <li>
          <strong>初期化忘れ</strong>:
          合計を計算するコードで初期化を忘れると「未定義 + 数値」となり実行時エラー
        </li>
        <li>
          <strong>型の取り違え</strong>: 整数型の変数に{" "}
          <code>3.14</code> のような実数を代入すると実行時エラー。試験でも「型がおかしい選択肢」がよく引っかけに使われます
        </li>
      </ul>

      <p>
        変数と型の書き方が読めるようになったら、次は{" "}
        <Link href="/fe/lessons/if">条件分岐 (if / elseif / else)</Link>{" "}
        に進みましょう。
      </p>
    </>
  );
}
