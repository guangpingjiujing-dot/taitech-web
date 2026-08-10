import { QuizCard as QuizCardView } from "@/components/quiz/QuizCard";
import {
  joho1IndexBaseNote,
  joho1QuizRunHref,
  JOHO1_FUNCTION_NOTES,
  type Joho1QuizMeta,
} from "@/content/joho1/quiz";
import { findJoho1Lesson } from "@/content/joho1/lessons";

/**
 * 情報I の練習問題 1 問。出題 UI は `components/quiz/QuizCard` が持ち、
 * ここは Joho1QuizMeta とリンク先の解決だけを担う。
 *
 * コードの手前に **添字の基点と、与えられた関数の説明** を必ず出す。
 * 共通テストでは毎回問題文で宣言される前提なので、省くと問題として成立しない
 * (00-overview.md §7-4)。
 */
export function QuizCard({ quiz }: { quiz: Joho1QuizMeta }) {
  const lesson = findJoho1Lesson(quiz.lesson);
  const functionNotes = quiz.functions
    .map((name) => JOHO1_FUNCTION_NOTES[name])
    .filter(Boolean);
  const codeNote = [joho1IndexBaseNote(quiz), ...functionNotes].join("\n");

  return (
    <QuizCardView
      namespace="joho1"
      slug={quiz.slug}
      prompt={quiz.prompt}
      codeNote={codeNote}
      code={quiz.code}
      choices={quiz.choices}
      answer={quiz.answer}
      explanation={quiz.explanation}
      trap={quiz.trap}
      runHref={joho1QuizRunHref(quiz)}
      lessonHref={lesson ? `/joho1/lessons/${lesson.slug}` : undefined}
      lessonLabel={lesson?.shortTitle}
    />
  );
}
