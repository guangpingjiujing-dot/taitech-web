import Link from "next/link";
import { Playground } from "@/components/fe/Playground";
import { findFeLesson } from "@/content/fe/lessons";

const lesson = findFeLesson("while")!;

const halfCode = `整数型: n ← 100
整数型: 回数 ← 0
while (n > 1)
  n ← n / 2
  回数 ← 回数 + 1
endwhile
print(回数)
`;

export const faq = [
  {
    q: "while ループは何回まわりますか？",
    a: "条件が true である限り何回でもまわります。ループ本体の中で条件に絡む変数を更新して、いずれ false になるように書くのが基本です。更新を忘れると無限ループになります。",
  },
  {
    q: "無限ループを書いてしまったらどうなりますか？",
    a: "この実行シミュレーターでは 100000 ステップを超えると自動的に停止し、「実行ステップが上限に達しました」というメッセージが出ます。ブラウザが固まる心配はありません。試験では手計算で無限ループを見抜く力が問われます。",
  },
  {
    q: "do-while (最初に 1 回実行してから条件判定) はありますか？",
    a: "基本情報の擬似言語には do-while に相当する構文もありますが、頻度は while より低めです。この実行シミュレーターでは Ver.5.1 の一般的な while / endwhile のみを対象にしています。",
  },
];

export default function WhileBody() {
  return (
    <>
      <h2>while は「条件が真の間くり返す」</h2>
      <p>
        <code>while (条件) ... endwhile</code>{" "}
        は、条件が真である間、間に挟まれた処理を何度もくり返します。
        条件が最初から偽なら 1 回もまわりません。
      </p>
      <pre>
        <code>{`while (条件)
  // くり返したい処理
endwhile`}</code>
      </pre>
      <p>
        条件式のカッコは省略できません。<code>endwhile</code> で必ず閉じます。
        for 文と違って、ループ変数の初期化・更新は
        <strong>プログラマが自分で書く</strong> 必要があります。
      </p>

      <h2>ブラウザで動かしてみる</h2>
      <p>
        1 から n までの合計を求める典型例です。
        <code>i</code> を 1 で初期化し、
        本体の最後で <code>i ← i + 1</code> と 1 ずつ増やしています。
        <strong>一行ずつ実行</strong>{" "}
        を押していくと、<code>i</code> と <code>合計</code>{" "}
        が交互に変わっていく様子を右側の表で追えます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={lesson.sampleCode} showOpenInFullEditor compact />
      </div>
      <p>
        <code>n</code> を 10 や 100 に変えて再実行すると、
        出力される合計値がガウス和 (<code>n(n+1)/2</code>)
        と一致することが確認できます。
      </p>

      <h2>「更新を忘れると無限ループ」の落とし穴</h2>
      <p>
        while で最も多いバグが、
        <strong>ループ本体で条件に絡む変数を更新し忘れる</strong>{" "}
        ことです。次のコードは <code>i ← i + 1</code>{" "}
        を書き忘れているので、<code>i</code> は永遠に 1 のまま、条件{" "}
        <code>i ≦ 5</code> はずっと真、ループは止まりません。
      </p>
      <pre>
        <code>{`整数型: i ← 1
while (i ≦ 5)   // ← 本体で i を増やさないと永遠にまわる
  print(i)
endwhile`}</code>
      </pre>
      <p>
        この実行シミュレーターは 100000 ステップを超えると自動停止しますが、
        試験問題では手で追いかけて「これは止まるか？」を判断する必要があります。
        <strong>ループ条件に出てくる変数が、本体で必ず条件を偽に近づける方向に更新されているか</strong>{" "}
        を先にチェックする癖をつけましょう。
      </p>

      <h2>回数が事前に分からない場合の while</h2>
      <p>
        for が「n 回まわす」向きなのに対し、while は
        「いつ終わるか事前に分からない繰り返し」に向いています。
        次の例は 100 を 2 で割り続けて 1 になるまで何回かかるかを数えます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={halfCode} showOpenInFullEditor compact />
      </div>
      <p>
        こういう「終了条件が動的に決まる」処理は for では書きにくく、while
        の方が自然です。for と while の使い分けの感覚は{" "}
        <Link href="/fe/lessons/for">次の for のレッスン</Link>{" "}
        と読み比べると掴めます。
      </p>

      <h2>試験でつまずきやすいポイント</h2>
      <ul>
        <li>
          <strong>更新式の位置</strong>: <code>i ← i + 1</code>{" "}
          を本体の先頭に書くのか末尾に書くのかで、出力がずれる問題がよく出る
        </li>
        <li>
          <strong>境界条件</strong>: <code>while (i ≦ n)</code> と{" "}
          <code>while (i &lt; n)</code>{" "}
          で 1 回分の差が出る。「以下 / より小さい」で n 回目を含むか変わる
        </li>
        <li>
          <strong>初期化の位置</strong>: while の外で 1 度だけ初期化するべきものを、
          本体の中に書いてしまうと毎ループで初期化されて意図と違う挙動になる
        </li>
      </ul>

      <p>
        while が読めるようになったら、次は「回数を明示する」形の{" "}
        <Link href="/fe/lessons/for">繰り返し (for)</Link>{" "}
        に進みましょう。境界条件の考え方は共通です。
      </p>
    </>
  );
}
