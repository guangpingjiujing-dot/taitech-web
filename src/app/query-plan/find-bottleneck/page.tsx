import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock, SelfTimeTable, SubtractionSketch } from "@/components/query-plan/PlanBlock";
import { CaptureEnv, HeroQuery } from "@/components/query-plan/HeroQuery";
import heroJson from "@/content/query-plan/plans/hero-plan.json";
import smallJson from "@/content/query-plan/plans/lesson-small-join.json";
import coveringJson from "@/content/query-plan/plans/hero-plan-after-covering.json";
import workmemJson from "@/content/query-plan/plans/hero-plan-after-workmem.json";
import statsJson from "@/content/query-plan/plans/hero-plan-after-stats.json";
import type { ExplainJson } from "@/lib/query-plan/types";
import { nodeLabel, selfTimes } from "@/lib/query-plan/analyze";

const slug = "find-bottleneck";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);

const hero = (heroJson as unknown as ExplainJson)[0];
const small = (smallJson as unknown as ExplainJson)[0];
const covering = (coveringJson as unknown as ExplainJson)[0];
const workmem = (workmemJson as unknown as ExplainJson)[0];
const stats = (statsJson as unknown as ExplainJson)[0];

/*
 * 冒頭の「眺めても当たらない」を**計画から生成する**。手で書くと採り直しでずれる
 * （05-implementation-review.md §M-2 の「派生値は本文に書かず計算する」）。
 *
 * 言いたいのは 2 つ。
 *   - 表示がいちばん大きいノード（= 常に根。累計だから）は、自分ではほとんど働いていない
 *   - 表示がいちばん小さいノードが、実際には最大の時間を持っている
 */
const HERO_RANKED = [...selfTimes(hero)].sort((a, b) => b.self - a.self);
const HEAVIEST_LOOKING = (() => {
  const row = HERO_RANKED.find((r) => r.node === hero.Plan)!;
  return {
    label: nodeLabel(hero.Plan),
    shown: `${(hero.Plan["Actual Total Time"] ?? 0).toFixed(3)} ミリ秒`,
    self: `${row.self.toFixed(1)} ミリ秒`,
  };
})();
const CULPRIT = {
  share: `${(HERO_RANKED[0].share * 100).toFixed(0)}%`,
};

const faq = [
  {
    q: "いちばん時間がかかっているノードを直せば終わりですか？",
    a: "終わりません。1 位を直すと 2 位が 1 位に上がってきます。このページの例でも、内側のインデックス参照を直した瞬間にソートが 1 位になります。直したら順位表を作り直してください。",
  },
  {
    q: "見積りが外れているノードを見つけたら、統計を更新すればいいですか？",
    a: "更新すると見積りは直りますが、速くなるとは限りません。このページの例では計画が Nested Loop から Hash Join へまるごと入れ替わり、かえって遅くなりました。統計の更新は「計画が変わる」操作であって「速くする」操作ではありません。",
  },
  {
    q: "自分の時間を引き算したら負の数になりました",
    a: "actual time はミリ秒 3 桁で丸められるので、loops が大きいノードでは掛け算した瞬間に誤差も loops 倍されます。その場合は親のサブツリー時間が上限を与えるので、そこで頭打ちにして読みます。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>手順にする理由</h2>
      <p>
        実行計画を眺めて <code>Seq Scan</code> を探す、という読み方だと当たりません。
        <strong>並んでいる数字が、そのままでは互いに比べられない形になっている</strong>からです。
        理由は 2 つあります。
      </p>
      <ul>
        <li>
          <strong>表示は累計。</strong>そのノードの <code>actual time</code> には
          <strong>子の時間が全部入っています</strong>。
          だから大きい数字を探すと、必ずいちばん上のノードに行き着きます
        </li>
        <li>
          <strong>
            <code>loops</code> が付いていると 1 回あたりの平均。
          </strong>
          掛け算を戻すまで、他のノードと同じ土俵に乗りません
        </li>
      </ul>
      <p>
        この計画では、その 2 つがまとめて効いています。
        <strong>
          表示がいちばん大きいノード（<code>{HEAVIEST_LOOKING.label}</code> の{" "}
          {HEAVIEST_LOOKING.shown}）は、自分では {HEAVIEST_LOOKING.self} しか使っていません。
        </strong>
        逆に<strong>表示がいちばん小さいノードが、全体の {CULPRIT.share} を持っています。</strong>
        だからここでは、眺めるのをやめて<strong>順番の決まった手順</strong>にします。
      </p>
      <p>
        題材は<Link href="/query-plan">このセクションの最初のページ</Link>に出したのと同じ計画です。
        <strong>まずクエリ本体を出しておきます。</strong>
        何をしているか分からないものの内部を読んでも身に付かないためです。
      </p>

      <HeroQuery />

      <p>
        顧客 <strong>2 万件</strong>（<code>customers</code>）・注文{" "}
        <strong>200 万件</strong>（<code>orders</code>）・明細 <strong>1200 万件</strong>
        （<code>order_items</code>）に対して実行して、
        <strong>2.16 秒</strong>かかっています。この計画です。
      </p>

      <PlanBlock
        plan={hero}
        caption="手 0: そのまま。"
      />

      <h2>サイン 1 — 時間を持っているノードを出す</h2>
      <p>各ノードについて、次を計算します。</p>
      <ol>
        <li>
          <code>actual time</code> の<strong>上端</strong>に <code>loops</code> を掛ける
          （これがそのノード以下の合計時間）
        </li>
        <li>そこから<strong>子のぶんを同じやり方で計算して</strong>引く</li>
        <li>残りがそのノードの<strong>自分の時間</strong></li>
      </ol>
      <h3>まず 3 ノードで手を動かす</h3>
      <p>
        いきなり 10 ノードでやると大変なので、
        <strong>3 ノードしかない計画</strong>で 1 回やってみます。
        こちらは <code>loops</code> が全部 1 なので、引き算だけで済みます。
      </p>
      <PlanBlock plan={small} caption="3 ノードの小さな計画。loops はすべて 1。" />
      <p>
        上から順に、<code>actual time</code> の<strong>上端の数字だけ</strong>拾います。
        いちばん上の数字には<strong>子 2 つの時間が全部入っている</strong>ので、引きます。
      </p>
      <SubtractionSketch plan={small} />
      <p>
        <strong>いちばん上のノードが、実は自分ではほとんど何もしていません。</strong>
        子は葉なので、引くものがなく、表示がそのまま自分の時間になります。
        結果はこうです。
      </p>
      <SelfTimeTable plan={small} limit={3} />
      <p>
        <strong>これが手順の全部です。</strong>あとはノードが増えるだけ……ではありません。
        <code>loops</code> が 1 でないノードが混じった瞬間に、話が変わります。
      </p>

      <h3>同じことを本物の計画でやる</h3>
      <p>
        <strong>さっきの引き算の「同じやり方で」が肝です。</strong>
        子に <code>loops</code> が付いていたら、子も掛け算してから引きます。
        ここを飛ばすと答えが変わります。実際に両方やって並べます。
      </p>

      <SelfTimeTable
        plan={hero}
        naive
        limit={5}
        highlight={/Index Scan using order_items_order_id_idx/}
      />

      <p>
        <strong>1 回の掛け算で、1 位と最下位が入れ替わりました。</strong>
      </p>
      <ul>
        <li>
          掛けないと <code>Nested Loop</code> が 1 位に見える。表示上いちばん大きい数字（
          <code>1561.364</code>）を持っているのがこのノードだからです
        </li>
        <li>
          掛けると <code>Nested Loop</code> は 134ms まで落ち、
          <strong>内側の <code>Index Scan</code> が 1250ms・全体の 58% で 1 位</strong>になります
        </li>
      </ul>
      <p>
        内側の表示は <code>actual time=0.005..0.005</code> です。
        <strong>1 回あたり 0.005 ミリ秒</strong>で終わっているので、素朴に読むといちばん軽く見えます。
        ところが <code>loops=250000</code> なので、
        <code>0.005 × 250000 = 1.25 秒</code>。これが 2.16 秒の内訳の大半です。
      </p>

      <h2>サイン 2 — loops を掛ける</h2>
      <p>
        サイン 1 と 2 は独立していません。<strong>サイン 1 の引き算にサイン 2 が要る</strong>ので、
        この順で並べています。
      </p>
      <p>
        <code>loops</code> が 1 より大きいノードでは、
        <code>actual time</code> も <code>rows</code> も<strong>1 回あたりの平均</strong>です。
        詳しくは<Link href="/query-plan/explain-analyze">EXPLAIN ANALYZE の見方</Link>にあります。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>引き算は「上限」も教えてくれる。</strong>
          <code>actual time</code> はミリ秒 3 桁で丸められるので、
          <code>loops</code> が大きいノードは掛けると上振れすることがあります。
          そのときは<strong>親のサブツリー時間から、外側のぶんを引いた値が内側の上限</strong>です。
          外側は <code>loops=1</code> で丸めが増幅されないので、そちらは正確に読めます。
        </p>
      </div>

      <h2>サイン 3 — 見積りと実測がずれているノードを探す</h2>
      <p>
        <code>rows=</code> は 2 か所に出ます。前半（<code>cost=…</code> の側）が
        <strong>見積り</strong>、後半（<code>actual …</code> の側）が<strong>実測</strong>です。
        この計画では、外側の <code>Seq Scan on orders</code> がこうなっています。
      </p>
      <ul>
        <li>
          見積り <code>rows=526</code> に対して、実測 <code>rows=250000</code>。
          <strong>475 倍の外れ</strong>
        </li>
      </ul>
      <p>
        <strong>これが Nested Loop が選ばれた理由です。</strong>
        外側が 526 行だと思っているので、「内側を 526 回まわす」計画が最安に見えます。
        実際は 250,000 回まわります。<code>loops=250000</code> の出どころはここです。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>見るのは「見積りが小さすぎる」側だけです。</strong>
          多めに見積もっているノードは候補に入れません。
          Nested Loop の暴発は<strong>必ず過小見積りで起きる</strong>（少なく見積もるから
          何度もまわす計画が安く見える）ためで、多めに見積もったときは
          プランナが安全側の計画を選ぶので事故になりにくいからです。
        </p>
        <p className="mt-3 text-[15px] leading-relaxed">
          この計画にちょうど反例があります。内側の <code>Index Scan</code> は
          <code>rows=23</code>（見積り）に対して <code>rows=2.00</code>（実測）で
          <strong>11.5 倍ずれています</strong>が、ずれの向きが逆なので候補には入りません。
          「10 倍以上ずれたら候補」とだけ覚えると、
          <strong>真犯人ではないノードが混じります</strong>。
        </p>
      </div>

      <h2>サイン 4 — 読んで捨てている行を見る</h2>
      <p>
        <code>Rows Removed by Filter</code> は、
        <strong>読んだあとに条件に合わなくて捨てた行数</strong>です。この計画では 2 か所に出ます。
      </p>
      <ul>
        <li>
          外側の <code>Seq Scan on orders</code>: <strong>1,750,000 行</strong>を捨てている。
          200 万行読んで 25 万行しか使っていません
        </li>
        <li>
          内側の <code>Index Scan</code>: <strong>ループ 1 回ごとに 4 行</strong>捨てている。
          6 行読んで 2 行だけ使っています
        </li>
      </ul>
      <p>
        条件が <code>Index Cond</code> 側にあれば読む前に効き、
        <code>Filter</code> 側にあると読んでから捨てます。違いは
        <Link href="/query-plan/index-cond-vs-filter">Index Cond と Filter の違い</Link>に。
      </p>

      <h2>直して、順位表を作り直す</h2>
      <p>
        犯人が分かったので直します。<strong>ここから先は全部実測です。</strong>
      </p>

      <h3>手 1: 内側にテーブル本体を読ませない</h3>
      <p>
        内側が遅いのは、インデックスを引いたあと<strong>テーブル本体を読みに行っている</strong>からです。
        必要な列をインデックスに含めてしまえば、テーブルを読まずに済みます。
      </p>
      <pre>{`CREATE INDEX order_items_covering
    ON order_items (order_id) INCLUDE (price, qty);`}</pre>
      <PlanBlock
        plan={covering}
        caption="手 1: Index Only Scan に変わり、Heap Fetches: 0（テーブル本体を 1 回も触っていない）。"
      />
      <p>
        <strong>2.16 秒 → 0.94 秒。</strong>内側は <code>Index Only Scan</code> になり、
        <code>Heap Fetches: 0</code> が出ています（<code>Heap</code>
        はテーブル本体のこと。インデックスから本体を取りに行った回数が 0 という意味）。
        カバリングインデックスの話は
        <Link href="/rdb-index/covering">カバリングインデックス</Link>に。
      </p>

      <SelfTimeTable plan={covering} limit={4} />

      <p>
        <strong>1 位が入れ替わりました。</strong>
        内側を直したので、今度は <code>Sort</code> が 1 位です。
        <code>Sort Method: external merge  Disk: 16656kB</code> と出ていて、
        <strong>並べ替えがメモリに収まらず一時ファイルに書いています</strong>。
      </p>

      <h3>手 2: ソートをメモリに載せる</h3>
      <pre>{`SET work_mem = '128MB';`}</pre>
      <PlanBlock
        plan={workmem}
        caption="手 2: Sort Method が quicksort に変わり、一時ファイルが消えた。"
      />
      <p>
        <strong>0.94 秒 → 0.84 秒。</strong>
        変わったのは <code>Sort Method</code> の 1 行だけです。
        <code>external merge  Disk: 16656kB</code> が
        <code>quicksort  Memory: 31820kB</code> になりました。
        この行の読み方は<Link href="/query-plan/sort-and-memory">ソートとメモリ</Link>に。
      </p>
      <p>
        <strong>ここでもう一度、順位表を作り直します。</strong>
      </p>
      <SelfTimeTable plan={workmem} limit={4} />
      <p>
        <strong>潰したはずの <code>Sort</code> が、まだ 1 位のままです。</strong>
        一時ファイルへの書き出しは消えましたが、並べ替えそのものは残っているためです。
        <strong>「1 位を直せば 2 位が上がってくる」とは限りません。</strong>
        同じノードが 1 位に残ることもあるので、
        <strong>直したら必ず作り直して確かめます。</strong>
      </p>

      <h2>やってはいけない直し方</h2>
      <p>
        サイン 3 で「見積りが 475 倍外れている」と分かったので、
        <strong>統計を直せば速くなりそうに見えます。</strong>
        4 つの条件に相関があることを DB に教えてみます。
      </p>
      <pre>{`CREATE STATISTICS orders_corr (mcv, ndistinct)
    ON status, ordered_at, channel, payment FROM orders;
ANALYZE orders;`}</pre>
      <PlanBlock
        plan={stats}
        caption="別枝: 見積りは直った（rows=245693）が、計画がまるごと入れ替わった。"
      />
      <p>
        見積りは直りました。<strong>ところが 3.64 秒に伸びています。</strong>
        計画を見ると、<code>Nested Loop</code> が消えて
        <strong><code>Hash Join</code> が 2 つと、明細テーブル 1200 万行の全表スキャン</strong>に
        変わっています。
      </p>
      <p>
        プランナは正確な見積りをもとに「25 万回のインデックス参照より 1200 万行を順に読む方が安い」と
        判断しました。<strong>コストモデル上はその判断で正しく、実測では間違っています。</strong>
        バラバラに読む手間を順に読む手間の 4 倍と仮定した既定値（<code>random_page_cost = 4.0</code>）
        が、キャッシュの効いた環境では<strong>インデックスを使う側を高く見積もりすぎる</strong>ためです。
      </p>
      <p>
        <strong>統計の更新は「計画が変わる」操作であって「速くする」操作ではありません。</strong>
        確実に言えるのは計画が別物になることだけで、速いか遅いかは環境で変わります。
        見積りが外れる仕組みそのものは
        <Link href="/query-plan/estimated-rows">見積り行数の内訳</Link>にあります。
      </p>

      <h2>まとめ</h2>
      <ol>
        <li>全ノードの自分の時間を出して降順に並べる（<code>loops</code> を掛けてから引く）</li>
        <li>1 位が分かったら直す</li>
        <li><strong>順位表を作り直す。</strong>2 位が 1 位に上がってくる</li>
        <li>
          見積りが小さすぎるノードは根本原因の候補だが、
          <strong>統計を直せば速くなるとは限らない</strong>
        </li>
      </ol>

      <CaptureEnv className="mt-10" />

      <FAQ items={faq} />
    </TopicLayout>
  );
}
