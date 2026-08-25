import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import coveringJson from "@/content/query-plan/plans/hero-plan-after-covering.json";
import workmemJson from "@/content/query-plan/plans/hero-plan-after-workmem.json";
import hashJson from "@/content/query-plan/plans/lesson-join-hash.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "sort-and-memory";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const covering = (coveringJson as unknown as ExplainJson)[0];
const workmem = (workmemJson as unknown as ExplainJson)[0];
const hash = (hashJson as unknown as ExplainJson)[0];

const faq = [
  {
    q: "work_mem はどれくらいにすればいいですか？",
    a: "このページでは扱いません。work_mem は同時に走るソートやハッシュの数だけ確保されうるので、サーバ全体のメモリ設計の話になります。ここで扱うのは「出力のこの行が何を意味するか」までです。",
  },
  {
    q: "external merge が出ていたら必ず直すべきですか？",
    a: "一時ファイルが出ること自体は異常ではありません。まず、その Sort が本当に必要かを見ます。ソートに流れる行数を減らせるなら、そちらの方が効きます。",
  },
  {
    q: "top-N heapsort とは何ですか？",
    a: "ORDER BY と LIMIT が組み合わさったときに使われる方式です。全部並べ替えるのではなく、上位 N 件だけを保持しながら流すので、メモリ使用量が小さくて済みます。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>Sort Method の 1 行で、メモリに載ったかが分かる</h2>
      <p>
        <code>Sort</code> ノードには <code>Sort Method:</code> という行が付きます。
        <strong>ここを見るだけで、並べ替えがメモリで完結したかどうかが分かります。</strong>
      </p>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-strong)] text-left">
              <th className="py-2 pr-3 font-bold">表示</th>
              <th className="py-2 pr-3 font-bold">意味</th>
              <th className="py-2 font-bold">ディスクを使ったか</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 pr-3 font-mono text-[13px]">quicksort</td>
              <td className="py-2 pr-3">メモリ内で全部並べ替えた</td>
              <td className="py-2">使っていない</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 pr-3 font-mono text-[13px]">top-N heapsort</td>
              <td className="py-2 pr-3">
                上位 N 件だけ保持しながら流した（<code>ORDER BY</code> +{" "}
                <code>LIMIT</code>）
              </td>
              <td className="py-2">使っていない</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 pr-3 font-mono text-[13px]">
                <strong>external merge</strong>
              </td>
              <td className="py-2 pr-3">
                メモリに収まらず、<strong>一時ファイルに書き出して</strong>並べ替えた
              </td>
              <td className="py-2">
                <strong>使った</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        後ろに付く <code>Memory:</code> と <code>Disk:</code> が決定的です。
        <strong><code>Disk:</code> と書いてあれば一時ファイルに落ちています。</strong>
      </p>

      <h2>同じクエリで、1 行だけが変わる</h2>
      <p>
        <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>で
        内側を直したあとの計画です。このときの 1 位は <code>Sort</code> でした。
      </p>
      <PlanBlock plan={covering} caption="Sort Method: external merge  Disk: 16656kB。一時ファイルに 16MB 書いている。" />
      <p>
        <code>external merge  Disk: 16656kB</code> と出ています。
        50 万行を並べ替えるのに、作業メモリ（既定 4MB）では足りず
        <strong>16MB ぶんを一時ファイルに書いた</strong>ということです。
      </p>
      <p>
        この作業メモリの大きさを決めているのが{" "}
        <Link
          href="https://www.postgresql.org/docs/18/runtime-config-resource.html#GUC-WORK-MEM"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>work_mem</code>
        </Link>
        （公式ドキュメント）です。増やして、同じクエリをもう一度実行します。
      </p>
      <pre>{`SET work_mem = '128MB';`}</pre>
      <PlanBlock plan={workmem} caption="Sort Method: quicksort  Memory: 31820kB。ディスクを使わなくなった。" />
      <p>
        <strong>変わったのは <code>Sort Method</code> の 1 行だけ</strong>です。
        <code>external merge  Disk: 16656kB</code> が
        <code>quicksort  Memory: 31820kB</code> になりました。
      </p>
      <p>
        <strong>数字が 2 倍近く増えていることに注意してください。</strong>
        <code>Disk:</code> の 16MB は一時ファイルとして書き出した量、
        <code>Memory:</code> の 31MB はメモリ上で使った量で、
        <strong>同じものを測っているわけではありません。</strong>
        ディスクへは<strong>行のデータだけを詰めて書く</strong>のに対して、
        メモリ側は<strong>並べ替えるための配列とアロケータの管理領域</strong>を一緒に数えています
        （1 行あたり 30 バイト前後）。1 行 34 バイトが 65 バイトに増えているのはこの差です。
      </p>

      <h2>Hash 側にも同じ現象がある</h2>
      <p>
        あふれるのはソートだけではありません。
        <Link href="/query-plan/join-nodes">Hash Join</Link> のハッシュ表も、
        メモリに収まらなければ分割されます。
      </p>
      <PlanBlock plan={hash} caption="Hash ノードの Buckets / Batches / Memory Usage。" />
      <p>
        <code>Hash</code> ノードに付く 3 つの数字がそれです。
      </p>
      <ul>
        <li><code>Buckets</code> — ハッシュ表のバケット数</li>
        <li>
          <strong><code>Batches</code></strong> — <strong>1 なら一発で収まった。</strong>
          2 以上なら<strong>メモリに収まらず、その回数に分けて処理した</strong>
        </li>
        <li><code>Memory Usage</code> — 実際に使ったメモリ</li>
      </ul>
      <p>
        <code>Batches: 1</code> でない計画を見たら、そこがあふれています。
        <code>(originally 1)</code> のような表記が付くこともあり、
        これは<strong>途中で見積りが外れて分割し直した</strong>という意味です。
      </p>

      <h2>一時ファイルの量を確かめる</h2>
      <p>
        あふれた量は <code>Buffers:</code> 行の <code>temp read</code> /{" "}
        <code>temp written</code> にも出ます。
        <code>EXPLAIN (ANALYZE, BUFFERS)</code> で見られます（PostgreSQL 18 では
        <code>ANALYZE</code> を付けると既定で出ます）。
      </p>
      <p>
        <strong>ここが 0 でなければ、そのクエリはディスクに書いています。</strong>
      </p>

      <h2>直す方向は 2 つある</h2>
      <ol>
        <li>
          <strong>入ってくる行を減らす。</strong>
          そもそも 50 万行を並べ替える必要があるのかを見ます。
          手前のノードで絞れるなら、そちらの方が効きます
        </li>
        <li>
          <strong>作業メモリを増やす。</strong>
          ただし<strong>同時に走るソートやハッシュの数だけ確保されうる</strong>ので、
          サーバ全体のメモリ設計の話になります。
          このセクションでは「この行が何を意味するか」までを扱い、
          設定値の決め方には踏み込みません
        </li>
      </ol>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>1 位を直したら順位表を作り直す。</strong>
          この <code>Sort</code> が 1 位になったのは、
          その前に 1 位だった内側のインデックス参照を直したからです。
          ボトルネックは<strong>1 つ潰すと次が出てきます</strong>（
          <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>）。
        </p>
      </div>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
