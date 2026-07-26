import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { UniqueViz } from "@/components/viz/UniqueViz";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "unique";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "ユニークインデックスとUNIQUE制約は同じもの？",
    a: "実装上はほぼ同じで、UNIQUE制約は内部的にユニークインデックスを作成します。DDLの書き方の違いくらいに考えて構いません。",
  },
  {
    q: "NULLは重複としてカウントされますか？",
    a: "SQL標準では、NULL同士は互いに異なる値として扱われるため、複数のNULLが許容されます。ただしRDBMSによってはこの挙動が異なる場合があるため、使いたい仕様であれば事前に確認が必要です。",
  },
  {
    q: "主キーとユニークインデックスの違いは？",
    a: "主キーはNULLを許さず、テーブルに1つだけ。ユニークインデックスはNULLを許し、複数貼れます。両方とも「重複させない」ための仕組みという点は共通です。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>ユニークインデックスとは</h2>
      <p>
        <strong>ユニークインデックス</strong> (unique index) とは、
        対象カラム (複合の場合はカラムの組) の値が
        <strong>テーブル全体で重複しないこと</strong> を保証するインデックスのこと。
        通常のインデックスと同じく検索を高速化する一方で、
        INSERT / UPDATE 時に「同じ値が既にあれば拒否する」制約チェックにも使われる。
      </p>
      <p>
        メールアドレス・ユーザー名・注文番号のような
        <strong>「一意でなければならない値」</strong> に貼るのが典型例。
        SQL の <code>UNIQUE</code> 制約は内部的にユニークインデックスを作るので、両者は実質同じ仕組み。
        主キーもユニークインデックスの一種 (NULL を許さない特殊版) と考えると整理しやすい。
      </p>

      <h2>「同じ値は入れさせない」という保証</h2>
      <p>
        ユニークインデックスは検索の高速化に加え、そのカラムの値が重複しないことを保証する制約として機能します。
        メールアドレス、ユーザー名、注文番号のように「1つしかあってはいけない値」に付与します。
      </p>

      <UniqueViz />

      <h2>裏でどう動いているか</h2>
      <p>
        INSERT時、DBはまずインデックスを引いて「同じ値が既に存在しないか」を確認してから挿入します。
        存在すればエラーを返し、無ければインデックスとテーブルの両方に書き込みます。
        検索の高速化のためのインデックスが、そのまま制約チェックにも使われる、賢い仕組みです。
      </p>

      <h2>使い所</h2>
      <ul>
        <li>メールアドレスや外部システムのID（自然キー）</li>
        <li>複合ユニーク: (user_id, role_id) のような組み合わせで一意にしたいペア</li>
        <li>論理削除がある場合は「未削除の中で一意」にしたいことが多く、部分ユニークが検討候補</li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
