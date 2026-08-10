import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { QuizCard } from "@/components/joho1/QuizCard";
import { Joho1Sidebar } from "@/components/joho1/Joho1Sidebar";
import { QuizJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import {
  joho1QuizNeighbors,
  joho1Quizzes,
  findJoho1Quiz,
} from "@/content/joho1/quiz";
import { findJoho1Lesson } from "@/content/joho1/lessons";

export function generateStaticParams() {
  return joho1Quizzes.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = findJoho1Quiz(slug);
  if (!quiz) return {};
  const path = `/joho1/quiz/${quiz.slug}`;
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

export default async function Joho1QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = findJoho1Quiz(slug);
  if (!quiz) notFound();
  const sectionMeta = sections.joho1;
  const lesson = findJoho1Lesson(quiz.lesson);
  const { prev, next } = joho1QuizNeighbors(quiz.slug);
  const path = `/joho1/quiz/${quiz.slug}`;

  return (
    <>
      <QuizJsonLd
        section="joho1"
        educationalLevel="高校生・大学入学共通テスト「情報I」受験者"
        path={path}
        name={quiz.title}
        description={quiz.description}
        keywords={quiz.keywords}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          {
            name: sectionMeta.shortLabel,
            item: `${site.url}${sectionMeta.path}`,
          },
          { name: "練習問題", item: `${site.url}/joho1/quiz` },
          { name: quiz.shortTitle, item: `${site.url}${path}` },
        ]}
        question={quiz.prompt}
        choices={quiz.choices.map((c) => ({ id: c.id, text: c.text }))}
        answer={quiz.answer}
        explanation={quiz.explanation.join(" ")}
        educationalAlignment={lesson?.shortTitle ?? "プログラム表記"}
      />
      <Container size="wide" className="py-8 md:py-12">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <article className="mx-auto w-full min-w-0 max-w-3xl lg:mx-0">
            <Breadcrumb
              className="mb-6"
              items={[
                { href: "/", label: "ホーム" },
                { href: sectionMeta.path, label: "情報I プログラム表記" },
                { href: "/joho1/quiz", label: "練習問題" },
                { label: quiz.shortTitle },
              ]}
            />

            <Eyebrow>
              大学入学共通テスト「情報I」— 練習問題 第 {quiz.order} 問 / 全{" "}
              {joho1Quizzes.length} 問 ·{" "}
              {quiz.tier === "basic" ? "基礎" : "本番相当"}
            </Eyebrow>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              {quiz.shortTitle}
            </h1>
            {lesson && (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                関連レッスン:{" "}
                <Link
                  href={`/joho1/lessons/${lesson.slug}`}
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
                prev
                  ? {
                      href: `/joho1/quiz/${prev.slug}`,
                      shortTitle: prev.shortTitle,
                    }
                  : null
              }
              next={
                next
                  ? {
                      href: `/joho1/quiz/${next.slug}`,
                      shortTitle: next.shortTitle,
                    }
                  : null
              }
            />

            <p className="mt-8 text-sm text-[var(--muted-foreground)]">
              <Link
                href="/joho1/quiz"
                className="underline underline-offset-4 hover:opacity-80"
              >
                練習問題一覧に戻る →
              </Link>
            </p>

            <AffiliateBooks
              topicSlug="joho1-quiz"
              domain="joho1"
              limit={3}
              heading="演習量を増やしたい方へ（おすすめ書籍）"
            />
          </article>

          <Joho1Sidebar topicSlug="joho1-quiz" />
        </div>
      </Container>
    </>
  );
}
