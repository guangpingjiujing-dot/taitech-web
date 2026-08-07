import { LessonPlayground } from "@/components/joho1/LessonPlayground";

export default function LoopWhileLesson() {
  return (
    <>
      <h2>「〜の間繰り返す：」</h2>
      <p>
        くり返す回数が最初から決まっていないときは、条件を書いて
        <code>条件 の間繰り返す：</code> の形にします。
        条件が成り立っている間だけ、中の処理をくり返します。
      </p>
      <p>
        条件は <strong>くり返しの前に毎回調べられます</strong>。
        最初から条件が成り立っていなければ、中の処理は 1 回も実行されません。
      </p>

      <h2>and と or で条件をつなぐ</h2>
      <p>
        条件を組み合わせるときは英語の <code>and</code> と <code>or</code> を使います。
      </p>
      <ul>
        <li><code>and</code> … 左右の<strong>どちらも</strong>成り立つときだけ成り立つ（かつ）</li>
        <li><code>or</code> … 左右の<strong>どちらか一方でも</strong>成り立てば成り立つ（または）</li>
      </ul>
      <p>
        試験では、この 2 つの意味が問題文のなかで毎回説明されます。
        記号を覚えていなくても解けるようになっているので、
        <strong>問題文の説明を読み落とさないこと</strong>のほうが大事です。
      </p>

      <LessonPlayground
        indexBase={1}
        code={`nokori = 100
kaisuu = 0
(nokori > 0) and (kaisuu < 10) の間繰り返す：
  nokori = nokori - 30
  kaisuu = kaisuu + 1
表示する(kaisuu, "回で残り", nokori)
`}
      />

      <h2>終わらない繰り返しに注意</h2>
      <p>
        条件に関わる変数を中で変えないと、条件がいつまでも成り立ったままになり、
        くり返しが終わりません。上のコードで <code>kaisuu = kaisuu + 1</code> の行を消すと
        どうなるか、1 行ずつ実行して確かめてみてください
        （最後まで実行すると止まらなくなるので、途中で「リセット」を押してください）。
      </p>
    </>
  );
}
