import Link from "next/link";
import { Playground } from "@/components/fe/Playground";
import { findFeLesson } from "@/content/fe/lessons";

const lesson = findFeLesson("if")!;

const rangeCode = `整数型: 気温 ← 18
if (気温 ≧ 30 and 気温 < 40)
  print("猛暑")
elseif (気温 ≧ 15 and 気温 < 30)
  print("快適")
else
  print("寒い")
endif
`;

export const faq = [
  {
    q: "elseif は else if と分けて書けますか？",
    a: "基本情報の擬似言語では 1 語の elseif で書きます。else if のように 2 語に分けると構文エラーになります。試験の選択肢でも elseif で統一されています。",
  },
  {
    q: "条件式の括弧は省略できますか？",
    a: "できません。if / elseif / while など条件を受け取る構文では、条件式全体を必ず () で囲みます。これは他の言語 (Python など) と違う点なので注意してください。",
  },
  {
    q: "then を書くこともありますか？",
    a: "IPA 公表の Ver.5.1 では then は書きません。ただし過去の擬似言語では then が付く記法もあったため、この実行シミュレーターでは then を書いても書かなくても動くよう寛容に扱います。",
  },
];

export default function IfBody() {
  return (
    <>
      <h2>if / elseif / else / endif の 4 点セット</h2>
      <p>
        基本情報の条件分岐は、次の 4 つのキーワードで組み立てます。
      </p>
      <pre>
        <code>{`if (条件A)
  // 条件A が true のときの処理
elseif (条件B)
  // 条件A が false かつ 条件B が true のときの処理
else
  // 上のどれにも当てはまらないときの処理
endif`}</code>
      </pre>
      <p>
        条件式は必ず <code>(...)</code> で囲みます。
        <code>elseif</code> と <code>else</code> は省略可能で、
        「true のときだけ何かをやる」用途なら <code>if</code> と{" "}
        <code>endif</code> だけでも書けます。
        一方 <code>endif</code> は絶対に必要で、これがないとどこまでが if
        の中身か分からず構文エラーになります。
      </p>

      <h2>ブラウザで動かしてみる</h2>
      <p>
        点数によって成績を「優 / 良 / 不可」に分ける典型例です。
        <strong>一行ずつ実行</strong>{" "}
        を押していくと、どの分岐に入るかを目で追えます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={lesson.sampleCode} showOpenInFullEditor compact />
      </div>
      <p>
        <code>点数</code> を 90 や 55 に書き換えて再実行すると、
        出力が <code>優</code> や <code>不可</code>{" "}
        に変わります。境界値 (60, 80) をまたぐ変更を試すと、
        <code>&gt;</code> と <code>≧</code> の違いが実感できます。
      </p>

      <h2>比較演算子は 6 種類</h2>
      <ul>
        <li>
          <code>=</code>{" "}
          <strong>等しい</strong> (代入の <code>←</code> と混同しないこと)
        </li>
        <li>
          <code>≠</code> <strong>等しくない</strong> (半角 <code>!=</code> でも可)
        </li>
        <li>
          <code>&lt;</code>, <code>&gt;</code> <strong>より小さい / より大きい</strong>
        </li>
        <li>
          <code>≦</code>, <code>≧</code>{" "}
          <strong>以下 / 以上</strong> (境界値を含む。半角 <code>&lt;=</code>,{" "}
          <code>&gt;=</code> でも可)
        </li>
      </ul>
      <p>
        試験では「以上」なのか「より大きい」なのかを引っかけてくる問題が多く出ます。
        <strong>「以上・以下は境界値を含む」</strong> を常に意識しましょう。
      </p>

      <h2>and / or / not で条件を組み合わせる</h2>
      <p>
        複数の条件を組み合わせるには <code>and</code> (かつ)、
        <code>or</code> (または)、<code>not</code> (でない) を使います。
        例えば「気温が 15℃ 以上かつ 30℃ 未満」は次のように書けます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={rangeCode} showOpenInFullEditor compact />
      </div>
      <p>
        条件式は左から順に評価されます。<code>and</code> は両方が真のときだけ真、
        <code>or</code> はどちらかが真なら真、<code>not</code> は真偽をひっくり返す
        — この 3 つを覚えれば大抵の分岐は表現できます。
      </p>

      <h2>試験でつまずきやすいポイント</h2>
      <ul>
        <li>
          <strong>括弧忘れ</strong>: <code>if 点数 &gt; 80</code>{" "}
          のように括弧を書き忘れると構文エラー
        </li>
        <li>
          <strong>endif 忘れ</strong>:
          ネストした if で内側の endif を書き忘れて外側が閉じない、というミスがよくある
        </li>
        <li>
          <strong>= と ← の混同</strong>:
          比較で <code>点数 ← 80</code>{" "}
          と書くと代入になり、条件式にならない
        </li>
        <li>
          <strong>elseif は 1 語</strong>: <code>else if</code>{" "}
          と分けて書くと構文エラー
        </li>
      </ul>

      <p>
        条件分岐が読めるようになったら、次は{" "}
        <Link href="/fe/algorithm/lessons/while">繰り返し (while)</Link>{" "}
        で「同じ処理を何度も実行する書き方」に進みましょう。
      </p>
    </>
  );
}
