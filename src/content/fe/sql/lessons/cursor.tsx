import Link from "next/link";

export const faq = [
  {
    q: "なぜカーソルが必要なのですか？",
    a: "SQL は「複数行の集合」を一度に返しますが、C や Java のようなプログラム言語の変数は 1 つの値しか持てません。この食い違いを埋めるため、結果に位置を持たせて 1 行ずつ取り出す仕組みがカーソルです。",
  },
  {
    q: "会話型SQL と埋込みSQL の違いは何ですか？",
    a: "会話型SQL は端末から直接 SQL を打ち込んで結果を見る使い方（独立言語方式）です。埋込みSQL は他のプログラム言語のソースコードに SQL を書き込む使い方（親言語方式）で、結果をホスト言語の変数に受け取ります。",
  },
  {
    q: "1 行しか返らないと分かっている場合もカーソルが要りますか？",
    a: "要りません。SELECT ... INTO でホスト変数に直接受け取れます。カーソルが必要になるのは、結果が複数行になりうる場合だけです。",
  },
];

export default function CursorBody() {
  return (
    <>
      <div className="not-prose my-6 rounded-lg border border-[var(--border-strong)] bg-[var(--muted)]/60 p-4 text-sm">
        <p className="font-bold">このレッスンは解説のみです</p>
        <p className="mt-2 leading-relaxed" style={{ textWrap: "pretty" }}>
          埋込みSQL は C や Java などのホスト言語があって初めて成立するため、
          このツールでは実行できません。試験では書式より
          <strong>「なぜこの仕組みが要るのか」</strong>が問われるので、
          そこを中心に解説します。
        </p>
      </div>

      <h2>SQL の使われ方は 2 通りある</h2>
      <table>
        <thead>
          <tr>
            <th>方式</th>
            <th>呼び方</th>
            <th>使い方</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>独立言語方式</td>
            <td><strong>会話型SQL</strong></td>
            <td>端末から SQL を直接打ち込んで結果を見る</td>
          </tr>
          <tr>
            <td>親言語方式</td>
            <td><strong>埋込みSQL</strong> / モジュール言語</td>
            <td>他の言語のプログラムから SQL を使う</td>
          </tr>
        </tbody>
      </table>
      <p>
        このページの Playground は会話型SQL に相当します。
        アプリケーションから使う場合は親言語方式になります。
      </p>

      <h2>なぜカーソルが必要になるのか</h2>
      <p>
        ここが本質です。<strong>SQL と手続き型言語では「一度に扱える量」が違います。</strong>
      </p>
      <ul>
        <li>SQL の SELECT は<strong>複数行の集合</strong>を返す</li>
        <li>C や Java の変数は<strong>1 つの値</strong>しか持てない</li>
      </ul>
      <p>
        100 行返ってきた結果を、変数 1 つには入れられません。
        そこで<strong>結果に「今どの行を見ているか」という位置を持たせ、
        1 行ずつ取り出す</strong>仕組みが用意されました。これがカーソルです。
      </p>
      <p>
        <Link href="/fe/algorithm">科目 B の擬似言語</Link>で配列を
        <code>for</code> で 1 要素ずつ回すのと同じ発想です。
      </p>

      <h2>カーソルの 4 つの命令</h2>
      <pre>
        <code>{`DECLARE 商品カーソル CURSOR FOR
  SELECT 商品番号, 商品名 FROM 商品 WHERE 分類 = 'A';

OPEN 商品カーソル;              -- 問合せを実行し、先頭の手前に位置づける

FETCH 商品カーソル INTO :番号, :名前;   -- 1 行取り出して変数へ

CLOSE 商品カーソル;             -- 使い終わったら閉じる`}</code>
      </pre>
      <ol>
        <li><strong>DECLARE</strong> — どの問合せに対するカーソルかを宣言する</li>
        <li><strong>OPEN</strong> — 問合せを実行する</li>
        <li><strong>FETCH</strong> — 1 行取り出してホスト変数に入れる。<strong>繰り返し呼ぶ</strong></li>
        <li><strong>CLOSE</strong> — 閉じる</li>
      </ol>
      <p>
        <code>:番号</code> のようにコロンが付いているのが<strong>ホスト変数</strong>
        （ホスト言語側の変数）です。SQL の中で参照するときにコロンを付けて区別します。
      </p>

      <h2>取り出す行が無くなったら</h2>
      <p>
        FETCH を繰り返して最後の行を超えると、
        <strong>「もう行が無い」ことを示す状態</strong>が返ります
        （SQLSTATE や SQLCODE で判定します）。
        プログラム側はこれを見てループを抜けます。
      </p>

      <h2>1 行しか返らないならカーソルは要らない</h2>
      <pre>
        <code>{`SELECT 商品名 INTO :名前 FROM 商品 WHERE 商品番号 = 'P01'`}</code>
      </pre>
      <p>
        主キーで 1 行に決まる場合は <code>SELECT ... INTO</code> で
        直接ホスト変数に受け取れます。
        <strong>カーソルが必要なのは、結果が複数行になりうるときだけ</strong>です。
      </p>

      <h2>試験で問われるポイント</h2>
      <ul>
        <li>
          <strong>カーソルが必要な理由</strong>。
          「SQL は集合を返すが、手続き型言語は 1 行ずつしか扱えない」
        </li>
        <li><strong>DECLARE → OPEN → FETCH → CLOSE の順序</strong></li>
        <li><strong>会話型SQL（独立言語方式）と埋込みSQL（親言語方式）</strong>の区別</li>
        <li>ホスト変数にコロンを付けること</li>
      </ul>
    </>
  );
}
