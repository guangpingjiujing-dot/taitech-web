import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import { RowsFunnel } from "@/components/query-plan/RowsFunnel";
import indexScanJson from "@/content/query-plan/plans/lesson-cond-filter-indexscan.json";
import singleJson from "@/content/query-plan/plans/lesson-cond-filter-single.json";
import compositeJson from "@/content/query-plan/plans/lesson-cond-filter-composite.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "index-cond-vs-filter";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const indexScan = (indexScanJson as unknown as ExplainJson)[0];
const single = (singleJson as unknown as ExplainJson)[0];
const composite = (compositeJson as unknown as ExplainJson)[0];

/* 実行時間の比較は**計画から計算する**。手で書くと採り直しでずれる（05 §M-2） */
const EXEC_SINGLE = (single["Execution Time"] ?? 0).toFixed(1);
const EXEC_COMPOSITE = (composite["Execution Time"] ?? 0).toFixed(1);
const EXEC_RATIO = ((single["Execution Time"] ?? 0) / (composite["Execution Time"] ?? 1)).toFixed(1);

const faq = [
  {
    q: "Filter が出ていたら必ず直すべきですか？",
    a: "直す価値があるかは Rows Removed by Filter の大きさで決めます。捨てている行が少なければ、インデックスを増やすコストの方が高くつきます。",
  },
  {
    q: "Recheck Cond は Filter とは違うのですか？",
    a: "違います。Recheck Cond は Bitmap Heap Scan がビットマップを粗く持ったときに、行を読んでから条件をもう一度確かめるためのものです。インデックスで絞れている点は Index Cond と同じです。",
  },
  {
    q: "Rows Removed by Filter が 0 なのに Filter が出ています",
    a: "条件は評価されているが、たまたま 1 行も捨てなかったという意味です。条件を満たさない行が増えれば捨て始めます。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>同じ条件が、2 か所のどちらかに出る</h2>
      <p>
        <code>WHERE</code> に書いた条件は、実行計画では
        <strong><code>Index Cond</code> 側か <code>Filter</code> 側か</strong>のどちらかに現れます。
        この 2 つは<strong>効くタイミングが違います。</strong>
      </p>
      <ul>
        <li>
          <strong><code>Index Cond</code></strong> — インデックスを辿る段階で使う。
          <strong>読む行数そのものが減る</strong>
        </li>
        <li>
          <strong><code>Filter</code></strong> — 行を読んだあとに捨てる。
          <strong>読む量は減らない</strong>
        </li>
      </ul>
      <p>
        <strong>同じクエリでも、インデックスの張り方でどちらに出るかが変わります。</strong>
        実際に並べます。
      </p>

      <h2>まず、2 つが並んで出ている計画を見る</h2>
      <p>
        <code>id</code>（主キー・インデックスあり）と
        <code>grade</code>（インデックス無し）で絞ります。
      </p>
      <pre>{`SELECT * FROM members WHERE id BETWEEN 1000 AND 1200 AND grade = 'gold';`}</pre>
      <PlanBlock plan={indexScan} caption="Index Cond と Filter が同じノードに並んで出ている。" />
      <p>
        <strong>2 つが上下に並んでいます。</strong>
      </p>
      <ul>
        <li>
          <code>Index Cond: ((id &gt;= 1000) AND (id &lt;= 1200))</code> —{" "}
          <strong>インデックスを辿る段階</strong>で使われた条件
        </li>
        <li>
          <code>Filter: (grade = &apos;gold&apos;)</code> —{" "}
          <strong>行を読んでから</strong>判定した条件
        </li>
        <li>
          <code>Rows Removed by Filter: 134</code> — 201 行読んで
          <strong>134 行を捨てた</strong>（返したのは 67 行）
        </li>
      </ul>
      <p>
        <code>id</code> の側はインデックスが範囲を直接絞れるので、
        <strong>そもそも 201 行しか読んでいません。</strong>
        <code>grade</code> の側はインデックスが無いので、
        <strong>201 行すべてを読んでから 134 行を捨てています。</strong>
        これが「読む前に効く」と「読んだあとに捨てる」の違いです。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>スキャンの種類によって、条件の出る場所が変わります。</strong>
          上の <code>Index Scan</code> では <code>Index Cond</code> と{" "}
          <code>Filter</code> が同じノードに並びますが、
          <strong>
            <code>Bitmap Heap Scan</code> になると <code>Index Cond</code> は
            子ノードの側に移ります。
          </strong>
          次がその形です。
        </p>
      </div>

      <h2>Bitmap になると、条件が 2 つのノードに分かれる</h2>
      <pre>{`-- members(city) にだけインデックスがある
SELECT * FROM members WHERE city = 'city-7' AND grade = 'gold';`}</pre>
      <PlanBlock plan={single} caption="Index Cond は子の Bitmap Index Scan 側にある。" />
      <p>
        <strong>条件が 2 つのノードに散っています。</strong>
        探すときは<strong>子まで見てください。</strong>
      </p>
      <ul>
        <li>
          <strong>子の <code>Bitmap Index Scan</code></strong> に{" "}
          <code>Index Cond: (city = &apos;city-7&apos;)</code> —{" "}
          <strong>これが本物の <code>Index Cond</code></strong>。
          インデックスを辿って「どのページを読むか」を決めている
        </li>
        <li>
          <strong>親の <code>Bitmap Heap Scan</code></strong> に{" "}
          <code>Recheck Cond: (city = &apos;city-7&apos;)</code> — 同じ条件をもう一度書いたもの。
          ビットマップが粗くなったときに備えた確認用で、
          <strong>「読む前に効いている」側という点は <code>Index Cond</code> と同じ</strong>
        </li>
        <li>
          <code>Filter: (grade = &apos;gold&apos;)</code> と{" "}
          <code>Rows Removed by Filter: 6667</code> — こちらは変わらず
          <strong>読んだあとに捨てている</strong>側
        </li>
      </ul>
      <p>
        10,000 行読んで 3,333 行しか使っていません。
        <strong>3 分の 2 が無駄読み</strong>です。
      </p>

      <h2>両方を含む複合インデックスを張ると</h2>
      <pre>{`CREATE INDEX members_city_grade_idx ON members (city, grade);`}</pre>
      <PlanBlock plan={composite} caption="Filter が消え、両方の条件が読む前に効くようになった。" />
      <p>
        <code>Filter</code> の行が消えました。代わりに
        <code>Recheck Cond</code>（と子の <code>Index Cond</code>）に
        <strong>両方の条件</strong>が乗っています。
        <code>Rows Removed by Filter</code> も出ていません。
        <strong>捨てる行がゼロになった</strong>ということです。
      </p>
      <p>
        効果は <code>Heap Blocks</code> の行に出ています。
        <strong>これは実際に読んだページ数</strong>です。
      </p>
      <ul>
        <li>
          単一インデックス: <code>Heap Blocks: exact=4167</code>
        </li>
        <li>
          複合インデックス: <code>Heap Blocks: exact=3333</code>
        </li>
      </ul>
      <p>
        <strong>4,167 ページ → 3,333 ページ。20% 減りました。</strong>
        捨てる行が無くなったぶん、触るページも減っています。
      </p>
      <p>
        <strong>読む量が減った結果は、実行時間にも出ています。</strong>
        同じ計画の <code>Execution Time</code> が{" "}
        <strong>{EXEC_SINGLE} ミリ秒 → {EXEC_COMPOSITE} ミリ秒（{EXEC_RATIO} 倍）</strong>。
        ページを 20% 減らしただけに見えて、
        <strong>行を捨てる処理そのものが無くなっている</strong>ぶん差が大きく出ます。
        複合インデックスの列順の話は
        <Link href="/rdb-index/composite">複合インデックス</Link>に。
      </p>

      <h2>3 つを並べると、捨てている量の差が見える</h2>
      <RowsFunnel
        title="読んだ行のうち、何行を捨てているか"
        cases={[
          {
            plan: indexScan,
            label: "Index Scan",
          },
          {
            plan: single,
            label: "単一インデックス",
          },
          {
            plan: composite,
            label: "複合インデックス",
          },
        ]}
        legend={
          <>
            <strong>薄い部分が「読んだのに捨てた行」。</strong>
            <code>Index Cond</code> に乗せられた条件が増えるほどここが短くなり、
            複合インデックスでは<strong>ゼロになる</strong>。
            <strong>棒の長さはそろえてある</strong>ので、比べているのは行数ではなく
            <strong>捨てた割合</strong>。実際の行数は棒の右に出ている。
          </>
        }
      />

      <h2>Rows Removed by Filter の読み方</h2>
      <p>
        <strong>この数字が「無駄読みの量」です。</strong>
        大きければ大きいほど、インデックスを見直す価値があります。
      </p>
      <p>
        ただし<strong>絶対値では判断できません。</strong>
        1 万行捨てていても、それが全体の 1% なら気にする必要はありません。
        <strong>返した行数と並べて</strong>見ます。
      </p>
      <ul>
        <li>返した行 3,333 / 捨てた行 6,667 → <strong>3 分の 2 が無駄</strong>。直す価値がある</li>
        <li>返した行 100 万 / 捨てた行 1,000 → 気にしなくてよい</li>
      </ul>

      {/* ★ この段落だけは旗艦の計画から数値を借りている。消すと、旗艦を採り直したときに
          ここだけ静かに腐る（page-numbers.test.ts が cite: の行を読んで照合する）。
          cite: hero-plan.json | Rows Removed by Filter: 4 */}
      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>ループの内側に出ることもあります。</strong>
          <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>の題材では、
          内側のノードに <code>Rows Removed by Filter: 4</code> が出ています。
          <strong>1 回あたり 4 行</strong>という意味なので、
          <code>loops</code> を掛けると 100 万行捨てていることになります。
          <code>loops</code> が付いているときは、この数字も 1 回あたりです。
        </p>
      </div>

      <h2>インデックスが効いているかの判定にも使える</h2>
      <p>
        「インデックスを貼ったのに速くならない」ときは、
        <strong>まず条件が <code>Index Cond</code> 側に乗っているか</strong>を見ます。
        <code>Filter</code> 側に残っていれば、そのインデックスはその条件には効いていません。
      </p>
      <p>
        乗らない理由はいくつもあります（列に関数をかけている、型が合っていない、
        複合インデックスの左端を使っていない、など）。
        一覧は<Link href="/rdb-index/explain">インデックスが使われないときに何を見るか</Link>に
        まとまっています。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
