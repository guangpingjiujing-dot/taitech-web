import Link from "next/link";
import { QuizStatusBadge } from "@/components/quiz/QuizProgress";
import type { QuizNamespace } from "@/lib/quiz/progress";

/**
 * 練習問題 1 問への導線カード (presentation)。
 *
 * `/fe/algorithm/quiz` `/joho1/quiz` の一覧と、各レッスン末尾の「この構文の練習問題」で使う。
 * セクション固有の型 (FeQuizMeta / Joho1QuizMeta) は受け取らず、表示に要る値だけ取る。
 * データ層は `components/{section}/QuizIndexCard.tsx` のラッパが持つ
 * (AGENTS.md の presentation / データ層分離パターン)。
 */
export function QuizIndexCard({
  namespace,
  href,
  slug,
  order,
  total,
  kindLabel,
  shortTitle,
  challenge,
  lessonLabel,
}: {
  namespace: QuizNamespace;
  href: string;
  slug: string;
  order: number;
  total: number;
  /** 「出力を答える」「空欄補充」など出題形式の 1 語 */
  kindLabel: string;
  shortTitle: string;
  challenge: string;
  /** 関連レッスン名。レッスン配下では自明なので渡さない */
  lessonLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="block h-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted-foreground)]">
          第 {order} 問 / 全 {total} 問
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          / {kindLabel}
        </span>
        <QuizStatusBadge namespace={namespace} slug={slug} />
      </div>
      <div className="mt-1 font-semibold">{shortTitle}</div>
      <p
        className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
        style={{ textWrap: "pretty" }}
      >
        {challenge}
      </p>
      {lessonLabel && (
        <div className="mt-3 text-[11px] text-[var(--muted-foreground)]">
          関連レッスン: {lessonLabel}
        </div>
      )}
    </Link>
  );
}
