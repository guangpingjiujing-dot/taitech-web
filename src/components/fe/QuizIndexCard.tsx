import Link from "next/link";
import { QuizStatusBadge } from "@/components/fe/QuizProgress";
import { feQuizzes, type FeQuizMeta } from "@/content/fe/quiz";
import { findFeLesson } from "@/content/fe/lessons";

/**
 * 練習問題 1 問への導線カード。
 *
 * `/fe/quiz` の一覧と、各レッスン末尾の「この構文の練習問題」の 2 箇所で使う。
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
    <Link
      href={`/fe/quiz/${quiz.slug}`}
      className="block h-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted-foreground)]">
          第 {quiz.order} 問 / 全 {feQuizzes.length} 問
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          / {quiz.kind === "trace" ? "出力を答える" : "空欄補充"}
        </span>
        <QuizStatusBadge slug={quiz.slug} />
      </div>
      <div className="mt-1 font-semibold">{quiz.shortTitle}</div>
      <p
        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
        style={{ textWrap: "pretty" }}
      >
        {quiz.challenge}
      </p>
      {showLesson && lesson && (
        <div className="mt-3 text-[11px] text-[var(--muted-foreground)]">
          関連レッスン: {lesson.shortTitle}
        </div>
      )}
    </Link>
  );
}
