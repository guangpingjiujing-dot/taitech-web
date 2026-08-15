import { LessonLayoutView } from "@/components/layout/LessonLayoutView";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { QuizIndexCard } from "@/components/fe/QuizIndexCard";
import { sections } from "@/content/sections";
import {
  feLessons,
  feLessonNeighbors,
  type FeLessonMeta,
} from "@/content/fe/lessons";
import { feQuizzesForLesson } from "@/content/fe/quiz";

const sectionMeta = sections.fe;

/**
 * 擬似言語レッスンのデータ層。見た目は `LessonLayoutView` が持つ。
 * ここが持つのは「FeLessonMeta からパス・前後・関連する練習問題を解決すること」だけ。
 */
export function FeLessonLayout({
  lesson,
  faq,
  children,
}: {
  lesson: FeLessonMeta;
  faq?: { q: string; a: string }[];
  children: React.ReactNode;
}) {
  const { prev, next } = feLessonNeighbors(lesson.slug);

  return (
    <LessonLayoutView
      breadcrumb={[
        { href: "/", label: "ホーム" },
        { href: sectionMeta.path, label: sectionMeta.shortLabel },
        { href: "/fe/algorithm", label: "擬似言語 実行シミュレーター" },
        { href: "/fe/algorithm/lessons", label: "構文別レッスン" },
        { label: lesson.shortTitle },
      ]}
      eyebrow="基本情報技術者試験 (FE) 科目 B — 擬似言語"
      title={lesson.title}
      definition={lesson.definition}
      faq={faq}
      quizSection={<LessonQuizList lesson={lesson} />}
      nextActionsHeading="自由に動かす / 他の構文を読む"
      nextActions={[
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
      ]}
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
      booksTopicSlug={`fe-${lesson.slug}`}
      booksDomain="fe"
      booksHeading="この構文をもっと練習する（おすすめ書籍）"
      mentorVariant="fe"
      sidebar={<FeSidebar topicSlug={`fe-${lesson.slug}`} />}
    >
      {children}
    </LessonLayoutView>
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
