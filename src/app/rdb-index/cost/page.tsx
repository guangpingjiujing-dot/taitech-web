import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "cost";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "インデックスはどれくらいまで貼っていい？",
    a: "「よく使うクエリのパターン数」+ 主キー・ユニーク制約分が目安。1テーブルに10個以上あるならほとんどのケースで貼りすぎです。使われていないインデックスは定期的に棚卸ししましょう。",
  },
  {
    q: "使われていないインデックスを見つけるには？",
    a: "多くのRDBMSがインデックスの使用回数を記録する統計ビューを提供しており、それを使うと「一度も使われていないインデックス」を洗い出せます。棚卸しの起点として有効です。",
  },
  {
    q: "書き込み負荷が高いテーブルで気をつけることは？",
    a: "読み取り優位のテーブルよりインデックスを絞る。特にログ・時系列・大量INSERTが想定されるテーブルでは、必要最小限に留めるのが定石。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>インデックスはタダではない</h2>
      <p>
        インデックスは検索を速くする代わりに、以下のコストを裏で払っています。
      </p>
      <ul>
        <li>
          <strong>ストレージ</strong>: テーブル本体とは別に、インデックスのB-tree構造をディスクに保持する。大規模テーブルでは数百MB〜数GBに達することも
        </li>
        <li>
          <strong>書き込みオーバーヘッド</strong>: INSERT / UPDATE / DELETE のたびに、テーブル本体だけでなくインデックス側にも書き込みが発生する
        </li>
        <li>
          <strong>統計情報の維持</strong>: オプティマイザが判断を下すための統計情報も、インデックスの数だけ管理対象が増える
        </li>
        <li>
          <strong>プランニング時間</strong>: オプティマイザの検討候補が増えるほど、実行計画を立てる時間も伸びる
        </li>
      </ul>

      <h2>書き込みコストの正体は「n+1 ページ書き込み」</h2>
      <p>
        インデックスを貼れば貼るほど INSERT が遅くなる、と言われる理由はシンプルです。
      </p>
      <p>
        <strong>1 件の INSERT で、テーブル本体のページ 1 枚に加えて、貼っているインデックスの葉ノードページを 1 枚ずつ更新する</strong>
        必要があります。インデックスが n 個あれば <code>n + 1</code> ページの書き込みです。
      </p>

      <pre>{`INSERT INTO users (email, name, status, ...)
VALUES (...);

-- 発生する書き込み（概念）
-- 1. users テーブル本体のページ ×1
-- 2. idx_email の葉ノード         ×1
-- 3. idx_status の葉ノード        ×1
-- 4. idx_created_at の葉ノード    ×1
--   （インデックスが n 個あるだけ増える）`}</pre>

      <p>
        インデックスの葉ノード分裂や、B-tree の再バランスが発生すればさらに書き込みは増えます。
        UPDATE の場合は「更新されたカラムに関連するインデックスだけ」が対象ですが、主キーや複合キーの更新は複数インデックスに波及します。
      </p>

      <h2>物理コストは「ページI/O 回数」で決まる</h2>
      <p>
        インデックスが「速い」「遅い」と言うときの実体は、
        <a href="/rdb-index/basics/data-structure">ページI/O</a>
        の回数と種類です。目安は以下。
      </p>
      <ul>
        <li>
          <strong>シーケンシャルページ読み取り</strong>: 1枚あたり数十マイクロ秒〜。連続領域は先読みが効くので実質もっと速い
        </li>
        <li>
          <strong>ランダムページ読み取り</strong>: 1枚あたり数ミリ秒〜。シーケンシャルの数十〜数百倍遅い
        </li>
        <li>
          <strong>ページ書き込み</strong>: WAL/redo log や fsync も絡み、読み取りより更に重い
        </li>
      </ul>
      <p>
        だから「更新頻度が高いテーブルにインデックスを大量に貼る」ことは、実質的に <em>書き込み時のランダムページ書き込み回数を掛け算で増やす</em> 選択と同じです。
      </p>

      <h2>どこまで貼っていいか（目安）</h2>
      <p>
        魔法の数字はないですが、実務でよく使う指針:
      </p>
      <ul>
        <li>
          <strong>主キー / ユニーク制約</strong>: 迷わず貼る（強制的に必要）
        </li>
        <li>
          <strong>頻出のWHERE条件</strong>: <code>SELECT ... WHERE X = ?</code> を高頻度で叩くなら X にインデックス
        </li>
        <li>
          <strong>頻出のJOIN条件</strong>: 外部キー側にインデックス。特に大きなテーブル同士の JOIN
        </li>
        <li>
          <strong>ソート/GROUP BY</strong>: 頻出のソート順にインデックス
        </li>
      </ul>
      <p>
        大まかな上限感として、<strong>1テーブルに 5〜7 個</strong>を超えたら要確認、<strong>10個以上</strong>ならほぼ間違いなく貼りすぎです。
      </p>

      <h2>「貼りすぎ」を防ぐ実務チェックリスト</h2>
      <ol>
        <li>
          <strong>本当に使われているか</strong>：<Link href="/rdb-index/explain">インデックスが使われないときに何を見るか</Link> でインデックスが選ばれているか確認。使われていないインデックスは削除候補
        </li>
        <li>
          <strong>重複していないか</strong>：<code>(A)</code> と <code>(A, B)</code> がある場合、前者は後者で代替できることが多いので削除できる
        </li>
        <li>
          <strong>書き込み比率を見る</strong>：INSERT/UPDATE の頻度が高いテーブルでは、インデックス数を積極的に絞る
        </li>
        <li>
          <strong>使用回数の統計ビューを見る</strong>：多くのRDBMSに「そのインデックスが何回使われたか」を記録する統計ビューがある。ゼロ回のものは棚卸し対象
        </li>
        <li>
          <strong>ログ系・時系列テーブルは特に絞る</strong>：ほぼ書き込みしかないテーブルにインデックスを多く貼るのは典型的なアンチパターン
        </li>
      </ol>

      <h2>まとめ</h2>
      <p>
        インデックス設計は「速くする」だけの作業ではなく <strong>トレードオフを設計する</strong> 作業です。
      </p>
      <p>
        検索頻度、書き込み頻度、データサイズ、ビジネス上の許容レイテンシ──これらを見て、
        <em>本当に必要なものだけ</em> を貼るのが正解に近づく方法です。
        「とりあえず全部のカラムにインデックス」は、書き込みコストとストレージを爆発させる最短ルートなので避けましょう。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
