import { QuizIndexCard as QuizIndexCardView } from "@/components/quiz/QuizIndexCard";
import { sqlQuizzes, type SqlQuizMeta } from "@/content/fe/sql/quiz";
import { findSqlLesson } from "@/content/fe/sql/lessons";

export function SqlQuizIndexCard({
  quiz,
  showLesson = true,
}: {
  quiz: SqlQuizMeta;
  showLesson?: boolean;
}) {
  const lesson = findSqlLesson(quiz.lesson);

  return (
    <QuizIndexCardView
      namespace="fe-sql"
      href={`/fe/sql/quiz/${quiz.slug}`}
      slug={quiz.slug}
      order={quiz.order}
      total={sqlQuizzes.length}
      kindLabel={quiz.kind === "result" ? "実行結果を答える" : "空欄補充"}
      shortTitle={quiz.shortTitle}
      challenge={quiz.challenge}
      lessonLabel={showLesson ? lesson?.shortTitle : undefined}
    />
  );
}
