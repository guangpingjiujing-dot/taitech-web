import Link from "next/link";
import { Playground } from "@/components/fe/Playground";
import { findFeLesson } from "@/content/fe/lessons";

const lesson = findFeLesson("array")!;

const maxCode = `整数型の配列: 点数 ← {70, 85, 92, 60, 78}
整数型: 最大 ← 点数[1]
for (i を 2 から 5 まで 1 ずつ増やす)
  if (点数[i] > 最大)
    最大 ← 点数[i]
  endif
endfor
print(最大)
`;

const outOfRangeCode = `整数型の配列: 点数 ← {70, 85, 92}
print(点数[0])   // 0 番目は存在しない → 実行時エラー
`;

export const faq = [
  {
    q: "なぜ配列が 1 始まりなのですか？",
    a: "IPA が試験用に定めた擬似言語の仕様がそうなっているためです。Java や Python など多くの言語が 0 始まりなのに対し、擬似言語は 1 始まりです。「1 番目の要素」「n 番目の要素」という日本語表現と一致するので、初学者には直感的だという設計方針です。",
  },
  {
    q: "配列の長さはどう取得しますか？",
    a: "基本情報の擬似言語には配列長を取得する共通の組み込み関数はなく、問題文で「要素数を n とする」のように与えられるのが普通です。実行シミュレーターで配列を扱うときも、要素数を別変数に持たせて扱ってください。",
  },
  {
    q: "arr[0] にアクセスしたらどうなりますか？",
    a: "配列の 0 番目は存在しないので、実行時エラー (添字が範囲外) になります。この実行シミュレーターでは「配列の添字は 1 から始まります」というヒント付きのエラーが表示されます。",
  },
];

export default function ArrayBody() {
  return (
    <>
      <h2>配列は「型の配列: 名前 ← {"{要素1, 要素2, ...}"}」</h2>
      <p>
        複数の値をまとめて扱いたいときは配列を使います。
      </p>
      <pre>
        <code>{`整数型の配列: 点数 ← {70, 85, 92, 60, 78}
文字列型の配列: 名前 ← {"太郎", "花子", "次郎"}`}</code>
      </pre>
      <p>
        <code>型の配列</code>{" "}
        で「その型の要素だけを入れる配列」を宣言します。
        初期値は波括弧 <code>{"{ ... }"}</code>{" "}
        の中にカンマ区切りで並べます。
        配列も宣言と初期化はまとめて 1 行に書けます。
      </p>

      <h2>添字は 1 から始まる (0 ではない)</h2>
      <p>
        <strong>基本情報の擬似言語では、配列の添字は 1 から始まります。</strong>{" "}
        Java や Python の 0 始まりとは違うので、これが最も引っかかりやすいポイントです。
      </p>
      <pre>
        <code>{`点数[1]   // 先頭要素 → 70
点数[3]   // 3 番目 → 92
点数[5]   // 末尾要素 → 78`}</code>
      </pre>
      <p>
        <code>点数[0]</code> や <code>点数[6]</code>{" "}
        にアクセスすると「添字が範囲外」の実行時エラーになります。
        下のコードでエラーの様子を確認できます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={outOfRangeCode} showOpenInFullEditor compact />
      </div>

      <h2>ブラウザで動かしてみる</h2>
      <p>
        配列と for を組み合わせて、5 人分の点数の合計を求める例です。
        for の <code>i</code> は 1 から 5 まで動くので、
        <code>点数[i]</code> で 1 番目から 5 番目までを順に足していきます。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={lesson.sampleCode} showOpenInFullEditor compact />
      </div>
      <p>
        出力は <code>{lesson.sampleOutput}</code> になります。
        <strong>一行ずつ実行</strong> を押していくと、
        <code>合計</code> が 70, 155, 247, 307, 385 と積み上がっていく様子を追えます。
      </p>

      <h2>要素の書き換えと最大値の探索</h2>
      <p>
        <code>点数[i] ← 新しい値</code> の形で要素を書き換えることもできます。
        次の例は「最初の要素を仮の最大値として、
        残りの要素と比べて更新していく」典型的な最大値探索です。
      </p>
      <div className="not-prose my-6">
        <Playground initialCode={maxCode} showOpenInFullEditor compact />
      </div>
      <p>
        出力は <code>92</code> です。
        「先頭を仮の最大値にする → 残りと比べて大きければ更新する」というアルゴリズムは、
        科目 B の頻出パターンなのでコードを目で追えるようにしておきましょう。
      </p>

      <h2>Python / TypeScript との違い</h2>
      <p>
        擬似言語が 1 始まりなのに対し、Python も TypeScript も 0 始まりです。
        この実行シミュレーターの{" "}
        <Link href="/fe/algorithm/transpile">多言語横並び比較ツール</Link>{" "}
        で変換すると、擬似言語の <code>arr[i]</code> が Python / TypeScript
        の <code>arr[i - 1]</code> に置き換わり、
        <strong>「擬似言語は 1 始まりなので -1」</strong>{" "}
        というコメントが自動で付きます。
      </p>
      <p>
        なぜ -1 されるのか、その理由を目で確かめると、
        「擬似言語の添字と実際の言語の添字がずれる」感覚が体に染みつきます。
      </p>

      <h2>試験でつまずきやすいポイント</h2>
      <ul>
        <li>
          <strong>1 始まりを忘れる</strong>: 「n 個の要素なら for は 1 から n まで」
          — 0 から始めると 1 個ずつずれた答えになる
        </li>
        <li>
          <strong>範囲外アクセス</strong>: <code>点数[n + 1]</code>{" "}
          のように 1 つ超えた添字を書いてしまう
        </li>
        <li>
          <strong>初期値の型と配列の型がずれる</strong>: 整数型の配列に{" "}
          <code>{"{1.5, 2, 3}"}</code> のような実数を入れると型不整合エラー
        </li>
        <li>
          <strong>配列を関数に渡す</strong>: 擬似言語では
          「配列を丸ごと引数にする」ような書き方は避けられがちで、
          要素数と要素を別々に受け取る問題文が多い
        </li>
      </ul>

      <p>
        配列が読めるようになったら、最後のレッスン{" "}
        <Link href="/fe/algorithm/lessons/function">関数と手続き</Link>{" "}
        に進みましょう。処理をまとめて名前を付けると、コードがぐっと読みやすくなります。
      </p>
    </>
  );
}
