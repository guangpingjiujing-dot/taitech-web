import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { sqlLessons } from "@/content/fe/sql/lessons";

const PAGE_TITLE = "基本情報 SQL レッスン一覧｜科目Aのデータベース";
const PAGE_DESCRIPTION =
  "基本情報技術者試験 科目A のデータベース分野で問われる SQL を、SELECT・WHERE・結合・集約・GROUP BY・副問合せなど 12 のテーマ別に、ブラウザで実行して確かめながら学べる無料の解説シリーズ。";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/fe/sql/lessons" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/fe/sql/lessons",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const sectionMeta = sections.fe;

export default function SqlLessonsIndexPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "基本情報 SQL レッスン",
    url: `${site.url}/fe/sql/lessons`,
    description: PAGE_DESCRIPTION,
    inLanguage: "ja-JP",
    isPartOf: {
      "@type": "CollectionPage",
      name: sectionMeta.label,
      url: `${site.url}${sectionMeta.path}`,
    },
    hasPart: sqlLessons.map((l) => ({
      "@type": "LearningResource",
      headline: l.title,
      url: `${site.url}/fe/sql/lessons/${l.slug}`,
      abstract: l.definition,
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
        name: "SQL レッスン",
        item: `${site.url}/fe/sql/lessons`,
      },
    ],
  };

  const runnable = sqlLessons.filter((l) => l.runnable);
  const readOnly = sqlLessons.filter((l) => !l.runnable);

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
                { label: "SQL レッスン" },
              ]}
            />

            <header className="mb-8 max-w-3xl">
              <Eyebrow>基本情報技術者試験 (FE) 科目 A — データベース</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                SQL レッスン一覧
              </h1>
              <p
                className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                シラバス「データ操作」の範囲を 12 のテーマに分けて解説します。
                各レッスンには実行できるエディタが埋め込まれているので、
                読みながらその場で確かめられます。
              </p>
            </header>

            <section>
              <h2 className="text-lg font-bold tracking-tight">
                動かして学ぶ（{runnable.length} 本）
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {runnable.map((l) => (
                  <li key={l.slug}>
                    <LessonCard lesson={l} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-bold tracking-tight">
                読んで学ぶ（{readOnly.length} 本）
              </h2>
              <p
                className="mt-2 text-sm text-[var(--muted-foreground)]"
                style={{ textWrap: "pretty" }}
              >
                試験範囲ですが、利用者アカウントやホスト言語が必要なため
                このツールでは実行できないテーマです。出題は多いので解説を用意しています。
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {readOnly.map((l) => (
                  <li key={l.slug}>
                    <LessonCard lesson={l} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12 max-w-3xl">
              <h2 className="text-lg font-bold tracking-tight">
                自由に試したくなったら
              </h2>
              <p
                className="mt-2 text-sm text-[var(--foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                <Link
                  href="/fe/sql"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  SQL 実行シミュレーター
                </Link>
                では、好きな SQL を書いて評価順を 1 段階ずつ追えます。
                科目 B のアルゴリズム対策は
                <Link
                  href="/fe/algorithm"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  擬似言語 実行シミュレーター
                </Link>
                です。
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

function LessonCard({
  lesson,
}: {
  lesson: (typeof sqlLessons)[number];
}) {
  return (
    <Link
      href={`/fe/sql/lessons/${lesson.slug}`}
      className="block h-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
    >
      <div className="text-xs text-[var(--muted-foreground)]">
        レッスン {lesson.order}
      </div>
      <div className="mt-1 font-semibold">{lesson.shortTitle}</div>
      <p
        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
        style={{ textWrap: "pretty" }}
      >
        {lesson.cardSummary}
      </p>
    </Link>
  );
}
