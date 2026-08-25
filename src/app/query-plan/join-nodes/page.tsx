import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import { JoinDiagram } from "@/components/query-plan/JoinDiagram";
import nlJson from "@/content/query-plan/plans/lesson-join-nestloop.json";
import hashJson from "@/content/query-plan/plans/lesson-join-hash.json";
import mergeJson from "@/content/query-plan/plans/lesson-join-merge.json";
import heroJson from "@/content/query-plan/plans/hero-plan.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "join-nodes";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const nl = (nlJson as unknown as ExplainJson)[0];
const hash = (hashJson as unknown as ExplainJson)[0];
const merge = (mergeJson as unknown as ExplainJson)[0];
const hero = (heroJson as unknown as ExplainJson)[0];

const faq = [
  {
    q: "Nested Loop が出ていたら遅いのですか？",
    a: "外側が少なければ Nested Loop がいちばん速い形です。問題になるのは、外側の行数を少なく見積もりすぎて選ばれたときで、そのとき内側が想定の何百倍もまわります。",
  },
  {
    q: "どの結合方式が選ばれるかは指定できますか？",
    a: "設定で無効化することはできますが、実務でそれをやるのは最後の手段です。まず見積りが合っているかを確認します。方式の選択はほぼ行数の見積りで決まるので、見積りが直れば選択も直ります。",
  },
  {
    q: "Merge Join はあまり見かけません",
    a: "両側がすでにキー順に並んでいるときに向く方式なので、条件が揃わないと選ばれません。両側にインデックスがあり、結合キーの順で結果が欲しいようなクエリで出てきます。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>3 つのやり方がある</h2>
      <p>
        2 つのテーブルを結合するとき、データベースには 3 通りのやり方があります。
        <strong>どれを選ぶかは、行数の見積りとインデックスの有無で決まります。</strong>
      </p>

      <h3>Nested Loop — 外側 1 行ごとに内側を引く</h3>
      <JoinDiagram variant="nested-loop" />
      <PlanBlock plan={nl} caption="外側が 1 行なので、内側を 1 回引くだけで済む。" />
      <p>
        外側から 1 行取り、その値で内側を引く。これを外側の行数だけ繰り返します。
      </p>
      <ul>
        <li><strong>向いているとき</strong> — 外側が少なく、内側にインデックスがある</li>
        <li><strong>向かないとき</strong> — 外側が多い。回数がそのまま効いてくる</li>
      </ul>
      <p>
        内側のノードに <code>loops=</code> が付くのが目印です。
        この計画では外側が 1 行なので <code>loops=1</code>、つまり 1 回引いて終わりです。
      </p>

      <h3>Hash Join — 片側でハッシュ表を作る</h3>
      <JoinDiagram variant="hash" />
      <PlanBlock plan={hash} caption="内側でハッシュ表を作り、外側を流しながら突き合わせる。" />
      <p>
        先に<strong>内側を全部読んでハッシュ表を作り</strong>、
        そのあと外側を 1 行ずつ流して突き合わせます。
      </p>
      <ul>
        <li><strong>向いているとき</strong> — 両側とも行数が多い。等値結合である</li>
        <li><strong>向かないとき</strong> — ハッシュ表がメモリに収まらない</li>
      </ul>
      <p>
        <code>Hash</code> というノードが子に現れ、その中に
        <code>Buckets</code> / <code>Batches</code> / <code>Memory Usage</code> が出ます。
        <strong><code>Batches</code> が 2 以上なら、メモリに収まらず分割している</strong>という意味です
        （<Link href="/query-plan/sort-and-memory">ソートとメモリ</Link>）。
      </p>
      <p>
        <code>Hash Join</code> は<strong>内側を全部読み終わるまで 1 行も返せません。</strong>
        だから開始コストが大きくなります。
      </p>

      <h3>Merge Join — 両側を並べて突き合わせる</h3>
      <JoinDiagram variant="merge" />
      <PlanBlock plan={merge} caption="両側がキー順に並んでいるので、前から順に突き合わせるだけで済む。" />
      <p>
        両側を<strong>結合キーの順に並べて</strong>、前から順に突き合わせます。
        トランプの神経衰弱ではなく、<strong>ソート済みの 2 つの束を合わせる</strong>イメージです。
      </p>
      <ul>
        <li>
          <strong>向いているとき</strong> — 両側がすでに並んでいる
          （インデックスを順に辿ればソート済みで取れる）
        </li>
        <li><strong>向かないとき</strong> — 並べ直しが必要で、その費用が高い</li>
      </ul>
      <p>
        この計画では両側とも <code>Index Only Scan</code> / <code>Index Scan</code> で
        <strong>並んだ状態で取れている</strong>ので、並べ直しの費用がかかっていません。
        <code>Merge Cond:</code> が目印です。
      </p>

      <h2>選ばれ方は「行数の見積り」でほぼ決まる</h2>
      <p>
        3 つのうちどれを選ぶかは、<strong>外側が何行返ると見積もったか</strong>でほぼ決まります。
      </p>
      <ul>
        <li>外側が<strong>少ない</strong>と見積もった → Nested Loop（内側を数回引くだけなら安い）</li>
        <li>外側が<strong>多い</strong>と見積もった → Hash Join（まとめて突き合わせた方が安い）</li>
        <li>両側が<strong>すでに並んでいる</strong> → Merge Join</li>
      </ul>
      <p>
        <strong>つまり見積りが外れると、選択そのものが間違います。</strong>
      </p>

      <h2>Nested Loop が事故るとき</h2>
      <PlanBlock plan={hero} caption="外側の見積りが 526 行、実測は 250,000 行。内側が 25 万回まわっている。" />
      <p>
        この計画では、外側の <code>Seq Scan on orders</code> が
        <strong>526 行と見積もられて、実際は 250,000 行返っています</strong>（475 倍）。
      </p>
      <p>
        プランナは「526 行なら内側を 526 回引くだけ」と考えて Nested Loop を選びました。
        実際は <code>loops=250000</code> です。
        <strong>1 回あたり 0.005 ミリ秒でも、25 万回まわれば 1.25 秒</strong>になります。
      </p>
      <p>
        <strong>Nested Loop 自体が悪いのではありません。</strong>
        外側の見積りが外れたことが原因で、そこを直せば選択も変わります。
        この計画を最後まで解いているのが
        <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>です。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>内側に <code>loops</code> が付いていたら、必ず掛け算してから読む。</strong>
          表示されているのは 1 回あたりの平均なので、
          そのまま読むと内側がいちばん軽いノードに見えます（
          <Link href="/query-plan/explain-analyze">EXPLAIN ANALYZE の見方</Link>）。
        </p>
      </div>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
