import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import { TreeDiagram } from "@/components/query-plan/TreeDiagram";
import smallJson from "@/content/query-plan/plans/lesson-small-join.json";
import hashJson from "@/content/query-plan/plans/lesson-join-hash.json";
import type { ExplainJson } from "@/lib/query-plan/types";
import { lineOf, renderPlan } from "@/lib/query-plan/render";
import heroJson from "@/content/query-plan/plans/hero-plan.json";

const slug = "read-tree";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const small = (smallJson as unknown as ExplainJson)[0];
const hash = (hashJson as unknown as ExplainJson)[0];

/*
 * 「あの計画のどこが読めるようになったか」で使う行番号。
 * ★ 手で書かない。ハブが PlanBlock に渡しているのと同じ hideBuffers 設定で引く
 *   （設定を取り違えると行番号がずれる。render.ts の lineOf の注意書きを参照）。
 */
const hero = (heroJson as unknown as ExplainJson)[0];
const HERO_HIDE_BUFFERS = true;
const heroText = renderPlan(hero, { hideBuffers: HERO_HIDE_BUFFERS });
const HERO_LINES = heroText.split("\n").length;
const HERO_ROOT_LINE = lineOf(hero, /^ Limit/, { hideBuffers: HERO_HIDE_BUFFERS });
const HERO_DEEPEST_LINE = lineOf(hero, /Index Scan using order_items_order_id_idx/, {
  hideBuffers: HERO_HIDE_BUFFERS,
});

const faq = [
  {
    q: "いちばん上の行が最初に実行されるのではないのですか？",
    a: "逆です。いちばん上が最後に実行されます。上の行は下の行から結果を受け取って自分の処理をするので、下（インデントが深い方）が先です。",
  },
  {
    q: "子が 2 つあるとき、どちらが先ですか？",
    a: "上に書かれている方が外側（Outer）、下が内側（Inner）です。Nested Loop なら外側を 1 行取るごとに内側を引き、Hash Join なら先に内側でハッシュ表を作ってから外側を流します。",
  },
  {
    q: "矢印がない行は何ですか？",
    a: "そのノードに付く補足情報です。Index Cond や Filter、Sort Method などがこれにあたります。ノードそのものではないので、読む順番には関係しません。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>上から順に実行される、ではない</h2>
      <p>
        実行計画でいちばん多い誤読がこれです。
        <strong>実行計画は木構造で、いちばん上の行が最後に実行されます。</strong>
      </p>
      <PlanBlock plan={small} caption="3 ノードの小さい計画。" />
      <p>この計画は、上から読むとこう書いてあります。</p>
      <ol>
        <li><code>Nested Loop</code></li>
        <li><code>Index Scan using members_pkey on members m</code></li>
        <li><code>Index Scan using orders_s_member_idx on orders_s o</code></li>
      </ol>
      <TreeDiagram
        plan={small}
        title="同じ計画を木にすると、動く順番が見える"
        showExec
        legend={
          <>
            テキストは<strong>木を縦に潰して並べたもの</strong>。
            インデントが親子関係を表しているので、
            <strong>上から順に実行される、にはならない</strong>。
          </>
        }
      />
      <p>
        <strong>実際に動く順番は 2 → 3 → 1 です。</strong>
        <code>members</code> から 1 行取り、その <code>id</code> を使って
        <code>orders_s</code> を引き、その結果を <code>Nested Loop</code> が組み合わせます。
      </p>

      <h2>読み方は 3 つの規則だけ</h2>
      <h3>1. 矢印（-&gt;）が付いている行がノード</h3>
      <p>
        矢印が付いていない行は、そのすぐ上のノードに対する<strong>補足</strong>です。
        <code>Index Cond:</code> <code>Filter:</code> <code>Index Searches:</code>{" "}
        <code>Sort Method:</code> <code>Buffers:</code> などがこれにあたります。
        ノードではないので、読む順番を考えるときは無視して構いません。
      </p>
      <p>
        <code>Index Searches:</code> は <strong>PostgreSQL 18 で増えた行</strong>で、
        そのノードが<strong>インデックスを何回探しに行ったか</strong>を表します。
        繰り返し実行されるノードでは <code>loops</code> と同じ数になることが多く、
        <strong>「何回まわったか」を裏から確かめる材料</strong>になります。
        <strong>ただしこの行だけは 1 回あたりではなく累計です。</strong>
        だから <code>loops</code> と同じ数になります。
        17 以前の出力を見慣れている人には見覚えのない行なので、先に触れておきます。
      </p>
      <h3>2. インデントが深い方が子</h3>
      <p>
        あるノードより<strong>右にずれている矢印</strong>が、そのノードの子です。
        同じ深さに矢印が 2 つ並んでいれば、そのノードは子を 2 つ持っています
        （結合ノードがこれです）。
      </p>
      <h3>3. 子が先に動き、親は結果を受け取る</h3>
      <p>
        だから<strong>いちばん深いところから読み始めます。</strong>
        いちばん上の行は、全部終わったあとに最後の仕上げをするノードです。
      </p>

      <h2>子が 2 つあるとき</h2>
      <p>
        結合のノードは子を 2 つ持ちます。<strong>上が外側、下が内側</strong>です。
      </p>
      <PlanBlock plan={hash} caption="Hash Join。子が 2 つ並んでいる。" />
      <TreeDiagram
        plan={hash}
        title="子が 2 つあるとき — 枝分かれがそのまま結合"
        legend={
          <>
            <strong>同じ深さに矢印が 2 つ並ぶ = そのノードは子を 2 つ持つ。</strong>
            テキストでは上下に並ぶだけだが、木にすると<strong>左右の枝</strong>になる。
            なお<strong>左右どちらの枝が先に動くかは、結合の種類で決まる</strong>
            （<code>Hash Join</code> は右の <code>Hash</code> を作り終えてから左を流す）。
            そのためこの図では動く順番の番号を出していない。
          </>
        }
      />
      <p>
        この <code>Hash Join</code> は、
        <code>Seq Scan on orders_s</code>（外側）と <code>Hash</code>（内側）を子に持っています。
        <code>Hash</code> はさらに <code>Bitmap Heap Scan on members</code> を子に持っています。
      </p>
      <p>
        動く順番は<strong>内側から</strong>です。先に <code>members</code> を読んでハッシュ表を作り、
        そのあと <code>orders_s</code> を流しながら突き合わせます。
        なぜその順番なのかは<Link href="/query-plan/join-nodes">結合の種類</Link>に書いてあります。
      </p>

      <h2>いちばん上は「最後にやること」</h2>
      <p>
        木のいちばん上に来やすいノードには決まった顔ぶれがあります。
      </p>
      <ul>
        <li><code>Limit</code> — 必要な件数だけ取ったら止める</li>
        <li><code>Sort</code> — <code>ORDER BY</code> のための並べ替え</li>
        <li><code>Aggregate</code> / <code>GroupAggregate</code> / <code>HashAggregate</code> — 集約</li>
      </ul>
      <p>
        <strong>これらが上にあるということは、それ以外の全部が先に終わっている</strong>ということです。
      </p>
      <p>
        <code>Limit</code> は少し特別で、<strong>下のノードを途中で止められます。</strong>
        10 件そろった時点で「もういい」と言えるので、
        下の <code>actual rows</code> が 10 で止まっていることがあります。
      </p>
      <p>
        <strong>逆に、下のノードが 100 万行返しているのに <code>Limit 10</code> が付いていたら、
        止められなかったという意味です。</strong>
        あいだに <code>Sort</code> や集約が挟まっていると、
        並べ替えるために全部読まないと 1 行目が決まらないためです。
        <strong>この場合、100 万行ぶんの仕事はもう終わっています。</strong>
      </p>

      <h2>ここまでで、あの計画のどこが読めるようになったか</h2>
      <p>
        <Link href="/query-plan">セクションの最初のページ</Link>に出した 2.16 秒の計画は、
        全部で {HERO_LINES} 行あります。<strong>その骨格はもう読めます。</strong>
      </p>
      <ul>
        <li>
          <strong>{HERO_ROOT_LINE} 行目の <code>Limit</code> が最後に実行される</strong>
          （いちばん上 = 最後）
        </li>
        <li>
          <strong>{HERO_DEEPEST_LINE} 行目のいちばん深いノードが最初に動く</strong>
          （いちばん深いところ = 最初）
        </li>
        <li>矢印が付いていない行は補足で、ノードではない</li>
      </ul>
      <p>
        まだ読めないのは<strong>数字の意味</strong>だけです。
        <code>cost</code> は<Link href="/query-plan/explain-basics">cost と rows の意味</Link>、
        <code>actual time</code> と <code>loops</code> は
        <Link href="/query-plan/explain-analyze">EXPLAIN ANALYZE の見方</Link>へ。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>読む順番が分かれば、時間の読み方も変わります。</strong>
          上の行に書いてある時間は<strong>その下で起きたこと全部を含んだ累積</strong>です。
          「このノードが何 ms 使ったか」を知るには引き算が要ります。
          そこは<Link href="/query-plan/explain-analyze">EXPLAIN ANALYZE の見方</Link>で扱います。
        </p>
      </div>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
