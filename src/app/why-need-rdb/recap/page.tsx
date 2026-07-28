import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "recap";
const topic = findTopic("why-need-rdb", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "RDB は「なぜ」使うのか、一言で言うと？",
    a: "複数ユーザーが更新する運用データを、宣言的な制約と ACID トランザクションで「構造的に」守れるからです。運用ルールに頼らず、DBMS が壊れないよう保証してくれるのが本質的価値です。",
  },
  {
    q: "NoSQL や表計算ではダメ？",
    a: "ケース次第です。ログ収集 / ドキュメントストレージ / 分析用のワイドテーブルには NoSQL / DWH が向きます。ただし「本気で運用する業務データ」の第一選択は RDB を起点に検討すべきです。",
  },
  {
    q: "ACID と「一意性」「参照整合性」の関係は？",
    a: "ACID は「トランザクションの実行モデル」の話で、一意性 / 参照整合性は「テーブル構造上の制約」の話です。両者は独立して機能し、組み合わせて RDB のデータ整合性を担保します。",
  },
  {
    q: "RDB を選んだあと、次に学ぶべきことは？",
    a: "「どう動くか (性能)」と「どう設計するか (スキーマ)」の 2 面です。本サイトでは RDBインデックス図解 (性能) と データモデリング体系 (設計) の 2 セクションで扱っています。",
  },
  {
    q: "変なER図と同じサイトなのに、なぜ別セクション？",
    a: "「なぜ RDB か」「どう設計するか」「どう動くか」の 3 領域は目的が違うため。「なぜ」はデータマネジメントの意思決定、「設計」は表構造の作り方、「性能」は物理層のチューニングです。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="why-need-rdb" slug={slug}>
      <TopicJsonLd section="why-need-rdb" slug={slug} faq={faq} />

      <h2>6 つの事故から見えた 5 つの根本価値</h2>
      <p>
        本シリーズで見てきた事故を並べ直すと、Excel には無く RDB には有る 5 つの根本価値が浮かび上がる。
      </p>

      <div className="not-prose my-8 overflow-x-auto border border-[var(--border-strong)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/60">
              <th className="px-3 py-2 text-left font-bold">#</th>
              <th className="px-3 py-2 text-left font-bold">事故</th>
              <th className="px-3 py-2 text-left font-bold">欠けていたもの</th>
              <th className="px-3 py-2 text-left font-bold">RDB での名前</th>
              <th className="px-3 py-2 text-left font-bold">ACID 対応</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">1</td>
              <td className="px-3 py-2">注文だけ記録され在庫が減らない</td>
              <td className="px-3 py-2">途中で止まらない保証</td>
              <td className="px-3 py-2">
                <Link
                  href="/why-need-rdb/atomicity"
                  className="font-bold underline underline-offset-4"
                >
                  原子性 (atomicity)
                </Link>
              </td>
              <td className="px-3 py-2 font-mono font-bold">A</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">2</td>
              <td className="px-3 py-2">2 人が同時に書いて修正が消えた</td>
              <td className="px-3 py-2">誰が最後に勝つかのルール</td>
              <td className="px-3 py-2">
                <Link
                  href="/why-need-rdb/concurrency"
                  className="font-bold underline underline-offset-4"
                >
                  同時実行制御 (isolation)
                </Link>
              </td>
              <td className="px-3 py-2 font-mono font-bold">I</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">3</td>
              <td className="px-3 py-2">「山田太郎」の重複登録を弾けない</td>
              <td className="px-3 py-2">「重複禁止」の宣言</td>
              <td className="px-3 py-2">
                <Link
                  href="/why-need-rdb/uniqueness"
                  className="font-bold underline underline-offset-4"
                >
                  一意性制約 (UNIQUE)
                </Link>
              </td>
              <td className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                C の材料
              </td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2 font-mono">4</td>
              <td className="px-3 py-2">顧客を消したら宛先不明</td>
              <td className="px-3 py-2">参照が壊れないことの保証</td>
              <td className="px-3 py-2">
                <Link
                  href="/why-need-rdb/referential-integrity"
                  className="font-bold underline underline-offset-4"
                >
                  参照整合性 (FK)
                </Link>
              </td>
              <td className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                C の材料
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-mono">5</td>
              <td className="px-3 py-2">停電で 8 時間分消失</td>
              <td className="px-3 py-2">一度確定したら消えない保証</td>
              <td className="px-3 py-2">
                <Link
                  href="/why-need-rdb/durability"
                  className="font-bold underline underline-offset-4"
                >
                  永続性 (durability)
                </Link>
              </td>
              <td className="px-3 py-2 font-mono font-bold">D</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>ACID の 4 文字とその他の制約の関係</h2>
      <p>
        <strong>ACID</strong> はトランザクションが守るべき 4 特性の頭字語:
      </p>
      <ul>
        <li>
          <strong>A — Atomicity (原子性)</strong>: トランザクション内の変更は「全部確定」か「全部戻す」のいずれか。
          → 表 <span className="font-mono">#1</span> で解説
        </li>
        <li>
          <strong>C — Consistency (一貫性)</strong>: トランザクション実行の前後で
          「宣言された制約 (UNIQUE / FK / CHECK など) がすべて満たされている」状態が保たれる。
          <strong>C 自体はメカニズムではなく「他 3 特性 + 制約群が正しく動いた結果として達成される状態」</strong>。
          具体的な制約 (表 <span className="font-mono">#3</span>、<span className="font-mono">#4</span> など) を宣言することで実現される
        </li>
        <li>
          <strong>I — Isolation (独立性 / 分離性)</strong>: 複数のトランザクションが同時に走っても、
          結果は「1 つずつ順番に実行した場合」と同等になる。
          → 表 <span className="font-mono">#2</span> で解説
        </li>
        <li>
          <strong>D — Durability (永続性)</strong>: コミット済みの変更は、システム障害後も失われずに残る。
          → 表 <span className="font-mono">#5</span> で解説
        </li>
      </ul>
      <p>
        よくある混乱: 「ACID の C は制約の話に見えるが、なぜ一意性 (UNIQUE) や参照整合性 (FK) は別扱いなのか？」。
        <strong>C は抽象的な「制約が守られる契約」で、UNIQUE / FK / CHECK は「具体的に何を守るか」の道具</strong>。
        階層が違うので独立して扱える。
      </p>

      <h2>Excel での「頑張って回避」はなぜ限界か</h2>
      <p>
        承認フロー、ダブルチェック、頻繁な手動保存、締め時間まで他人を触らせない運用 — これらは全て
        <strong>「宣言的でない」= 人間の運用に依存する</strong> 手段。
      </p>
      <ul>
        <li>運用が完璧に守られる前提でしか機能しない</li>
        <li>人が増えれば増えるほど破綻確率が上がる</li>
        <li>誰かが 1 回でも間違えたら壊れる</li>
      </ul>
      <p>
        RDB は「壊れないよう宣言すれば DBMS が構造的に守る」= 運用不要。
        <strong>これが Excel との根本的な差</strong>。
      </p>

      <h2>だから RDB を選ぶ</h2>
      <p>
        「本気で運用するデータ = RDB」が第一選択。以下いずれかに該当するなら RDB を検討する:
      </p>
      <ul>
        <li>複数ユーザーが同時に更新する</li>
        <li>消えては困る取引・在庫・請求データを扱う</li>
        <li>参照関係が複数テーブルにまたがる</li>
        <li>「絶対に重複禁止」「絶対に空欄禁止」のルールを機械的に強制したい</li>
      </ul>
      <p>
        逆に RDB が向かない場面 (ログ収集の高頻度書き込み、ドキュメント指向のデータ、
        分析専用の massive scan) は NoSQL / DWH / スプレッドシートの適用範囲。
        これは v2 の <code>when-not-to-rdb</code> で詳しく扱う予定。
      </p>

      <h2>次に学ぶこと</h2>
      <p>
        「なぜ RDB か」を掴んだら、次は 2 面:
      </p>
      <div className="not-prose my-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/rdb-index"
          className="group block border border-[var(--border-strong)] p-6 hover:bg-[var(--muted)]/60"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            性能を掘る
          </div>
          <div className="mt-2 text-lg font-bold group-hover:underline underline-offset-4">
            RDBインデックス図解 →
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            B-tree / ハッシュ / 複合インデックスの動きを可視化で辿る。
          </p>
        </Link>
        <Link
          href="/data-modeling"
          className="group block border border-[var(--border-strong)] p-6 hover:bg-[var(--muted)]/60"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            設計を掘る
          </div>
          <div className="mt-2 text-lg font-bold group-hover:underline underline-offset-4">
            データモデリング体系 →
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            「変なER図」で ER の読み方を身につけ、正規化 1NF〜3NF まで。
          </p>
        </Link>
      </div>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
