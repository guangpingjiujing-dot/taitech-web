import Link from "next/link";

export const faq = [
  {
    q: "GRANT はこの実行シミュレーターで試せますか？",
    a: "試せません。GRANT は「誰に」権限を与えるかを指定する命令で、データベースの利用者アカウントという概念が必要になります。このツールはブラウザ内で表だけを扱うため、利用者を持っていません。試験範囲なので解説だけを置いています。",
  },
  {
    q: "WITH GRANT OPTION を付けるとどうなりますか？",
    a: "権限を与えられた利用者が、さらに別の利用者へ同じ権限を与えられるようになります。付けなければ、受け取った利用者は自分が使えるだけで、他人に配ることはできません。",
  },
  {
    q: "PUBLIC とは何ですか？",
    a: "すべての利用者を指す特別な指定です。GRANT SELECT ON 商品 TO PUBLIC と書くと、そのデータベースの全利用者が商品表を参照できるようになります。",
  },
];

export default function GrantBody() {
  return (
    <>
      <div className="not-prose my-6 rounded-lg border border-[var(--border-strong)] bg-[var(--muted)]/60 p-4 text-sm">
        <p className="font-bold">このレッスンは解説のみです</p>
        <p className="mt-2 leading-relaxed" style={{ textWrap: "pretty" }}>
          GRANT は「誰に」権限を与えるかを指定する命令で、データベースの利用者という
          概念が必要になります。このツールはブラウザ内で表だけを扱うため実行できません。
          試験にはよく出るので、書式と考え方を押さえてください。
        </p>
      </div>

      <h2>アクセス権とは</h2>
      <p>
        データベースは複数の人が共有して使います。
        「経理の人は給与を見られるが、営業の人は見られない」のように、
        <strong>誰が何をできるか</strong>を制御する仕組みが<strong>アクセス権</strong>です。
      </p>

      <h2>GRANT — 権限を与える</h2>
      <pre>
        <code>{`GRANT SELECT ON 商品 TO 山田

GRANT SELECT, UPDATE ON 商品 TO 山田, 佐藤

GRANT SELECT ON 商品 TO PUBLIC     -- 全利用者に`}</code>
      </pre>
      <p>
        構文は <code>GRANT 権限 ON 対象 TO 利用者</code> です。
        与えられる権限には <code>SELECT</code> / <code>INSERT</code> /
        <code>UPDATE</code> / <code>DELETE</code> などがあり、
        <code>ALL PRIVILEGES</code> ですべてをまとめて指定することもできます。
      </p>
      <p>
        <code>PUBLIC</code> は<strong>すべての利用者</strong>を指す特別な指定です。
      </p>

      <h2>WITH GRANT OPTION — 権限を配る権限</h2>
      <pre>
        <code>{`GRANT SELECT ON 商品 TO 山田 WITH GRANT OPTION`}</code>
      </pre>
      <p>
        これを付けると、山田さんは<strong>自分が受け取った権限を
        さらに他の人へ与えられる</strong>ようになります。
        付けなければ、山田さんは自分が使えるだけです。
      </p>

      <h2>REVOKE — 権限を取り消す</h2>
      <pre>
        <code>{`REVOKE SELECT ON 商品 FROM 山田`}</code>
      </pre>
      <p>
        <code>GRANT ... TO</code> に対して <code>REVOKE ... FROM</code> です。
        <strong>前置詞が変わる</strong>点が地味に問われます。
      </p>

      <h2>ビューと組み合わせる</h2>
      <p>
        アクセス権は<strong>列単位では指定しにくい</strong>ため、
        実務では<Link href="/fe/sql/lessons/view">ビュー</Link>と組み合わせます。
      </p>
      <pre>
        <code>{`-- 給与を含まないビューを作り、そのビューにだけ権限を与える
CREATE VIEW 従業員一覧 AS
  SELECT 社員番号, 氏名, 部門コード FROM 従業員;

GRANT SELECT ON 従業員一覧 TO PUBLIC`}</code>
      </pre>
      <p>
        こうすると、利用者は氏名や部門は見られますが、
        給与の列にはそもそも到達できません。
        <strong>「ビューは列を隠すのに使える」</strong>という定番の組み合わせで、
        試験でもこの形で出題されます。
      </p>

      <h2>試験で問われるポイント</h2>
      <ul>
        <li><strong>GRANT ... TO と REVOKE ... FROM</strong> の前置詞</li>
        <li><strong>WITH GRANT OPTION の意味</strong>（権限を再配布できる）</li>
        <li><strong>PUBLIC が全利用者</strong>を指すこと</li>
        <li>ビューと組み合わせて列を隠す使い方</li>
      </ul>
    </>
  );
}
