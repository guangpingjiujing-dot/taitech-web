import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock, SelfTimeTable } from "@/components/query-plan/PlanBlock";
import heroJson from "@/content/query-plan/plans/hero-plan.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "explain-analyze";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const hero = (heroJson as unknown as ExplainJson)[0];

const faq = [
  {
    q: "actual time の 2 つの数字は何ですか？",
    a: "左が最初の 1 行を返すまで、右が全部返し終わるまでの実測時間です。cost の 2 つと対応しています。ソートのように全部読まないと 1 行も返せないノードは左右がほぼ同じになります。",
  },
  {
    q: "loops が 1 より大きいとき、時間は合計ですか平均ですか？",
    a: "平均です。actual time も actual rows も loops で割った値が表示されます。総量に戻すには loops を掛けます。ここを掛け忘れるのが、実行計画でいちばん多い読み違えです。",
  },
  {
    q: "全ノードの時間を足しても Execution Time になりません",
    a: "上の行の時間はその下で起きたこと全部を含む累積なので、単純に足すと二重に数えます。あるノードだけの時間を知るには、そのノードから子のぶんを引きます。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>見積りと実測を並べて出す</h2>
      <p>
        <code>EXPLAIN</code> は見積りだけを返します。
        <code>EXPLAIN (ANALYZE)</code> を付けると<strong>実際にクエリを実行して</strong>、
        実測値も一緒に返します。
      </p>
      <pre>{`EXPLAIN (ANALYZE) SELECT ...;`}</pre>
      <p>すると各ノードにカッコが 2 つ並びます。</p>
      <pre>{`(cost=0.43..266.09 rows=23 width=12) (actual time=0.005..0.005 rows=2.00 loops=250000)`}</pre>
      <ul>
        <li>前半（<code>cost=…</code>）が<strong>見積り</strong></li>
        <li>後半（<code>actual …</code>）が<strong>実測</strong></li>
      </ul>
      <p>
        <strong>この 2 つを見比べるのが EXPLAIN ANALYZE の主目的です。</strong>
        見積りが実測から大きく外れていれば、そのノードを起点に計画が壊れています。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>ANALYZE は本当に実行します。</strong>
          <code>UPDATE</code> / <code>DELETE</code> / <code>INSERT</code> に付けると
          <strong>データが変わります</strong>。試すなら
          <code>BEGIN;</code> … <code>ROLLBACK;</code> で囲みます。
        </p>
      </div>

      <h2>actual time は 2 つある</h2>
      <p>
        <code>actual time=0.005..0.005</code> の左は<strong>最初の 1 行まで</strong>、
        右は<strong>全部返すまで</strong>です。<code>cost</code> の 2 つと対応しています。
      </p>
      <p>
        <code>Sort</code> のように<strong>全部読まないと 1 行も返せない</strong>ノードは、
        左が大きくなります。逆に <code>Seq Scan</code> は 1 行目をすぐ返せるので左が小さいままです。
      </p>

      <h2>loops があると、表示は 1 回あたりの平均になる</h2>
      <p>
        <strong>ここがこのページでいちばん大事な話です。</strong>
      </p>
      <p>
        あるノードが繰り返し実行される場合、<code>loops=</code> に回数が入ります。
        そして<strong><code>actual time</code> も <code>rows</code> も、
        loops で割った平均が表示されます。</strong>
      </p>
      <PlanBlock plan={hero} caption="内側の Index Scan に loops=250000 が付いている。" />
      <p>この計画の内側はこう書いてあります。</p>
      <pre>{`(actual time=0.005..0.005 rows=2.00 loops=250000)`}</pre>
      <ul>
        <li><strong>1 回あたり</strong> 0.005 ミリ秒</li>
        <li><strong>1 回あたり</strong> 2 行</li>
        <li>それが <strong>250,000 回</strong></li>
      </ul>
      <p>
        総量に戻すには掛けます。
        <code>0.005 × 250000 = 1250ms</code>、<code>2 × 250000 = 500,000 行</code>。
        <strong>表示上いちばん小さい数字を持つノードが、実は 1.25 秒使っています。</strong>
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>PostgreSQL 18 から rows が小数で出ます</strong>（<code>rows=2.00</code>）。
          これは<strong>平均だから</strong>です。
          17 までは整数に丸められていたので、平均であることが見た目から分かりませんでした。
        </p>
        <p className="mt-3 text-[15px] leading-relaxed">
          この変更は{" "}
          <Link
            href="https://www.postgresql.org/docs/18/release-18.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            PostgreSQL 18 のリリースノート
          </Link>
          に載っています。同じバージョンで <code>EXPLAIN (ANALYZE)</code> の
          <code>BUFFERS</code> が既定で有効になり、<code>Index Searches</code> の行も増えました。
        </p>
      </div>

      <h2>上の行の時間は「その下で起きたこと全部」を含む</h2>
      <p>
        <code>actual time</code> は累積です。あるノードの時間には、
        <strong>その子で使った時間が全部入っています。</strong>
        だから全ノードを足すと二重に数えることになります。
      </p>
      <p>そのノード「だけ」の時間を知るには引き算します。</p>
      <pre>{`自分の時間 = 自分の actual time 上端 × loops
             - Σ (子の actual time 上端 × 子の loops)`}</pre>
      <p>
        <strong>子にも loops を掛けるのを忘れないでください。</strong>
        忘れると答えが変わります。実際にやってみます。
      </p>

      <SelfTimeTable
        plan={hero}
        naive
        limit={5}
        highlight={/Index Scan using order_items_order_id_idx/}
      />

      <p>
        左が掛け忘れた場合、右が正しい場合です。
        <strong><code>Nested Loop</code> が 1 位から 3 位に落ち、
        代わりに内側の <code>Index Scan</code> が 1 位に上がりました。</strong>
      </p>
      <p>
        この引き算を全ノードでやって並べるのが、
        <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>の手順そのものです。
      </p>

      <h2>丸めの影響</h2>
      <p>
        <code>actual time</code> はミリ秒 3 桁で丸められます。
        <code>0.005</code> と表示されていても、実際は 0.0045〜0.0055 の幅があります。
      </p>
      <p>
        <strong>loops が大きいと、この誤差も loops 倍されます。</strong>
        25 万回なら ±125ms。だから <code>loops</code> の大きいノードの絶対値は、
        <strong>桁として読む</strong>のが正しい付き合い方です。
      </p>
      <p>
        引き算した結果が<strong>負になる</strong>こともあります。
        そのときは親のサブツリー時間が上限を教えてくれます
        （親から、丸めの増幅を受けていない側の子を引いた値が、残りの子の上限）。
      </p>

      <h2>まとめ</h2>
      <ul>
        <li><code>EXPLAIN ANALYZE</code> は<strong>実際に実行する</strong></li>
        <li><code>actual time</code> は「初行まで / 全部まで」の 2 つ</li>
        <li>
          <strong><code>loops</code> があると表示は 1 回あたりの平均。</strong>
          総量は掛け算で戻す
        </li>
        <li>上の行の時間は累積。自分の時間は引き算で出す</li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
