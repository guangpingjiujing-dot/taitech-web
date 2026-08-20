import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { RaceDiagram } from "@/components/viz/rdb-fundamentals/RaceDiagram";
import { findTopic } from "@/content/topics";

const slug = "concurrency";
const topic = findTopic("why-need-rdb", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "Lost Update は Excel だけの問題？",
    a: "いいえ、RDB でも分離レベルや設計次第で起こります。RDB は「起こらないようにする手段 (ロック / MVCC / バージョン列)」を提供する点が Excel との違いです。",
  },
  {
    q: "悲観ロックと楽観ロックはどちらを選ぶべき？",
    a: "競合が頻発する場面は悲観、稀な場面は楽観が向きます。楽観は競合検出時のリトライロジックを実装する必要があります。",
  },
  {
    q: "分離レベルの 4 段階、実務では何を選ぶ？",
    a: "多くのアプリケーションは READ COMMITTED (PostgreSQL のデフォルト) で十分です。金融系や在庫のような厳密な整合性が必要な処理では SERIALIZABLE を局所的に使います。",
  },
  {
    q: "MVCC を使えばロックは不要？",
    a: "読み取りは他の書き込みをブロックしなくなりますが、書き込み同士の競合や書き込みスキューは別途対処が必要です。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="why-need-rdb" slug={slug}>
      <TopicJsonLd section="why-need-rdb" slug={slug} faq={faq} />

      <h2>事故 — 2 人が別々の行を修正しただけで、片方の修正が消えた</h2>
      <p>
        経理担当 A と担当 B は、共有ドライブに置かれた売上 Excel をそれぞれ自分の PC で開いていた。
        A が行 45 の金額を <code>¥98,000 → ¥120,000</code> に修正して保存。ほぼ同時に B が別の行 88 の顧客名を修正して保存した。
        B が上書き保存した時点で B の PC の版には A の修正が含まれておらず、
        <strong>B の保存が売上シート全体を「B の版」で上書きし、A の修正 (行 45) が消えた</strong>。
      </p>
      <p>
        週次で月次売上を集計した時、A の修正が反映されておらず、報告値が実際と食い違って初めて発覚した。
        これが <strong>Lost Update (更新消失)</strong>。
      </p>
      <p className="text-sm text-[var(--muted-foreground)]">
        ※ 冒頭の「壊れた Excel」に仕込んだ <strong>同一 <code>ORD-001</code> が 2 行できる違和感</strong> も、同じ concurrency 系統の事故。
        こちらは「A と B がほぼ同時に新規注文を起票し、それぞれ手元で『次の注文ID は ORD-001』と採番して衝突」という別メカニズムだが、
        いずれも「他人の並行操作を DBMS が調停してくれない」ことが根本原因。
      </p>

      <h2>原因 — Excel には行 / セル単位のロック機構がない</h2>
      <p>
        Excel の共有ファイルは、各自が自分の PC でコピーを編集して戻す方式が多い。
        このパターンでは、A と B が別々の行を修正しても、
        <strong>後で保存した版が全体を上書きし、先の修正が消える</strong>。
        「別の行を触っただけなのに他人の変更まで消える」のは、Excel が
        「あなたが変更した行だけをトランザクション単位でロックする」細粒度の制御を持たないため。
      </p>
      <p>
        OneDrive の同時編集や Excel の共有ブックでは、同じセルへの同時編集は
        <strong>Last Write Wins (後勝ち)</strong> になる。方式を変えても
        「変更したセル (or 行) だけを他人から守る」細粒度制御がない点は共通している。
      </p>

      <RaceDiagram
        title="Lost Update — 2 人が同時に読んで別々に上書き"
        actors={["担当 A", "担当 B"]}
        steps={[
          {
            time: 1,
            actor: 0,
            action: "売上シートを開く",
            value: "行 45 = ¥98,000",
          },
          {
            time: 2,
            actor: 1,
            action: "同じ売上シートを開く",
            value: "行 45 = ¥98,000",
          },
          {
            time: 3,
            actor: 0,
            action: "行 45 を修正 → 保存",
            value: "行 45 = ¥120,000",
          },
          {
            time: 4,
            actor: 1,
            action: "別の行を修正 → 保存",
            value: "自分の手元のコピーで上書き",
            isProblem: true,
          },
        ]}
        outcome="A の修正 (¥120,000) が B の保存で消え、¥98,000 に戻った"
      />

      <h2>解決策 — ロックと分離レベル</h2>

      <h3>1. 悲観ロック — 「触ったら他人を待たせる」</h3>
      <p>
        書き換えたい行を最初に <code>SELECT ... FOR UPDATE</code> で明示的にロックする。
        他のトランザクションはそのロックが解放されるまで待たされる。
      </p>
      <pre>
        <code>{`BEGIN;
SELECT amount FROM sales WHERE id = 45 FOR UPDATE;
-- 他のトランザクションはここで待たされる
UPDATE sales SET amount = 120000 WHERE id = 45;
COMMIT;`}</code>
      </pre>

      <h3>2. 楽観ロック — 「保存直前にバージョンを確認」</h3>
      <p>
        行に <code>version</code> 列を持たせ、UPDATE の <code>WHERE</code> で読んだ時のバージョンを条件に含める。
        他人が先に書き換えていたらバージョンが変わっているので UPDATE は 0 行にヒットして失敗、リトライする。
      </p>
      <pre>
        <code>{`UPDATE sales
   SET amount = 120000, version = version + 1
 WHERE id = 45 AND version = 12;
-- 影響行が 0 なら他人が先に書き換えている → リトライ`}</code>
      </pre>

      <h3>3. 分離レベル (Isolation Level) — DBMS の既定挙動</h3>
      <p>
        「他人の途中経過がどこまで見えるか」を決める設定。SQL 標準で 4 段階が定義されており、
        <strong>どの読み取り異常を許すか</strong>で段階が分かれる。
      </p>
      <p>
        4 段階の違いと、ダーティリード / ノンリピータブルリード / ファントムリードの 3 異常は、
        2 つのトランザクションをステップ実行しながら見るのがいちばん早い。
        <Link href="/why-need-rdb/isolation-levels">
          トランザクション分離レベルと 3 つの読み取り異常
        </Link>
        で、同じ操作列のまま分離レベルを切り替えて確かめられる。
      </p>

      <h3>4. MVCC (多版同時実行制御)</h3>
      <p>
        PostgreSQL や Oracle は行に「バージョン」を内部で持ち、書き込みが読み取りをブロックしない設計 (MVCC)。
        読み取りは常に「トランザクション開始時点のスナップショット」を見るため待ち時間が減る。
        ただし書き込み同士の競合と <strong>書き込みスキュー</strong> は別途対処が必要。
      </p>

      <h2>境界事例</h2>
      <ul>
        <li>
          <strong>分離レベルは高いほど遅い</strong>: SERIALIZABLE は高コスト。競合予測に基づいて必要な範囲だけに絞る
        </li>
        <li>
          <strong>デッドロック</strong>: 2 つのトランザクションが互いの行をロックし合って進めなくなる状態。
          DBMS は片方を検出して自動 ROLLBACK する
        </li>
        <li>
          <strong>MVCC でも起こる書き込みスキュー</strong>: 「両者ともスナップショットを見て別々に更新したら、直列実行では起こり得ない結果になる」異常。
          SERIALIZABLE への昇格や述語ロックで防ぐ
        </li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
