"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { lineNumbers } from "@codemirror/view";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Database, Stage, StatementResult } from "@/lib/sql";
import { datasets, type DatasetKey } from "@/content/fe/sql/datasets";
import { sqlLanguage } from "./sqlLanguage";
import {
  SqlPlaygroundProvider,
  useSqlPlayground,
  type SqlError,
  type TimelineEntry,
} from "./sqlPlaygroundStore";
import { ResultTableView, ValueCell } from "./ResultTableView";
import { DiffTableView } from "./DiffTableView";
import {
  EditorFallback,
  EditorFallbackProvider,
} from "@/components/playground/EditorFallback";

const EDITOR_EXTENSIONS = [lineNumbers(), sqlLanguage];

const CodeEditor = dynamic(
  () => import("@/components/playground/CodeEditor").then((m) => m.CodeEditor),
  {
    ssr: false,
    // 初期 SQL をそのまま出す。ここが空だと、レッスン本文が「試す: …」と
    // 指している当の SQL が初期 HTML に残らない
    // (docs/wip/20260828-seo-aeo-review/00-review.md §2)。
    // minHeight は下の <CodeEditor> と同じ値にする (CLS 対策)
    loading: () => <EditorFallback minHeight="180px" />,
  },
);

export function SqlPlayground({
  initialSql,
  datasetKey,
  /** レッスンに埋め込むときの縮小版。表の一覧を初期状態で畳み、表の切り替えも出さない */
  compact = false,
  /** ストアの中に差し込む要素。`?sql=` の適用など store を触るものを置く */
  children,
}: {
  initialSql: string;
  datasetKey: DatasetKey;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <SqlPlaygroundProvider initialSql={initialSql} datasetKey={datasetKey}>
      <EditorFallbackProvider code={initialSql}>
        {children}
        <SqlPlaygroundInner compact={compact} />
      </EditorFallbackProvider>
    </SqlPlaygroundProvider>
  );
}

function SqlPlaygroundInner({ compact }: { compact: boolean }) {
  const sql = useSqlPlayground((s) => s.sql);
  const setSql = useSqlPlayground((s) => s.setSql);
  const status = useSqlPlayground((s) => s.status);
  const error = useSqlPlayground((s) => s.error);
  const highlightRange = useSqlPlayground((s) => s.highlightRange);
  const highlightVersion = useSqlPlayground((s) => s.highlightVersion);
  const run = useSqlPlayground((s) => s.run);
  const stepForward = useSqlPlayground((s) => s.stepForward);
  const stepBack = useSqlPlayground((s) => s.stepBack);
  const reset = useSqlPlayground((s) => s.reset);
  const editorInsertRef = useSqlPlayground((s) => s.editorInsertRef);
  const stageIndex = useSqlPlayground((s) => s.stageIndex);
  const timelineLength = useSqlPlayground((s) => s.timeline.length);

  const stepping = status === "stepping";
  const atStart = !stepping || stageIndex === 0;
  const atEnd = stepping && stageIndex === timelineLength - 1;

  return (
    <div className="not-prose">
      {!compact && <DatasetPicker />}

      {/* 「開始」と「送り」を分けない。一つ進めるを押し続けるだけで段階を追える */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={run}>
          ▶ 実行
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={stepBack}
          disabled={atStart}
        >
          ← 一つ戻る
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={stepForward}
          disabled={atEnd}
        >
          一つ進める →
        </Button>
        <Button variant="secondary" size="sm" onClick={reset}>
          ⟲ リセット
        </Button>
        <span className="text-xs text-[var(--muted-foreground)]">
          リセットで表の中身も元に戻ります
        </span>
      </div>

      <div className="mt-3">
        <CodeEditor
          extensions={EDITOR_EXTENSIONS}
          value={sql}
          onChange={setSql}
          highlightRange={highlightRange}
          highlightVersion={highlightVersion}
          minHeight="180px"
          onReady={({ insertText }) => {
            editorInsertRef.current = insertText;
          }}
        />
      </div>

      {error && <SqlErrorBox error={error} />}

      {status === "stepping" && <StageStepper />}
      {status === "result" && <FinalResults />}

      <SchemaPanel defaultOpen={!compact} />
    </div>
  );
}

/* ---------------- 使う表の切り替え ---------------- */

function DatasetPicker() {
  const datasetKey = useSqlPlayground((s) => s.datasetKey);
  const selectDataset = useSqlPlayground((s) => s.selectDataset);
  const active = datasets.find((d) => d.key === datasetKey);

  return (
    <div className="mb-3">
      <div
        role="group"
        aria-label="使う表"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-bold text-[var(--muted-foreground)]">
          使う表
        </span>
        {datasets.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => selectDataset(d.key)}
            aria-pressed={d.key === datasetKey}
            className={cn(
              "cursor-pointer rounded border px-2.5 py-1 text-xs font-bold transition-colors",
              d.key === datasetKey
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60",
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
      {active && (
        <p
          className="mt-1.5 text-xs text-[var(--muted-foreground)]"
          style={{ textWrap: "pretty" }}
        >
          {active.summary}
        </p>
      )}
    </div>
  );
}

/* ---------------- 段階を追う ---------------- */

/**
 * 評価の段階。
 *
 * **送りのボタンはここに置かない** — ツールバーに集約してある。ここが持つのは
 * 「今どこにいて、何がまだ残っているか」の可視化だけ。
 * `SELECT` がまだ先にあることが目で見えること自体がこのツールの主張なので、
 * 進捗を `3 / 6` のような数字に落とさず、段階そのものを並べる。
 */
function StageStepper() {
  const timeline = useSqlPlayground((s) => s.timeline);
  const stageIndex = useSqlPlayground((s) => s.stageIndex);
  const goToStage = useSqlPlayground((s) => s.goToStage);

  const entry: TimelineEntry | undefined = timeline[stageIndex];
  if (!entry) return null;

  return (
    <section
      aria-label="段階の実行"
      className="mt-4 rounded-lg border border-[var(--border)] p-4"
    >
      <ol className="flex flex-wrap gap-1.5" aria-label="評価の段階">
        {timeline.map((t, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => goToStage(i)}
              aria-current={i === stageIndex ? "step" : undefined}
              title={t.stage.label}
              className={cn(
                "cursor-pointer rounded border px-2 py-0.5 text-[11px] font-bold transition-colors",
                i === stageIndex
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                  : i < stageIndex
                    ? "border-[var(--border-strong)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] opacity-60 hover:opacity-100 hover:bg-[var(--muted)]",
              )}
            >
              {stageKindLabel(t.stage.kind)}
            </button>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm font-bold" style={{ textWrap: "pretty" }}>
        {entry.statementLabel && (
          <span className="mr-2 font-normal text-[var(--muted-foreground)]">
            {entry.statementLabel}
          </span>
        )}
        {entry.stage.label}
      </p>

      <div className="mt-3">
        <StageBody stage={entry.stage} />
      </div>
    </section>
  );
}

function StageBody({ stage }: { stage: Stage }) {
  // GROUP BY / HAVING の段階は「行の集合」ではなく「グループの集合」として見せる。
  // WHERE と HAVING の違いが腹落ちするのはここだけなので、専用の見せ方をする
  if (stage.groups) {
    if (stage.groups.length === 0) {
      return (
        <p className="text-sm text-[var(--muted-foreground)]">
          条件を満たすグループはありません（0 グループ）
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {stage.groups.map((group, gi) => (
          <div
            key={gi}
            className="rounded border border-[var(--border-strong)] p-3"
          >
            <div className="mb-2 text-xs font-bold">
              {group.key.length === 0 ? (
                <span>表全体（1 グループ）</span>
              ) : (
                group.key.map((k, ki) => (
                  <span key={ki} className="mr-3">
                    <span className="text-[var(--muted-foreground)] font-normal">
                      {k.column} ={" "}
                    </span>
                    <span className="font-mono">
                      <ValueCell value={k.value} />
                    </span>
                  </span>
                ))
              )}
              <span className="ml-1 font-normal text-[var(--muted-foreground)]">
                — {group.rows.length} 行
              </span>
            </div>
            <ResultTableView columns={stage.table.columns} rows={group.rows} />
          </div>
        ))}
      </div>
    );
  }

  return <ResultTableView columns={stage.table.columns} rows={stage.table.rows} />;
}

function stageKindLabel(kind: Stage["kind"]): string {
  switch (kind) {
    case "from":
      return "FROM";
    case "join":
      return "JOIN";
    case "where":
      return "WHERE";
    case "group-by":
      return "GROUP BY";
    case "having":
      return "HAVING";
    case "select":
      return "SELECT";
    case "distinct":
      return "DISTINCT";
    case "order-by":
      return "ORDER BY";
    case "set-op":
      return "集合演算";
  }
}

/* ---------------- 最終結果 ---------------- */

function FinalResults() {
  const results = useSqlPlayground((s) => s.results);
  if (results.length === 0) return null;

  return (
    // 表の一覧にも同じ値が出るので、結果だけを一意に指せるよう region にする
    <section aria-label="実行結果" className="mt-4 space-y-4">
      {results.map((result, i) => (
        <ResultBlock
          key={i}
          result={result}
          label={results.length > 1 ? `${i + 1} 文目` : null}
        />
      ))}
    </section>
  );
}

function ResultBlock({
  result,
  label,
}: {
  result: StatementResult;
  label: string | null;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      {label && (
        <div className="mb-2 text-xs font-bold text-[var(--muted-foreground)]">
          {label}
        </div>
      )}
      {result.kind === "select" && (
        <ResultTableView
          columns={result.table.columns}
          rows={result.table.rows}
        />
      )}
      {result.kind === "dml" && (
        <>
          <p className="mb-2 text-sm font-bold">
            {result.op}: {result.affected} 行が対象
          </p>
          <DiffTableView diff={result.diff} tableName={result.table} />
        </>
      )}
      {result.kind === "ddl" && (
        <p className="text-sm">{result.message}</p>
      )}
    </div>
  );
}

/* ---------------- エラー ---------------- */

function SqlErrorBox({ error }: { error: SqlError }) {
  // 実行対象外の構文は「間違い」ではないので、赤で出さずに解説へ誘導する
  const isUnsupported = error.kind === "unsupported";

  return (
    <div
      role="alert"
      className={cn(
        "mt-4 rounded-lg border p-4 text-sm",
        isUnsupported
          ? "border-[var(--border-strong)] bg-[var(--muted)]/60"
          : "border-[#c53030] bg-[#fdecea]",
      )}
    >
      <p className="font-bold" style={{ textWrap: "pretty" }}>
        {error.message}
      </p>
      {error.hint && (
        <p
          className="mt-2 text-[var(--foreground)]"
          style={{ textWrap: "pretty" }}
        >
          {error.hint}
        </p>
      )}
      {isUnsupported && error.lessonPath && (
        <p className="mt-3">
          <Link
            href={error.lessonPath}
            className="font-bold underline underline-offset-4 hover:opacity-80"
          >
            この構文の解説を読む →
          </Link>
        </p>
      )}
    </div>
  );
}

/* ---------------- 表の一覧 ---------------- */

function SchemaPanel({ defaultOpen }: { defaultOpen: boolean }) {
  const database = useSqlPlayground((s) => s.database);
  const error = useSqlPlayground((s) => s.error);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-2 text-sm font-bold hover:opacity-80"
      >
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
        使える表 ({database.tables.length})
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {database.tables.map((table) => (
            <div key={table.schema.name}>
              <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm font-bold">
                  {table.schema.name}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {describeConstraints(table.schema.constraints)}
                </span>
              </div>
              <ResultTableView
                columns={table.schema.columns.map((c) => ({
                  name: c.name,
                  qualifier: null,
                }))}
                rows={table.rows}
                /* 違反した表にだけ印を付ける。表名を見ないと、在庫表の 3 行目で
                   落ちたときに商品表の 3 行目まで赤くなる */
                offendingRowIndex={
                  error?.offendingTable === table.schema.name
                    ? error.offendingRowIndex
                    : null
                }
                emptyMessage="この表にはまだ行がありません（0 行）"
              />
            </div>
          ))}
          {database.views.length > 0 && (
            <div className="text-xs text-[var(--muted-foreground)]">
              ビュー: {database.views.map((v) => v.name).join(" / ")}
              （実表ではないので、元の表が変わると内容も変わります）
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * 表に付いている制約の要約。
 *
 * **4 制約すべてを出す。** `ddl-constraints` レッスンが一意性・参照・検査・非NULL の
 * 4 つを教えるのに、画面には主キーと外部キーしか出ていないと、
 * 「CHECK に違反しました」と言われた学習者がその制約の存在を確認できない。
 */
function describeConstraints(
  constraints: Database["tables"][number]["schema"]["constraints"],
): string {
  const parts: string[] = [];
  const notNull: string[] = [];
  for (const c of constraints) {
    switch (c.kind) {
      case "PrimaryKey":
        parts.push(`主キー: ${c.columns.join(", ")}`);
        break;
      case "Unique":
        parts.push(`一意: ${c.columns.join(", ")}`);
        break;
      case "ForeignKey":
        parts.push(`${c.columns.join(", ")} → ${c.refTable}`);
        break;
      case "Check":
        parts.push(
          c.columns.length > 0 ? `検査: ${c.columns.join(", ")}` : "検査制約あり",
        );
        break;
      case "NotNull":
        notNull.push(c.column);
        break;
    }
  }
  if (notNull.length > 0) parts.push(`非NULL: ${notNull.join(", ")}`);
  return parts.join(" / ");
}
