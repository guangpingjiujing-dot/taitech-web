import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { CoveringViz } from "@/components/viz/CoveringViz";
import { IndexToRowFlow } from "@/components/viz/IndexToRowFlow";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "covering";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "INCLUDE付きインデックスとは？",
    a: "多くのRDBMSに、インデックスキーには使わないが値だけをインデックスに保持するためのオプションがあります。これを使うと、キーとしての探索性能を保ちつつ、カバリング用の追加カラムを持たせられます。",
  },
  {
    q: "カバリングインデックスは常に得？",
    a: "いいえ。インクルードするカラムが多いほどインデックスサイズが増え、更新コストも上がります。頻出クエリに絞って設計するのが基本です。",
  },
  {
    q: "実行計画で見分けるには？",
    a: "「Index Only Scan」「Using index」など、RDBMSごとに表現は違いますが、いずれも「テーブル本体を触っていない」ことを示す文言が実行計画に現れます。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>「テーブル本体を読まない」インデックス</h2>
      <p>
        通常のインデックス検索は、インデックスで該当行を特定してからテーブル本体にアクセスして必要なカラムを取り出します。
        カバリングインデックスは、必要なカラムをインデックス側に全部含めることで、テーブル本体アクセスを一切不要にします。
      </p>

      <CoveringViz />

      <h2>省略されているのは「テーブル本体のページ読み取り」</h2>
      <p>
        通常のインデックスは、葉ノードから <a href="/rdb-index/basics/data-structure">行ID</a> を取得したあと、
        <strong>そのIDが指すページを読みに行きます</strong>。この追加のページI/Oが、行数が多いクエリでは支配的な時間になる。
      </p>

      <IndexToRowFlow variant="covering-off" />

      <p>
        カバリングにすると、必要な値がインデックス側に入っているため、この「テーブル本体のページを読む」ステップを完全に省略できます。
      </p>

      <IndexToRowFlow variant="covering-on" />

      <h2>「インデックスオンリースキャン」と呼ばれる</h2>
      <p>
        実行計画（EXPLAIN）に「テーブル本体を触っていない」ことを示す文言が現れるのがこのケース（RDBMSごとに用語は異なる）。
        テーブルアクセスが省かれるため、行数が多いクエリで劇的に速くなります。
      </p>

      <h2>設計のポイント</h2>
      <ul>
        <li>クエリで参照するカラムだけを覆えばよい。<code>SELECT *</code> ではなく必要な列だけを取る</li>
        <li>ソートや集約に使うカラムを含めておくと、そのままインデックスから結果が返せる</li>
        <li>大きなカラムを覆うとインデックスが膨らむので費用対効果を確認する</li>
      </ul>

      <p>
        <strong>効果を実測した例があります。</strong>
        2.16 秒かかっていたクエリの内側にカバリングインデックスを足したところ、
        <code>Index Only Scan</code> に変わって <code>Heap Fetches: 0</code> になり、
        <strong>0.94 秒まで落ちました</strong>。実行計画つきで
        <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link>に置いてあります。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
