import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import { ScanDiagram } from "@/components/query-plan/ScanDiagram";
import seqJson from "@/content/query-plan/plans/lesson-scan-seq.json";
import indexJson from "@/content/query-plan/plans/lesson-scan-index.json";
import onlyJson from "@/content/query-plan/plans/lesson-scan-indexonly.json";
import bitmapJson from "@/content/query-plan/plans/lesson-scan-bitmap.json";
import crossover from "@/content/query-plan/scan-crossover.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "scan-nodes";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const seq = (seqJson as unknown as ExplainJson)[0];
const idx = (indexJson as unknown as ExplainJson)[0];
const only = (onlyJson as unknown as ExplainJson)[0];
const bitmap = (bitmapJson as unknown as ExplainJson)[0];

/**
 * 選択率を上げると Bitmap → Seq に切り替わる実測。
 * **数値をここに書かない。** 採り直すたびにズレるので、採取した生成物をそのまま読む
 * （`capture-lessons.sh` が作る `lesson-scan-crossover.txt` から変換したもの）。
 */
const CROSSOVER = crossover.rows;
const CROSSOVER_TOTAL = crossover.total;

const faq = [
  {
    q: "Seq Scan が出たらインデックスを貼るべきですか？",
    a: "そうとは限りません。対象行が全体の半分を超えるようなクエリでは、インデックスを辿るより順に読んだ方が速いのでプランナは正しく Seq Scan を選んでいます。このページの実測では 50% 前後が境目でした。",
  },
  {
    q: "Bitmap Heap Scan は何のためにあるのですか？",
    a: "インデックスを辿って行を 1 件ずつ取りに行くと、ページをバラバラに読むことになります。該当行の位置をいったん集めてページ順に並べ替えてから読めば、まとめて読めるぶん速くなります。その中間的な方式です。",
  },
  {
    q: "Index Only Scan の Heap Fetches が 0 でないのはなぜですか？",
    a: "インデックスだけでは行が見えてよいかを判断できない場合があり、そのときはテーブル本体を確認しに行きます。VACUUM が行き届いていると 0 に近づきます。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>4 つの表記</h2>
      <p>
        テーブルからデータを取り出すノードには 4 つの顔があります。
        <strong>どれが出ているかで、何をしているかが分かります。</strong>
      </p>
      <p>
        先に用語を 1 つ。この先に出てくる <code>Heap</code>（<code>Bitmap Heap Scan</code> /
        <code>Heap Blocks</code> / <code>Heap Fetches</code>）は
        <strong>テーブル本体</strong>のことです。インデックスと区別するための呼び名で、
        <strong>「Heap を読んだ」＝「テーブル本体を読んだ」</strong>と読み替えて構いません。
      </p>

      <h3>Seq Scan — 先頭から最後まで読む</h3>
      <ScanDiagram variant="seq" />
      <PlanBlock plan={seq} caption="50 万行を全部読む。" />
      <p>
        テーブルを順番に全部読みます。インデックスが使えないとき、
        <strong>あるいは使わない方が速いと判断されたとき</strong>に選ばれます。
      </p>

      <h3>Index Scan — インデックスを辿って 1 行ずつ取りに行く</h3>
      <ScanDiagram variant="index" />
      <PlanBlock plan={idx} caption="主キーで 1 行だけ引く。" />
      <p>
        <code>Index Cond:</code> に条件が乗っているのが目印です。
        インデックスで場所を特定してから、その行があるページを読みに行きます。
      </p>
      <p>
        <strong>該当行が多いと不利になります。</strong>
        行ごとにページをバラバラに読むことになるためです。
      </p>

      <h3>Index Only Scan — テーブルを読まない</h3>
      <ScanDiagram variant="index-only" />
      {/* ★ 4 方式のうちここだけ SQL を出す。「なぜテーブルを読まずに済むのか」は
          SELECT リストを見ないと分からないため（06-content-review.md P4） */}
      <pre>{`SELECT city FROM members WHERE city = 'city-7';`}</pre>
      <p>
        <strong>取り出すのが <code>city</code> だけ</strong>で、
        その <code>city</code> にインデックスが張ってあります。
        <strong>欲しい値がインデックスの中に全部ある</strong>ので、テーブル本体に用がありません。
      </p>
      <PlanBlock plan={only} caption="Heap Fetches: 0。テーブル本体を 1 回も触っていない。" />
      <p>
        <strong>必要な列が全部インデックスに入っている</strong>ときだけ選ばれます。
        テーブル本体を読まないので、いちばん速い形です。
        <code>Heap Fetches: 0</code> が「1 回も触っていない」印です。
      </p>
      <p>
        これを狙って作るのが<Link href="/rdb-index/covering">カバリングインデックス</Link>です。
        <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>では、
        実際にこれで内側を 5 分の 1 にしています。
      </p>

      <h3>Bitmap Heap Scan — 位置を集めてから、まとめて読む</h3>
      <ScanDiagram variant="bitmap" />
      <PlanBlock plan={bitmap} caption="Bitmap Index Scan で位置を集め、Bitmap Heap Scan でページ順に読む。" />
      <p>
        <strong>2 段構えになっている</strong>のが特徴です。
      </p>
      <ol>
        <li>
          <code>Bitmap Index Scan</code> がインデックスを辿って、
          <strong>該当行の位置だけ</strong>を集める
        </li>
        <li>
          <code>Bitmap Heap Scan</code> が、集めた位置を<strong>ページ順に並べ替えて</strong>読む
        </li>
      </ol>
      <p>
        <code>Index Scan</code> がインデックスを引くたびにテーブルへ飛ぶのに対して、
        <strong>先に位置を全部集めてから、ページ順にまとめて読む</strong>のが違いです。
        該当行が「そこそこ多い」ときに選ばれます。
      </p>
      <p>
        <strong>ここで <code>Heap Blocks: exact=4167</code> の意味を確かめてください。</strong>
        これは実際に読んだページ数です。この例が返しているのは
        50 万行のうち 1 万行（<strong>2%</strong>）だけなのに、
        <strong>読んだページ数は 4,167 ページ ——
        上の <code>Seq Scan</code> がテーブル全体を読んだのと同じ数</strong>です。
      </p>
      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>Bitmap は「読むページを減らす」方式ではありません。</strong>
          <code>city</code> の値がテーブル全体に散らばっているので、
          <strong>結局どのページにも 1 行以上入っている</strong>からです。
          Bitmap が減らしているのは<strong>ページを行き来する回数</strong>で、
          <strong>読む順番を整える</strong>方式だと考えるのが正確です。
        </p>
        <p className="mt-3 text-[15px] leading-relaxed">
          ページ数まで減るのは、<strong>該当行が固まって置かれているとき</strong>です。
          行の物理的な並びがインデックス順にどれだけ近いかで効果が変わります（
          <Link href="/rdb-index/clustered">クラスタ化インデックス</Link>）。
        </p>
      </div>
      <p>
        <code>Recheck Cond:</code> が出るのは、
        ビットマップが粗くなったときにページ単位で持つことがあり、
        そのとき行を読んでから条件をもう一度確かめるためです。
        この行の読み方は
        <Link href="/query-plan/index-cond-vs-filter">Index Cond と Filter の違い</Link>に。
      </p>

      <h2>何 % を超えると全表スキャンになるか</h2>
      <p>
        <strong>実際に測りました。</strong>
        50 万行のテーブルで、条件に合う行の割合を少しずつ上げていきます。
      </p>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-strong)] text-left">
              <th className="py-2 pr-3 font-bold">条件</th>
              <th className="py-2 pr-3 text-right font-bold">見積り行数</th>
              <th className="py-2 pr-3 text-right font-bold">全体比</th>
              <th className="py-2 font-bold">選ばれたスキャン</th>
            </tr>
          </thead>
          <tbody>
            {CROSSOVER.map((r) => (
              <tr key={r.cond} className="border-b border-[var(--border)]">
                <td className="py-1.5 pr-3 font-mono text-[13px]">{r.cond}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{r.rows.toLocaleString()}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">
                  {((r.rows / CROSSOVER_TOTAL) * 100).toFixed(0)}%
                </td>
                <td className="py-1.5">
                  {r.node === "Seq Scan" ? <strong>{r.node}</strong> : r.node}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <strong>50% 前後で切り替わりました。</strong>
        {(() => {
          const lastBitmap = [...CROSSOVER].reverse().find((r) => r.node !== "Seq Scan");
          const firstSeq = CROSSOVER.find((r) => r.node === "Seq Scan");
          if (!lastBitmap || !firstSeq) return null;
          const p = (n: number) => ((n / CROSSOVER_TOTAL) * 100).toFixed(1);
          return (
            <>
              {lastBitmap.rows.toLocaleString()} 行（{p(lastBitmap.rows)}%）までは{" "}
              <code>Bitmap Heap Scan</code>、{firstSeq.rows.toLocaleString()} 行（
              {p(firstSeq.rows)}%）から <code>Seq Scan</code> です。
            </>
          );
        })()}
      </p>
      <p>
        つまり<strong>「インデックスがあるのに Seq Scan になっている」のは、
        たいてい正しい判断</strong>です。半分読むなら順に読んだ方が速いからです。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>この境目は環境で動きます。</strong>
          バラバラに読む手間を順に読む手間の何倍と仮定するか、という設定値が効くためです。
          既定では 4 倍と仮定していますが、SSD ではもっと近く、
          キャッシュがよく効いていればさらに近くなります。
          <strong>「何 % で切り替わるか」を暗記するのではなく、
          自分の環境で測る</strong>のが正しい向き合い方です。
        </p>
      </div>

      <h2>インデックスがあるのに使われないとき</h2>
      <p>
        ここまでは「対象行が多いから使わない」という<strong>正しい</strong>ケースでした。
        それ以外の理由で使われないことも多くあります。
        列に関数をかけた、型が合っていない、複合インデックスの左端を使っていない、など。
      </p>
      <p>
        そちらは<Link href="/rdb-index/explain">インデックスが使われないときに何を見るか</Link>に
        まとまっています。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
