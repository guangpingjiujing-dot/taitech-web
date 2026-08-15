import { QuizIndexCard as QuizIndexCardView } from "@/components/quiz/QuizIndexCard";
import { feQuizzes, type FeQuizMeta } from "@/content/fe/quiz";
import { findFeLesson } from "@/content/fe/lessons";

/**
 * FE の練習問題カード。見た目は `components/quiz/QuizIndexCard` が持ち、
 * ここは FeQuizMeta を表示用の値へ解決するデータ層だけを担う。
 *
 * レッスン側では関連レッスン名が自明なので `showLesson={false}` で落とす。
 */
export function QuizIndexCard({
  quiz,
  showLesson = true,
}: {
  quiz: FeQuizMeta;
  showLesson?: boolean;
}) {
  const lesson = findFeLesson(quiz.lesson);
  return (
    <QuizIndexCardView
      namespace="fe"
      href={`/fe/algorithm/quiz/${quiz.slug}`}
      slug={quiz.slug}
      order={quiz.order}
      total={feQuizzes.length}
      kindLabel={quiz.kind === "trace" ? "出力を答える" : "空欄補充"}
      shortTitle={quiz.shortTitle}
      challenge={quiz.challenge}
      lessonLabel={showLesson ? lesson?.shortTitle : undefined}
    />
  );
}
