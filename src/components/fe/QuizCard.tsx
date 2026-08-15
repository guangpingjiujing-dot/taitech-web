import { QuizCard as QuizCardView } from "@/components/quiz/QuizCard";
import { feQuizRunnableCode, type FeQuizMeta } from "@/content/fe/quiz";
import { findFeLesson } from "@/content/fe/lessons";

/**
 * FE の練習問題 1 問。出題 UI は `components/quiz/QuizCard` が持ち、
 * ここは FeQuizMeta とリンク先の解決だけを担う。
 */
export function QuizCard({ quiz }: { quiz: FeQuizMeta }) {
  const lesson = findFeLesson(quiz.lesson);
  const runHref = `/fe/algorithm?code=${encodeURIComponent(
    feQuizRunnableCode(quiz),
  )}&from=${encodeURIComponent(`/fe/algorithm/quiz/${quiz.slug}`)}`;

  return (
    <QuizCardView
      namespace="fe"
      slug={quiz.slug}
      prompt={quiz.prompt}
      code={quiz.code}
      choices={quiz.choices}
      answer={quiz.answer}
      explanation={quiz.explanation}
      trap={quiz.trap}
      runHref={runHref}
      lessonHref={lesson ? `/fe/algorithm/lessons/${lesson.slug}` : undefined}
      lessonLabel={lesson?.shortTitle}
    />
  );
}
