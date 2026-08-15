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

const EDITOR_EXTENSIONS = [lineNumbers(), sqlLanguage];

function EditorSkeleton() {
  return (
    <div className="h-[300px] rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 font-mono text-sm text-[var(--muted-foreground)]">
      エディタを読み込み中…
    </div>
  );
}

const CodeEditor = dynamic(
  () => import("@/components/playground/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
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
      {children}
      <SqlPlaygroundInner compact={compact} />
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
  const startStepping = useSqlPlayground((s) => s.startStepping);
  const reset = useSqlPlayground((s) => s.reset);
  const editorInsertRef = useSqlPlayground((s) => s.editorInsertRef);

  return (
    <div className="not-prose">
      {!compact && <DatasetPicker />}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={run}>
          ▶ 実行
        </Button>
        <Button variant="primary" size="sm" onClick={startStepping}>
          段階を追う
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

function StageStepper() {
  const timeline = useSqlPlayground((s) => s.timeline);
  const stageIndex = useSqlPlayground((s) => s.stageIndex);
  const next = useSqlPlayground((s) => s.next);
  const prev = useSqlPlayground((s) => s.prev);

  const entry: TimelineEntry | undefined = timeline[stageIndex];
  if (!entry) return null;

  const atStart = stageIndex === 0;
  const atEnd = stageIndex === timeline.length - 1;

  return (
    <section
      aria-label="段階の実行"
      className="mt-4 rounded-lg border border-[var(--border)] p-4"
    >
      <h3 className="text-sm font-bold">評価の段階</h3>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        SQL は書いた順ではなく、この順で評価されます。SELECT は最後です。
      </p>

      <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="評価の段階">
        {timeline.map((t, i) => (
          <li key={i}>
            <span
              aria-current={i === stageIndex ? "step" : undefined}
              className={cn(
                "inline-block rounded border px-2 py-0.5 text-[11px] font-bold",
                i === stageIndex
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                  : i < stageIndex
                    ? "border-[var(--border-strong)] text-[var(--muted-foreground)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] opacity-60",
              )}
            >
              {stageKindLabel(t.stage.kind)}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={prev} disabled={atStart}>
          ← 前へ
        </Button>
        <Button variant="primary" size="sm" onClick={next} disabled={atEnd}>
          次へ →
        </Button>
        <span className="text-xs text-[var(--muted-foreground)]">
          {stageIndex + 1} / {timeline.length}
          {entry.statementLabel && ` (${entry.statementLabel})`}
        </span>
      </div>

      <p className="mt-3 text-sm font-bold" style={{ textWrap: "pretty" }}>
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
                offendingRowIndex={error?.offendingRowIndex ?? null}
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

function describeConstraints(
  constraints: Database["tables"][number]["schema"]["constraints"],
): string {
  const parts: string[] = [];
  for (const c of constraints) {
    if (c.kind === "PrimaryKey") parts.push(`主キー: ${c.columns.join(", ")}`);
    if (c.kind === "ForeignKey") {
      parts.push(`${c.columns.join(", ")} → ${c.refTable}`);
    }
  }
  return parts.join(" / ");
}
