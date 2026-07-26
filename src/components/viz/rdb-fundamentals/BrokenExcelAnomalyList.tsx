"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrokenExcel, type AnomalyId } from "./BrokenExcel";

type Anomaly = {
  id: AnomalyId;
  number: number;
  hintLabel: string;
  answerTitle: string;
  concept: string;
  href?: string;
};

const ANOMALIES: Anomaly[] = [
  {
    id: "stock-neg",
    number: 1,
    hintLabel: "商品シートの在庫列で何かがおかしい",
    answerTitle: "在庫が -1 個",
    concept: "原子性 (atomicity)",
    href: "/why-need-rdb/atomicity",
  },
  {
    id: "dup-order",
    number: 2,
    hintLabel: "同じ注文 ID の行が 2 つあり、金額が違う",
    answerTitle: "同一注文 ID が重複、Lost Update の痕跡",
    concept: "同時実行制御 (concurrency control)",
    href: "/why-need-rdb/concurrency",
  },
  {
    id: "same-name",
    number: 3,
    hintLabel: "顧客名「山田太郎」の行が 3 つある",
    answerTitle: "同名 3 人問題",
    concept: "一意性 (uniqueness)",
    href: "/why-need-rdb/uniqueness",
  },
  {
    id: "orphan-fk",
    number: 4,
    hintLabel: "注文シートの顧客 ID が顧客シートに存在しない",
    answerTitle: "顧客 ID `C-999` の孤立参照 (#N/A)",
    concept: "参照整合性 (referential integrity)",
    href: "/why-need-rdb/referential-integrity",
  },
  {
    id: "resurrected",
    number: 5,
    hintLabel: "削除したはずの過去の注文が残っている",
    answerTitle: "最終保存タイムスタンプの不整合で復活した行",
    concept: "永続性 (durability)",
    href: "/why-need-rdb/durability",
  },
  {
    id: "invalid-email",
    number: 6,
    hintLabel: "メール列に文字列にならないゴミデータが並ぶ",
    answerTitle: "`n/a` `unknown` `-` の混在",
    concept: "CHECK / NOT NULL 制約 (v2 で解説予定)",
  },
  {
    id: "sum-mismatch",
    number: 7,
    hintLabel: "$9.99 × 3 の手計算結果が四捨五入で $30.00 になっている",
    answerTitle: "手計算の集約ミス",
    concept: "SQL の宣言的集約 (v2 で解説予定)",
  },
];

type Mode = "initial" | "hint" | "reveal";

export function BrokenExcelAnomalyList() {
  const [mode, setMode] = useState<Mode>("initial");
  const highlightIds =
    mode === "reveal" ? ANOMALIES.map((a) => a.id) : [];

  return (
    <div className="my-8">
      <BrokenExcel highlightIds={highlightIds} />

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMode(mode === "hint" ? "initial" : "hint")}
          aria-pressed={mode === "hint"}
          className={cn(
            "inline-flex items-center gap-2 border px-4 py-2 text-sm font-bold transition-colors",
            mode === "hint"
              ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
              : "border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--muted)]",
          )}
        >
          {mode === "hint" ? "ヒントを隠す" : "ヒントを見る"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "reveal" ? "initial" : "reveal")}
          aria-pressed={mode === "reveal"}
          className={cn(
            "inline-flex items-center gap-2 border px-4 py-2 text-sm font-bold transition-colors",
            mode === "reveal"
              ? "border-[var(--wrong)] bg-[var(--wrong)] text-white"
              : "border-[var(--wrong)] text-[var(--wrong)] hover:bg-[var(--wrong-soft)]",
          )}
        >
          {mode === "reveal" ? "答え合わせを閉じる" : "全て答え合わせ"}
        </button>
      </div>

      {mode !== "initial" && (
        <ol className="mt-6 space-y-3 border-l-2 border-[var(--border)] pl-6">
          {ANOMALIES.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[calc(1.5rem+0.5rem)] top-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--wrong)] text-xs font-bold text-white">
                {a.number}
              </span>
              {mode === "hint" ? (
                <div className="text-sm text-[var(--foreground)]">
                  {a.hintLabel}
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-[var(--foreground)]">
                    {a.answerTitle}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                    RDB での名前:{" "}
                    <span className="font-bold text-[var(--foreground)]">
                      {a.concept}
                    </span>
                    {a.href && (
                      <>
                        {" — "}
                        <Link
                          href={a.href}
                          className="underline underline-offset-2 hover:text-[var(--foreground)]"
                        >
                          詳しく見る →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
