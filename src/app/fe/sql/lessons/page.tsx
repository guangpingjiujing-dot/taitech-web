import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { FAQ } from "@/components/layout/FAQ";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { sqlLessons } from "@/content/fe/sql/lessons";

const PAGE_TITLE = "基本情報のSQLをわかりやすく解説｜レッスン一覧";
const PAGE_DESCRIPTION =
  "基本情報技術者試験 科目A の SQL を、初学者にもわかりやすく 12 のテーマ別に解説。SELECT・WHERE・結合・集約・GROUP BY・副問合せを、読みながらその場で実行して確かめられます。プログラミング未経験からでも順に読み進められる無料シリーズ。";

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

/*
 * 一覧ページにも FAQ を置く。**「どの順で読めばいいか」は一覧ページ特有の悩み**で、
 * 個別レッスンの FAQ では答えられない。AEO / LLMO ではこの手の
 * 「学習の進め方」の質問が引用されやすい。
 */
const FAQ_ITEMS = [
  {
    q: "SQL のレッスンはどの順番で読むのがわかりやすいですか？",
    a: "上から順です。SELECT で列の取り出し方を覚え、WHERE で行の絞り込み、結合で複数の表をつなぎ、集約関数と GROUP BY で集計、副問合せへ進みます。前のレッスンで扱った内容を次が前提にしているので、飛ばさずに進めるのが結局いちばん速く終わります。",
  },
  {
    q: "プログラミング未経験でも読めますか？",
    a: "読めます。SQL は変数もループも使わず、「どの表から、どの行を、どの列で取り出すか」を書くだけの言語です。各レッスンには実行できるエディタが節ごとに埋め込まれているので、説明を読んだ直後にその場で確かめられます。値を書き換えて結果がどう変わるかを見るのが、初学者にとっていちばん理解が早い方法です。",
  },
  {
    q: "基本情報の SQL は何を覚えれば足りますか？",
    a: "IPA シラバス Ver.9.2 の中分類「データ操作」の範囲です。具体的には SELECT・WHERE の各述語・結合・集約関数・GROUP BY と HAVING・副問合せ・集合演算・INSERT / UPDATE / DELETE・CREATE TABLE と 4 つの制約・ビュー・GRANT・カーソルです。このシリーズはこの範囲をちょうど 12 テーマに分けて全部カバーしています。",
  },
  {
    q: "GRANT とカーソルのレッスンだけ実行できないのはなぜですか？",
    a: "GRANT はデータベースの利用者アカウント、カーソルは C や Java などのホスト言語が必要になるため、ブラウザだけで完結するこのツールでは動かせません。ただし過去問では 22 問中 4〜5 問がこの領域なので、解説だけを用意しています。",
  },
];

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
      <FaqJsonLd
        items={FAQ_ITEMS}
        aboutName="基本情報技術者試験の SQL"
        path="/fe/sql/lessons"
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
                シラバス「データ操作」の範囲を 12 のテーマに分けて、
                初学者の方がつまずきやすい順に解説します。
                各レッスンには実行できるエディタが節ごとに埋め込まれているので、
                読んだ内容をその場で確かめられます。
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
