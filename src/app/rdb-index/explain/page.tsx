import Link from "next/link";
import { buildTopicMetadata } from "@/lib/metadata";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { findTopic } from "@/content/topics";

const slug = "explain";
const topic = findTopic("rdb-index", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "インデックスを貼ったのに Seq Scan のままです",
    a: "対象行が多いときは全表スキャンの方が速いので、それが正しい判断であることがあります。目安として全体の半分を超えると切り替わります。それ以外の理由なら、このページの 8 つを上から当ててください。",
  },
  {
    q: "Index Cond と Filter はどう違いますか",
    a: "Index Cond はインデックスを辿る段階で効くので読む行数そのものが減ります。Filter は行を読んでから捨てるので読む量は減りません。同じ WHERE 句でも、インデックスの張り方でどちらに出るかが変わります。",
  },
  {
    q: "インデックスは何本まで貼っていいですか",
    a: "検索は速くなりますが、INSERT / UPDATE / DELETE のたびに全部を更新する必要があるので、貼りすぎると書き込みが遅くなります。判断基準は更新コストのページにまとめています。",
  },
];

const REASONS = [
  {
    n: 1,
    title: "列に関数をかけている",
    bad: "WHERE lower(email) = 'a@example.com'",
    why: "インデックスは email の値で並んでいる。lower(email) の値では並んでいないので辿れない。",
    fix: "式そのものにインデックスを作る（式インデックス）か、保存時に小文字で入れておく。",
    href: "/rdb-index/btree",
    hrefLabel: "B-tree インデックス",
  },
  {
    n: 2,
    title: "暗黙の型変換が入っている",
    bad: "WHERE zip_code = 1500001   -- zip_code は varchar",
    why: "比較のために列側が数値へ変換される。変換後の値では並んでいないので辿れない。",
    fix: "型を合わせる（'1500001' と書く）。アプリ側から渡す値の型も確認する。",
    href: "/rdb-index/btree",
    hrefLabel: "B-tree インデックス",
  },
  {
    n: 3,
    title: "中間一致・後方一致で検索している",
    bad: "WHERE name LIKE '%tanaka'",
    why: "B-tree は先頭から順に並んでいるので、先頭が分からないと探し始められない。",
    fix: "前方一致にできないか見直す。できないなら全文検索の索引を検討する。",
    href: "/rdb-index/btree",
    hrefLabel: "B-tree インデックス",
  },
  {
    n: 4,
    title: "複合インデックスの左端を使っていない",
    bad: "-- (city, grade) の索引に対して\nWHERE grade = 'gold'",
    why: "複合インデックスは左の列から順に並んでいる。左端を指定しないと辿る起点が決まらない。",
    fix: "列順を見直すか、使い方に合った索引を別に作る。",
    href: "/rdb-index/composite",
    hrefLabel: "複合インデックス",
  },
  {
    n: 5,
    title: "OR でつないでいる",
    bad: "WHERE city = 'tokyo' OR grade = 'gold'",
    why: "どちらか片方でも当たれば対象になるので、片方の索引だけでは絞りきれない。",
    fix: "UNION に分ける。よく使う条件が固定なら部分インデックスも効く。",
    href: "/rdb-index/partial",
    hrefLabel: "部分インデックス",
  },
  {
    n: 6,
    title: "ORDER BY の方向が索引と合っていない",
    bad: "-- (a ASC, b ASC) の索引に対して\nORDER BY a ASC, b DESC",
    why: "索引を順に辿れば並び替えずに済むはずが、方向が混ざると辿るだけでは順序が作れない。",
    fix: "その並び順に合わせた索引を作る（列ごとに方向を指定できる）。",
    href: "/rdb-index/btree",
    hrefLabel: "B-tree インデックス",
  },
  {
    n: 7,
    title: "対象行が多すぎて、読んだ方が速い",
    bad: "WHERE age < 55   -- 50 万行中 29 万行が該当",
    why: "索引を辿ると行ごとにページをバラバラに読むことになる。半分読むなら順に読んだ方が速い。",
    fix: "直す必要は無い。これはプランナが正しく判断している。",
    href: "/query-plan/scan-nodes",
    hrefLabel: "スキャンの種類（切り替わりの実測つき）",
    href2: "/rdb-index/clustered",
    hrefLabel2: "クラスタ化インデックス（行の並びで結果が変わる）",
  },
  {
    n: 8,
    title: "統計が古い / 見積りが外れている",
    bad: "-- 大量投入の直後、ANALYZE 前",
    why: "何行返るかの見積りが外れると、索引を使うかどうかの判断そのものが間違う。",
    fix: "ANALYZE を打つ。それでも直らないなら列どうしの相関を疑う。",
    href: "/query-plan/find-bottleneck",
    hrefLabel: "遅いノードの見つけ方",
    href2: "/rdb-index/statistics",
    hrefLabel2: "統計情報とオプティマイザ",
  },
];

export default function Page() {
  return (
    <TopicLayout section="rdb-index" slug={slug}>
      <TopicJsonLd section="rdb-index" slug={slug} faq={faq} />

      <h2>貼ったのに速くならない</h2>
      <p>
        インデックスは、<strong>貼れば必ず使われるわけではありません。</strong>
        使われているかどうかは実行計画を見れば分かり、
        使われない理由はだいたい 8 つのどれかです。
      </p>
      <p>
        <strong>実行計画そのものが読めない場合は先に</strong>
        <Link href="/query-plan">実行計画の読み方</Link>へ。
        このページは「読める」前提で、インデックス側の話だけをします。
      </p>

      <h2>判定は 1 行で済む</h2>
      <p>実行計画で、その条件がどちらに出ているかを見ます。</p>
      <ul>
        <li>
          <strong><code>Index Cond:</code> に乗っている</strong> → 使われている。
          読む行数そのものが減っている
        </li>
        <li>
          <strong><code>Filter:</code> に残っている</strong> → 使われていない。
          テーブルを読んでから捨てている
        </li>
      </ul>
      <p>
        <code>Rows Removed by Filter</code> が出ていれば、それが<strong>捨てた行数</strong>です。
        この数字が返した行数に比べて大きければ、それだけ無駄に読んでいます。
      </p>
      <p>
        表記の詳しい意味と、同じクエリで両方を見比べた実例は
        <Link href="/query-plan/index-cond-vs-filter">Index Cond と Filter の違い</Link>に。
      </p>
      <p>
        なお <code>Index Scan</code> ではなく{" "}
        <strong>
          <code>Index Only Scan</code> が出ていれば、テーブル本体を読まずに済んでいる
        </strong>
        という意味で、いちばん効いている状態です。
        一意インデックスなら 1 行と分かった時点で探索が止まるので、
        条件が等値のときは<Link href="/rdb-index/unique">一意インデックス</Link>かどうかでも
        読む量が変わります。
      </p>

      <h2>使われない 8 つの理由</h2>
      {REASONS.map((r) => (
        <div key={r.n}>
          <h3>
            {r.n}. {r.title}
          </h3>
          <pre>{r.bad}</pre>
          <p>
            <strong>なぜ:</strong> {r.why}
          </p>
          <p>
            <strong>直し方:</strong> {r.fix}　
            <Link href={r.href}>{r.hrefLabel}</Link>
            {r.href2 ? (
              <>
                {" / "}
                <Link href={r.href2}>{r.hrefLabel2}</Link>
              </>
            ) : null}
          </p>
        </div>
      ))}

      <h2>「使われていない」と「使わない方が速い」は違う</h2>
      <p>
        7 番は<strong>直す必要がありません。</strong>
        インデックスを辿ると行ごとにページをバラバラに読むことになるので、
        対象行が多いときは順に全部読んだ方が速いためです。
      </p>
      <p>
        実際に測ると、<strong>全体の 50% 前後</strong>で切り替わります。
        50 万行のテーブルで、条件に合う行が 25 万行を超えたあたりから全表スキャンが選ばれます。
        測定した表は<Link href="/query-plan/scan-nodes">スキャンの種類</Link>にあります。
      </p>
      <p>
        <strong>「Seq Scan が出ているから遅い」ではありません。</strong>
        まず対象行の割合を見て、それから 1〜6 と 8 を当ててください。
      </p>

      <h2>貼る前に確かめる手順</h2>
      <ol>
        <li>
          <code>EXPLAIN</code> を打つ。
          <strong>使われるかどうかは見積りの段階で決まる</strong>ので、
          <code>ANALYZE</code> は無くても判定できます
        </li>
        <li>条件が <code>Index Cond</code> 側に乗るか見る</li>
        <li>乗らないなら、上の 8 つを上から当てる</li>
        <li>
          貼ると決めたら、<strong>更新が遅くなる分</strong>も見積もる。
          <Link href="/rdb-index/cost">インデックスの更新コスト</Link>へ
        </li>
        <li>
          必要な列を全部含められるなら
          <Link href="/rdb-index/covering">カバリングインデックス</Link>にすると、
          テーブル本体を読まずに済みます
        </li>
      </ol>

      <h2>よくある勘違い</h2>
      <ul>
        <li>
          <strong>「インデックスを貼れば必ず速くなる」</strong> — 7 番のとおり、
          対象行が多ければ逆効果です。書き込みも遅くなります
        </li>
        <li>
          <strong>「実行計画に索引名が出ていれば使われている」</strong> —{" "}
          <code>Bitmap Index Scan</code> は索引を使いますが、
          そのあとテーブルも読みます。どれだけ読んだかは <code>Heap Blocks</code> に出ます
        </li>
        <li>
          <strong>「複合インデックスは列の順番と関係ない」</strong> — 4 番のとおり、
          左端から順に使われます
        </li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
