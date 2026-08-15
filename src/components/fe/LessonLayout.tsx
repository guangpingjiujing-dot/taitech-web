import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { FAQ } from "@/components/layout/FAQ";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { QuizIndexCard } from "@/components/fe/QuizIndexCard";
import { sections } from "@/content/sections";
import {
  feLessons,
  feLessonNeighbors,
  type FeLessonMeta,
  type FeLessonSlug,
} from "@/content/fe/lessons";
import { feQuizzesForLesson } from "@/content/fe/quiz";

const sectionMeta = sections.fe;

export function FeLessonLayout({
  lesson,
  faq,
  children,
}: {
  lesson: FeLessonMeta;
  /** JSON-LD の FAQPage と同じ内容。可視でも必ず出す (Google のガイドライン要件) */
  faq?: { q: string; a: string }[];
  children: React.ReactNode;
}) {
  const { prev, next } = feLessonNeighbors(lesson.slug);

  return (
    <Container size="wide" className="py-8 md:py-12">
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="mx-auto w-full min-w-0 max-w-3xl lg:mx-0">
          <Breadcrumb
            className="mb-6"
            items={[
              { href: "/", label: "ホーム" },
              { href: sectionMeta.path, label: "擬似言語 実行シミュレーター" },
              { href: "/fe/algorithm/lessons", label: "構文別レッスン" },
              { label: lesson.shortTitle },
            ]}
          />

          <Eyebrow>基本情報技術者試験 (FE) 科目 B — 擬似言語</Eyebrow>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {lesson.title}
          </h1>

          <DefinitionBox className="mt-6">{lesson.definition}</DefinitionBox>

          <div className="prose-jp mt-10 max-w-none">{children}</div>

          {faq && faq.length > 0 && <FAQ items={faq} />}

          <LessonQuizList lesson={lesson} />

          <LessonNextActions lessonSlug={lesson.slug} />

          <PrevNextCards
            ariaLabel="前後のレッスン"
            prev={
              prev
                ? { href: `/fe/algorithm/lessons/${prev.slug}`, shortTitle: prev.shortTitle }
                : null
            }
            next={
              next
                ? { href: `/fe/algorithm/lessons/${next.slug}`, shortTitle: next.shortTitle }
                : null
            }
          />

          <AffiliateBooks
            topicSlug={`fe-${lesson.slug}`}
            domain="fe"
            limit={3}
            heading="この構文をもっと練習する（おすすめ書籍）"
          />

          <MentorCTA variant="fe" />
        </article>

        <FeSidebar topicSlug={`fe-${lesson.slug}`} />
      </div>
    </Container>
  );
}

/**
 * その構文に紐づく練習問題を **全問** 並べる。
 *
 * ここを 1 問だけにしない理由: 2026-08-07 時点で quiz 20 問のうち 19 問が
 * Google に未インデックスだった。当時レッスンから張っていたリンクは各構文の
 * 先頭 1 問だけで、20 問中 6 問しか内部リンクを受けていなかった
 * (唯一インデックスされていた array-one-based は array の先頭問)。
 * クロール済みのレッスンページから全問へ導線を通すのが目的なので、
 * 「代表 1 問だけ見せる」形に戻さないこと。
 */
function LessonQuizList({ lesson }: { lesson: FeLessonMeta }) {
  const quizzes = feQuizzesForLesson(lesson.slug);
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
        読んだ内容がそのまま出題されます。答え合わせをすると解説と、
        そのコードを実行シミュレーターで動かすリンクが出ます。
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {quizzes.map((q) => (
          <li key={q.slug}>
            <QuizIndexCard quiz={q} showLesson={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * レッスン末尾に置く「次に何ができるか」導線カード。
 * 読了直後の自然な次の一手を提示する。breadcrumb と重複するが
 * 目に入りやすい位置に置くのが目的。
 * 練習問題は LessonQuizList が全問並べるので、ここには入れない。
 */
function LessonNextActions({ lessonSlug }: { lessonSlug: FeLessonSlug }) {
  const actions: { href: string; label: string; hint: string }[] = [
    {
      href: "/fe/algorithm",
      label: "実行シミュレーターへ",
      hint: "自由にコードを書いて動かす",
    },
    {
      href: "/fe/algorithm/transpile",
      label: "多言語横並び比較へ",
      hint: "Python / TypeScript と読み比べる",
    },
    {
      href: "/fe/algorithm/lessons",
      label: "レッスン一覧へ",
      hint: `他 ${feLessons.length - 1} 本の構文レッスンを見る`,
    },
  ];
  return (
    <section
      aria-labelledby="lesson-next-actions"
      className="mt-12 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
    >
      <h2
        id="lesson-next-actions"
        className="text-sm font-bold text-[var(--foreground)]"
      >
        自由に動かす / 他の構文を読む
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group block rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
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