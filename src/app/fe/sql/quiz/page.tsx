import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { FAQ } from "@/components/layout/FAQ";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { SqlQuizIndexCard } from "@/components/sql/QuizIndexCard";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { sqlQuizzes, sqlQuizzesByTier } from "@/content/fe/sql/quiz";

const PAGE_TITLE = "基本情報 SQL 練習問題｜実行結果を当てる";
const PAGE_DESCRIPTION = `基本情報技術者試験 科目A のデータベース分野の SQL 練習問題 ${sqlQuizzes.length} 問。SELECT・結合・集約・GROUP BY・副問合せの実行結果を 4 択で答え、解答するとその SQL を実行シミュレーターで動かせる。初学者がつまずく箇所をわかりやすく解説つきで示し、解答は全問エンジンで実行して検証している（すべてオリジナル問題）。`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/fe/sql/quiz" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/fe/sql/quiz",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const sectionMeta = sections.fe;

/*
 * 練習問題一覧特有の悩み（解けない / 何問やればいいか / 過去問との関係）に答える。
 * レッスン一覧の FAQ とは重複させない。
 */
const FAQ_ITEMS = [
  {
    q: "SQL の問題がまったく解けません。どうすればわかりやすくなりますか？",
    a: "実行結果を暗記で当てにいくのをやめて、評価の順番で追ってください。SQL は書いた順ではなく FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY の順に評価されます。実行シミュレーターで「一つ進める」を押すと各段階の表が出るので、どこで行が減り、どこで列が減ったのかが目で分かります。解けない問題は、この途中の表のどこで自分の予想とずれたかを見るのがいちばん速い直し方です。",
  },
  {
    q: "何問くらい解けば科目 A の SQL は大丈夫ですか？",
    a: "本番の科目 A でデータベース分野から出るのは 60 問中およそ 4〜6 問で、そのうち SQL を読ませる問題は 1〜3 問です。ここの 14 問は出題パターン（射影と選択・結合・集約・GROUP BY と HAVING・副問合せ・NULL）を一通り網羅してあるので、全問を解説まで理解できていれば十分に届きます。",
  },
  {
    q: "過去問そのものではないのですか？",
    a: "違います。IPA 公式の過去問は転載していません。過去問に出た構文パターンを踏まえたオリジナル問題で、表と値は作り直しています。そのぶん正解が本当に正しいかが問題になるので、全問を SQL エンジンに実行させて解答キーを検証しています。",
  },
];

export default function SqlQuizIndexPage() {
  const basic = sqlQuizzesByTier("basic");
  const exam = sqlQuizzesByTier("exam");

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "基本情報 SQL 練習問題",
    url: `${site.url}/fe/sql/quiz`,
    description: PAGE_DESCRIPTION,
    inLanguage: "ja-JP",
    isPartOf: {
      "@type": "CollectionPage",
      name: sectionMeta.label,
      url: `${site.url}${sectionMeta.path}`,
    },
    hasPart: sqlQuizzes.map((q) => ({
      "@type": "Quiz",
      name: q.title,
      url: `${site.url}/fe/sql/quiz/${q.slug}`,
      abstract: q.challenge,
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: sectionMeta.shortLabel,
        item: `${site.url}${sectionMeta.path}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "SQL 実行シミュレーター",
        item: `${site.url}/fe/sql`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "SQL 練習問題",
        item: `${site.url}/fe/sql/quiz`,
      },
    ],
  };


  return (
    <div className="py-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <FaqJsonLd
        items={FAQ_ITEMS}
        aboutName="基本情報技術者試験の SQL"
        path="/fe/sql/quiz"
      />
      <Container size="wide">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <Breadcrumb
              className="mb-6"
              items={[
                { href: "/", label: "ホーム" },
                { href: sectionMeta.path, label: sectionMeta.shortLabel },
                { href: "/fe/sql", label: "SQL 実行シミュレーター" },
                { label: "SQL 練習問題" },
              ]}
            />

            <header className="mb-8 max-w-3xl">
              <Eyebrow>基本情報技術者試験 (FE) 科目 A — データベース</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                SQL 練習問題 {sqlQuizzes.length} 問
              </h1>
              <div
                className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed space-y-2"
                style={{ textWrap: "pretty" }}
              >
                <p>
                  SQL を読んで実行結果を当てる 4 択問題です。解答すると解説と、
                  その SQL を実行シミュレーターで開くリンクが出ます。
                </p>
                <p className="text-xs">
                  すべてオリジナル問題です（IPA 公式の過去問は転載していません）。
                  解答は全問エンジンに実行させて検証しているので、
                  解説と実際の出力が食い違うことはありません。
                </p>
              </div>
            </header>

            <section>
              <h2 className="text-lg font-bold tracking-tight">
                基礎（{basic.length} 問）
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                レッスンを読めば解けます。
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {basic.map((q) => (
                  <li key={q.slug}>
                    <SqlQuizIndexCard quiz={q} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-bold tracking-tight">
                本番相当（{exam.length} 問）
              </h2>
              <p
                className="mt-1 text-sm text-[var(--muted-foreground)]"
                style={{ textWrap: "pretty" }}
              >
                NULL の扱いや外部結合など、引っかかりやすい点を突いています。
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {exam.map((q) => (
                  <li key={q.slug}>
                    <SqlQuizIndexCard quiz={q} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12 max-w-3xl">
              <h2 className="text-lg font-bold tracking-tight">
                解けなかったら
              </h2>
              <p
                className="mt-2 text-sm text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                各問題には関連する
                <Link
                  href="/fe/sql/lessons"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  レッスン
                </Link>
                へのリンクが付いています。
                <Link
                  href="/fe/sql"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  実行シミュレーター
                </Link>
                で「一つ進める」を押していくと、どこで行が絞られたのかが目で見えます。
              </p>
            </section>

            <div className="max-w-3xl">
              <FAQ items={FAQ_ITEMS} />
            </div>

            <div className="max-w-3xl">
              <AffiliateBooks
                topicSlug="fe-sql"
                domain="fe"
                limit={3}
                heading="データベース分野をもっと学ぶ（おすすめ書籍）"
              />
            </div>
          </div>

          <FeSidebar topicSlug="fe-sql" />
        </div>
      </Container>
    </div>
  );
}
