/**
 * 練習問題の進捗を localStorage にだけ保存する (サーバ保存・アカウントなし)。
 * SSR 中は必ず空を返し、読み出しは必ずマウント後に行うこと (hydration mismatch 対策)。
 */

export type FeQuizResult = "correct" | "incorrect";

export type FeQuizProgress = Record<string, FeQuizResult>;

const STORAGE_KEY = "fe-quiz-progress";

/** 同一タブ内で進捗の更新を伝えるためのイベント名 (storage イベントは他タブ用) */
export const FE_QUIZ_PROGRESS_EVENT = "fe-quiz-progress-change";

export function readFeQuizProgress(): FeQuizProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: FeQuizProgress = {};
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === "correct" || value === "incorrect") out[slug] = value;
    }
    return out;
  } catch {
    // クォータ超過・JSON 破損・プライベートモード等では進捗なし扱いにする
    return {};
  }
}

export function recordFeQuizResult(slug: string, result: FeQuizResult): void {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readFeQuizProgress(), [slug]: result };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(FE_QUIZ_PROGRESS_EVENT));
  } catch {
    // 保存できなくても解答体験は継続させる
  }
}
