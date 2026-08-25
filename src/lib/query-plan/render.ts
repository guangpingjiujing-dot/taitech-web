import type { ExplainResult, PlanNode } from "./types";
import { nodeLabel } from "./analyze";

/**
 * `EXPLAIN (FORMAT JSON)` の出力を psql のテキスト形式に描画する。
 *
 * **なぜ描画するのか。** サイトが持つ正は JSON（1 つの run）だが、記事に見せるのは psql の
 * テキスト。テキストを別に採ると**別 run の数値が混ざり、読者が引き算しても合わなくなる**。
 * JSON から描くことで「記事の本文 = サイトのデータ = 同一 run」を構造的に保証する。
 *
 * 仕様の一次情報は `docs/wip/20260818-explain/capture/render-plan.py`（psql の出力と
 * 突き合わせて検証済み。時刻とバッファ以外は完全一致）。
 */

/** psql のインデント: 深さ d のノード行 = 空白 6d-3 + "->  "、補足行 = 空白 6d+3 */
const nodeIndent = (d: number) => (d === 0 ? " " : " ".repeat(6 * d - 3) + "->  ");
const detailIndent = (d: number) => " ".repeat(6 * d + 3);

function costs(n: PlanNode): string {
  const parts: string[] = [];
  parts.push(
    `(cost=${n["Startup Cost"].toFixed(2)}..${n["Total Cost"].toFixed(2)}` +
      ` rows=${n["Plan Rows"]} width=${n["Plan Width"]})`,
  );
  if (n["Actual Total Time"] !== undefined) {
    // ★ PostgreSQL 18 は actual rows を小数 2 桁で出す
    parts.push(
      `(actual time=${n["Actual Startup Time"]!.toFixed(3)}..${n["Actual Total Time"].toFixed(3)}` +
        ` rows=${n["Actual Rows"]!.toFixed(2)} loops=${n["Actual Loops"]})`,
    );
  }
  return parts.join(" ");
}

/** ノード直下に出る補足行。psql の出力順に合わせてある */
function details(n: PlanNode): string[] {
  const out: string[] = [];
  const put = (key: keyof PlanNode, fmt: (v: string) => string) => {
    const v = n[key];
    if (v === undefined) return;
    out.push(fmt(Array.isArray(v) ? v.join(", ") : String(v)));
  };
  // ★ 順序は psql (`explain.c`) に合わせる。結合ノードでは
  //   Hash/Merge Cond → Join Filter → Rows Removed by Join Filter → Filter → Rows Removed by Filter。
  //   いま持っている計画に `Join Filter` は 1 つも無いので出力は変わらないが、
  //   非等値結合を採った瞬間に読者の手元と 1 行ずれる（06-content-review.md C4）。
  put("Hash Cond", (v) => `Hash Cond: ${v}`);
  put("Merge Cond", (v) => `Merge Cond: ${v}`);
  put("Join Filter", (v) => `Join Filter: ${v}`);
  put("Rows Removed by Join Filter", (v) => `Rows Removed by Join Filter: ${v}`);
  put("Index Cond", (v) => `Index Cond: ${v}`);
  put("Recheck Cond", (v) => `Recheck Cond: ${v}`);
  put("Filter", (v) => `Filter: ${v}`);
  put("Rows Removed by Filter", (v) => `Rows Removed by Filter: ${v}`);
  put("Heap Fetches", (v) => `Heap Fetches: ${v}`);
  put("Index Searches", (v) => `Index Searches: ${v}`);
  put("Group Key", (v) => `Group Key: ${v}`);
  put("Sort Key", (v) => `Sort Key: ${v}`);
  put("One-Time Filter", (v) => `One-Time Filter: ${v}`);

  if (n["Sort Method"]) {
    let line = `Sort Method: ${n["Sort Method"]}`;
    if (n["Sort Space Type"] && n["Sort Space Used"] !== undefined) {
      line += `  ${n["Sort Space Type"]}: ${n["Sort Space Used"]}kB`;
    }
    out.push(line);
  }
  if (n["Exact Heap Blocks"] || n["Lossy Heap Blocks"]) {
    const p: string[] = [];
    if (n["Exact Heap Blocks"]) p.push(`exact=${n["Exact Heap Blocks"]}`);
    if (n["Lossy Heap Blocks"]) p.push(`lossy=${n["Lossy Heap Blocks"]}`);
    out.push(`Heap Blocks: ${p.join(" ")}`);
  }
  if (n["Workers Planned"] !== undefined) out.push(`Workers Planned: ${n["Workers Planned"]}`);
  if (n["Workers Launched"] !== undefined) out.push(`Workers Launched: ${n["Workers Launched"]}`);
  if (n["Hash Buckets"] !== undefined) {
    let line = `Buckets: ${n["Hash Buckets"]}`;
    if (n["Original Hash Buckets"] && n["Original Hash Buckets"] !== n["Hash Buckets"]) {
      line += ` (originally ${n["Original Hash Buckets"]})`;
    }
    line += `  Batches: ${n["Hash Batches"]}`;
    if (n["Original Hash Batches"] && n["Original Hash Batches"] !== n["Hash Batches"]) {
      line += ` (originally ${n["Original Hash Batches"]})`;
    }
    line += `  Memory Usage: ${n["Peak Memory Usage"]}kB`;
    out.push(line);
  }
  const shared: string[] = [];
  ([
    ["Shared Hit Blocks", "hit"],
    ["Shared Read Blocks", "read"],
    ["Shared Dirtied Blocks", "dirtied"],
    ["Shared Written Blocks", "written"],
  ] as const).forEach(([k, label]) => {
    if (n[k]) shared.push(`${label}=${n[k]}`);
  });
  const temp: string[] = [];
  ([
    ["Temp Read Blocks", "read"],
    ["Temp Written Blocks", "written"],
  ] as const).forEach(([k, label]) => {
    if (n[k]) temp.push(`${label}=${n[k]}`);
  });
  if (shared.length || temp.length) {
    let line = "Buffers:";
    if (shared.length) line += ` shared ${shared.join(" ")}`;
    if (temp.length) line += `${shared.length ? ", " : " "}temp ${temp.join(" ")}`;
    out.push(line);
  }
  return out;
}

export type RenderOptions = {
  /** `Buffers:` 行を落とす。STEP 1 のページでは情報量が多すぎるので隠す */
  hideBuffers?: boolean;
};

export function renderPlan(result: ExplainResult, opts: RenderOptions = {}): string {
  const lines: string[] = [];
  const walk = (n: PlanNode, depth: number) => {
    lines.push(`${nodeIndent(depth)}${nodeLabel(n)}  ${costs(n)}`.trimEnd());
    for (const d of details(n)) {
      if (opts.hideBuffers && d.startsWith("Buffers:")) continue;
      lines.push(`${detailIndent(depth)}${d}`);
    }
    (n.Plans ?? []).forEach((c) => walk(c, depth + 1));
  };
  walk(result.Plan, 0);
  if (result.Planning && !opts.hideBuffers) {
    const d = details(result.Planning as unknown as PlanNode);
    if (d.length) {
      lines.push(" Planning:");
      d.forEach((line) => lines.push(`   ${line}`));
    }
  }
  // 素の EXPLAIN（ANALYZE 無し）には両方とも無い。psql も同じく何も出さない
  const pt = result["Planning Time"];
  const et = result["Execution Time"];
  if (pt !== undefined) lines.push(` Planning Time: ${pt.toFixed(3)} ms`);
  if (et !== undefined) lines.push(` Execution Time: ${et.toFixed(3)} ms`);
  return lines.join("\n");
}

/**
 * 描画結果のうち `re` に最初に一致する行の行番号（1 始まり）。
 *
 * **本文に行番号を手で書かないための道具。** 05-implementation-review §L-1 で、
 * ハブの「真犯人は上から 8 行目」が実際には 19 行目で、
 * 8 行目は `Sort Key: c.name` という**ノードですらない補足行**だった。
 * 計画を採り直せば行数は動くので、**行番号は本文に書かず必ずここから引く**。
 *
 * ★ `hideBuffers` の有無で行数が変わる。**そのページが `PlanBlock` に渡している
 *   設定をそのまま渡すこと**。取り違えると同じ事故を作り直す。
 */
export function lineOf(result: ExplainResult, re: RegExp, opts: RenderOptions = {}): number {
  // /g 付きの正規表現は .test() が lastIndex を持つので、非 global の複製で走らせる
  const rx = new RegExp(re.source, re.flags.replace("g", ""));
  const i = renderPlan(result, opts)
    .split("\n")
    .findIndex((l) => rx.test(l));
  // 見つからなければ落とす。黙って 0 を返すと本文に 0 行目と出る
  if (i < 0) throw new Error(`lineOf: 一致する行が無い: ${re}`);
  return i + 1;
}
