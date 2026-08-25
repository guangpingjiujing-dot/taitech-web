import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { ClusteredViz } from "@/components/viz/ClusteredViz";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "clustered";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "クラスタ化インデックスはテーブルにいくつ作れますか？",
    a: "実データそのものの並び順を決めるため、1テーブルにつき1つだけです。通常は主キーがそのままクラスタ化インデックスとして機能します。",
  },
  {
    q: "RDBMSごとに実装は違う？",
    a: "はい。主キーを自動的にクラスタ化するタイプもあれば、ヒープ表を基本とし別途コマンドで一時的にキー順へ並べ替えるタイプもあります。原則としては「1テーブル1つ」の制約と「物理配置がキー順になる」性質は共通です。",
  },
  {
    q: "クラスタ化インデックスのデメリットは？",
    a: "主キーが可変長・ランダムな値だと物理的な再配置コストが上がる（挿入が遅くなる）ことです。分散設計や連番主キーが好まれるのはこのため。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>「テーブルの並び方」そのものが索引</h2>
      <p>
        通常のインデックスは「別のデータ構造として、テーブルの行を指し示すポインタを持つ」ものですが、クラスタ化インデックスは違います。
        テーブル本体を索引キーの順に物理配置してしまうのです。結果、範囲検索や順序スキャンでは連続領域の読み取り一発で済みます。
      </p>

      <ClusteredViz />

      <h2>「ページの並び順」を意識すると理解が深まる</h2>
      <p>
        テーブルは<a href="/rdb-index/basics/data-structure">ページ単位</a>でディスクに置かれるので、範囲検索の速さは「該当行がどのページに散らばっているか」で決まります。
      </p>
      <ul>
        <li>
          <strong>非クラスタ化</strong>: 該当行のページは飛び地。範囲検索でも <em>何ページも別々に読む</em> ランダムI/Oが発生する。
        </li>
        <li>
          <strong>クラスタ化</strong>: 該当行が連続ページに固まっている。<em>先頭ページから順に読む</em> シーケンシャルI/Oで済む（ランダムより数十倍速い）。
        </li>
      </ul>

      <h2>非クラスタ化インデックスとの違い</h2>
      <ul>
        <li>
          <strong>非クラスタ化</strong>: インデックス側にキーと行ポインタを持つ。範囲検索でも該当行の物理位置は飛び飛び。
        </li>
        <li>
          <strong>クラスタ化</strong>: テーブルの物理的な並びそのもの。範囲検索は連続ブロックのシーケンシャルアクセスで完結。
        </li>
      </ul>

      <h2>設計時のポイント</h2>
      <ul>
        <li>「範囲でよく引くカラム」をクラスタキーにするとI/Oが劇的に減る</li>
        <li>主キーがランダム値（UUID など）の場合、挿入のたびに物理的な再配置が発生してコストが増大するので注意</li>
        <li>1つしか作れないので、「どの検索を最も速くしたいか」を吟味する</li>
      </ul>

      <p>
        <strong>行の並びが効く場面は実行計画にも出ます。</strong>
        <code>Bitmap Heap Scan</code> が読むページ数を減らせるのは
        <strong>該当行が固まって置かれているときだけ</strong>で、散らばっていると
        全表スキャンと同じページ数を読みます。実測は
        <Link href="/query-plan/scan-nodes">スキャンの種類</Link>に。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
