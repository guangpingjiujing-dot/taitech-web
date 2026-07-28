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
  /** 「本来 (前提から期待される状態) / 現在 (壊れた Excel の値)」の対比。答え合わせで表示 */
  expectedVsActual: string;
  concept: string;
  href?: string;
};

const ANOMALIES: Anomaly[] = [
  {
    id: "stock-not-decremented",
    number: 1,
    hintLabel: "商品シートの在庫と、注文シートの受注件数を突き合わせる",
    answerTitle: "注文が入ったのに在庫が減算されていない",
    expectedVsActual:
      "本来: P-042 座布団は 12 - 5 件 = 7 のはず / 現在: 12 (減算が一度も反映されていない)",
    concept: "原子性 (atomicity)",
    href: "/why-need-rdb/atomicity",
  },
  {
    id: "dup-order",
    number: 2,
    hintLabel: "注文 ID が本当に一意になっているか",
    answerTitle: "同一注文 ID が重複、Lost Update の痕跡",
    expectedVsActual:
      "本来: 注文 ID は自動採番で 1 つの ID = 1 行のはず / 現在: ORD-001 が 2 行 (金額も異なる)",
    concept: "同時実行制御 (concurrency control)",
    href: "/why-need-rdb/concurrency",
  },
  {
    id: "same-name",
    number: 3,
    hintLabel:
      "新規登録 3 件が「重複登録の可能性」として弾かれる仕組みがあるか (同名自体は問題ではない)",
    answerTitle:
      "email に UNIQUE 制約と CHECK 形式検証が無く、同一人物の再登録と別人の登録を DB 側から区別できない",
    expectedVsActual:
      "本来: identifying 属性 (email) に UNIQUE + CHECK があれば、C-001 (yamada@example.com) の再訪なら 2 回目挿入は拒否、`n/a` 等のゴミ email も CHECK で弾ける / 現在: ゴミ email で 3 件全て通過、C-001 の再訪か別 3 名か判定不能",
    concept: "一意性 (uniqueness) — 意味のある UNIQUE は識別属性に掛ける",
    href: "/why-need-rdb/uniqueness",
  },
  {
    id: "orphan-fk",
    number: 4,
    hintLabel: "注文シートの顧客 ID を、顧客シートで実際に引けるか",
    answerTitle: "顧客 ID `C-999` の孤立参照",
    expectedVsActual:
      "本来: C-999 の退会処理で、注文の C-999 参照も CASCADE 削除 or 履歴化されるはず / 現在: 顧客シートから C-999 が消えたのに、注文 ORD-002 だけが C-999 参照のまま残り #N/A",
    concept: "参照整合性 (referential integrity)",
    href: "/why-need-rdb/referential-integrity",
  },
  {
    id: "resurrected",
    number: 5,
    hintLabel: "注文シートの日付を確認、削除済みのはずの行が混じっていないか",
    answerTitle: "削除された 2024-03-15 の注文が復活",
    expectedVsActual:
      "本来: 2024-03-15 の注文は先月削除済みで、当日の Excel には現れないはず / 現在: 「最終保存」タイムスタンプの不整合で復活し、注文シートの最下行に紛れ込んでいる",
    concept: "永続性 (durability)",
    href: "/why-need-rdb/durability",
  },
  {
    id: "invalid-email",
    number: 6,
    hintLabel: "顧客シートのメール列を眺める",
    answerTitle: "メール列に `n/a` `unknown` `-` の混在",
    expectedVsActual:
      "本来: 登録フォームで RFC 準拠のメール形式を検証し、未入力なら NULL のはず / 現在: 文字列型の列にゴミデータが混在 (CHECK / NOT NULL 制約が無い)",
    concept: "CHECK / NOT NULL 制約 (本シリーズ scope 外)",
  },
  {
    id: "sum-mismatch",
    number: 7,
    hintLabel: "合計金額の計算を手で検算する",
    answerTitle: "合計金額の集約ミス",
    expectedVsActual:
      "本来: $9.99 × 3 = $29.97 のはず / 現在: $30.00 (手計算で四捨五入)。SQL の SUM ならこの誤りは起きない",
    concept: "SQL の宣言的集約 (本シリーズ scope 外)",
  },
];

type Mode = "initial" | "hint" | "reveal";

export function BrokenExcelAnomalyList() {
  const [mode, setMode] = useState<Mode>("initial");
  const highlightIds =
    mode === "reveal" ? ANOMALIES.map((a) => a.id) : [];

  return (
    <div className="my-8">
      <InitialStateSnapshot />
      <div
        aria-hidden
        className="my-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]"
      >
        <span className="mx-3">
          ↓ 現在 (After) — 当日終業時の Excel、期待とズレている 7 箇所を探せ
        </span>
      </div>

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
        <ol className="mt-6 space-y-4 border-l-2 border-[var(--border)] pl-6">
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
                  <div className="mt-1.5 text-xs text-[var(--foreground)]/90 leading-relaxed">
                    {a.expectedVsActual}
                  </div>
                  <div className="mt-1.5 text-xs text-[var(--muted-foreground)]">
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

/**
 * 常時表示する「前 (Before)」パネル。
 * 前日終業時の初期状態と、当日発生した操作を table 形式で明示することで、
 * 読者が「現在の Excel」を puzzle として解けるようにする (context 無しでは
 * どれが anomaly か決定的に言えないため)。
 */
function InitialStateSnapshot() {
  return (
    <div className="border-2 border-dashed border-[var(--border-strong)] bg-[var(--muted)]/30 p-4 md:p-6">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
        前 (Before) — 前日終業時の初期状態と当日発生した操作
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: initial tables */}
        <div className="space-y-4">
          <MiniTable
            title="商品シート (前日終業時)"
            columns={["商品ID", "商品名", "在庫"]}
            rightAlignCols={[2]}
            rows={[
              ["P-042", "プレミアム座布団", "12"],
              ["P-018", "竹製箸", "42"],
            ]}
          />

          <MiniTable
            title="顧客シート (前日終業時、抜粋)"
            columns={["顧客ID", "名前", "メール"]}
            rows={[
              ["C-001", "山田太郎", "yamada@example.com"],
              ["C-002", "佐藤花子", "sato@example.com"],
              ["C-999", "山田太郎", "taro@example.com"],
            ]}
            note="※ C-001 と C-999 は同姓同名の別人 (実在の顧客)。他にも複数顧客が登録済み"
          />

          <div>
            <div className="text-xs font-bold text-[var(--foreground)]">
              注文シート (前日終業時)
            </div>
            <div className="mt-1 border border-dashed border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)] italic">
              前日締切後、当日分は空。過去 (2024-03-15) の削除済み注文は復元されない前提。
            </div>
          </div>
        </div>

        {/* Right: events */}
        <div>
          <div className="text-xs font-bold text-[var(--foreground)]">
            当日発生した業務イベント
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-[var(--foreground)]/90 leading-relaxed">
            <li>
              <span className="font-mono">P-042</span> 座布団の受注{" "}
              <strong>5 件</strong> (各 qty 1、合計 5 units)
            </li>
            <li>
              <span className="font-mono">P-018</span> 竹製箸の受注{" "}
              <strong>2 件</strong> (qty 2 + 3 = 5 units)
            </li>
            <li>
              <span className="font-mono">C-999</span> の退会処理 (削除)
            </li>
            <li>
              新規顧客登録 <strong>3 件</strong> (C-011 / C-012 / C-013、
              いずれも「山田太郎」を名乗る)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MiniTable({
  title,
  columns,
  rows,
  note,
  rightAlignCols = [],
}: {
  title: string;
  columns: string[];
  rows: string[][];
  note?: string;
  rightAlignCols?: number[];
}) {
  const rightSet = new Set(rightAlignCols);
  return (
    <div>
      <div className="text-xs font-bold text-[var(--foreground)]">{title}</div>
      <div className="mt-1 overflow-x-auto border border-[var(--border-strong)] bg-[var(--card)]">
        <table className="min-w-full font-mono text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-3 py-1 font-bold text-[var(--foreground)]",
                    rightSet.has(i) ? "text-right" : "text-left",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-3 py-1",
                      rightSet.has(j) ? "text-right" : "text-left",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && (
        <div className="mt-1 text-[10px] text-[var(--muted-foreground)] leading-relaxed">
          {note}
        </div>
      )}
    </div>
  );
}
