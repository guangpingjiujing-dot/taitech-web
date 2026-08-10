/**
 * 練習問題の進捗を localStorage にだけ保存する (サーバ保存・アカウントなし)。
 * SSR 中は必ず空を返し、読み出しは必ずマウント後に行うこと (hydration mismatch 対策)。
 *
 * セクションごとに保存先を分ける。`/fe` と `/joho1` は問題の slug が衝突しうるうえ、
 * 「基本情報の進捗」と「共通テストの進捗」が混ざった合計は受験者にとって意味がない。
 * FE の保存キーは既に本番で使われているので `fe-quiz-progress` のまま動かさないこと
 * (変えると既存ユーザーの記録が消える)。
 */

export type QuizNamespace = "fe" | "joho1";

export type QuizResult = "correct" | "incorrect";

export type QuizProgress = Record<string, QuizResult>;

const storageKey = (ns: QuizNamespace) => `${ns}-quiz-progress`;

/** 同一タブ内で進捗の更新を伝えるためのイベント名 (storage イベントは他タブ用) */
const changeEvent = (ns: QuizNamespace) => `${ns}-quiz-progress-change`;

export function readQuizProgress(ns: QuizNamespace): QuizProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(ns));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: QuizProgress = {};
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === "correct" || value === "incorrect") out[slug] = value;
    }
    return out;
  } catch {
    // クォータ超過・JSON 破損・プライベートモード等では進捗なし扱いにする
    return {};
  }
}

export function recordQuizResult(
  ns: QuizNamespace,
  slug: string,
  result: QuizResult,
): void {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readQuizProgress(ns), [slug]: result };
    window.localStorage.setItem(storageKey(ns), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(changeEvent(ns)));
  } catch {
    // 保存できなくても解答体験は継続させる
  }
}

/* ---------------------------------------------------------------------------
   購読用のミニストア

   一覧ページではバッジが 20 個並ぶ。各々が localStorage を読んでリスナーを
   張ると 20 回の read と 40 個のリスナーになるので、スナップショットを 1 つに
   まとめて useSyncExternalStore から共有する。
--------------------------------------------------------------------------- */

const EMPTY: QuizProgress = {};

interface Store {
  snapshot: QuizProgress;
  loaded: boolean;
  listeners: Set<() => void>;
  refresh: () => void;
}

const stores = new Map<QuizNamespace, Store>();

function storeFor(ns: QuizNamespace): Store {
  let store = stores.get(ns);
  if (!store) {
    const created: Store = {
      snapshot: EMPTY,
      loaded: false,
      listeners: new Set(),
      refresh: () => {
        created.snapshot = readQuizProgress(ns);
        created.loaded = true;
        for (const l of created.listeners) l();
      },
    };
    stores.set(ns, created);
    store = created;
  }
  return store;
}

export function subscribeQuizProgress(
  ns: QuizNamespace,
  onChange: () => void,
): () => void {
  const store = storeFor(ns);
  if (store.listeners.size === 0) {
    store.refresh();
    window.addEventListener(changeEvent(ns), store.refresh);
    window.addEventListener("storage", store.refresh);
  } else if (!store.loaded) {
    store.refresh();
  }
  store.listeners.add(onChange);
  return () => {
    store.listeners.delete(onChange);
    if (store.listeners.size === 0) {
      window.removeEventListener(changeEvent(ns), store.refresh);
      window.removeEventListener("storage", store.refresh);
      store.loaded = false;
    }
  };
}

/** クライアント用スナップショット。同一参照を返さないと無限ループになる */
export function getQuizProgressSnapshot(ns: QuizNamespace): QuizProgress {
  const store = storeFor(ns);
  return store.loaded ? store.snapshot : EMPTY;
}

/** SSR / ハイドレーション時は常に空 (localStorage を読めないため) */
export function getQuizProgressServerSnapshot(): QuizProgress {
  return EMPTY;
}
