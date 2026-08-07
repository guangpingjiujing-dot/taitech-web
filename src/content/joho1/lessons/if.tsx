import { LessonPlayground } from "@/components/joho1/LessonPlayground";

export default function IfLesson() {
  return (
    <>
      <h2>もし〜ならば： と そうでなければ：</h2>
      <p>
        条件分岐は <code>もし 条件 ならば：</code> で始めます。行末のコロンを忘れないでください。
        条件が成り立ったときに実行したい処理は、次の行から <strong>字下げして</strong> 書きます。
      </p>
      <p>
        条件が成り立たなかったときの処理は <code>そうでなければ：</code> の下に書きます。
        <code>そうでなければ</code> は <code>もし</code> と同じ深さに置きます。
      </p>

      <h2>代入の = と比較の == は別物</h2>
      <p>
        ここが最もつまずきやすいところです。
      </p>
      <ul>
        <li><code>a = 1</code> … 変数 a に 1 を<strong>入れる</strong>（代入）</li>
        <li><code>a == 1</code> … a が 1 と<strong>等しいか調べる</strong>（比較）</li>
      </ul>
      <p>
        大小の比較は <code>&lt;</code> <code>&gt;</code> <code>&lt;=</code>{" "}
        <code>&gt;=</code> を使います。
      </p>

      <LessonPlayground
        indexBase={1}
        code={`tokuten = 72
もし tokuten >= 60 ならば：
  表示する("合格")
そうでなければ：
  表示する("不合格")
`}
      />

      <h2>どこまでがブロックかを見る</h2>
      <p>
        試験の問題冊子では、ブロックの範囲が行の左側の縦線で示されています。
        このシミュレーターも同じ見た目で線を引くので、
        <strong>どの行が条件の中に入っているのか</strong>を線でたどってください。
        条件分岐を読み違える原因のほとんどは、この範囲の取り違えです。
      </p>
    </>
  );
}
