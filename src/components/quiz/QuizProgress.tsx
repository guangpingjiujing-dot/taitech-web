"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getQuizProgressServerSnapshot,
  getQuizProgressSnapshot,
  subscribeQuizProgress,
  type QuizNamespace,
  type QuizProgress,
} from "@/lib/quiz/progress";

/**
 * localStorage の進捗を購読する。
 * 一覧では 20 個のバッジが同時にマウントされるので、
 * 読み取りとリスナーは `lib/quiz/progress.ts` のストアに 1 本化している。
 * SSR とハイドレーション直後は必ず空を返す (mismatch 防止)。
 */
function useQuizProgress(ns: QuizNamespace): QuizProgress {
  // subscribe の参照が毎レンダー変わると React が unsubscribe / subscribe を
  // 繰り返すので、namespace ごとに固定する
  const subscribe = useCallback(
    (onChange: () => void) => subscribeQuizProgress(ns, onChange),
    [ns],
  );
  const getSnapshot = useCallback(() => getQuizProgressSnapshot(ns), [ns]);
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getQuizProgressServerSnapshot,
  );
}

export function QuizStatusBadge({
  namespace,
  slug,
}: {
  namespace: QuizNamespace;
  slug: string;
}) {
  const result = useQuizProgress(namespace)[slug];
  if (!result) return null;
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

export function QuizProgressSummary({
  namespace,
  total,
}: {
  namespace: QuizNamespace;
  total: number;
}) {
  const progress = useQuizProgress(namespace);
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
