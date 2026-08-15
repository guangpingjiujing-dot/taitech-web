import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { QuizCard } from "@/components/fe/QuizCard";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { QuizJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { feQuizNeighbors, feQuizzes, findFeQuiz } from "@/content/fe/quiz";
import { findFeLesson } from "@/content/fe/lessons";

export function generateStaticParams() {
  return feQuizzes.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = findFeQuiz(slug);
  if (!quiz) return {};
  const path = `/fe/algorithm/quiz/${quiz.slug}`;
  return {
    title: quiz.title,
    description: quiz.description,
    keywords: quiz.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: quiz.title,
      description: quiz.description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title: quiz.title,
      description: quiz.description,
    },
  };
}

export default async function FeQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = findFeQuiz(slug);
  if (!quiz) notFound();
  const sectionMeta = sections.fe;
  const lesson = findFeLesson(quiz.lesson);
  const { prev, next } = feQuizNeighbors(quiz.slug);
  const path = `/fe/algorithm/quiz/${quiz.slug}`;

  return (
    <>
      <QuizJsonLd
        section="fe"
        path={path}
        name={quiz.title}
        description={quiz.description}
        keywords={quiz.keywords}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          { name: sectionMeta.shortLabel, item: `${site.url}${sectionMeta.path}` },
          { name: "練習問題", item: `${site.url}/fe/algorithm/quiz` },
          { name: quiz.shortTitle, item: `${site.url}${path}` },
        ]}
        question={quiz.prompt}
        choices={quiz.choices.map((c) => ({ id: c.id, text: c.text }))}
        answer={quiz.answer}
        explanation={quiz.explanation.join(" ")}
        educationalAlignment={lesson?.shortTitle ?? "擬似言語"}
      />
      <Container size="wide" className="py-8 md:py-12">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <article className="mx-auto w-full min-w-0 max-w-3xl lg:mx-0">
            <Breadcrumb
              className="mb-6"
              items={[
                { href: "/", label: "ホーム" },
                { href: sectionMeta.path, label: "擬似言語 実行シミュレーター" },
                { href: "/fe/algorithm/quiz", label: "練習問題" },
                { label: quiz.shortTitle },
              ]}
            />

            <Eyebrow>
              基本情報技術者試験 (FE) 科目 B — 練習問題 第 {quiz.order} 問 / 全 {feQuizzes.length} 問 · {quiz.tier === "basic" ? "基礎" : "本番相当"}
            </Eyebrow>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              {quiz.shortTitle}
            </h1>
            {lesson && (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                関連レッスン:{" "}
                <Link
                  href={`/fe/algorithm/lessons/${lesson.slug}`}
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  {lesson.title}
                </Link>
              </p>
            )}

            <div className="mt-8">
              <QuizCard quiz={quiz} />
            </div>

            <PrevNextCards
              ariaLabel="前後の練習問題"
              prev={
                prev ? { href: `/fe/algorithm/quiz/${prev.slug}`, shortTitle: prev.shortTitle } : null
              }
              next={
                next ? { href: `/fe/algorithm/quiz/${next.slug}`, shortTitle: next.shortTitle } : null
              }
            />

            <p className="mt-8 text-sm text-[var(--muted-foreground)]">
              <Link
                href="/fe/algorithm/quiz"
                className="underline underline-offset-4 hover:opacity-80"
              >
                練習問題一覧に戻る →
              </Link>
            </p>

            <AffiliateBooks
              topicSlug="fe-quiz"
              domain="fe"
              limit={3}
              heading="演習量を増やしたい方へ（おすすめ書籍）"
            />

            <MentorCTA variant="fe" />
          </article>

          <FeSidebar topicSlug="fe-quiz" />
        </div>
      </Container>
    </>
  );
}
