import { LessonLayoutView } from "@/components/layout/LessonLayoutView";
import { FeSidebar } from "@/components/fe/FeSidebar";
import { SqlQuizIndexCard } from "@/components/sql/QuizIndexCard";
import { sections } from "@/content/sections";
import {
  sqlLessons,
  sqlLessonNeighbors,
  type SqlLessonMeta,
} from "@/content/fe/sql/lessons";
import { sqlQuizzesForLesson } from "@/content/fe/sql/quiz";

const sectionMeta = sections.fe;

/**
 * SQL レッスンのデータ層。見た目は `LessonLayoutView` が持つ
 * (`components/fe/LessonLayout.tsx` と同じ形)。
 */
export function SqlLessonLayout({
  lesson,
  faq,
  children,
}: {
  lesson: SqlLessonMeta;
  faq?: { q: string; a: string }[];
  children: React.ReactNode;
}) {
  const { prev, next } = sqlLessonNeighbors(lesson.slug);

  return (
    <LessonLayoutView
      breadcrumb={[
        { href: "/", label: "ホーム" },
        { href: sectionMeta.path, label: sectionMeta.shortLabel },
        { href: "/fe/sql", label: "SQL 実行シミュレーター" },
        { href: "/fe/sql/lessons", label: "SQL レッスン" },
        { label: lesson.shortTitle },
      ]}
      eyebrow="基本情報技術者試験 (FE) 科目 A — データベース"
      title={lesson.title}
      definition={lesson.definition}
      faq={faq}
      quizSection={<LessonQuizList lesson={lesson} />}
      nextActionsHeading="自由に試す / 他のレッスンを読む"
      nextActions={[
        {
          href: "/fe/sql",
          label: "SQL 実行シミュレーターへ",
          hint: "自由に SQL を書いて評価順を追う",
        },
        {
          href: "/fe/sql/lessons",
          label: "レッスン一覧へ",
          hint: `他 ${sqlLessons.length - 1} 本のレッスンを見る`,
        },
        {
          href: "/fe/algorithm",
          label: "擬似言語 実行シミュレーターへ",
          hint: "科目 B のアルゴリズム対策はこちら",
        },
      ]}
      prev={
        prev
          ? { href: `/fe/sql/lessons/${prev.slug}`, shortTitle: prev.shortTitle }
          : null
      }
      next={
        next
          ? { href: `/fe/sql/lessons/${next.slug}`, shortTitle: next.shortTitle }
          : null
      }
      booksTopicSlug="fe-sql"
      booksDomain="fe"
      booksHeading="データベース分野をもっと学ぶ（おすすめ書籍）"
      mentorVariant="fe"
      sidebar={<FeSidebar topicSlug="fe-sql" />}
    >
      {children}
    </LessonLayoutView>
  );
}

/**
 * そのテーマに紐づく練習問題を **全問** 並べる。
 * 代表 1 問だけにしない理由は `components/fe/LessonLayout.tsx` と同じで、
 * クロール済みのレッスンページから全問へ内部リンクを通すため。
 */
function LessonQuizList({ lesson }: { lesson: SqlLessonMeta }) {
  const quizzes = sqlQuizzesForLesson(lesson.slug);
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
        読んだ内容がそのまま出題されます。解答すると解説と、
        その SQL を実行シミュレーターで開くリンクが出ます。
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {quizzes.map((q) => (
          <li key={q.slug}>
            <SqlQuizIndexCard quiz={q} showLesson={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}
