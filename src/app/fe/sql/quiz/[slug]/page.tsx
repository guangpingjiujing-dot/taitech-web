import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ArticleMeta } from "@/components/layout/ArticleMeta";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { QuizJsonLd } from "@/components/seo/JsonLd";
import { SqlQuizCard } from "@/components/sql/QuizCard";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import {
  sqlQuizNeighbors,
  sqlQuizzes,
  findSqlQuiz,
} from "@/content/fe/sql/quiz";
import { findSqlLesson } from "@/content/fe/sql/lessons";

export function generateStaticParams() {
  return sqlQuizzes.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = findSqlQuiz(slug);
  if (!quiz) return {};
  const path = `/fe/sql/quiz/${quiz.slug}`;
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

export default async function SqlQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = findSqlQuiz(slug);
  if (!quiz) notFound();
  const { prev, next } = sqlQuizNeighbors(quiz.slug);
  const lesson = findSqlLesson(quiz.lesson);
  const sectionMeta = sections.fe;
  const path = `/fe/sql/quiz/${quiz.slug}`;

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
          { name: "SQL 実行シミュレーター", item: `${site.url}/fe/sql` },
          { name: "SQL 練習問題", item: `${site.url}/fe/sql/quiz` },
          { name: quiz.shortTitle, item: `${site.url}${path}` },
        ]}
        question={quiz.prompt}
        choices={quiz.choices.map((c) => ({ id: c.id, text: c.text }))}
        answer={quiz.answer}
        explanation={quiz.explanation.join(" ")}
        educationalAlignment={lesson?.shortTitle ?? "SQL"}
      />
      <Container size="wide" className="py-8 md:py-12">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <article className="mx-auto w-full min-w-0 max-w-3xl lg:mx-0">
            <Breadcrumb
              className="mb-6"
              items={[
                { href: "/", label: "ホーム" },
                { href: sectionMeta.path, label: sectionMeta.shortLabel },
                { href: "/fe/sql", label: "SQL 実行シミュレーター" },
                { href: "/fe/sql/quiz", label: "SQL 練習問題" },
                { label: quiz.shortTitle },
              ]}
            />

            <Eyebrow>
              基本情報技術者試験 科目 A — SQL 練習問題 第 {quiz.order} 問 /{" "}
              {sqlQuizzes.length}
            </Eyebrow>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              {quiz.title}
            </h1>

            <ArticleMeta path={`/fe/sql/quiz/${quiz.slug}`} className="mt-3" />

            <div className="mt-8">
              <SqlQuizCard quiz={quiz} />
            </div>

            {lesson && (
              <p className="mt-8 text-sm text-[var(--muted-foreground)]">
                この問題のもとになっている解説:{" "}
                <Link
                  href={`/fe/sql/lessons/${lesson.slug}`}
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  {lesson.title}
                </Link>
              </p>
            )}

            <PrevNextCards
              ariaLabel="前後の練習問題"
              prev={
                prev
                  ? { href: `/fe/sql/quiz/${prev.slug}`, shortTitle: prev.shortTitle }
                  : null
              }
              next={
                next
                  ? { href: `/fe/sql/quiz/${next.slug}`, shortTitle: next.shortTitle }
                  : null
              }
            />

            <p className="mt-8 text-sm">
              <Link
                href="/fe/sql/quiz"
                className="underline underline-offset-4 hover:opacity-80"
              >
                練習問題一覧へ（全 {sqlQuizzes.length} 問）→
              </Link>
            </p>

            <AffiliateBooks
              topicSlug="fe-sql"
              domain="fe"
              limit={3}
              heading="データベース分野をもっと学ぶ（おすすめ書籍）"
            />
          </article>

          <FeSidebar topicSlug="fe-sql" />
        </div>
      </Container>
    </>
  );
}
