import { QuizIndexCard as QuizIndexCardView } from "@/components/quiz/QuizIndexCard";
import { joho1Quizzes, type Joho1QuizMeta } from "@/content/joho1/quiz";
import { findJoho1Lesson } from "@/content/joho1/lessons";

/**
 * 情報I の練習問題カード。見た目は `components/quiz/QuizIndexCard` が持ち、
 * ここは Joho1QuizMeta を表示用の値へ解決するデータ層だけを担う。
 */
export function QuizIndexCard({
  quiz,
  showLesson = true,
}: {
  quiz: Joho1QuizMeta;
  showLesson?: boolean;
}) {
  const lesson = findJoho1Lesson(quiz.lesson);
  return (
    <QuizIndexCardView
      namespace="joho1"
      href={`/joho1/quiz/${quiz.slug}`}
      slug={quiz.slug}
      order={quiz.order}
      total={joho1Quizzes.length}
      kindLabel={quiz.kind === "trace" ? "出力を答える" : "空欄補充"}
      shortTitle={quiz.shortTitle}
      challenge={quiz.challenge}
      lessonLabel={showLesson ? lesson?.shortTitle : undefined}
    />
  );
}
