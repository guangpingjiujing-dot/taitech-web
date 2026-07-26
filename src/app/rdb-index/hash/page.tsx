import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { HashViz } from "@/components/viz/HashViz";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "hash";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "ハッシュインデックスがB-treeより速いのに使われる場面が少ないのはなぜ？",
    a: "範囲検索・並び替え・複合的な条件に対応できないためです。用途が「主キーやユニーク値の等価検索」に限られます。",
  },
  {
    q: "ハッシュ衝突が起きるとどうなりますか？",
    a: "同じバケットに複数のキーが入り、線形探索やチェーンで解決します。衝突が多いと性能が落ちるため、ハッシュ関数と負荷率の設計が重要です。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>ハッシュインデックスとは</h2>
      <p>
        <strong>ハッシュインデックス</strong> (hash index) とは、
        キーの値をハッシュ関数で固定長の数値 (ハッシュ値) に変換し、
        その値に対応するバケットへ格納・参照することで
        <strong>平均 O(1) の等価検索</strong> を実現するインデックス方式のこと。
        B-tree のように木構造を辿らず、1 回の計算でバケット位置が決まるのが最大の特徴だ。
      </p>
      <p>
        <strong>使える場面</strong>: <code>WHERE id = ?</code> のような等価検索 (完全一致)。
        <strong>使えない場面</strong>: 範囲検索・ソート・前方一致・複合条件の先頭以外での絞り込み。
        PostgreSQL の <code>USING hash</code>、MySQL Memory エンジン、キーバリューストア (Redis 等) の内部構造で使われる。
      </p>

      <h2>キーをハッシュ値に変換してバケットに配る</h2>
      <p>
        ハッシュインデックスの仕組みはシンプルです。キーをハッシュ関数に通して固定サイズの数値に変換し、そのバケットに格納する。
        探すときも同じ関数でバケットを特定して、そこだけを見れば済みます。
        件数が増えても平均O(1)で目的にたどり着けるのが強みです。
      </p>

      <HashViz />

      <h2>ハッシュインデックスの弱点</h2>
      <ul>
        <li>
          <strong>範囲検索ができない</strong>: ハッシュ値は元の値の大小関係を保存しないため、<code>WHERE id BETWEEN 10 AND 20</code>のような検索は不可能。
        </li>
        <li>
          <strong>ソートに使えない</strong>: <code>ORDER BY</code>を高速化する用途にも使えない。
        </li>
        <li>
          <strong>複合条件が組みにくい</strong>: 一部のカラムだけでの検索や先頭一致は不可。
        </li>
      </ul>

      <h2>使うべき場面</h2>
      <p>
        セッションストアのキャッシュキー引き、ユニークIDでの等価検索、インメモリDB。
        逆に一般的な業務テーブルの主インデックスとしてはB-treeが選ばれることがほとんどです。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
