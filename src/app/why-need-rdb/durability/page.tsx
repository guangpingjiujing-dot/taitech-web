import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { LogSequence } from "@/components/viz/rdb-fundamentals/LogSequence";
import { findTopic } from "@/content/topics";

const slug = "durability";
const topic = findTopic("why-need-rdb", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "WAL とデータファイルの書き込み順序はなぜ WAL が先？",
    a: "WAL を先に永続化することで、クラッシュ後にログを再生 (ロールフォワード) すれば必ずコミット済み状態に戻せます。データファイルを先に書くと、書き込み途中で落ちた時に整合性を保証できません。",
  },
  {
    q: "同期書き込みを無効化するとどうなる？",
    a: "スループットは上がりますが、OS やディスクのバッファに残った WAL がクラッシュで失われる可能性があり、コミット済みのはずの変更が消える (永続性が破れる) リスクがあります。データが消えても再生できる用途 (キャッシュ、ログ収集) 以外では使わないのが安全。",
  },
  {
    q: "レプリケーションがあれば WAL は要らない？",
    a: "非同期レプリケーションだと primary クラッシュ時にレプリカに届いていない変更が失われます。同期レプリケーションでも WAL は障害復旧の基盤として必要です。",
  },
  {
    q: "SSD ならデータが壊れにくいから同期書き込みは不要では？",
    a: "SSD 内部にも DRAM キャッシュがあり、電源喪失で書き込み途中の状態が中途半端に残る可能性があります。エンタープライズ SSD は電源保護回路を持ちますが、一般的な民生 SSD には無いことが多いです。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="why-need-rdb" slug={slug}>
      <TopicJsonLd section="why-need-rdb" slug={slug} faq={faq} />

      <h2>事故 — 停電で 8 時間分の作業が消えた</h2>
      <p>
        深夜 2 時、雷雨で停電。復電後にスタッフが Excel を開くと、当日の受注データがまるごと消えていた。
        <strong>最終保存は朝 9 時。以降 17 時までの 8 時間分の作業が全滅</strong>。
        自動回復ファイルにも 15 時までの断片しか残っていなかった。
      </p>

      <h2>原因 — Excel は明示保存後にしか確定しない</h2>
      <p>
        Excel の「変更」はメモリ上にしかない。Ctrl+S を押した瞬間、あるいは自動保存機能が発火した瞬間にしかディスクに書かれない。
        <strong>電源が落ちるとメモリの内容は消える</strong>。自動回復は数分単位の抜けを救うが確実ではない。
      </p>

      <LogSequence
        title="Excel の作業履歴 — 明示保存の間だけが揮発"
        entries={[
          { kind: "op", label: "Excel を開く / 保存済み状態" },
          {
            kind: "op",
            label: "9:00 手動で保存 (最終保存)",
          },
          {
            kind: "op",
            label: "9:00〜17:00 受注入力 (メモリ上のみ)",
            note: "8 時間分の作業が「メモリ」にしか無い状態",
            lost: true,
          },
          {
            kind: "event",
            label: "深夜 2 時 停電",
            note: "メモリ内容は全て消える",
          },
        ]}
        outcome="8 時間分の作業が消失 (最終保存以降が全滅)"
      />

      <div className="not-prose my-6 border-l-2 border-[var(--border-strong)] bg-[var(--muted)]/40 px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          先に用語を整理
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--foreground)] leading-relaxed">
          <li>
            <strong>WAL (Write-Ahead Logging)</strong>: データ本体ファイルより <em>先に</em>
            「変更ログ」をディスクに書き込む方式
          </li>
          <li>
            <strong>REDO ログ</strong>: コミット済みだがデータ本体に反映が間に合わなかった変更を、
            クラッシュ後に <em>再現</em> するための操作記録
          </li>
          <li>
            <strong>UNDO ログ</strong>: 未コミットの変更を <em>取り消す</em> ための操作記録
          </li>
          <li>
            <strong>ロールフォワード (roll forward)</strong>: REDO ログを再生して、
            コミット済みの状態まで前に進める処理
          </li>
          <li>
            <strong>ロールバック (roll back)</strong>: UNDO ログを使って、
            未コミット変更を取り消す処理 (原子性の実装にも使う)
          </li>
          <li>
            <strong>クラッシュリカバリ</strong>: DBMS 起動時にログを読み、
            ロールフォワード + ロールバックで整合性を復元する処理
          </li>
        </ul>
      </div>

      <h2>解決策 — WAL とコミット時の同期書き込み</h2>
      <p>
        RDB の <code>COMMIT</code> は
        <strong>「ログを永続ストレージに書き終わってから」</strong>
        アプリケーションに成功を返す。データ本体ファイルより先に、変更操作をログに記録する
        ことで、ログが確実にディスクに残っていれば後から状態を再現できる。これが WAL の原理。
      </p>
      <p>
        COMMIT の裏では、OS のバッファではなく <strong>物理ディスクへの書き込み完了</strong>
        まで DBMS が待つ (「同期書き込み」)。これで COMMIT 応答が返った時点で、
        変更は電源喪失があっても失われない状態になっている。
      </p>

      <LogSequence
        title="RDB の COMMIT + WAL — COMMIT 応答時点で確定"
        entries={[
          { kind: "begin", label: "BEGIN" },
          { kind: "op", label: "INSERT / UPDATE / ..." },
          {
            kind: "commit",
            label: "COMMIT (同期書き込み待ち)",
            note: "WAL エントリが物理ディスクに書き終わった状態。この瞬間から永続化保証",
          },
          {
            kind: "event",
            label: "停電",
            note: "データ本体ファイルの一部がまだメモリでも問題ない",
          },
          {
            kind: "op",
            label: "復電 → ロールフォワードでコミット済み状態を復元",
          },
        ]}
        outcome="COMMIT 済みの変更は全て守られる (WAL による再現可能性)"
      />

      <h3>クラッシュリカバリ — ロールフォワード + ロールバック</h3>
      <p>
        DBMS 起動時に <strong>クラッシュリカバリ</strong> フェーズを実行する:
      </p>
      <ol>
        <li>
          <strong>ロールフォワード</strong>: REDO ログを再生し、コミット済みだがデータファイルに
          反映が間に合っていなかった変更を再適用する
        </li>
        <li>
          <strong>ロールバック</strong>: UNDO ログを使って、未コミットのまま中断した変更を取り消す
        </li>
      </ol>
      <p>
        この 2 段階で「COMMIT 応答済みの変更は残り、未 COMMIT の変更は消える」が保証される。
      </p>

      <h2>境界事例</h2>
      <ul>
        <li>
          <strong>同期書き込みを無効化する高速化オプション</strong>: PostgreSQL の
          <code>synchronous_commit = off</code> など。スループットは上がるが、電源喪失で数百 ms 分の
          コミットが失われる可能性がある。データが消えても再生できる用途 (キャッシュ、ログ収集) 以外では使わない
        </li>
        <li>
          <strong>グループコミット / ログのバッファリング</strong>: 複数トランザクションの WAL を
          まとめて 1 回で書き込む。スループットを稼ぎつつ永続性は保つ最適化
        </li>
        <li>
          <strong>レプリケーションと永続性</strong>: 同期レプリケーションを組めば primary クラッシュ時も
          レプリカで復旧可能。非同期だとレプリカに届かなかった数百 ms 分が失われる (RPO)
        </li>
        <li>
          <strong>民生 SSD の電源保護</strong>: エンタープライズ SSD は電源保護コンデンサ内蔵、
          民生 SSD は多くの場合内蔵していない。RDB サーバのストレージ選定で確認事項
        </li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
