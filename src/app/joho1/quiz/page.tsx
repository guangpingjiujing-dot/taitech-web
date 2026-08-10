import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { QuizProgressSummary } from "@/components/quiz/QuizProgress";
import { QuizIndexCard } from "@/components/joho1/QuizIndexCard";
import { Joho1Sidebar } from "@/components/joho1/Joho1Sidebar";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { joho1Quizzes, joho1QuizzesByTier } from "@/content/joho1/quiz";

// 問題数はレジストリから導出する (数を直書きすると増やしたときに矛盾する)
const QUIZ_COUNT = joho1Quizzes.length;
const PAGE_TITLE = `情報I プログラム表記 練習問題 ${QUIZ_COUNT} 問｜共通テスト対策`;
const PAGE_DESCRIPTION = `大学入学共通テスト「情報I」のプログラム表記をトレースして答えるオリジナル練習問題 ${QUIZ_COUNT} 問。変数と代入・条件分岐・繰り返し・配列・外部関数を 4 択で確認できる。配列の添字が 0 始まりか 1 始まりかは問題ごとに明示。解説と実行シミュレーターで答え合わせまでできる無料教材。`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/joho1/quiz" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/joho1/quiz",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const sectionMeta = sections.joho1;

export default function Joho1QuizIndexPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "情報I プログラム表記 練習問題",
    url: `${site.url}/joho1/quiz`,
    description: PAGE_DESCRIPTION,
    inLanguage: "ja-JP",
    isPartOf: {
      "@type": "CollectionPage",
      name: sectionMeta.label,
      url: `${site.url}${sectionMeta.path}`,
    },
    hasPart: joho1Quizzes.map((q) => ({
      "@type": "Quiz",
      name: q.title,
      url: `${site.url}/joho1/quiz/${q.slug}`,
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
        item: `${site.url}/joho1/quiz`,
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
                { href: sectionMeta.path, label: "情報I プログラム表記" },
                { label: "練習問題" },
              ]}
            />

            <header className="mb-8 max-w-3xl">
              <Eyebrow>大学入学共通テスト「情報I」— プログラム表記</Eyebrow>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                プログラム表記 練習問題 {QUIZ_COUNT} 問
              </h1>
              <p
                className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                プログラムを目で追って出力を答える 4 択問題です。1 問ずつ独立しているので、
                気になる構文から解いて構いません。答え合わせをすると解説と、
                そのプログラムを実行シミュレーターで動かすリンクが出ます。
              </p>
              <p
                className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed"
                style={{ textWrap: "pretty" }}
              >
                本番と同じように、
                <strong>配列の添字が 0 から始まるか 1 から始まるかは各問題の冒頭で示します</strong>
                。問題文のその一行を読み飛ばさない練習も兼ねています。
              </p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                すべてオリジナル問題です（大学入試センターの過去問・試作問題の転載はしていません）。
              </p>
              <QuizProgressSummary namespace="joho1" total={QUIZ_COUNT} />
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
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {joho1QuizzesByTier(t.key).map((q) => (
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
                href="/joho1/lessons"
                className="underline underline-offset-4 hover:opacity-80"
              >
                構文別レッスン
              </Link>
              に戻って読み直すのが近道です。自分でプログラムを書き換えて確かめたい場合は
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
                topicSlug="joho1-quiz"
                domain="joho1"
                heading="もっと問題を解きたい方へ（おすすめ書籍）"
              />
            </div>
          </div>

          <Joho1Sidebar topicSlug="joho1-quiz" />
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
    heading: "本番相当 — 共通テストと同じ土俵",
    lead: "配列を書き換えながら回す、添字に式を書く、条件を組み合わせるなど、実際の共通テストで出るパターンです。追う変数が増えるので、紙に表を書きながら解いてください。",
  },
];
