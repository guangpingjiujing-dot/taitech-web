import Link from "next/link";
import { LessonPlayground } from "@/components/joho1/LessonPlayground";

export default function ArrayLesson() {
  return (
    <>
      <h2>[ ] で並べて作る</h2>
      <p>
        配列は <code>[ ]</code> の中に値をカンマで区切って並べて作ります。
        <code>Tokuten = [70, 85, 92, 60, 78]</code> のように書き、
        取り出すときは <code>Tokuten[2]</code> のように名前のうしろに添字を書きます。
      </p>
      <p>
        試験のプログラムでは、<strong>配列の名前だけ大文字で始める</strong>のが慣習です
        （<code>Tokuten</code>、<code>Kouka</code>）。ふつうの変数は小文字で始まります。
        名前の形を見るだけで配列かどうかが分かるので、読むときの手がかりになります。
      </p>

      <h2>添字は 0 からとは限らない</h2>
      <p>
        ここがこの科目でいちばん事故になるところです。
        <strong>添字が 0 から始まるか 1 から始まるかは、言語で決まっていません。</strong>
        問題文のなかで毎回指定されます。実際の出題を並べるとこうなっています。
      </p>
      <table>
        <thead>
          <tr>
            <th>出題</th>
            <th>添字</th>
            <th>問題文の書かれ方</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>試作問題</td>
            <td>0 から</td>
            <td>「配列の添字は 0 から始まるものとする」</td>
          </tr>
          <tr>
            <td>令和 7 年度 本試験</td>
            <td>1 から</td>
            <td>「この配列の添字（1 から始まる。）」</td>
          </tr>
          <tr>
            <td>令和 8 年度 本試験</td>
            <td>1 から</td>
            <td>「すべての配列の添字は 1 から始まり」</td>
          </tr>
          <tr>
            <td>令和 8 年度 追試験</td>
            <td>0 から</td>
            <td>分野の番号をそのまま添字にする</td>
          </tr>
        </tbody>
      </table>
      <p>
        同じ年度でも本試験と追試験で違います。
        <strong>「情報Iの配列は 1 から」と覚えてはいけません。</strong>
        問題を開いたら、まず添字の指定を探すのが正しい手順です。
      </p>

      <h2>繰り返しと組み合わせる</h2>
      <p>
        配列は繰り返しと組み合わせて、全部の要素を順に見るのが定番です。
        添字が 0 からなら <code>0 から 要素数 - 1 まで</code>、
        1 からなら <code>1 から 要素数 まで</code> になります。
        下のコードは 0 から始まる前提で書いてあります。
        シミュレーターの「配列の添字」を 1 に切り替えると何が起きるか、試してみてください。
      </p>

      <LessonPlayground
        indexBase={0}
        code={`Tokuten = [70, 85, 92, 60, 78]
goukei = 0
i を 0 から 4 まで 1 ずつ増やしながら繰り返す：
  goukei = goukei + Tokuten[i]
表示する("合計は", goukei)
`}
      />

      <p>
        要素の個数は <code>要素数()</code> で求められますが、これは
        言語に最初から用意されている関数ではなく、問題文で与えられるものです。
        詳しくは{" "}
        <Link href="/joho1/lessons/function">外部関数の読み方</Link> を読んでください。
      </p>
    </>
  );
}
