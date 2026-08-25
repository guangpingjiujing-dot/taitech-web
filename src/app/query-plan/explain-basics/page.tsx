import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import seqJson from "@/content/query-plan/plans/lesson-scan-seq.json";
import indexJson from "@/content/query-plan/plans/lesson-scan-index.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "explain-basics";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const seq = (seqJson as unknown as ExplainJson)[0];
const idx = (indexJson as unknown as ExplainJson)[0];

const faq = [
  {
    q: "cost が小さい方が必ず速いのですか？",
    a: "プランナはそう信じて選びますが、実測と食い違うことがあります。cost はバラバラに読む手間を順に読む手間の 4 倍と仮定した計算なので (random_page_cost = 4.0)、キャッシュがよく効いていて実際には 4 倍も違わない環境では、インデックスを使う側が不当に高く見積もられます。",
  },
  {
    q: "cost の 2 つの数字は何ですか？",
    a: "左が「最初の 1 行を返せるまで」、右が「全部返し終わるまで」です。LIMIT が付くと左の値が効いてきます。ソートのように全部読まないと 1 行も返せないノードは、左の値が大きくなります。",
  },
  {
    q: "width は何に使われますか？",
    a: "1 行あたりの平均バイト数の見積りで、ソートやハッシュがメモリに収まるかの判断に使われます。width の見積りが外れると、行数の見積りも連鎖して外れることがあります。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>どのノードにも同じ 3 つが付く</h2>
      <p>
        実行計画のどのノードにも <code>cost</code> / <code>rows</code> / <code>width</code> が
        付いています。<strong>この 3 つは全部「見積り」</strong>で、
        実際に実行した結果ではありません。
      </p>
      {/*
        このページだけ Buffers を出す。下で cost の内訳を「実ページ数 4167」から計算するので、
        隠すと読者が検算できない（レビュー A-1）。
      */}
      <PlanBlock
        plan={seq}
        hideBuffers={false}
        caption="Seq Scan。50 万行を順に読む計画。"
      />
      <p>
        <code>(cost=0.00..10417.00 rows=500000 width=34)</code> の読み方を 1 つずつ見ます。
      </p>

      <h2>cost は秒ではない</h2>
      <p>
        <strong>いちばん誤解されるのがここです。</strong>
        <code>cost</code> の単位は秒でもミリ秒でもありません。
        <strong>ページを 1 枚順番に読む手間を 1.0 とした相対値</strong>です。
      </p>
      <p>
        だから <code>cost=10417.00</code> と <code>Execution Time: 33 ms</code> を
        <strong>並べて比べても意味がありません。</strong>
        cost は cost どうし、時間は時間どうしで比べます。
      </p>
      <p>
        <strong>ページ</strong>とは、データベースがディスクとやりとりする最小単位です
        （PostgreSQL では 8KB）。1 行だけ欲しくても、その行が入っているページを 1 枚まるごと
        読みます（
        <Link href="/rdb-index/basics/data-structure">データはどう置かれているか</Link>）。
      </p>
      <p>おおまかな内訳はこうです（いずれも既定値）。</p>
      <ul>
        <li>ページを 1 枚<strong>順番に</strong>読む = <code>1.0</code>（<code>seq_page_cost</code>）</li>
        <li>
          ページを 1 枚<strong>バラバラに</strong>読む = <code>4.0</code>（
          <code>random_page_cost</code>。4 倍高いと仮定している）
        </li>
        <li>1 行を処理する = <code>0.01</code>（<code>cpu_tuple_cost</code>）</li>
        <li>条件式を 1 回評価する = <code>0.0025</code>（<code>cpu_operator_cost</code>）</li>
      </ul>
      <p>
        上の <code>Seq Scan</code> に当てはめます。
        <code>Buffers: shared hit=4167</code> が実際に読んだページ数です（
        <strong>プランナが見積りに使うのは統計が持つページ数 <code>relpages</code></strong> で、
        ここでは一致しています。統計が古いと両者はずれます）。
        <strong>4,167 ページ</strong>を順に読み、<strong>50 万行</strong>を処理し、
        <code>Filter: (age &gt;= 20)</code> の条件式を<strong>50 万回</strong>評価します。
      </p>
      <pre>{`  4167 × 1.0     = 4167.00   ページを順に読む
+ 500000 × 0.01   = 5000.00   1 行ずつ処理する
+ 500000 × 0.0025 = 1250.00   条件式を 1 回ずつ評価する
                  ----------
                    10417.00`}</pre>
      <p>
        <strong>計画に出ている <code>cost=0.00..10417.00</code> と端数まで一致します。</strong>
        cost は当てずっぽうではなく、この 4 つの定数と見積り行数から<strong>計算で出せます</strong>。
      </p>
      <p className="text-sm">
        定数の一覧と既定値は{" "}
        <Link
          href="https://www.postgresql.org/docs/18/runtime-config-query.html#RUNTIME-CONFIG-QUERY-CONSTANTS"
          target="_blank"
          rel="noopener noreferrer"
        >
          PostgreSQL 公式ドキュメント Planner Cost Constants
        </Link>
        にあります。
      </p>

      <h3>2 つ書いてあるのは「開始」と「全部」</h3>
      <p>
        <code>cost=0.00..10417.00</code> の左は<strong>最初の 1 行を返せるまで</strong>、
        右は<strong>全部返し終わるまで</strong>のコストです。
      </p>
      <ul>
        <li>
          <code>Seq Scan</code> は 1 行目をすぐ返せるので左が <code>0.00</code>
        </li>
        <li>
          <code>Sort</code> は全部読み終わるまで 1 行も返せないので、
          <strong>左と右がほぼ同じ</strong>になります
        </li>
      </ul>
      <p>
        <code>LIMIT</code> が付いているクエリでは左の値が効きます。
        「全部やると高いが、最初の 10 行だけなら安い」という計画が選ばれるためです。
      </p>

      <h2>rows は見積りの行数</h2>
      <p>
        <code>rows=500000</code> は<strong>このノードが返すと見積もった行数</strong>です。
        実際に何行返ったかは、<code>EXPLAIN (ANALYZE)</code> を付けたときだけ分かります。
      </p>
      <PlanBlock plan={idx} caption="Index Scan。1 行だけ返る見積り。" />
      <p>
        この計画では <code>rows=1</code> です。主キーで 1 行引いているので当然ですが、
        <strong>この数字は統計情報から計算されたもの</strong>で、当てずっぽうではありません。
        どうやって出しているかは
        <Link href="/query-plan/estimated-rows">見積り行数の内訳</Link>で最後まで追います。
      </p>
      <p>
        <strong>rows が外れると計画が壊れます。</strong>
        少なく見積もりすぎると「何度もまわしても安い」と判断してしまうためです。
        その実例は<Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>にあります。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>rows は「1 回あたり」の数字です。</strong>
          そのノードが繰り返し実行される場合、<code>rows</code> は
          <strong>1 回の実行で返る行数</strong>を指します。
          総数を知るには <code>loops</code> を掛けます（
          <Link href="/query-plan/explain-analyze">EXPLAIN ANALYZE の見方</Link>）。
        </p>
      </div>

      <h2>width は 1 行の平均バイト数</h2>
      <p>
        <code>width=34</code> は<strong>そのノードが返す 1 行の平均バイト数の見積り</strong>です。
        直接読む機会は少ないですが、次の 2 つで効いてきます。
      </p>
      <ul>
        <li>
          <strong>ソートやハッシュがメモリに収まるか</strong>の判断。
          行数 × width が作業メモリを超えると一時ファイルに落ちます（
          <Link href="/query-plan/sort-and-memory">ソートとメモリ</Link>）
        </li>
        <li>
          <strong>統計が無いときの行数の見積り。</strong>
          width の見積りが外れると<strong>行数の見積りも連鎖して外れます</strong>（
          <Link href="/query-plan/estimated-rows">見積り行数の内訳</Link>）
        </li>
      </ul>
      <p>
        必要な列だけ選べば width は小さくなります。
        <code>SELECT *</code> をやめると効くのはこの部分です。
      </p>

      <h2>まとめ</h2>
      <ul>
        <li><code>cost</code> — 秒ではない。相対値。左が開始、右が全部</li>
        <li><code>rows</code> — 見積りの行数。<strong>1 回あたり</strong></li>
        <li><code>width</code> — 1 行の平均バイト数の見積り</li>
      </ul>
      <p>
        次は<Link href="/query-plan/explain-analyze">EXPLAIN ANALYZE</Link>で、
        <strong>見積りと実測を並べて見る</strong>ところに進みます。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
