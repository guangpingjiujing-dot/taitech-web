import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { sections } from "@/content/sections";
import {
  feLessonNeighbors,
  type FeLessonMeta,
  type FeLessonSlug,
} from "@/content/fe/lessons";
import { feQuizzesForLesson } from "@/content/fe/quiz";

const sectionMeta = sections.fe;

export function FeLessonLayout({
  lesson,
  children,
}: {
  lesson: FeLessonMeta;
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
              { href: "/fe/lessons", label: "構文別レッスン" },
              { label: lesson.shortTitle },
            ]}
          />

          <Eyebrow>基本情報技術者試験 (FE) 科目 B — 擬似言語</Eyebrow>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {lesson.title}
          </h1>

          <DefinitionBox className="mt-6">{lesson.definition}</DefinitionBox>

          <div className="prose-jp mt-10 max-w-none">{children}</div>

          <LessonNextActions lessonSlug={lesson.slug} />

          <PrevNextCards
            ariaLabel="前後のレッスン"
            prev={
              prev
                ? { href: `/fe/lessons/${prev.slug}`, shortTitle: prev.shortTitle }
                : null
            }
            next={
              next
                ? { href: `/fe/lessons/${next.slug}`, shortTitle: next.shortTitle }
                : null
            }
          />

          <AffiliateBooks
            topicSlug={`fe-${lesson.slug}`}
            domain="fe"
            limit={3}
            heading="この構文をもっと練習する（おすすめ書籍）"
          />

          <MentorCTA />
        </article>

        <FeSidebar topicSlug={`fe-${lesson.slug}`} />
      </div>
    </Container>
  );
}

/**
 * レッスン末尾に置く「次に何ができるか」導線カード。
 * 読了直後の自然な次の一手を提示する。breadcrumb と重複するが
 * 目に入りやすい位置に置くのが目的。
 * 該当構文の練習問題がある場合は、それを先頭に置く (理解 → 確認の順)。
 */
function LessonNextActions({ lessonSlug }: { lessonSlug: FeLessonSlug }) {
  const quiz = feQuizzesForLesson(lessonSlug)[0];
  const actions: { href: string; label: string; hint: string }[] = [
    ...(quiz
      ? [
          {
            href: `/fe/quiz/${quiz.slug}`,
            label: "練習問題を解く",
            hint: `「${quiz.shortTitle}」で理解を確認する`,
          },
        ]
      : []),
    {
      href: "/fe",
      label: "実行シミュレーターへ",
      hint: "自由にコードを書いて動かす",
    },
    {
      href: "/fe/transpile",
      label: "多言語横並び比較へ",
      hint: "Python / TypeScript と読み比べる",
    },
    {
      href: "/fe/lessons",
      label: "レッスン一覧へ",
      hint: "他 5 本の構文レッスンを見る",
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
        理解できたか試す / 自由に動かす
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