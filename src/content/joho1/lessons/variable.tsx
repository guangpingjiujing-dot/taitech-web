import { LessonPlayground } from "@/components/joho1/LessonPlayground";

export default function VariableLesson() {
  return (
    <>
      <h2>代入は = で書く</h2>
      <p>
        共通テストのプログラム表記では、変数に値を入れるのに <code>=</code> を使います。
        数学の「等しい」ではなく「右の値を左の変数に入れる」という意味なので、
        <code>kingaku = 46</code> は「変数 kingaku を 46 にする」と読みます。
      </p>
      <p>
        型を先に宣言する必要はありません。代入した時点でその変数が使えるようになります。
      </p>

      <h2>カンマで区切ると 1 行に複数書ける</h2>
      <p>
        <code>maisu = 0, nokori = kingaku</code> のように、カンマで区切って
        1 行に複数の代入を並べられます。実際の試験でもこの書き方が出ています。
        左から順に実行されるので、右側で左側の結果を使えます。
      </p>

      <h2>表示する() で結果を出す</h2>
      <p>
        画面に出したいものは <code>表示する()</code> のカッコの中にカンマで区切って並べます。
        文字列は <code>&quot;&quot;</code> で囲みます。並べたものは
        <strong>すき間なくつながって</strong> 1 行として表示されます。
      </p>

      <LessonPlayground slug="variable" />

      <h2>試験ではどう問われるか</h2>
      <p>
        代入そのものが単独で問われることはほとんどありません。
        問われるのは <strong>「この行を実行した後、変数がいくつになっているか」</strong> です。
        1 行ずつ実行して、右のパネルの数字がどう変わるかを目で追う練習をしておくと、
        繰り返しに入ったときに迷わなくなります。
      </p>
    </>
  );
}
