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
    a: "WAL を先に永続化することで、クラッシュ後にログを再生 (REDO) すれば必ずコミット済み状態に戻せます。データファイルを先に書くと、書き込み途中で落ちた時に整合性を保証できません。",
  },
  {
    q: "fsync を無効化すると何が起きる？",
    a: "性能は上がりますが、OS やディスクのバッファに残った WAL がクラッシュで失われる可能性があり、コミット済みのはずの変更が消える (永続性が破れる) リスクがあります。",
  },
  {
    q: "レプリケーションがあれば WAL は要らない？",
    a: "非同期レプリケーションだと primary クラッシュ時にレプリカに届いていない変更が失われます。同期レプリケーションでも WAL は障害復旧の基盤として必要です。",
  },
  {
    q: "SSD ではデータが壊れにくいから fsync 不要では？",
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

      <h2>解決策 — WAL (Write-Ahead Logging) と fsync</h2>
      <p>
        RDB の <code>COMMIT</code> は
        <strong>「ログを永続ストレージに書き終わってから」</strong>
        アプリケーションに成功を返す。データ本体ファイルより先に、変更操作をログに記録する。
        これが <strong>Write-Ahead Logging (WAL)</strong> の原理。
      </p>
      <p>
        <code>fsync()</code> システムコールで OS のバッファを跨いで物理ディスクへの書き込み完了を待つ。
        COMMIT 応答が返った時点で、変更は電源喪失があっても失われない状態になっている。
      </p>

      <LogSequence
        title="RDB の COMMIT + WAL — COMMIT 応答時点で確定"
        entries={[
          { kind: "begin", label: "BEGIN" },
          { kind: "op", label: "INSERT / UPDATE / ..." },
          {
            kind: "commit",
            label: "COMMIT (fsync 待ち)",
            note: "WAL エントリがディスクに fsync 済み。この瞬間から永続化保証",
          },
          {
            kind: "event",
            label: "停電",
            note: "データ本体ファイルの一部がまだメモリでも問題ない",
          },
          {
            kind: "op",
            label: "復電 → REDO ログを再生してコミット済み状態を復元",
          },
        ]}
        outcome="COMMIT 済みの変更は全て守られる (WAL による再現可能性)"
      />

      <h3>REDO と UNDO</h3>
      <ul>
        <li>
          <strong>REDO ログ</strong>: コミット済みだがデータファイルに反映が間に合わなかった変更を、
          クラッシュ後に再適用する情報
        </li>
        <li>
          <strong>UNDO ログ</strong>: 未コミットの変更を戻すための情報 (原子性の実装にも使う)
        </li>
      </ul>
      <p>
        起動時に <strong>クラッシュリカバリ</strong> フェーズを実行:
        REDO でコミット済み分を再適用し、UNDO で未コミット分を戻す。この 2 段階で
        「COMMIT 応答済みの変更は残り、未 COMMIT の変更は消える」が保証される。
      </p>

      <h2>境界事例</h2>
      <ul>
        <li>
          <strong><code>fsync</code> を無効化する高速化オプション</strong>: PostgreSQL の <code>synchronous_commit = off</code> など。
          スループットは上がるが、電源喪失で数百 ms 分のコミットが失われる可能性がある。
          データが消えても再生できる用途 (キャッシュ、ログ収集) 以外では使わない
        </li>
        <li>
          <strong>グループコミット / ログのバッファリング</strong>: 複数トランザクションの WAL をまとめて 1 回の fsync で書く。
          スループットを稼ぎつつ永続性は保つ最適化
        </li>
        <li>
          <strong>レプリケーションと永続性</strong>: 同期レプリケーションを組めば primary クラッシュ時もレプリカで復旧可能。
          非同期だとレプリカに届かなかった数百 ms 分が失われる (RPO)
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
