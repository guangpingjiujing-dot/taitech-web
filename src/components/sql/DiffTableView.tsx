"use client";

import type { DiffTable } from "@/lib/sql";
import { cn } from "@/lib/utils";
import { ValueCell } from "./ResultTableView";

/**
 * DML の「実行前 → 実行後」の差分。
 *
 * SELECT の中間表と同じ見せ方にしないのは、INSERT / UPDATE / DELETE で
 * 効くのが「何行返ったか」ではなく **「表がどう変わったか」** だから
 * (docs/wip/20260815-fe-sql/00-overview.md §2-4)。
 * UPDATE は変わったセルだけを指し、変更前の値も併記する。
 */

const CHANGE_STYLE = {
  inserted: {
    row: "bg-[#eaf7ee]",
    badge: "追加",
    badgeClass: "bg-[#1f7a34] text-white",
  },
  deleted: {
    row: "bg-[#fdecea] line-through decoration-[var(--muted-foreground)]",
    badge: "削除",
    badgeClass: "bg-[#c53030] text-white",
  },
  updated: {
    row: "bg-[#fff8e1]",
    badge: "更新",
    badgeClass: "bg-[#8a6d00] text-white",
  },
  unchanged: { row: "", badge: "", badgeClass: "" },
} as const;

export function DiffTableView({
  diff,
  tableName,
}: {
  diff: DiffTable;
  tableName: string;
}) {
  const changed = diff.rows.filter((r) => r.change !== "unchanged").length;

  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-xs text-[var(--muted-foreground)]">
        表「{tableName}」— {changed} 行が変化
      </div>
      <div className="overflow-x-auto border border-[var(--border)] rounded">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/60">
              <th
                scope="col"
                className="w-14 whitespace-nowrap border-b border-[var(--border)] px-2 py-2 text-left text-xs font-bold"
              >
                <span className="sr-only">変化</span>
              </th>
              {diff.columns.map((c) => (
                <th
                  key={c.name}
                  scope="col"
                  className="whitespace-nowrap border-b border-[var(--border)] px-3 py-2 text-left text-xs font-bold"
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diff.rows.map((row, ri) => {
              const style = CHANGE_STYLE[row.change];
              return (
                <tr
                  key={ri}
                  className={cn(
                    "border-b border-[var(--border)] last:border-b-0",
                    style.row,
                  )}
                >
                  <td className="px-2 py-1.5 align-top">
                    {style.badge && (
                      <span
                        className={cn(
                          "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold",
                          style.badgeClass,
                        )}
                      >
                        {style.badge}
                      </span>
                    )}
                  </td>
                  {diff.columns.map((_, ci) => {
                    const isChanged = row.changedColumns?.includes(ci) ?? false;
                    return (
                      <td
                        key={ci}
                        className={cn(
                          "whitespace-nowrap px-3 py-1.5 align-top font-mono text-xs",
                          isChanged && "font-bold",
                        )}
                      >
                        {isChanged && row.before ? (
                          <span className="flex items-baseline gap-1.5">
                            <span className="text-[var(--muted-foreground)] line-through font-normal">
                              <ValueCell value={row.before[ci]} />
                            </span>
                            <span aria-hidden="true">→</span>
                            <span>
                              <ValueCell value={row.values[ci]} />
                            </span>
                          </span>
                        ) : (
                          <ValueCell value={row.values[ci]} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
