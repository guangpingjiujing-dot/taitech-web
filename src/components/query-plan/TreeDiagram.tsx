import { VizFrame } from "@/components/viz/VizFrame";
import type { ExplainResult, PlanNode } from "@/lib/query-plan/types";

/**
 * 実行計画のテキストを**木の絵**にして、「表示の順」と「動く順」を並べて振る図。
 *
 * **なぜ図が要るか**: `read-tree` が「いちばん多い誤読」と呼んでいる
 * 「上から順に実行される」は、テキストのインデントが木だと分かっていないから起きる。
 * **文章で「いちばん深いところから」と言っても、木の絵が無いと像を結ばない**（レビュー指摘）。
 *
 * ★ ノード名は**計画 JSON から取る**。図に手で書くと採り直しでずれる
 *   （05-implementation-review.md §M-2「派生値は本文に書かず計算する」）。
 */

type Flat = {
  node: PlanNode;
  depth: number;
  /** テキストで上から何行目のノードか（1 始まり・補足行は数えない） */
  display: number;
  /** 実際に動く順番（1 始まり）。子が先に終わるので後行順 */
  exec: number;
  x: number;
  y: number;
};

const NODE_W = 150;
const NODE_H = 44;
const LEVEL_H = 86;
/** ★「表示 N」を箱の**上**に出すぶんの余白。箱の中に入れると長いノード名に重なる */
const TOP = 14;

/** 葉から順に x を配り、親は子の中点に置く（標準的な木レイアウト） */
function layout(root: PlanNode): { nodes: Flat[]; width: number } {
  const nodes: Flat[] = [];
  let display = 0;
  let exec = 0;
  let leaf = 0;

  const walk = (node: PlanNode, depth: number): Flat => {
    const d = ++display; // 前順 = テキストに並ぶ順
    const kids = node.Plans ?? [];
    const placed = kids.map((k) => walk(k, depth + 1));
    const e = ++exec; // 後順 = 動く順（子を全部置いたあとに採番）
    const x =
      placed.length === 0
        ? leaf++ * (NODE_W + 26) + NODE_W / 2
        : (placed[0].x + placed[placed.length - 1].x) / 2;
    const self: Flat = { node, depth, display: d, exec: e, x, y: depth * LEVEL_H + TOP };
    nodes.push(self);
    return self;
  };

  walk(root, 0);
  return { nodes, width: Math.max(leaf, 1) * (NODE_W + 26) };
}

/** ノードの見出し 2 行。`Index Scan using ... on members m` は図では長すぎる */
function caption(n: PlanNode): [string, string] {
  const rel = n["Relation Name"];
  const alias = n.Alias;
  const sub = rel ? (alias && alias !== rel ? `${rel} ${alias}` : rel) : "";
  return [n["Node Type"], sub];
}

export function TreeDiagram({
  plan,
  title,
  legend,
  showExec = false,
}: {
  plan: ExplainResult;
  title: string;
  legend?: React.ReactNode;
  /**
   * 「実際に動く順番」の丸を出すか。
   *
   * ★ **既定は false。**「子 → 親」は常に正しいが、**兄弟どうしの前後は結合方式で決まる**。
   *   `Hash Join` は 2 番目の子（`Hash`）を先に作り終えてから 1 番目の子を流すので、
   *   単純な後行順で採番すると `read-tree` 本文の「内側から動く」と矛盾する。
   *   `Nested Loop`（外側から 1 行取って内側を引く）のように
   *   **後行順が実際の順序と一致する計画でだけ true にすること。**
   */
  showExec?: boolean;
}) {
  const { nodes, width } = layout(plan.Plan);
  const depth = Math.max(...nodes.map((n) => n.depth));
  const W = Math.max(width + 120, 460);
  const H = depth * LEVEL_H + NODE_H + 54 + TOP;
  const byNode = new Map(nodes.map((n) => [n.node, n]));

  return (
    <VizFrame title={title} legend={legend}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          style={{ minWidth: Math.min(W, 520) }}
          role="img"
          aria-label={`${title}。テキストで上から N 行目のノードが、実際には別の順で動くことを示す木の図。`}
        >
          {/* 親子をつなぐ線。先に描いてノードの下に敷く */}
          {nodes.flatMap((p) =>
            (p.node.Plans ?? []).map((k, i) => {
              const c = byNode.get(k)!;
              return (
                <path
                  key={`${p.display}-${i}`}
                  d={`M ${p.x + 60} ${p.y + NODE_H} V ${p.y + NODE_H + 20} H ${c.x + 60} V ${c.y}`}
                  fill="none"
                  stroke="var(--border-strong)"
                  strokeWidth="1.4"
                />
              );
            }),
          )}

          {nodes.map((n) => {
            const [kind, sub] = caption(n.node);
            const isRoot = n.depth === 0;
            return (
              <g key={n.display}>
                <rect
                  x={n.x - 15}
                  y={n.y}
                  width={NODE_W}
                  height={NODE_H}
                  fill={isRoot ? "var(--primary-soft)" : "var(--card)"}
                  stroke="var(--foreground)"
                  strokeWidth={isRoot ? 1.8 : 1.2}
                />
                <text
                  x={n.x + 60}
                  y={n.y + (sub ? 19 : 27)}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="700"
                  fill="var(--foreground)"
                >
                  {kind}
                </text>
                {sub ? (
                  <text
                    x={n.x + 60}
                    y={n.y + 34}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    fill="var(--muted-foreground)"
                  >
                    {sub}
                  </text>
                ) : null}

                {/* ★ 箱の真上・左寄せ。箱の中だと長いノード名に、箱の左だと隣の箱に重なる */}
                <text
                  x={n.x - 15}
                  y={n.y - 4}
                  fontSize="9"
                  fill="var(--muted-foreground)"
                >
                  {`表示 ${n.display}`}
                </text>
                {showExec ? (
                  <>
                    <circle
                      cx={n.x + NODE_W - 6}
                      cy={n.y + NODE_H - 6}
                      r="11"
                      fill="var(--foreground)"
                    />
                    <text
                      x={n.x + NODE_W - 6}
                      y={n.y + NODE_H - 2}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="var(--primary-foreground)"
                    >
                      {n.exec}
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}

          <text x={0} y={showExec ? H - 26 : H - 12} fontSize="11" fill="var(--muted-foreground)">
            「表示 N」= テキストで上から N 行目のノード
          </text>
          {showExec ? (
            <text x={0} y={H - 8} fontSize="11" fill="var(--muted-foreground)">
              黒丸 = 実際に動く順番。いちばん深いところが 1 番、いちばん上が最後
            </text>
          ) : null}
        </svg>
      </div>
    </VizFrame>
  );
}
