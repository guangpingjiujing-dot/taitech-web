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

      <LessonPlayground slug="loop-while" />

      <h2>終わらない繰り返しに注意</h2>
      <p>
        条件に関わる変数を中で変えないと、条件がいつまでも成り立ったままになり、
        くり返しが終わりません。上のコードで <code>kaisuu = kaisuu + 1</code> の行を消して
        実行してみてください。
      </p>
      <p>
        このシミュレーターには実行回数の上限があるので、ブラウザが固まることはありません。
        1 秒ほどで止まり、<strong>「実行ステップが 100000 を超えました。無限ループに
        なっていませんか?」</strong> と表示されます。試験でこの形のミスをすると、
        プログラムが答えを出さないまま終わります。
      </p>
    </>
  );
}
