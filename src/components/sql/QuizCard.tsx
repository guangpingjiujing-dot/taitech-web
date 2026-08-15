import { QuizCard as QuizCardView } from "@/components/quiz/QuizCard";
import { sqlQuizRunnableSql, type SqlQuizMeta } from "@/content/fe/sql/quiz";
import { findSqlLesson } from "@/content/fe/sql/lessons";
import { findDataset } from "@/content/fe/sql/datasets";

/**
 * SQL の練習問題 1 問。出題 UI は `components/quiz/QuizCard` が持ち、
 * ここは SqlQuizMeta とリンク先の解決だけを担う
 * (`components/fe/QuizCard.tsx` と同じ形)。
 */
export function SqlQuizCard({ quiz }: { quiz: SqlQuizMeta }) {
  const lesson = findSqlLesson(quiz.lesson);
  const dataset = findDataset(quiz.datasetKey);
  const runHref = `/fe/sql?sql=${encodeURIComponent(
    sqlQuizRunnableSql(quiz),
  )}&dataset=${encodeURIComponent(quiz.datasetKey)}&from=${encodeURIComponent(
    `/fe/sql/quiz/${quiz.slug}`,
  )}`;

  return (
    <QuizCardView
      namespace="fe-sql"
      slug={quiz.slug}
      prompt={quiz.prompt}
      code={quiz.sql}
      codeNote={`使用する表: ${dataset.label}`}
      choices={quiz.choices}
      answer={quiz.answer}
      explanation={quiz.explanation}
      trap={quiz.trap}
      runHref={runHref}
      lessonHref={lesson ? `/fe/sql/lessons/${lesson.slug}` : undefined}
      lessonLabel={lesson?.shortTitle}
    />
  );
}
