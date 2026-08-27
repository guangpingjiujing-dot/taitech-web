import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { ArticleMeta } from "@/components/layout/ArticleMeta";
import { FAQ } from "@/components/layout/FAQ";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { Joho1Sidebar } from "@/components/joho1/Joho1Sidebar";
import { QuizIndexCard } from "@/components/joho1/QuizIndexCard";
import { sections } from "@/content/sections";
import {
  joho1Lessons,
  joho1LessonNeighbors,
  type Joho1LessonMeta,
} from "@/content/joho1/lessons";
import { joho1QuizzesForLesson } from "@/content/joho1/quiz";

const sectionMeta = sections.joho1;

/**
 * `/joho1/lessons/*` の骨組み。
 *
 * FE の `FeLessonLayout` とは**別実装**にしている。見た目はほぼ同じだが、
 * lesson / quiz の型も CTA のドメインも別なので、両方を満たす props を持たせると
 * どちらのセクションからも読みにくくなるため。見た目を持つ部品
 * (`PrevNextCards` / `QuizIndexCard` / `AffiliateBooks`) は共有していて、
 * ここが持つのはそれらの並べ方とデータの解決だけ (AGENTS.md の分離パターン)。
 */
export function Joho1LessonLayout({
  lesson,
  faq,
  children,
}: {
  lesson: Joho1LessonMeta;
  faq?: { q: string; a: string }[];
  children: React.ReactNode;
}) {
  const { prev, next } = joho1LessonNeighbors(lesson.slug);

  return (
    <Container size="wide" className="py-8 md:py-12">
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <article className="mx-auto w-full min-w-0 max-w-3xl lg:mx-0">
        <Breadcrumb
          className="mb-6"
          items={[
            { href: "/", label: "ホーム" },
            { href: sectionMeta.path, label: "情報I プログラム表記" },
            { href: "/joho1/lessons", label: "構文別レッスン" },
            { label: lesson.shortTitle },
          ]}
        />

        <Eyebrow>大学入学共通テスト「情報I」— プログラム表記</Eyebrow>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          {lesson.title}
        </h1>

        <ArticleMeta path={`/joho1/lessons/${lesson.slug}`} className="mt-3" />

        <DefinitionBox className="mt-6">{lesson.definition}</DefinitionBox>

        <div className="prose-jp mt-10 max-w-none">{children}</div>

        {faq && faq.length > 0 && <FAQ items={faq} />}

        <LessonQuizList lesson={lesson} />

        <LessonNextActions />

        <PrevNextCards
          ariaLabel="前後のレッスン"
          prev={
            prev
              ? {
                  href: `/joho1/lessons/${prev.slug}`,
                  shortTitle: prev.shortTitle,
                }
              : null
          }
          next={
            next
              ? {
                  href: `/joho1/lessons/${next.slug}`,
                  shortTitle: next.shortTitle,
                }
              : null
          }
        />

        <AffiliateBooks
          topicSlug={`joho1-${lesson.slug}`}
          domain="joho1"
          limit={3}
          heading="この構文をもっと練習する（おすすめ書籍）"
        />
      </article>

      <Joho1Sidebar topicSlug={`joho1-${lesson.slug}`} />
      </div>
    </Container>
  );
}

/**
 * その構文に紐づく練習問題を **全問** 並べる。
 *
 * 代表 1 問だけにしないのは FE で踏んだ失敗があるため: レッスンからのリンクが
 * 各構文の先頭 1 問だけだったとき、quiz 20 問のうち 19 問が Google に
 * 未インデックスのまま残った (2026-08-07)。クロール済みのレッスンページから
 * 全問へ導線を通すのが目的。
 */
function LessonQuizList({ lesson }: { lesson: Joho1LessonMeta }) {
  const quizzes = joho1QuizzesForLesson(lesson.slug);
  if (quizzes.length === 0) return null;

  return (
    <section aria-labelledby="lesson-quiz-list" className="mt-12">
      <h2 id="lesson-quiz-list" className="text-lg font-bold tracking-tight">
        「{lesson.shortTitle}」の練習問題 {quizzes.length} 問
      </h2>
      <p
        className="mt-1 text-sm text-[var(--muted-foreground)]"
        style={{ textWrap: "pretty" }}
      >
        読んだ内容がそのまま問われます。答え合わせをすると解説と、
        そのプログラムを実行シミュレーターで動かすリンクが出ます。
      </p>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {quizzes.map((q) => (
          <li key={q.slug}>
            <QuizIndexCard quiz={q} showLesson={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function LessonNextActions() {
  const actions: { href: string; label: string; hint: string }[] = [
    {
      href: "/joho1",
      label: "実行シミュレーターへ",
      hint: "問題のプログラムを貼って動かす",
    },
    {
      href: "/joho1/transpile",
      label: "Python と読み比べる",
      hint: "授業で書いた Python との対応を見る",
    },
    {
      href: "/joho1/dncl",
      label: "DNCL との違いへ",
      hint: "情報Iの言語は DNCL ではない",
    },
    {
      href: "/joho1/lessons",
      label: "レッスン一覧へ",
      hint: `他 ${joho1Lessons.length - 1} 本の構文レッスンを見る`,
    },
  ];
  return (
    <section
      aria-labelledby="lesson-next-actions"
      className="mt-12 border border-[var(--border)] bg-[var(--card)] p-5"
    >
      <h2
        id="lesson-next-actions"
        className="text-sm font-bold text-[var(--foreground)]"
      >
        自由に動かす / 他の構文を読む
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group block border border-[var(--border)] bg-[var(--background)] px-3 py-2 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
            >
              <div className="text-sm font-semibold group-hover:underline underline-offset-4">
                {a.label} →
              </div>
              <div className="mt-0.5 text-xs text-[var(--muted-foreground)] leading-tight">
                {a.hint}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
