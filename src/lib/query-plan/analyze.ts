import type { ExplainResult, PlanNode } from "./types";

/**
 * 実行計画から「どのノードが時間を持っているか」を出す。
 *
 * ここが `/query-plan/find-bottleneck` のサイン 1 の中身そのもの。
 * **派生値は静的データに持たず、描画時に計算する**（持つと採り直しのたびに二重更新になる）。
 */

/** そのノード以下の合計時間。`actual time` は loops 1 回あたりなので掛け戻す */
export function subtreeMs(n: PlanNode): number {
  return (n["Actual Total Time"] ?? 0) * (n["Actual Loops"] ?? 1);
}

/**
 * 見積りと実測のずれ。**両方とも「loops 1 回あたり」なので、片方だけに loops を掛けない。**
 *
 * 掛けると、内側の Index Scan のように loops が大きいノードが常に巨大な乖離に見え、
 * 「真犯人ではない」と判定したはずのノードが乖離ランキングの 1 位に来てしまう。
 */
export function misEstimate(n: PlanNode): number | null {
  const est = n["Plan Rows"];
  const actual = n["Actual Rows"];
  if (actual === undefined || est === 0) return null;
  return actual / est;
}

/** 累計行数が欲しいときだけ両方に loops を掛ける（比を取るなら loops は約分されて消える） */
export function totalRows(n: PlanNode): number {
  return (n["Actual Rows"] ?? 0) * (n["Actual Loops"] ?? 1);
}

export type SelfTimeRow = {
  node: PlanNode;
  label: string;
  depth: number;
  /** そのノード以下の合計（上限を適用したあと） */
  subtree: number;
  /** 子を引いた「自分の時間」 */
  self: number;
  share: number;
  /** 表示の丸めが loops 倍されて親を超えたため、上限で頭打ちにした */
  capped: boolean;
};

/**
 * 全ノードの「自分の時間」を出す。**親のサブツリー時間が子の合計に上限を与える。**
 *
 * `actual time` はミリ秒 3 桁で丸められるので、`loops` が大きいノードは掛けた瞬間に
 * 誤差も loops 倍される（表示 0.006 の真値は 0.0055〜0.0065 → 50 万倍で ±250ms）。
 * 素朴に引くと子の合計が親を超え、**自分の時間が負になる**。
 *
 * あふれた分は **`loops > 1` の子からだけ**削る。`loops === 1` の子は
 * `actual time` がそのまま実測値なので触らない。
 */
export function selfTimes(result: ExplainResult): SelfTimeRow[] {
  const total = result["Execution Time"] ?? 0;
  const out: SelfTimeRow[] = [];

  const walk = (n: PlanNode, depth: number, cap?: number) => {
    const raw = subtreeMs(n);
    const capped = cap === undefined ? raw : Math.min(raw, cap);
    const kids = n.Plans ?? [];
    const raws = kids.map(subtreeMs);
    const caps = [...raws];
    const over = raws.reduce((a, b) => a + b, 0) - capped;
    if (over > 0) {
      const amplified = kids
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => (c["Actual Loops"] ?? 1) > 1);
      const ampTotal = amplified.reduce((a, { i }) => a + raws[i], 0);
      if (ampTotal > 0) {
        for (const { i } of amplified) {
          caps[i] = Math.max(0, raws[i] - over * (raws[i] / ampTotal));
        }
      } else {
        const t = raws.reduce((a, b) => a + b, 0);
        if (t > 0) for (let i = 0; i < caps.length; i++) caps[i] = (raws[i] * capped) / t;
      }
    }
    const self = Math.max(0, capped - caps.reduce((a, b) => a + b, 0));
    out.push({
      node: n,
      label: nodeLabel(n),
      depth,
      subtree: capped,
      self,
      share: total > 0 ? self / total : 0,
      capped: Math.abs(raw - capped) > 1e-9,
    });
    kids.forEach((c, i) => walk(c, depth + 1, caps[i]));
  };

  walk(result.Plan, 0);
  return out;
}

/** `loops` を掛けずに引き算した場合の自分時間（＝素朴に読んだときの誤答） */
export function naiveSelfTimes(result: ExplainResult): SelfTimeRow[] {
  const total = result["Execution Time"] ?? 0;
  const out: SelfTimeRow[] = [];
  const walk = (n: PlanNode, depth: number) => {
    const kids = n.Plans ?? [];
    const self =
      (n["Actual Total Time"] ?? 0) -
      kids.reduce((a, c) => a + (c["Actual Total Time"] ?? 0), 0);
    out.push({
      node: n,
      label: nodeLabel(n),
      depth,
      subtree: n["Actual Total Time"] ?? 0,
      self,
      share: total > 0 ? self / total : 0,
      capped: false,
    });
    kids.forEach((c) => walk(c, depth + 1));
  };
  walk(result.Plan, 0);
  return out;
}

/**
 * JSON の `Node Type` を psql の表示名に直す。
 *
 * **JSON と psql で名前が違うものがある**ので、そのまま出すと読者の手元と食い違う。
 * いちばん多いのが `Aggregate` で、psql は `Strategy` を見て名前を変える。
 */
export function nodeLabel(n: PlanNode): string {
  const t = n["Node Type"];
  if (t === "Aggregate") {
    if (n.Strategy === "Sorted") return "GroupAggregate";
    if (n.Strategy === "Hashed") return "HashAggregate";
    if (n.Strategy === "Mixed") return "MixedAggregate";
    return "Aggregate";
  }
  if (t === "Bitmap Index Scan") {
    // psql は「Bitmap Index Scan on <索引名>」（リレーション名ではない）
    return n["Index Name"] ? `${t} on ${n["Index Name"]}` : t;
  }
  if (t === "Nested Loop" || t === "Hash Join" || t === "Merge Join") {
    const jt = n["Join Type"];
    const base = t === "Nested Loop" ? "Nested Loop" : t.replace(" Join", "");
    if (!jt || jt === "Inner") return t === "Nested Loop" ? base : `${base} Join`;
    return t === "Nested Loop" ? `${base} ${jt} Join` : `${base} ${jt} Join`;
  }
  if (["Seq Scan", "Index Scan", "Index Only Scan", "Bitmap Heap Scan"].includes(t)) {
    let s = t;
    if (n["Index Name"] && (t === "Index Scan" || t === "Index Only Scan")) {
      s += ` using ${n["Index Name"]}`;
    }
    if (n["Relation Name"]) {
      s += ` on ${n["Relation Name"]}`;
      if (n.Alias && n.Alias !== n["Relation Name"]) s += ` ${n.Alias}`;
    }
    return s;
  }
  return t;
}
