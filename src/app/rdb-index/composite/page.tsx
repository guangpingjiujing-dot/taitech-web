import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { CompositeViz } from "@/components/viz/CompositeViz";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "composite";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "複合インデックスの順序はどう決めればいい？",
    a: "「頻繁に単独で検索するカラム」「絞り込みが強い（カーディナリティが高い）カラム」を先頭に置くのが基本です。逆順にすると効かないクエリが増えます。",
  },
  {
    q: "3カラム以上の複合インデックスは効果ありますか？",
    a: "はい。ただしカラム数が増えるほどインデックスサイズと更新コストが増えるため、実際のクエリパターンを見て必要な組み合わせだけを作るのが定石です。",
  },
  {
    q: "先頭以外のカラム条件でも効くケースはある？",
    a: "RDBMSやオプティマイザによっては「スキップスキャン」的な最適化が働くこともありますが、期待するべきではありません。カラム順の設計を正しく行うのが原則です。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>複合インデックスは「辞書順」で並ぶ</h2>
      <p>
        複合インデックス <code>(A, B)</code> は、まずAで並び替え、A内でBの順に並びます。
        辞書の「アイウエオ」で1文字目→2文字目の順に並ぶのと同じです。
        だから先頭カラムAが条件に無いとインデックスをたどれず、Bだけで絞り込むことはできません。
      </p>

      <CompositeViz />

      <h2>先頭カラム限定原則</h2>
      <p>
        複合インデックス <code>(A, B, C)</code> が効くのは以下のパターンです：
      </p>
      <ul>
        <li><code>WHERE A = ?</code></li>
        <li><code>WHERE A = ? AND B = ?</code></li>
        <li><code>WHERE A = ? AND B = ? AND C = ?</code></li>
      </ul>
      <p>逆に、以下では基本的に効きません：</p>
      <ul>
        <li><code>WHERE B = ?</code>（Aが指定されていない）</li>
        <li><code>WHERE C = ?</code></li>
        <li><code>WHERE B = ? AND C = ?</code></li>
      </ul>

      <h2>設計指針</h2>
      <ul>
        <li>頻度の高い検索パターンをリストアップ → 共通の先頭カラムを見つける</li>
        <li>等価比較 → 範囲比較 → ソートの順にカラムを並べると効果的</li>
        <li>不要な複合を大量に作らない。似た2つは統合できないか検討する</li>
      </ul>

      <h2>複合キーが自然に生まれる場面 — 多対多の連関実体</h2>
      <p>
        複合インデックスの典型的な出現源が、
        {" "}<Link href="/data-modeling/er-diagram/many-to-many">多対多を連関実体で分解した中間テーブル</Link>
        {" "}だ。例えば「学生 × 科目」を分解した履修登録テーブルでは、
        主キーが <code>(学籍番号, 科目ID)</code> の複合主キーになる。
        この主キーはそのまま <code>(学籍番号, 科目ID)</code> の複合インデックスを兼ねる。
      </p>
      <p>
        カラム順は「よく単独で検索するほう」を先頭に置くのが定石。
        「特定学生の履修科目一覧」を頻繁に引くなら <code>(学籍番号, 科目ID)</code>、
        「特定科目の履修者一覧」を頻繁に引くなら <code>(科目ID, 学籍番号)</code>。
        両方の検索がバランス良く発生するなら、逆順の複合インデックスを追加で貼るのが実務での判断。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
