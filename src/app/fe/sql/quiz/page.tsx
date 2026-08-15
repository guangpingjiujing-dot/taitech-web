import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { SqlQuizIndexCard } from "@/components/sql/QuizIndexCard";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { sqlQuizzes, sqlQuizzesByTier } from "@/content/fe/sql/quiz";

const PAGE_TITLE = "基本情報 SQL 練習問題｜実行結果を当てる";
const PAGE_DESCRIPTION = `基本情報技術者試験 科目A のデータベース分野の SQL 練習問題 ${sqlQuizzes.length} 問。SELECT・結合・集約・GROUP BY・副問合せの実行結果を 4 択で答え、解答するとその SQL を実行シミュレーターで動かせる。すべてオリジナル問題で、解答は実際に実行して検証している。`;

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
                で「段階を追う」を使うと、どこで行が絞られたのかが目で見えます。
              </p>
            </section>

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
