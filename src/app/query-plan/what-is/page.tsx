import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";
import { PlanBlock } from "@/components/query-plan/PlanBlock";
import smallJson from "@/content/query-plan/plans/lesson-small-join.json";
import type { ExplainJson } from "@/lib/query-plan/types";

const slug = "what-is";
const topic = findTopic("query-plan", slug)!;
export const metadata = buildTopicMetadata(topic);
const small = (smallJson as unknown as ExplainJson)[0];

const faq = [
  {
    q: "EXPLAIN を打つとクエリは実行されますか？",
    a: "EXPLAIN だけなら実行されません。見積りを返すだけです。EXPLAIN ANALYZE は実際に実行するので、UPDATE や DELETE で打つと本当にデータが変わります。",
  },
  {
    q: "実行計画は毎回同じですか？",
    a: "同じとは限りません。統計情報が更新されたり、テーブルの行数が変わったり、設定が違えば別の計画が選ばれます。だから「前は速かったのに急に遅くなった」が起きます。",
  },
  {
    q: "ORM を使っていても実行計画は見られますか？",
    a: "見られます。多くの ORM は生成した SQL を出力する機能を持っているので、その SQL の先頭に EXPLAIN を付けて DB クライアントで実行します。Rails のように .explain を持つものもあります。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="query-plan" slug={slug}>
      <TopicJsonLd section="query-plan" slug={slug} faq={faq} />

      <h2>SQL は「何が欲しいか」しか書いていない</h2>
      <p>
        SQL には<strong>どうやって取るか</strong>が書かれていません。
        「この条件に合う行が欲しい」としか言っていないので、
        <strong>取り方はデータベースが決めます。</strong>
      </p>
      <pre>{`SELECT * FROM members WHERE city = 'city-7';`}</pre>
      <p>この 1 行に対して、少なくとも次の取り方があります。</p>
      <ul>
        <li>テーブルを先頭から最後まで読んで、条件に合う行だけ拾う</li>
        <li><code>city</code> のインデックスを辿って、該当する行だけ取りに行く</li>
        <li>インデックスで該当行の位置を全部集めてから、ページ順にまとめて読む</li>
      </ul>
      <p>
        どれも同じ結果を返します。<strong>違うのは速さだけ</strong>です。
        そして「どれが速いか」は、テーブルの行数や条件に合う行の割合で変わります。
        だからデータベースは毎回<strong>見積もって選んで</strong>います。
      </p>
      <p>
        この「選んだ結果」が<strong>実行計画</strong>です。
        選ぶ担当を<strong>オプティマイザ（プランナ）</strong>と呼びます。
      </p>

      <h2>EXPLAIN で見る</h2>
      <p>クエリの先頭に <code>EXPLAIN</code> を付けると、選ばれた計画が返ってきます。</p>
      <p>
        ただし <code>EXPLAIN</code> だけだと<strong>見積りしか返りません。</strong>
        実測値も欲しいので、最初から <code>EXPLAIN (ANALYZE)</code> で打ちます。
        こちらは<strong>実際にクエリを実行して</strong>、かかった時間と返った行数も返します。
      </p>
      <pre>{`EXPLAIN (ANALYZE)
SELECT m.name, o.amount
FROM members m
JOIN orders_s o ON o.member_id = m.id
WHERE m.id = 42;`}</pre>
      <PlanBlock
        plan={small}
        caption="EXPLAIN (ANALYZE) の出力。"
      />
      <p>
        いまはまだ読めなくて構いません。
        <Link href="/query-plan/read-tree">読む順番</Link>と
        <Link href="/query-plan/explain-basics">cost と rows の意味</Link>を押さえれば読めます。
      </p>

      <div className="not-prose my-6 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-[15px] leading-relaxed">
          <strong>EXPLAIN ANALYZE は本当に実行します。</strong>
          <code>SELECT</code> なら問題ありませんが、
          <code>UPDATE</code> / <code>DELETE</code> / <code>INSERT</code> で打つと
          <strong>データが変わります</strong>。試すときはトランザクションを開いて
          最後に <code>ROLLBACK</code> するのが安全です。
        </p>
      </div>

      <h2>どこで打つか</h2>
      <h3>psql（コマンドライン）</h3>
      <p>
        そのまま打てます。長い計画は折り返されて読みにくいので、
        <code>\pset pager off</code> にしておくと扱いやすくなります。
      </p>
      <h3>GUI クライアント（pgAdmin / DBeaver / TablePlus など）</h3>
      <p>
        クエリの実行ボタンとは別に「実行計画」のボタンがあることが多いです。
        <strong>テキストで見たい場合は、素直に <code>EXPLAIN</code> を付けて普通に実行する</strong>のが
        確実です。ツールの独自ビューは見やすい代わりに、
        この先で扱う <code>loops</code> や <code>Rows Removed by Filter</code> が
        隠れていることがあります。
      </p>
      <h3>ORM 経由</h3>
      <ul>
        <li>
          <strong>まず生成された SQL を出す。</strong>
          ログ出力やデバッグモードで確認できます
        </li>
        <li>その SQL をクライアントに貼って <code>EXPLAIN</code> を付ける</li>
        <li>
          プレースホルダ（<code>$1</code> など）が残っている場合は、実際の値を入れて打ちます。
          <strong>値によって計画が変わることがある</strong>ので、
          本番で問題になっている値をそのまま使うのが大事です
        </li>
      </ul>

      <h2>次に読むもの</h2>
      <p>
        計画の<strong>読む順番</strong>から始めるのが最短です。
        木構造だと知らないまま数字を追っても、どこから見ればいいのか分からないためです。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
