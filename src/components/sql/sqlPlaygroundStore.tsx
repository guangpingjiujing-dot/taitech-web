"use client";

import { createStore, useStore } from "zustand";
import { createContext, useContext, useRef, type ReactNode } from "react";
import {
  cloneDatabase,
  evaluate,
  parse,
  SqlLexError,
  SqlParseError,
  SqlRuntimeError,
  SqlUnsupportedError,
  type Database,
  type Span,
  type Stage,
  type StatementResult,
} from "@/lib/sql";
import {
  findDataset,
  initialSql as datasetInitialSql,
  type DatasetKey,
} from "@/content/fe/sql/datasets";

/**
 * SQL Playground のストア。
 *
 * **`components/playground/playgroundStore.tsx` は使えない。** あちらの
 * `LanguageAdapter` は「変数スナップショット付きのステップ実行」に固く結びついていて、
 * SQL の「段階ごとの中間表」とは状態の型が本質的に違う
 * (docs/wip/20260815-fe-sql/01-implementation-design.md §1-2)。
 *
 * 共有しているのは `CodeEditor` と UI primitives だけ。ステップ送りの UI が
 * 両者で同じ形に落ち着いたら、そこだけ presentation として抽出を検討する。
 */

/** 段階の一覧。文が複数あるときは連結して 1 本の時系列にする */
export interface TimelineEntry {
  statementIndex: number;
  /** 文が複数あるときだけ出す見出し (「2 文目」) */
  statementLabel: string | null;
  stage: Stage;
}

export interface SqlError {
  /** UI の出し分け用。unsupported だけは「間違い」ではないので扱いを変える */
  kind: "lex" | "parse" | "runtime" | "unsupported";
  message: string;
  hint: string | null;
  /** unsupported のときの解説ページ */
  lessonPath: string | null;
  /** 制約違反のときに表の上で指す行 */
  offendingRowIndex: number | null;
  /** その行がどの表のものか。表名が無いと全部の表の同じ行番号を光らせてしまう */
  offendingTable: string | null;
}

export type SqlPlaygroundStatus = "idle" | "result" | "stepping" | "error";

export interface SqlPlaygroundState {
  sql: string;
  setSql: (sql: string) => void;

  /** 今見ているデータセット */
  datasetKey: DatasetKey;
  /** データセットの初期状態。リセットで必ずここへ戻す */
  initialDatabase: Database;
  /** 直近の実行後のデータベース。DML の結果が反映されている */
  database: Database;

  status: SqlPlaygroundStatus;
  error: SqlError | null;
  results: StatementResult[];
  timeline: TimelineEntry[];
  /** `status === "stepping"` のときに見ている段階 */
  stageIndex: number;

  /** エディタで光らせる範囲。段階を追っているときだけ入る */
  highlightRange: Span | null;
  /** 同じ範囲を指し直したときも decoration を張り直すためのカウンタ */
  highlightVersion: number;

  /** 全部実行して最終結果を出す */
  run: () => void;
  /** 実行して最初の段階から追う */
  startStepping: () => void;
  next: () => void;
  prev: () => void;
  /** データセットを初期状態へ戻し、結果を消す */
  reset: () => void;
  /**
   * 使う表を切り替える。SQL も切り替え先の既定に差し替える
   * (前のデータセット向けの SQL が残っていると必ず「表がありません」で落ちるため)。
   * `keepSql` を渡すと SQL は差し替えない (deep link 用)。
   */
  selectDataset: (key: DatasetKey, options?: { keepSql?: boolean }) => void;

  editorInsertRef: { current: ((text: string) => void) | null };
  insertText: (text: string) => void;
}

function toSqlError(e: unknown): SqlError {
  if (e instanceof SqlUnsupportedError) {
    return {
      kind: "unsupported",
      message: e.detail,
      hint: null,
      lessonPath: e.lessonPath,
      offendingRowIndex: null,
      offendingTable: null,
    };
  }
  if (e instanceof SqlLexError) {
    return {
      kind: "lex",
      message: `${e.pos.line}行目 ${e.pos.column}文字目: ${e.detail}`,
      hint: e.hint ?? null,
      lessonPath: null,
      offendingRowIndex: null,
      offendingTable: null,
    };
  }
  if (e instanceof SqlParseError) {
    return {
      kind: "parse",
      message: `${e.pos.line}行目: ${e.detail}`,
      hint: e.hint ?? null,
      lessonPath: null,
      offendingRowIndex: null,
      offendingTable: null,
    };
  }
  if (e instanceof SqlRuntimeError) {
    return {
      kind: "runtime",
      message: e.detail,
      hint: e.hint ?? null,
      lessonPath: null,
      offendingRowIndex: e.offendingRowIndex ?? null,
      offendingTable: e.offendingTable ?? null,
    };
  }
  return {
    kind: "runtime",
    message: e instanceof Error ? e.message : String(e),
    hint: null,
    lessonPath: null,
    offendingRowIndex: null,
    offendingTable: null,
  };
}

function buildTimeline(results: StatementResult[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const multiple = results.length > 1;
  results.forEach((result, statementIndex) => {
    const stages = result.kind === "ddl" ? [] : result.stages;
    for (const stage of stages) {
      entries.push({
        statementIndex,
        statementLabel: multiple ? `${statementIndex + 1} 文目` : null,
        stage,
      });
    }
  });
  return entries;
}

function createSqlPlaygroundStore(initialSql: string, datasetKey: DatasetKey) {
  const editorInsertRef: { current: ((text: string) => void) | null } = {
    current: null,
  };
  const initialDatabase = findDataset(datasetKey).build();

  return createStore<SqlPlaygroundState>()((set, get) => {
    /** 実行して状態を組み立てる。成功したかどうかを返す */
    const execute = (): boolean => {
      const { sql, initialDatabase: base } = get();
      try {
        const program = parse(sql);
        const { results, database } = evaluate(program, base);
        set({
          results,
          database,
          timeline: buildTimeline(results),
          error: null,
        });
        return true;
      } catch (e) {
        set((s) => ({
          status: "error",
          error: toSqlError(e),
          results: [],
          timeline: [],
          stageIndex: 0,
          highlightRange: null,
          highlightVersion: s.highlightVersion + 1,
          // 失敗した実行でデータを壊さない
          database: cloneDatabase(base),
        }));
        return false;
      }
    };

    return {
      sql: initialSql,
      setSql: (sql) => set({ sql }),

      datasetKey,
      initialDatabase,
      database: cloneDatabase(initialDatabase),

      status: "idle",
      error: null,
      results: [],
      timeline: [],
      stageIndex: 0,
      highlightRange: null,
      highlightVersion: 0,

      run: () => {
        if (!execute()) return;
        set((s) => ({
          status: "result",
          stageIndex: Math.max(0, s.timeline.length - 1),
          highlightRange: null,
          highlightVersion: s.highlightVersion + 1,
        }));
      },

      startStepping: () => {
        if (!execute()) return;
        set((s) => ({
          status: s.timeline.length > 0 ? "stepping" : "result",
          stageIndex: 0,
          highlightRange: s.timeline[0]?.stage.clauseRange ?? null,
          highlightVersion: s.highlightVersion + 1,
        }));
      },

      next: () => {
        set((s) => {
          if (s.status !== "stepping") return s;
          const index = Math.min(s.stageIndex + 1, s.timeline.length - 1);
          return {
            stageIndex: index,
            highlightRange: s.timeline[index]?.stage.clauseRange ?? null,
            highlightVersion: s.highlightVersion + 1,
          };
        });
      },

      prev: () => {
        set((s) => {
          if (s.status !== "stepping") return s;
          const index = Math.max(s.stageIndex - 1, 0);
          return {
            stageIndex: index,
            highlightRange: s.timeline[index]?.stage.clauseRange ?? null,
            highlightVersion: s.highlightVersion + 1,
          };
        });
      },

      reset: () => {
        set((s) => ({
          status: "idle",
          error: null,
          results: [],
          timeline: [],
          stageIndex: 0,
          database: cloneDatabase(s.initialDatabase),
          highlightRange: null,
          highlightVersion: s.highlightVersion + 1,
        }));
      },

      selectDataset: (key, options) => {
        const next = findDataset(key).build();
        set((s) => ({
          datasetKey: key,
          initialDatabase: next,
          database: cloneDatabase(next),
          sql: options?.keepSql ? s.sql : (datasetInitialSql[key] ?? s.sql),
          status: "idle",
          error: null,
          results: [],
          timeline: [],
          stageIndex: 0,
          highlightRange: null,
          highlightVersion: s.highlightVersion + 1,
        }));
      },

      insertText: (text) => editorInsertRef.current?.(text),
      editorInsertRef,
    };
  });
}

const SqlPlaygroundContext = createContext<ReturnType<
  typeof createSqlPlaygroundStore
> | null>(null);

export function SqlPlaygroundProvider({
  children,
  initialSql,
  datasetKey,
}: {
  children: ReactNode;
  initialSql: string;
  /**
   * 表の実体ではなくキーを受け取る。サーバから Database を丸ごと渡すと
   * RSC のペイロードに載るうえ、データセットの切り替えができなくなる。
   */
  datasetKey: DatasetKey;
}) {
  const storeRef = useRef<ReturnType<typeof createSqlPlaygroundStore> | null>(
    null,
  );
  if (!storeRef.current) {
    storeRef.current = createSqlPlaygroundStore(initialSql, datasetKey);
  }
  return (
    <SqlPlaygroundContext.Provider value={storeRef.current}>
      {children}
    </SqlPlaygroundContext.Provider>
  );
}

export function useSqlPlayground<T>(selector: (s: SqlPlaygroundState) => T): T {
  const store = useContext(SqlPlaygroundContext);
  if (!store) {
    throw new Error(
      "useSqlPlayground は SqlPlaygroundProvider の中で使ってください",
    );
  }
  return useStore(store, selector);
}
