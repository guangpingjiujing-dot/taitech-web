import Link from "next/link";
import { Playground } from "@/components/fe/Playground";
import { findFeLesson } from "@/content/fe/lessons";

const lesson = findFeLesson("for")!;

const decreaseCode = `整数型: n ← 5
for (i を n から 1 まで 1 ずつ減らす)
  print(i)
endfor
`;

const stepTwoCode = `整数型: 合計 ← 0
for (i を 2 から 10 まで 2 ずつ増やす)
  合計 ← 合計 + i
endfor
print(合計)
`;

export const faq = [
  {
    q: "「〜まで」は終了値を含みますか？",
    a: "含みます。基本情報の擬似言語の for は開始値も終了値も含む閉区間で動きます。例えば「1 から 5 まで 1 ずつ増やす」は 1, 2, 3, 4, 5 の 5 回まわります。Python の range(1, 5) が 1〜4 になるのとは異なるので注意してください。",
  },
  {
    q: "「〜ずつ減らす」の書き方はありますか？",
    a: "あります。「i を n から 1 まで 1 ずつ減らす」のように書くと、変数を減らしながらループします。減らす方向のときは開始値のほうが終了値より大きい必要があります。",
  },
  {
    q: "for のループ変数はループの外でも使えますか？",
    a: "この実行シミュレーターでは、for のループ変数は for 文の中で自動的に宣言され、for が終わった後もその値 (終了値の次の値) を参照できます。ただし試験の解答では「ループ変数はループ内でのみ意味を持つ」と考えるのが安全です。",
  },
];

export default function ForBody() {
  return (
    <>
      <h2>「〜から〜まで〜ずつ増やす」がひとつの型</h2>
      <p>
        基本情報の for 文は、日本語らしい独自の書き方をします。
      </p>
      <pre>
        <code>{`for (i を 1 から n まで 1 ずつ増やす)
  // くり返したい処理
endfor`}</code>
      </pre>
      <p>
        <code>i</code> がループ変数、<code>1</code> が開始値、<code>n</code>{" "}
        が終了値、<code>1</code> が増分です。
        <strong>開始値も終了値も含む閉区間</strong>{" "}
        で動くので、「1 から 5 まで」は 1, 2, 3, 4, 5 の
        5 回まわります。Python の <code>range</code> と境界の扱いが違う点は、
        変換して読み比べると特に印象に残ります。
      </p>

      <h2>ブラウザで動かしてみる</h2>
      <p>
        1 から n までの合計を求める定番例。
        <strong>一行ずつ実行</strong> を押すと <code>i</code>{" "}
        が 1, 2, 3, 4, 5 と順に増え、<code>合計</code>{" "}
        が 1, 3, 6, 10, 15 と積み上がっていくのが右側の表で追えます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={lesson.sampleCode} />
      </div>

      <h2>減らす方向の for</h2>
      <p>
        カウントダウンのように減らしたいときは
        <code>ずつ減らす</code> を使い、開始値を終了値より大きくします。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={decreaseCode} />
      </div>
      <p>
        実行すると 5, 4, 3, 2, 1 と順に出力されます。増減の方向を間違えると
        1 回もループしない (または無限にまわらないだけで意図とズレる) ので、
        <strong>開始値と終了値の大小関係が方向と一致しているか</strong>{" "}
        を確認しましょう。
      </p>

      <h2>増分は 1 以外でも書ける</h2>
      <p>
        「1 ずつ」の部分は他の値でも構いません。例えば偶数だけを足したいときは
        「2 から 10 まで 2 ずつ増やす」と書けます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={stepTwoCode} />
      </div>
      <p>
        出力は <code>30</code> (= 2+4+6+8+10) になります。
        増分の値によっては終了値ちょうどでは止まらず、
        「終了値を超えない最後の値」まででループが終わる点にも注意してください。
      </p>

      <h2>for と while の使い分け</h2>
      <ul>
        <li>
          <strong>for が向くケース</strong>: 事前に「n 回まわす」と決まっている、
          または配列の全要素を頭から順に見たいとき
        </li>
        <li>
          <strong>while が向くケース</strong>:
          いつ終わるかを実行してみないと分からない、
          複雑な終了条件で判断するとき
        </li>
      </ul>
      <p>
        試験の選択肢でも「これは for でも while でも書けるが、意図が明確なのは？」
        という問い方が出ることがあります。回数が固定なら for、
        終了条件が動的なら while、と覚えておきましょう。
      </p>

      <h2>試験でつまずきやすいポイント</h2>
      <ul>
        <li>
          <strong>境界を含む / 含まない</strong>:
          擬似言語の for は「まで」を含む閉区間。
          Python の range とは違う
        </li>
        <li>
          <strong>方向の取り違え</strong>: <code>減らす</code>{" "}
          なのに開始値が終了値より小さい、と書くと 1 回もまわらない
        </li>
        <li>
          <strong>増分と回数の関係</strong>: 「1 から 10 まで 3 ずつ増やす」は
          1, 4, 7, 10 の 4 回。増分によって回数が変わるので手計算で確認する癖を
        </li>
        <li>
          <strong>ループ変数の再代入</strong>: 本体の中で{" "}
          <code>i ← i + 5</code> のようにループ変数を勝手にいじると、
          for の仕組みと衝突して意図しない挙動になる
        </li>
      </ul>

      <p>
        for が読めるようになったら、次は「大量のデータをまとめて扱う」ための{" "}
        <Link href="/fe/lessons/array">配列 (1 始まり)</Link>{" "}
        に進みましょう。for と組み合わせるとぐっと表現力が上がります。
      </p>
    </>
  );
}
