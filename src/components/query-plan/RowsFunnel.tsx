import { VizFrame } from "@/components/viz/VizFrame";
import type { ExplainResult, PlanNode } from "@/lib/query-plan/types";

/**
 * 「読んだ行」と「返した行」の差＝**捨てた行**を、計画どうしで並べて見せる図。
 *
 * **なぜ図が要るか**: `index-cond-vs-filter` の主題は
 * 「`Index Cond` は読む行そのものを減らす / `Filter` は読んでから捨てる」だが、
 * 文章と `Rows Removed by Filter: 6667` という数字だけでは**量の差**が伝わらない（レビュー指摘）。
 * 棒の長さにすると、捨てている割合が一目で分かる。
 *
 * ★ 行数は**計画 JSON から計算する**。手で書くと採り直しでずれる
 *   （05-implementation-review.md §M-2）。
 *   読んだ行 = 返した行 + `Rows Removed by Filter`。
 */

/** 条件を評価しているノード（`Filter` か `Index Cond` を持つ最初のノード）を探す */
function conditionNode(plan: ExplainResult): PlanNode {
  let found: PlanNode | undefined;
  const walk = (n: PlanNode) => {
    if (!found && (n.Filter !== undefined || n["Index Cond"] !== undefined)) found = n;
    (n.Plans ?? []).forEach(walk);
  };
  walk(plan.Plan);
  return found ?? plan.Plan;
}

export type FunnelCase = { plan: ExplainResult; label: string };

const BAR_X = 150;
const BAR_W = 250;
const ROW_H = 58;

export function RowsFunnel({
  cases,
  title,
  legend,
}: {
  cases: FunnelCase[];
  title: string;
  legend?: React.ReactNode;
}) {
  const rows = cases.map((c) => {
    const n = conditionNode(c.plan);
    const returned = n["Actual Rows"] ?? 0;
    const removed = n["Rows Removed by Filter"] ?? 0;
    return { ...c, returned, removed, read: returned + removed };
  });
  const H = rows.length * ROW_H + 46;
  const fmt = (v: number) => Math.round(v).toLocaleString();

  return (
    <VizFrame title={title} legend={legend}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 560 ${H}`}
          className="h-auto w-full min-w-[520px]"
          role="img"
          aria-label={`${title}。読んだ行のうち何行を捨てているかを、計画ごとに割合で比べた図。`}
        >
          {rows.map((r, i) => {
            const y = i * ROW_H + 20;
            // ★ 棒の長さは**そろえて割合で見せる**。行数の絶対値でスケールすると
            //    201 行のケースが 10,000 行の隣で潰れて、肝心の割合が読めない。
            //    本文も「返した行数と並べて見る」と割合で語っている。
            const keep = r.read === 0 ? 0 : (r.returned / r.read) * BAR_W;
            const pct = r.read === 0 ? 0 : Math.round((r.removed / r.read) * 100);
            return (
              <g key={r.label}>
                <text x={0} y={y + 18} fontSize="12" fontWeight="700" fill="var(--foreground)">
                  {r.label}
                </text>

                {/* 返した行（濃い）＋ 読んだのに捨てた行（薄い） */}
                <rect x={BAR_X} y={y} width={keep} height={26} fill="var(--foreground)" />
                <rect
                  x={BAR_X + keep}
                  y={y}
                  width={Math.max(BAR_W - keep, 0)}
                  height={26}
                  fill="var(--muted)"
                  stroke="var(--border-strong)"
                  strokeWidth="1"
                />
                <text x={BAR_X + BAR_W + 10} y={y + 12} fontSize="11" fill="var(--foreground)">
                  {`読んだ ${fmt(r.read)} → 返した ${fmt(r.returned)}`}
                </text>
                <text x={BAR_X + BAR_W + 10} y={y + 26} fontSize="11" fill="var(--muted-foreground)">
                  {r.removed > 0 ? `うち ${fmt(r.removed)} を捨てた（${pct}%）` : "捨てた行なし"}
                </text>
              </g>
            );
          })}

          <rect x={BAR_X} y={H - 26} width={14} height={12} fill="var(--foreground)" />
          <text x={BAR_X + 20} y={H - 16} fontSize="11" fill="var(--muted-foreground)">
            返した行
          </text>
          <rect
            x={BAR_X + 80}
            y={H - 26}
            width={14}
            height={12}
            fill="var(--muted)"
            stroke="var(--border-strong)"
          />
          <text x={BAR_X + 100} y={H - 16} fontSize="11" fill="var(--muted-foreground)">
            読んだのに捨てた行（Rows Removed by Filter）
          </text>
        </svg>
      </div>
    </VizFrame>
  );
}
