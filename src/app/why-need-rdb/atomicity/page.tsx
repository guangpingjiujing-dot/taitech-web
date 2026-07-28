import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { LogSequence } from "@/components/viz/rdb-fundamentals/LogSequence";
import { findTopic } from "@/content/topics";

const slug = "atomicity";
const topic = findTopic("why-need-rdb", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "トランザクションを使えば必ずデータが守られる？",
    a: "原子性は「途中で止まらない」ことを保証しますが、他人の同時操作から守るのは分離性 (concurrency 側の話) です。両方揃って初めて「守られている」状態になります。",
  },
  {
    q: "Excel の Ctrl+Z (Undo) とトランザクションの ROLLBACK は何が違う？",
    a: "Undo は「1 操作を戻す」のに対し、ROLLBACK は「BEGIN からの複数操作をまとめて戻す」動作です。Undo は他のユーザーの操作を巻き込んで戻せませんが、ROLLBACK は自分のトランザクション内のみを一貫して戻します。",
  },
  {
    q: "原子性と一貫性 (Consistency) の違いは？",
    a: "原子性は「全か無か」の実行保証で、一貫性は「実行前後で制約が保たれる」ことです。原子性は実行モデル、一貫性は結果状態の話で、階層が異なります。",
  },
  {
    q: "「オートコミット」モードとは？",
    a: "各 SQL 文が暗黙に BEGIN/COMMIT に囲まれるモードです。便利ですが、複数文を原子的に扱いたい時は明示的に BEGIN しないと途中で止まった時に片方だけ残ります。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="why-need-rdb" slug={slug}>
      <TopicJsonLd section="why-need-rdb" slug={slug} faq={faq} />

      <h2>事故 — 注文だけが残った夜</h2>
      <p>
        ある EC サイトの受注は、受注ボタンが押されるたびに 2 段階の Excel マクロで処理されていた。
        まず注文シートに 1 行追加し、次に商品シートの在庫を 1 減らす。ある夜、注文シートに書き込んだ直後にネットワークが瞬断してマクロが止まった。翌朝スタッフが気付いた時には、
        注文は残ったまま <strong>商品の在庫が減らされていない</strong> 状態だった。
      </p>
      <p>
        これが単発の 1 件で終わればまだ被害は小さい。実際、冒頭の「壊れた Excel」でも
        P-042 座布団は 1 日で 5 件売れたはずなのに在庫はまだ 12 のまま — 初日は数個の差にすぎない。
        しかしマクロは毎日何百件も実行され、同じ形の中断が週に数件のペースで起き続けた。数週間後、商品シートの在庫は
        <strong>実在庫より 20 個以上多い値</strong> を示すようになっていた。
      </p>
      <p>
        営業担当が「在庫あり」と表示された商品を客に売っても、倉庫には物理的に商品が無い。
        出荷指示を受けた倉庫スタッフから何度も返品連絡が入り、顧客対応が破綻した。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--border-strong)] bg-[var(--muted)]/40 px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          先に用語を 3 つだけ整理
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--foreground)] leading-relaxed">
          <li>
            <strong>トランザクション</strong>: 「複数の変更を 1 つの塊として扱う」単位。
            この塊の中身は「全部やる」か「1 つもやらない」かのどちらかしか許さない
          </li>
          <li>
            <strong>コミット (COMMIT)</strong>: トランザクション内の変更を「全部確定させる」操作。
            これ以降、変更は永続化される
          </li>
          <li>
            <strong>ロールバック (ROLLBACK)</strong>: トランザクション内の変更を「全部なかったことにする」操作。
            途中でエラーが起きた時に呼び出される
          </li>
        </ul>
        <div className="mt-2 text-xs text-[var(--muted-foreground)]">
          以下、この 3 語を前提に解説します。詳細な SQL 例は「解決策」節で扱います。
        </div>
      </div>

      <h2>原因 — Excel には「まとめて確定」の単位がない</h2>
      <p>
        Excel / Sheets には <strong>「複数の変更を 1 つのトランザクションとして扱う」</strong> 仕組みがない。
        マクロで擬似的に順番に実行しても、どこかで止まれば「片方だけ適用された中途半端な状態」が残る。
        RDB ならこの時点で自動 ROLLBACK が走って両方戻せるが、Excel には ROLLBACK 相当の機能がない。
        マクロがどこまで進んだかも、変更がまとめて COMMIT されたかどうかも、記録されない。
      </p>

      <LogSequence
        title="Excel マクロの操作履歴 — 途中で止まると片方だけ残る"
        entries={[
          {
            kind: "op",
            label: "注文シートに ORD-001 を追加",
          },
          {
            kind: "event",
            label: "ネットワーク瞬断 — マクロ停止",
            note: "この時点で注文行だけがシートに残り、在庫は減算されていない",
          },
          {
            kind: "op",
            label: "商品シートの在庫を -1 する",
            lost: true,
            note: "本来ここで実行されるはずだった処理 (実行されない)",
          },
        ]}
        outcome="注文だけ記録され、在庫は減っていない (整合性喪失)"
      />

      <h2>解決策 — トランザクション (BEGIN / COMMIT / ROLLBACK)</h2>
      <p>
        RDB では複数の SQL 文を <strong>BEGIN と COMMIT で挟む</strong> ことで、その間の全ての変更を「1 つの塊」として扱える。
        途中でエラーが起きたら ROLLBACK で全て戻す。COMMIT する前の変更は誰にも見えず、COMMIT した瞬間にまとめて確定する。
      </p>
      <pre>
        <code>{`BEGIN;
INSERT INTO orders (customer_id, product_id, qty)
  VALUES ('C-001', 'P-042', 1);
UPDATE products
  SET stock = stock - 1
  WHERE id = 'P-042';
COMMIT;`}</code>
      </pre>
      <p>
        この BEGIN...COMMIT の間で通信が切れたりサーバがクラッシュしても、RDB は自動で ROLLBACK する。
        <strong>「注文は追加されたが在庫は減らない」中途半端な状態は構造的に発生しない。</strong>
      </p>

      <LogSequence
        title="RDB のトランザクション — 途中で止まっても両方戻る"
        entries={[
          { kind: "begin", label: "BEGIN" },
          { kind: "op", label: "INSERT INTO orders ..." },
          {
            kind: "event",
            label: "ネットワーク瞬断",
            note: "COMMIT 前の中途半端な状態を DBMS が検知",
          },
          {
            kind: "rollback",
            label: "AUTO ROLLBACK",
            note: "INSERT も UPDATE も全てなかったことに",
          },
        ]}
        outcome="中途半端な状態が残らない (整合性守られる)"
      />

      <h2>境界事例と誤解</h2>
      <ul>
        <li>
          <strong>オートコミットの罠</strong>: 多くのクライアントは既定でオートコミット (各文が独立トランザクション)。
          複数文を原子的に扱いたい時は明示的に <code>BEGIN</code> しないと、片方だけ確定するリスクが残る。
        </li>
        <li>
          <strong>トランザクションの入れ子</strong>: SAVEPOINT で部分的な戻しは可能だが、
          外側の BEGIN..COMMIT を跨いだ「片方コミット」はできない。
        </li>
        <li>
          <strong>原子性は分離性を含意しない</strong>: 「途中で止まらない」と「他人の同時変更から守る」は別問題。
          後者は次の
          <a href="/why-need-rdb/concurrency"> 同時実行制御 </a>
          で扱う。
        </li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
