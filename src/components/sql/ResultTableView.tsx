"use client";

import { formatValue, type ResultColumn, type SqlValue } from "@/lib/sql";
import { cn } from "@/lib/utils";

/**
 * 結果表・中間表の表示。
 *
 * 横に広い表は **自分の中でスクロールさせる**。body ごと横に溢れると
 * モバイルでページ全体が横スクロールする (AGENTS.md)。
 */
export function ResultTableView({
  columns,
  rows,
  /** 制約違反した行を指す。エラー文言だけで終わらせないため */
  offendingRowIndex = null,
  emptyMessage = "該当する行はありません（0 行）",
  caption,
}: {
  columns: ResultColumn[];
  rows: SqlValue[][];
  offendingRowIndex?: number | null;
  emptyMessage?: string;
  caption?: string;
}) {
  if (columns.length === 0) {
    return <p className="text-sm text-[var(--muted-foreground)]">{emptyMessage}</p>;
  }

  return (
    <div className="min-w-0">
      {caption && (
        <div className="mb-1.5 text-xs text-[var(--muted-foreground)]">
          {caption}
        </div>
      )}
      <div className="overflow-x-auto border border-[var(--border)] rounded">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/60">
              {columns.map((c, i) => (
                <th
                  key={`${c.qualifier ?? ""}.${c.name}.${i}`}
                  scope="col"
                  className="whitespace-nowrap border-b border-[var(--border)] px-3 py-2 text-left text-xs font-bold"
                >
                  {c.qualifier ? (
                    <>
                      <span className="text-[var(--muted-foreground)] font-normal">
                        {c.qualifier}.
                      </span>
                      {c.name}
                    </>
                  ) : (
                    c.name
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={cn(
                    "border-b border-[var(--border)] last:border-b-0",
                    ri === offendingRowIndex && "bg-[#fdecea]",
                  )}
                >
                  {columns.map((_, ci) => (
                    <td
                      key={ci}
                      className="whitespace-nowrap px-3 py-1.5 font-mono text-xs"
                    >
                      <ValueCell value={row[ci] ?? null} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="mt-1.5 text-xs text-[var(--muted-foreground)]">
          {rows.length} 行
        </div>
      )}
    </div>
  );
}

/** NULL は空欄にしない。空文字列と見分けが付かなくなる */
export function ValueCell({ value }: { value: SqlValue }) {
  if (value === null) {
    return (
      <span className="text-[var(--muted-foreground)] italic">NULL</span>
    );
  }
  return <>{formatValue(value)}</>;
}
