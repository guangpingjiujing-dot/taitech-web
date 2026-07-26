import { VizFrame } from "@/components/viz/VizFrame";
import { cn } from "@/lib/utils";

export type LogEntry = {
  kind: "begin" | "op" | "commit" | "rollback" | "event";
  /** 表示テキスト (SQL 例や説明) */
  label: string;
  /** イベント (停電など) 用の補助説明 */
  note?: string;
  /** true にすると失われたステップ (灰色 + 打ち消し線) として描画 */
  lost?: boolean;
};

export type LogSequenceProps = {
  title: string;
  entries: LogEntry[];
  outcome: string;
  legend?: React.ReactNode;
};

/**
 * トランザクションログ / WAL の時系列を線形に表示する。
 * atomicity ページでは BEGIN..COMMIT の流れ、durability ページでは fsync と停電の対比に使う。
 */
export function LogSequence({
  title,
  entries,
  outcome,
  legend,
}: LogSequenceProps) {
  return (
    <VizFrame title={title} legend={legend}>
      <ol className="relative space-y-1 border-l-2 border-[var(--border)] pl-5">
        {entries.map((e, i) => (
          <li key={i} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[calc(1.25rem+0.5rem)] top-1.5 h-3 w-3 rounded-full border-2",
                markerStyle(e),
              )}
            />
            <div
              className={cn(
                "flex flex-col rounded-sm border px-3 py-2",
                entryStyle(e),
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block text-[9px] font-bold uppercase tracking-widest",
                    labelStyle(e.kind),
                  )}
                >
                  {kindLabel(e.kind)}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs",
                    e.lost && "text-[var(--muted-foreground)] line-through",
                  )}
                >
                  {e.label}
                </span>
              </div>
              {e.note && (
                <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  {e.note}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          結末
        </div>
        <div
          className={cn(
            "mt-1 text-sm font-bold",
            outcome.includes("成功") || outcome.includes("守られ")
              ? "text-[var(--correct)]"
              : "text-[var(--wrong)]",
          )}
        >
          {outcome}
        </div>
      </div>
    </VizFrame>
  );
}

function kindLabel(kind: LogEntry["kind"]): string {
  switch (kind) {
    case "begin":
      return "BEGIN";
    case "op":
      return "OP";
    case "commit":
      return "COMMIT";
    case "rollback":
      return "ROLLBACK";
    case "event":
      return "EVENT";
  }
}

function labelStyle(kind: LogEntry["kind"]): string {
  switch (kind) {
    case "begin":
    case "commit":
      return "text-[var(--correct)]";
    case "rollback":
      return "text-[var(--wrong)]";
    case "event":
      return "text-[var(--wrong)]";
    default:
      return "text-[var(--muted-foreground)]";
  }
}

function markerStyle(e: LogEntry): string {
  if (e.lost) return "border-[var(--border-strong)] bg-transparent";
  switch (e.kind) {
    case "begin":
    case "commit":
      return "border-[var(--correct)] bg-[var(--correct)]";
    case "rollback":
    case "event":
      return "border-[var(--wrong)] bg-[var(--wrong)]";
    default:
      return "border-[var(--border-strong)] bg-[var(--card)]";
  }
}

function entryStyle(e: LogEntry): string {
  if (e.lost) return "border-dashed border-[var(--border)] bg-transparent";
  if (e.kind === "event")
    return "border-[var(--wrong)] bg-[var(--wrong-soft)]";
  return "border-[var(--border-strong)] bg-[var(--card)]";
}
