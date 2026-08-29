import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { FAQ } from "@/components/layout/FAQ";
import { FePlaygroundJsonLd } from "@/components/seo/JsonLd";
import { SqlPlayground } from "@/components/sql/SqlPlayground";
import { SqlPlaygroundDeepLink } from "@/components/sql/SqlPlaygroundDeepLink";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { findDataset, initialSql, defaultDatasetKey } from "@/content/fe/sql/datasets";
import { sqlLessons } from "@/content/fe/sql/lessons";
import { sqlQuizzes } from "@/content/fe/sql/quiz";
import { primarySources } from "@/content/primary-sources";

const sectionMeta = sections.fe;

const PAGE_PATH = "/fe/sql";
const PAGE_TITLE = "基本情報のSQLをわかりやすく｜動かして学ぶ";
const PAGE_DESCRIPTION =
  "基本情報技術者試験 科目A の SQL を、初学者にもわかりやすく。ブラウザで実際に実行しながら、FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY の評価順を 1 段階ずつ、途中の表を見て確かめられる無料の学習ツール。プログラミング未経験でも読める解説つき。";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

/*
 * FAQ は「ツールの使い方」だけにしない。
 *
 * **検索して来る人が実際に打つのは「SQL わからない」「どこから勉強」といった悩み**で、
 * 使い方の質問ではない。AEO / LLMO では、この種の質問に正面から答えている
 * FAQPage が引用されるので、悩みの質問を先頭に置く。
 */
const FAQ_ITEMS = [
  {
    q: "SQL がまったくわからないのですが、どこから始めればよいですか？",
    a: "このページのエディタで「一つ進める」を押すところから始めてください。SQL が FROM → WHERE → GROUP BY → HAVING → SELECT の順に評価される様子が、途中の表つきで 1 段階ずつ見られます。SQL が難しく感じる最大の理由は「書いた順と実行される順が違う」ことなので、そこが目で見えると一気にわかりやすくなります。そのあと SQL レッスンを 1 本目の SELECT から順に読むのが最短です。",
  },
  {
    q: "プログラミング未経験でも基本情報の SQL は解けるようになりますか？",
    a: "なります。SQL はプログラミング言語というより「表から必要な行と列を取り出す指示の書き方」で、変数もループも使いません。基本情報で問われるのは SELECT・結合・集約・GROUP BY・副問合せといった決まった型なので、型ごとに一度動かして確かめれば解けるようになります。このサイトのレッスンは、その型を 12 テーマに分けて初学者向けに順番に並べています。",
  },
  {
    q: "参考書を読んでも SQL が頭に入りません。何が違いますか？",
    a: "紙の上では「この SQL を実行すると表がどう変わるか」が見えないためです。とくに GROUP BY は複数の行が 1 つのグループにまとまる操作なので、途中の状態を想像できないと HAVING との違いが理解できません。このツールでは GROUP BY の段階でグループそのものが表示されるので、想像する必要がなくなります。",
  },
  {
    q: "このツールは何ができますか？",
    a: "基本情報技術者試験で問われる SQL を、その場で書いて実行できます。特徴は「一つ進める」で 1 段階ずつ追えることで、FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY という評価の順に、それぞれの時点の表を 1 つずつ見られることです。SELECT が最後に評価されることや、WHERE と HAVING の違いが目で確認できます。",
  },
  {
    q: "SQL はどこまで対応していますか？",
    a: "IPA シラバス Ver.9.2 の「データ操作」の範囲です。SELECT・結合（カンマ結合と INNER / LEFT / RIGHT OUTER JOIN）・WHERE の各述語・GROUP BY・HAVING・ORDER BY・集約関数・副問合せ・集合演算・INSERT / UPDATE / DELETE・CREATE TABLE と 4 つの制約・CREATE VIEW を実行できます。",
  },
  {
    q: "GRANT やカーソルも試せますか？",
    a: "いいえ。GRANT・REVOKE・カーソル・埋込み SQL は試験範囲ですが、利用者やホスト言語の概念が必要なため実行できません。これらを書くと「実行できない理由」と解説ページへのリンクが出ます。",
  },
  {
    q: "本物のデータベースを使っていますか？",
    a: "いいえ。SQL の解析と実行はすべてブラウザ内で完結し、サーバには送信されません。表のデータもページを読み込むたびに初期状態に戻ります。INSERT や DELETE を自由に試して構いません。",
  },
  {
    q: "SQLite などと結果が違うことはありますか？",
    a: "意図的に違えている点が 2 つあります。GROUP BY に無い列を SELECT に書いたときと、文字列と数値を比較したときは、SQLite が黙って通すのに対してこのツールはエラーにします。どちらも標準 SQL ではエラーで、試験でも誤りとされる書き方だからです。",
  },
];

export default function FeSqlPage() {
  const dataset = findDataset(defaultDatasetKey);

  return (
    <div className="py-8 lg:py-12">
      <FePlaygroundJsonLd
        path={PAGE_PATH}
        name="基本情報技術者試験 SQL 実行シミュレーター"
        description={PAGE_DESCRIPTION}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          { name: sectionMeta.shortLabel, item: `${site.url}${sectionMeta.path}` },
          { name: "SQL 実行シミュレーター", item: `${site.url}${PAGE_PATH}` },
        ]}
        faq={FAQ_ITEMS}
      />
      <Container size="wide">
        <div className="grid gap-8 xl:gap-10 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <header className="mb-6">
              <Eyebrow>基本情報技術者試験 科目 A</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
SQL をブラウザで動かして、わかりやすく理解する
              </h1>
              <div
                className="mt-3 max-w-3xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed space-y-2"
                style={{ textWrap: "pretty" }}
              >
                <p>
                  プログラミング未経験でもつまずかないように、
                  データベース分野の SQL をその場で書いて実行できるようにしました。
                </p>
                <p>
                  「一つ進める」を押していくと、<strong>SQL が実際に評価される順番</strong>で、
                  それぞれの時点の表が 1 つずつ表示されます。
                </p>
                <p className="text-xs">
                  IPA <ExternalLink href={primarySources.ipaFeSyllabus.url}>シラバス Ver.9.2</ExternalLink>（PDF）「データ操作」の範囲に対応。処理はすべてブラウザ内で完結します。
                </p>
              </div>
            </header>

            {/* Playground 自体は SSR して prerender HTML に markup を残す。
                ?sql= / ?dataset= の読み取りだけを Suspense 配下の client に閉じ込める
                (server の searchParams で受けるとこのページが Dynamic になる) */}
            <SqlPlayground
              initialSql={initialSql[dataset.key]}
              datasetKey={dataset.key}
            >
              <Suspense fallback={null}>
                <SqlPlaygroundDeepLink />
              </Suspense>
            </SqlPlayground>

            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              使用している表は過去問の構造をもとにした架空データです（{dataset.source}）。
            </p>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                SQL は書いた順に実行されない
              </h2>
              <div
                className="mt-4 space-y-4 text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                <p>
                  SQL は <code>SELECT</code> から書き始めますが、
                  <strong>評価されるのは最後</strong>です。実際の順番はこうなります。
                </p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                      <th className="py-2 pr-3 font-semibold">順</th>
                      <th className="py-2 pr-3 font-semibold">句</th>
                      <th className="py-2 font-semibold">その時点で何が起きるか</th>
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    {EVALUATION_ORDER.map((row, i) => (
                      <tr key={row.clause} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-3 whitespace-nowrap font-semibold">
                          {i + 1}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                            {row.clause}
                          </code>
                        </td>
                        <td
                          className="py-2 text-[var(--muted-foreground)]"
                          style={{ textWrap: "pretty" }}
                        >
                          {row.what}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-10 text-lg font-bold tracking-tight">
                この順番から分かること
              </h3>
              <ul className="mt-3 space-y-3 text-[var(--foreground)] leading-relaxed">
                <li style={{ textWrap: "pretty" }}>
                  <strong>WHERE では集約関数が使えない。</strong>{" "}
                  <code>WHERE</code> は 2 番目、グループ化は 4 番目なので、
                  <code>WHERE</code> の時点ではまだグループが存在しません。
                  グループに対する条件は <code>HAVING</code> に書きます。
                </li>
                <li style={{ textWrap: "pretty" }}>
                  <strong>ORDER BY では SELECT で付けた別名が使える。</strong>{" "}
                  <code>ORDER BY</code> は <code>SELECT</code> の後なので、
                  そこで確定した列名を参照できます。
                </li>
                <li style={{ textWrap: "pretty" }}>
                  <strong>GROUP BY に無い列は取り出せない。</strong>{" "}
                  1 グループに複数行がまとまるため、どの行の値を出すか決まらないからです。
                </li>
              </ul>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                試験で問われる SQL の範囲
              </h2>
              <p
                className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                IPA <ExternalLink href={primarySources.ipaFeSyllabus.url}>シラバス Ver.9.2</ExternalLink>（PDF）の中分類「データ操作」に挙げられている用語のうち、
                SQL に関わるものです。
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                      <th className="py-2 pr-3 font-semibold">分類</th>
                      <th className="py-2 pr-3 font-semibold">項目</th>
                      <th className="py-2 font-semibold">このツール</th>
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    {SYLLABUS_COVERAGE.map((row) => (
                      <tr key={row.group} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-3 whitespace-nowrap font-semibold">
                          {row.group}
                        </td>
                        <td className="py-2 pr-3" style={{ textWrap: "pretty" }}>
                          {row.items}
                        </td>
                        <td className="py-2 whitespace-nowrap text-[var(--muted-foreground)]">
                          {row.supported ? "実行できる" : "解説のみ"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p
                className="mt-4 text-sm text-[var(--muted-foreground)]"
                style={{ textWrap: "pretty" }}
              >
                GRANT とカーソルは、利用者の概念やホスト言語が必要になるため実行できません。
                エディタに書くと、実行できない理由と解説へのリンクが表示されます。
              </p>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                SQL をわかりやすく学ぶ — レッスン {sqlLessons.length} 本
              </h2>
              <p
                className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                シラバス「データ操作」の範囲をテーマ別に解説しています。
                各レッスンには実行できるエディタが埋め込まれています。
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {sqlLessons.slice(0, 6).map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/fe/sql/lessons/${l.slug}`}
                      className="block h-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <div className="text-xs text-[var(--muted-foreground)]">
                        レッスン {l.order}
                      </div>
                      <div className="mt-1 font-semibold">{l.shortTitle}</div>
                      <p
                        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
                        style={{ textWrap: "pretty" }}
                      >
                        {l.cardSummary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                <Link
                  href="/fe/sql/lessons"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  基本情報の SQL をわかりやすく解説したレッスン一覧（全 {sqlLessons.length} 本）→
                </Link>
              </p>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                読めるようになったら — 練習問題 {sqlQuizzes.length} 問
              </h2>
              <p
                className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                SQL を読んで実行結果を当てる 4 択問題です。解答すると解説と、
                その SQL をこのシミュレーターで開くリンクが出ます。
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {sqlQuizzes.slice(0, 4).map((q) => (
                  <li key={q.slug}>
                    <Link
                      href={`/fe/sql/quiz/${q.slug}`}
                      className="block h-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <div className="text-xs text-[var(--muted-foreground)]">
                        第 {q.order} 問
                      </div>
                      <div className="mt-1 font-semibold">{q.shortTitle}</div>
                      <p
                        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
                        style={{ textWrap: "pretty" }}
                      >
                        {q.challenge}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                <Link
                  href="/fe/sql/quiz"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  基本情報 SQL の練習問題一覧（全 {sqlQuizzes.length} 問）→
                </Link>
              </p>
            </section>

            <section className="mt-16 max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                データベースをもっと深く理解する
              </h2>
              <p
                className="mt-3 text-sm text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                科目 A のデータベース分野では、SQL と並んで
                <Link
                  href="/data-modeling/normalization/why"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  正規化
                </Link>
                と
                <Link
                  href="/data-modeling/er-diagram"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  ER 図
                </Link>
                が頻出です。このツールで扱う制約が「なぜ必要なのか」は
                <Link
                  href="/why-need-rdb/referential-integrity"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  参照整合性の解説
                </Link>
                で、実行速度に効くインデックスは
                <Link
                  href="/rdb-index"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  RDB インデックス図解
                </Link>
                で扱っています。
              </p>
              <p
                className="mt-3 text-sm text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                科目 B の擬似言語は
                <Link
                  href="/fe/algorithm"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  擬似言語 実行シミュレーター
                </Link>
                で同じように 1 行ずつ動かせます。
              </p>
            </section>

            <div className="max-w-3xl">
              <FAQ items={FAQ_ITEMS} />
            </div>

            <div className="max-w-3xl">
              <AffiliateBooks
                topicSlug="fe-sql"
                domain="fe"
                heading="試験対策に使える書籍"
              />
            </div>
          </div>

          <FeSidebar topicSlug="fe-sql" from="xl" />
        </div>
      </Container>
    </div>
  );
}

const EVALUATION_ORDER = [
  {
    clause: "FROM / JOIN",
    what: "表を読み込み、複数あれば組み合わせる。ここで扱う行が最も多くなる",
  },
  {
    clause: "WHERE",
    what: "1 行ずつ見て絞り込む。まだグループが無いので集約関数は使えない",
  },
  {
    clause: "GROUP BY",
    what: "残った行を、指定した列の値ごとにグループへまとめる",
  },
  {
    clause: "HAVING",
    what: "グループ単位で絞り込む。集約関数の結果で条件を書ける",
  },
  {
    clause: "SELECT",
    what: "ここでようやく列が決まる。別名 (AS) が有効になるのもこの時点",
  },
  { clause: "DISTINCT", what: "確定した行から重複を取り除く" },
  {
    clause: "ORDER BY",
    what: "最後に並べ替える。SELECT で付けた別名を使えるのはこのため",
  },
] as const;

const SYLLABUS_COVERAGE = [
  {
    group: "問合せ",
    items: "SELECT文 / 相関名 / パターン文字列 / 副問合せ / 集約関数",
    supported: true,
  },
  {
    group: "関係演算",
    items: "選択 / 射影 / 結合（内部結合・外部結合）",
    supported: true,
  },
  {
    group: "集合演算",
    items: "和 (UNION) / 差 (EXCEPT) / 積 (INTERSECT) / 直積",
    supported: true,
  },
  {
    group: "DML",
    items: "INSERT文 / UPDATE文 / DELETE文",
    supported: true,
  },
  {
    group: "DDL・制約",
    items:
      "CREATE TABLE / 一意性制約 / 参照制約 / 検査制約 / 非NULL制約 / 実表とビュー",
    supported: true,
  },
  {
    group: "アクセス権",
    items: "GRANT文 / REVOKE文",
    supported: false,
  },
  {
    group: "親言語方式",
    items: "埋込みSQL / カーソル / モジュール言語",
    supported: false,
  },
] as const;
