import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { StatisticsViz } from "@/components/viz/StatisticsViz";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "statistics";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "統計情報はいつ更新される？",
    a: "多くのRDBMSは自動更新の仕組みを持っていますが、大量のバルクロードやデータ分布が急変した直後は手動で統計情報の更新コマンドを実行した方が安全です。",
  },
  {
    q: "カーディナリティとは？",
    a: "そのカラムに含まれる異なる値の数のこと。カーディナリティが高いほどインデックスが効きやすく、低い（例: is_deleted のような真偽値）と部分インデックスの方が有効なことが多い。",
  },
  {
    q: "ヒストグラムは何のため？",
    a: "値の分布を段階的に表現したもの。データが偏っている場合（例: 特定のstatusに9割集中）、単純な平均だけでは判断できないため、ヒストグラムを見て「どの値なら少ないか」を推定します。",
  },
  {
    q: "MySQL の統計情報はどこに保存されている？",
    a: "InnoDB では mysql.innodb_table_stats / mysql.innodb_index_stats に永続化されています。ANALYZE TABLE を実行するか、テーブルの一定割合が変更されると自動更新されます (innodb_stats_auto_recalc)。",
  },
  {
    q: "PostgreSQL の統計情報はどこに保存されている？",
    a: "pg_statistic (システムカタログ) に保存され、pg_stats ビュー経由で参照できます。ANALYZE か autovacuum の一部として自動更新されます。サンプリング粒度は default_statistics_target (デフォルト 100) で決まり、列単位に ALTER TABLE ... SET STATISTICS で上書きできます。",
  },
  {
    q: "統計を更新すれば必ず速くなりますか？",
    a: "なりません。統計の更新は「見積りが直る」操作であって「速くなる」操作ではありません。見積りが直った結果、プランナが別の計画を選んでかえって遅くなることもあります。実測した例が実行計画のセクションにあります。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>インデックスを使うかどうかは統計情報が決める</h2>
      <p>
        このページは統計情報が<strong>インデックスの選択にどう効くか</strong>を、
        MySQL / InnoDB と PostgreSQL の両方で扱う。
        PostgreSQL のプランナ側（見積りがどう計算され、外れると何が起きるか）は
        <Link href="/query-plan">実行計画の読み方</Link>にある。
      </p>
      <p>
        DBの中では「クエリオプティマイザ」がSQLを見て、複数の実行計画候補の中からコスト最小のものを選びます。
        このコスト見積りは統計情報（各カラムの値の分布、行数、NULL率など）に基づきます。
      </p>

      <StatisticsViz />

      <h2>インデックスを使わない判断もある</h2>
      <p>
        テーブルの多くの行が該当するクエリでは、インデックス経由でランダムアクセスを繰り返すよりもフルスキャンの方が速い。
        オプティマイザはこれを見積りコストで判断します。
        <strong>「インデックスを貼ったのに使われない」の原因</strong>のほとんどは、この見積りで「使わない方が速い」と判断されているか、統計情報が古くて誤った判断が下されているかのどちらかです。
      </p>

      <h2>統計情報が古いとどうなるか</h2>
      <ul>
        <li>大量INSERT直後: 実際にはインデックスが効かない量なのにインデックスを選んでしまう</li>
        <li>大量DELETE直後: インデックスが有効なのに、統計上「多くの行が該当する」と誤認して使わない</li>
        <li>データ分布の変化: 元は偏っていたstatusが均等になったのに古い分布で判断してしまう</li>
      </ul>
      <p>
        こうした場合は、統計情報を更新するコマンドを実行して最新の分布に合わせます（コマンド名はRDBMSごとに異なる）。
      </p>

      <h2>MySQL の統計情報</h2>
      <p>
        MySQL の InnoDB は、統計情報を <code>mysql.innodb_table_stats</code> と
        <code>mysql.innodb_index_stats</code> の 2 テーブルに永続化する。行数見積り、
        インデックスごとのカーディナリティ、リーフページ数などが並ぶ。
      </p>
      <p>
        更新のトリガーは 2 つ。
      </p>
      <ul>
        <li>
          <strong>自動</strong>: <code>innodb_stats_auto_recalc</code> が ON (デフォルト) の場合、
          テーブルの行数が約 10% 変化したタイミングでバックグラウンドスレッドが再計算する。
        </li>
        <li>
          <strong>手動</strong>: <code>ANALYZE TABLE table_name;</code> を実行すると即時に統計を採り直す。
          バルクロード直後・大量削除直後・想定と実行計画がズレたときはこれを打つ。
        </li>
      </ul>
      <p>
        サンプリング精度は <code>innodb_stats_persistent_sample_pages</code> (デフォルト 20 ページ) で調整可能。
        巨大テーブルで見積り誤差が大きいときは増やす。
        なお MySQL 8.0 からは <strong>ヒストグラム</strong> ( <code>ANALYZE TABLE ... UPDATE HISTOGRAM ON col;</code>)
        が使えるようになり、値の偏ったカラム (例: status に 90% が同じ値) の見積り精度が上がる。
      </p>

      <h2>PostgreSQL の統計情報</h2>
      <p>
        PostgreSQL でも考え方は同じで、統計が古いとインデックスが選ばれなくなる。
        違うのは保存先と更新の仕組みだ。統計はシステムカタログ{" "}
        <code>pg_statistic</code> に格納される。直接読むのは面倒なので、通常は{" "}
        <code>pg_stats</code> ビュー越しに参照する (行数・NULL 率・最頻値{" "}
        <code>most_common_vals</code>・ヒストグラム境界 <code>histogram_bounds</code>{" "}
        などが人間可読な形で並ぶ)。
      </p>
      <p>更新のトリガーは 2 つ。</p>
      <ul>
        <li>
          <strong>自動</strong>: <strong>autovacuum</strong> ワーカーが VACUUM とセットで
          ANALYZE も回す。<code>autovacuum_analyze_scale_factor</code> (デフォルト 0.1) と
          <code>autovacuum_analyze_threshold</code> (デフォルト 50) で発火条件が決まる。
        </li>
        <li>
          <strong>手動</strong>: <code>ANALYZE table_name;</code> または{" "}
          <code>VACUUM ANALYZE table_name;</code>。後者は VACUUM も同時に実行する。
          バルクロード後は必ず手で打つのが安全。
        </li>
      </ul>
      <p>
        サンプリング粒度は <code>default_statistics_target</code> (デフォルト 100) で決まり、
        列単位に <code>ALTER TABLE ... ALTER COLUMN col SET STATISTICS 1000;</code>{" "}
        で上書きできる。偏りが大きいカラムはターゲット値を上げると{" "}
        <code>most_common_vals</code> の候補数とヒストグラム境界数が増え、見積り精度が改善する。
      </p>
      <p>
        <code>EXPLAIN ANALYZE</code> で「見積り行数」と「実際の行数」が大きくズレていたら、
        まず ANALYZE を疑うのが定石。
        <strong>ただし、それで速くなるとは限らない。</strong>
      </p>
      <p>
        <strong>プランナ側の詳しい話は実行計画のセクションにまとめてある。</strong>
      </p>
      <ul>
        <li>
          <Link href="/query-plan/estimated-rows">見積り行数の内訳</Link> —
          統計が無いテーブルで <code>rows=850</code> と出る理由を最後まで計算で追う。
          <code>reltuples = -1</code> が「0 行」ではなく「未調査」の印である話も
        </li>
        <li>
          <Link href="/query-plan/find-bottleneck">遅いノードの見つけ方</Link> —
          見積りが 475 倍外れている実例と、
          <strong>統計を直したら計画が別物になって遅くなった</strong>実測
        </li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
