import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { QuizProgressSummary, QuizStatusBadge } from "@/components/fe/QuizProgress";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { feQuizzes, feQuizzesByTier, type FeQuizMeta } from "@/content/fe/quiz";
import { findFeLesson } from "@/content/fe/lessons";

// 問題数はレジストリから導出する (数を直書きすると増やしたときに矛盾する)
const QUIZ_COUNT = feQuizzes.length;
const PAGE_TITLE = `基本情報 擬似言語 練習問題 ${QUIZ_COUNT} 問｜科目B オリジナル`;
const PAGE_DESCRIPTION = `基本情報技術者試験 (FE) 科目 B の擬似言語をトレースして答えるオリジナル練習問題 ${QUIZ_COUNT} 問。変数・条件分岐・while・for・配列・関数の頻出パターンから、連結リスト・整列・再帰といった本番相当の出題まで 4 択で確認できる。解説と実行シミュレーターで答え合わせまでできる無料教材。`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/fe/quiz" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/fe/quiz",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const sectionMeta = sections.fe;

export default function FeQuizIndexPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "基本情報 擬似言語 練習問題",
    url: `${site.url}/fe/quiz`,
    description: PAGE_DESCRIPTION,
    inLanguage: "ja-JP",
    isPartOf: {
      "@type": "CollectionPage",
      name: sectionMeta.label,
      url: `${site.url}${sectionMeta.path}`,
    },
    hasPart: feQuizzes.map((q) => ({
      "@type": "Quiz",
      name: q.title,
      url: `${site.url}/fe/quiz/${q.slug}`,
      abstract: q.description,
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
        name: "練習問題",
        item: `${site.url}/fe/quiz`,
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
                { href: sectionMeta.path, label: "擬似言語 実行シミュレーター" },
                { label: "練習問題" },
              ]}
            />

            <header className="mb-8 max-w-3xl">
              <Eyebrow>基本情報技術者試験 (FE) 科目 B — 擬似言語</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                擬似言語 練習問題 {feQuizzes.length} 問
              </h1>
              <p
                className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                コードを目で追って出力を答える 4 択問題です。1 問ずつ独立しているので、
                気になる構文から解いて構いません。答え合わせをすると解説と、
                そのコードを実行シミュレーターで動かすリンクが出ます。
              </p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                すべてオリジナル問題です（IPA 公式過去問の転載はしていません）。
              </p>
              <QuizProgressSummary total={feQuizzes.length} />
            </header>

            {TIERS.map((t) => (
              <section key={t.key} className="mt-10 first:mt-0 max-w-3xl">
                <h2 className="text-lg font-bold tracking-tight">{t.heading}</h2>
                <p
                  className="mt-1 text-sm text-[var(--muted-foreground)]"
                  style={{ textWrap: "pretty" }}
                >
                  {t.lead}
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {feQuizzesByTier(t.key).map((q) => (
                    <li key={q.slug}>
                      <QuizIndexCard quiz={q} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <p
              className="mt-10 max-w-3xl text-sm text-[var(--muted-foreground)]"
              style={{ textWrap: "pretty" }}
            >
              解けなかった構文は
              <Link
                href="/fe/lessons"
                className="underline underline-offset-4 hover:opacity-80"
              >
                構文別レッスン
              </Link>
              に戻って読み直すのが近道です。自分でコードを書き換えて確かめたい場合は
              <Link
                href={sectionMeta.path}
                className="underline underline-offset-4 hover:opacity-80"
              >
                実行シミュレーター
              </Link>
              へ。
            </p>

            <div className="max-w-3xl">
              <AffiliateBooks
                topicSlug="fe-quiz"
                domain="fe"
                heading="もっと問題を解きたい方へ（おすすめ書籍）"
              />
            </div>
          </div>

          <FeSidebar topicSlug="fe-quiz" />
        </div>
      </Container>
    </div>
  );
}

const TIERS = [
  {
    key: "basic" as const,
    heading: "基礎 — 構文が読めれば解ける",
    lead: "構文別レッスンの内容がそのまま問われます。まずはここから。",
  },
  {
    key: "exam" as const,
    heading: "本番相当 — 科目 B と同じ土俵",
    lead: "配列で表したデータ構造・整列・再帰など、実際の科目 B で出るパターンです。追う変数が増えるので、紙に表を書きながら解いてください。",
  },
];

function QuizIndexCard({ quiz }: { quiz: FeQuizMeta }) {
  const lesson = findFeLesson(quiz.lesson);
  return (
    <Link
      href={`/fe/quiz/${quiz.slug}`}
      className="block h-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted-foreground)]">
          第 {quiz.order} 問 / 全 {feQuizzes.length} 問
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          / {quiz.kind === "trace" ? "出力を答える" : "空欄補充"}
        </span>
        <QuizStatusBadge slug={quiz.slug} />
      </div>
      <div className="mt-1 font-semibold">{quiz.shortTitle}</div>
      <p
        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
        style={{ textWrap: "pretty" }}
      >
        {quiz.challenge}
      </p>
      {lesson && (
        <div className="mt-3 text-[11px] text-[var(--muted-foreground)]">
          関連レッスン: {lesson.shortTitle}
        </div>
      )}
    </Link>
  );
}
