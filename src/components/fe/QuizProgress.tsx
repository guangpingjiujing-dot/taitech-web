"use client";

import { useEffect, useState } from "react";
import {
  FE_QUIZ_PROGRESS_EVENT,
  readFeQuizProgress,
  type FeQuizProgress,
} from "@/lib/fe/quizProgress";

/** localStorage の進捗を購読する。SSR / マウント前は必ず空を返す */
function useFeQuizProgress(): { progress: FeQuizProgress; mounted: boolean } {
  const [progress, setProgress] = useState<FeQuizProgress>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sync = () => setProgress(readFeQuizProgress());
    sync();
    setMounted(true);
    window.addEventListener(FE_QUIZ_PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FE_QUIZ_PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { progress, mounted };
}

export function QuizStatusBadge({ slug }: { slug: string }) {
  const { progress, mounted } = useFeQuizProgress();
  const result = progress[slug];
  if (!mounted || !result) return null;
  return (
    <span
      className={
        result === "correct"
          ? "rounded-sm bg-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--background)]"
          : "rounded-sm border border-[var(--border-strong)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]"
      }
    >
      {result === "correct" ? "正解" : "再挑戦"}
    </span>
  );
}

export function QuizProgressSummary({ total }: { total: number }) {
  const { progress, mounted } = useFeQuizProgress();
  if (!mounted) return null;
  const answered = Object.keys(progress).length;
  if (answered === 0) return null;
  const correct = Object.values(progress).filter((r) => r === "correct").length;
  return (
    <p className="mt-4 text-sm text-[var(--muted-foreground)]" role="status">
      これまでの記録: {total} 問中 {answered} 問に解答、{correct} 問正解
      <span className="ml-2 text-xs">
        (このブラウザにのみ保存され、サーバには送信されません)
      </span>
    </p>
  );
}
