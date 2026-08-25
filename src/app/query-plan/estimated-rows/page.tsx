import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import fixture from "@/content/query-plan/width-fixture.json";
import demoNoJson from "@/content/query-plan/plans/estimate-demo-noanalyze.json";
import demoYesJson from "@/content/query-plan/plans/estimate-demo-analyzed.json";
import bigNoJson from "@/content/query-plan/plans/big-noanalyze.json";
import bigYesJson from "@/content/query-plan/plans/big-analyzed.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "estimated-rows";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);

/* ★ 素の EXPLAIN（ANALYZE 無し）で採っている。見積りだけを見せるページなので実測は要らない */
const demoNo = (demoNoJson as unknown as ExplainJson)[0];
const demoYes = (demoYesJson as unknown as ExplainJson)[0];
const bigNo = (bigNoJson as unknown as ExplainJson)[0];
const bigYes = (bigYesJson as unknown as ExplainJson)[0];

/** 型の組み合わせを変えると width → rows → cost が動く。全部実測値（width-fixture.tsv） */
const SHOWN = [
  "a BOOLEAN",
  "a INT",
  "a BIGINT",
  "a TEXT",
  "a TEXT, b INT",
  "a TEXT, b TEXT, c INT",
  "a TEXT, b TEXT, c TEXT",
];
const shown = SHOWN.map((c) => fixture.rows.find((r) => r.columns === c)!).filter(Boolean);

const faq = [
  {
    q: "reltuples が -1 なのは 0 行という意味ですか？",
    a: "違います。-1 は「まだ調べていない」という印です。0 行と区別するためにこの値が使われています。ANALYZE を打つと実測値に置き換わります。",
  },
  {
    q: "統計が無いテーブルでも 10 ページと仮定されるのはなぜですか？",
    a: "作ったばかりのテーブルに対して 0 行と見積もると、そのテーブルを使う計画が極端に安く見えてしまうためです。下限を置くことで、極端な計画が選ばれるのを防いでいます。",
  },
  {
    q: "読者の手元で数字が一致しません",
    a: "ANALYZE はテーブル全体ではなくサンプリングで統計を取るので、実行するたびに数 % ずれます。大事なのは特定の数字ではなく、掛け算の手順の方です。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>3 行しかないテーブルで、850 行と見積もられる</h2>
      <p>
        テーブルを作って 3 行だけ入れ、<code>EXPLAIN</code> を打ちます。
      </p>
      <pre>{`CREATE TABLE estimate_demo (
    sensor_id TEXT, room_name TEXT, floor INT
) WITH (autovacuum_enabled = false);

INSERT INTO estimate_demo VALUES
    ('s1','room-a',1), ('s2','room-b',2), ('s3','room-c',3);

EXPLAIN SELECT * FROM estimate_demo;`}</pre>
      <PlanBlock plan={demoNo} caption="3 行しか入っていないのに rows=850 と出ている。" />
      <p>
        <strong><code>rows=850</code>。</strong>3 行しか入っていないのにです。
        そして <code>cost=18.50</code>。
      </p>
      <p>
        <strong>この 850 も 18.50 も、当てずっぽうではありません。</strong>
        最後まで計算で再現できます。
      </p>

      <h2>手順 1 — 統計が無いことを確認する</h2>
      <pre>{`SELECT relpages, reltuples FROM pg_class WHERE relname = 'estimate_demo';
--  relpages | reltuples
-- ----------+-----------
--         0 |        -1`}</pre>
      <p>
        <code>relpages = 0</code>、<code>reltuples = -1</code>。
        <strong><code>-1</code> は「0 行」ではなく「まだ調べていない」の印</strong>です。
        <code>ANALYZE</code> を一度も打っていないので、統計がありません。
      </p>

      <h2>手順 2 — ページ数は 10 とみなす</h2>
      <p>
        実ファイルは 1 ページしかありませんが、
        <strong>10 ページ未満かつ未調査なら 10 ページとして扱う</strong>という下限があります。
      </p>
      <p>
        作ったばかりのテーブルを 0 行と見積もると、
        そのテーブルを使う計画が極端に安く見えてしまうためです。
      </p>

      <h2>手順 3 — 1 行の幅を型から決める</h2>
      <p>
        統計が無いので、実際のデータは見ません。<strong>型ごとの既定値</strong>を使います。
      </p>
      <ul>
        <li><code>text</code> = 32 バイト（可変長なので決め打ち）</li>
        <li><code>int</code> = 4 バイト</li>
      </ul>
      <p>
        <code>text</code> が 2 つと <code>int</code> が 1 つなので、
        <code>32 + 32 + 4 = 68</code>。出力の <code>width=68</code> と一致します。
      </p>

      <h2>手順 4 — 1 ページに何行入るか</h2>
      <pre>{`(8192 - 24) ÷ (68 + 24 + 4) = 8168 ÷ 96 = 85.08... → 85 行`}</pre>
      <ul>
        <li><strong>8192</strong> — 1 ページの大きさ（8KB）</li>
        <li><strong>24</strong> — ページの先頭にある管理領域</li>
        <li><strong>68</strong> — さっき出した 1 行の幅</li>
        <li><strong>24</strong> — 行ごとの管理領域</li>
        <li><strong>4</strong> — ページ内で行の位置を指すポインタ</li>
      </ul>
      <p>小数は切り捨てて <strong>85 行</strong>。</p>

      <h2>手順 5 — 掛ける</h2>
      <pre>{`85 行/ページ × 10 ページ = 850 行`}</pre>
      <p>
        <strong><code>rows=850</code> が出ました。</strong>
      </p>

      <h2>手順 6 — コストも同じ前提から出る</h2>
      <pre>{`10 ページ × 1.0（ページを順に読む）
  + 850 行 × 0.01（1 行を処理する）
= 10 + 8.5 = 18.50`}</pre>
      <p>
        <strong><code>cost=0.00..18.50</code> も一致しました。</strong>
        コストの単位の話は
        <Link href="/query-plan/explain-basics">cost と rows の意味</Link>にあります。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          この計算は PostgreSQL 本体の{" "}
          <Link
            href="https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/optimizer/util/plancat.c"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>estimate_rel_size()</code>（<code>src/backend/optimizer/util/plancat.c</code>）
          </Link>
          がやっていることを、そのままなぞったものです。
          ソースを読める人は、そこを見ると同じ式が書いてあります。
        </p>
      </div>

      <h2>列を変えると数字が動く</h2>
      <p>
        手順 3〜5 は<strong>列の型だけで決まります。</strong>実際に測った値を並べます。
      </p>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-strong)] text-left">
              <th className="py-2 pr-3 font-bold">列</th>
              <th className="py-2 pr-3 text-right font-bold">width</th>
              <th className="py-2 pr-3 text-right font-bold">1 ページの行数</th>
              <th className="py-2 pr-3 text-right font-bold">rows</th>
              <th className="py-2 text-right font-bold">cost</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.columns} className="border-b border-[var(--border)]">
                <td className="py-1.5 pr-3 font-mono text-[13px]">{r.columns}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{r.width}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{r.rows / 10}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">
                  {r.columns === "a TEXT, b TEXT, c INT" ? <strong>{r.rows}</strong> : r.rows}
                </td>
                <td className="py-1.5 text-right tabular-nums">{r.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <strong>幅が広いほど 1 ページに入る行が減り、見積り行数も減ります。</strong>
        どの行も <code>(8192 - 24) ÷ (width + 28) × 10</code> で計算できます。
      </p>

      <h2>この数字は信用できない</h2>
      <h3>10 ページは下限であって決め打ちではない</h3>
      <p>
        2 万行入れて <code>ANALYZE</code> を打たずに <code>EXPLAIN</code> すると、
        実ファイルの 345 ページがちゃんと使われます。
      </p>
      <PlanBlock plan={bigNo} caption="実ページ数 345 は使われている。外れているのは width。" />
      <p>
        ページ数は正しいのに、<strong>行数は 43,815</strong>（実際は 20,000）。
        原因は <code>width=36</code> です。
        <code>memo</code> 列に 100 文字入れているのに、
        統計が無いので <code>text</code> = 32 バイトと踏んでいます。
      </p>
      <p>
        <strong>幅の外れが、そのまま行数の外れに連鎖します。</strong>
        <code>(8192-24) ÷ (36+28) = 127 行/ページ × 345 ページ = 43,815</code>。
        計算は合っていて、入力が間違っているだけです。
      </p>

      <h3>ANALYZE すると推測が実測になる</h3>
      <pre>{`ANALYZE big_noanalyze;`}</pre>
      <PlanBlock plan={bigYes} caption="行数も幅も実測に置き換わった。" />
      <p>
        <code>rows=43815 width=36</code> が <code>rows=20000 width=105</code> になりました。
        3 行のテーブルでも同じです。
      </p>
      <pre>{`ANALYZE estimate_demo;
EXPLAIN SELECT * FROM estimate_demo;`}</pre>
      <PlanBlock plan={demoYes} caption="ANALYZE 後。850 が実測の 3 になった。" />
      <p>
        <code>rows=850 width=68</code> が <code>rows=3 width=14</code> になりました。
        <strong>幅も推測をやめて実データの平均長を使います。</strong>
        <code>text</code> は 32 バイト決め打ちではなく、実際に入っている
        <code>&#39;s1&#39;</code>（2 文字 + 長さ 1 バイト = 3）と
        <code>&#39;room-a&#39;</code>（6 文字 + 1 = 7）で測られ、
        <code>3 + 7 + 4 = 14</code> になります。
      </p>
      <p>
        <strong>推測に使っていた下限も型ごとの既定幅も、もう使われません。</strong>
        統計が実測を持っているからです。
      </p>

      <h2>実験するときの注意</h2>
      <p>
        <strong>「統計が無い状態」は放っておくと勝手に消えます。</strong>
        自動で統計を取る仕組みが動くためです。ただし
        <strong>どのテーブルでも消えるわけではありません。</strong>
      </p>
      <ul>
        <li>
          <strong>3 行のテーブル — 消えません。</strong>
          自動で統計を取る条件は「変更された行数が 50 + 全体の 10% を超えたら」なので、
          3 行では届きません
        </li>
        <li>
          <strong>2 万行のテーブル — 消えます。</strong>
          実測では <code>INSERT</code> の <strong>18 秒後</strong>に統計が取られていました
        </li>
      </ul>
      <p>
        だから 2 万行の実験をするときは、テーブルを作るときに
        <code>WITH (autovacuum_enabled = false)</code> を付けます。
        <strong>付けないと、観察する前に統計が付いて再現しません。</strong>
      </p>

      <h2>統計があっても外れることはある</h2>
      <p>
        ここまでは「統計が無い」場合でした。
        <strong>統計があっても見積りは外れます。</strong>
      </p>
      <p>
        <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>の題材では、
        統計がある状態で <strong>475 倍</strong>外れています。
        条件が 4 つあり、それぞれの選択率を掛け算しているためです
        （実際には 4 つが連動しているので、掛けると小さくなりすぎる）。
      </p>
      {/* ★ 次の段落だけは他ページの計画から数値を借りている。消すと、旗艦を採り直したときに
          ここだけ静かに腐る（page-numbers.test.ts が cite: の行を読んで照合する）。
          cite: hero-plan.json | rows=23 */}
      <p>
        同じ計画の内側にも、もう 1 つ外れているノードがあります。
        <code>rows=23</code> と見積もって実測は 2 行。
        こちらは<strong>1 つの注文に何行の明細があるか</strong>の見積りが外れているためです。
        1200 万行をサンプリングして異なり数を数えているので、
        <strong>異なり数を少なく見積もると、1 件あたりの行数が多く見えます。</strong>
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
