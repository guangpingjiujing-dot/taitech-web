import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import heroJson from "@/content/query-plan/plans/hero-plan.json";
import coveringJson from "@/content/query-plan/plans/hero-plan-after-covering.json";
import workmemJson from "@/content/query-plan/plans/hero-plan-after-workmem.json";
import bitmapJson from "@/content/query-plan/plans/lesson-scan-bitmap.json";
import mergeJson from "@/content/query-plan/plans/lesson-join-merge.json";
import type { ExplainJson, ExplainResult } from "./types";
import { misEstimate, naiveSelfTimes, nodeLabel, selfTimes, subtreeMs } from "./analyze";
import { renderPlan } from "./render";

const hero = (heroJson as unknown as ExplainJson)[0];
const covering = (coveringJson as unknown as ExplainJson)[0];
const workmem = (workmemJson as unknown as ExplainJson)[0];
const bitmap = (bitmapJson as unknown as ExplainJson)[0];
const merge = (mergeJson as unknown as ExplainJson)[0];

const byDesc = (rows: ReturnType<typeof selfTimes>) => [...rows].sort((a, b) => b.self - a.self);
/** ANALYZE 付きで採った計画にしか使わない（素の EXPLAIN には Execution Time が無い） */
const execMs = (r: ExplainResult) => {
  const v = r["Execution Time"];
  if (v === undefined) throw new Error("ANALYZE 無しの計画に Execution Time を求めている");
  return v;
};
const find = (r: typeof hero, re: RegExp) => {
  const hit = selfTimes(r).find((x) => re.test(x.label));
  if (!hit) throw new Error(`node not found: ${re}`);
  return hit;
};

/*
 * **絶対値（ms）を期待値にしない。**
 *
 * 計画を採り直すたびに ms は動くので、絶対値で固定すると再採取のたびにテストを
 * 書き換えることになる（実際に 3 回そうなった）。**記事が壊れるのは ms が変わったときではなく、
 * 順位と大小関係が崩れたとき**なので、そちらを固定する。
 *
 * ここが落ちたら「旗艦の教材が成立しなくなった」という意味なので、
 * 計画を採り直すか、ページの筋書きを変えるかの判断が要る。
 */
describe("旗艦の教材が成立している", () => {
  it("内側の Index Scan が自分時間 1 位（サイン 1 の答え）", () => {
    expect(byDesc(selfTimes(hero))[0].label).toMatch(/^Index Scan using .+ on order_items/);
  });

  it("2 位に対して十分な差がある（表示の丸め 1 段で入れ替わらない）", () => {
    const [first, second] = byDesc(selfTimes(hero));
    expect(first.self / second.self).toBeGreaterThan(1.5);
  });

  it("loops を掛けずに読むと Nested Loop が 1 位に見える（＝落差が存在する）", () => {
    expect(byDesc(naiveSelfTimes(hero))[0].label).toMatch(/Nested Loop/);
  });

  it("サイン 3 は外側の Seq Scan を指し、内側の Index Scan は指さない", () => {
    // 過小見積り側だけを候補にする。内側は「多く見積もっている」ので候補外
    expect(misEstimate(find(hero, /Seq Scan on orders/).node)!).toBeGreaterThan(100);
    expect(misEstimate(find(hero, /^Index Scan using .+ on order_items/).node)!).toBeLessThan(10);
  });

  it("自分時間の合計が Execution Time に収まる", () => {
    const sum = selfTimes(hero).reduce((a, r) => a + r.self, 0);
    expect(sum).toBeLessThanOrEqual(execMs(hero));
    expect(sum).toBeGreaterThan(execMs(hero) * 0.95);
  });

  it("自分時間が負にならない（丸め × loops の増幅を上限で抑えている）", () => {
    for (const r of [hero, covering, workmem]) {
      expect(selfTimes(r).every((x) => x.self >= 0)).toBe(true);
    }
  });
});

describe("修正チェーンの教材が成立している", () => {
  it("手 1 でカバリングインデックスが効き、ヒープを 1 回も触っていない", () => {
    const inner = find(covering, /^Index Only Scan using/);
    expect(inner.node["Heap Fetches"]).toBe(0);
  });

  it("手 1 で 1 位が Sort に入れ替わる（2 位の受け皿が要る理由）", () => {
    expect(byDesc(selfTimes(covering))[0].label).toBe("Sort");
  });

  it("手 1 は手 0 より速く、内側の負担も減っている", () => {
    expect(execMs(covering)).toBeLessThan(execMs(hero));
    expect(subtreeMs(find(covering, /^Index Only Scan using/).node)).toBeLessThan(
      subtreeMs(find(hero, /^Index Scan using .+ on order_items/).node),
    );
  });

  it("手 2 で Sort Method が external merge から quicksort に変わる", () => {
    const sortOf = (r: typeof hero) =>
      selfTimes(r).find((x) => x.node["Sort Method"]?.includes("merge"))?.node["Sort Method"] ??
      selfTimes(r).find((x) => x.node["Sort Method"]?.includes("quicksort"))?.node["Sort Method"];
    expect(sortOf(covering)).toContain("external merge");
    expect(sortOf(workmem)).toContain("quicksort");
  });
});

describe("描画器が psql の表記に合っている", () => {
  /*
   * 期待値は Python 実装（capture/render-plan.py）が同じ JSON を描いた結果。
   * **psql の実出力と突き合わせて検証済みなのは Python 側**なので、これは
   * 「独立した 2 実装が一致する」というクロスチェックになっている。
   *
   * ファイルは `src/content/` に置く。`docs/` は .gitignore 済みで、そこを読むと
   * clone / CI で落ち、wip を harvest した瞬間に壊れる（05-… B-3）。
   * 再生成は `capture/capture-all.sh --render-only`。
   */
  it("Python 実装の描画結果と一致する", () => {
    const saved = readFileSync(
      path.resolve(__dirname, "../../content/query-plan/hero-plan.expected.txt"),
      "utf8",
    ).trim();
    expect(renderPlan(hero).trim()).toBe(saved);
  });

  it("JSON と psql で名前が違うノードを psql 側に寄せている", () => {
    // JSON は常に "Aggregate"。psql は Strategy を見て名前を変える
    const agg = selfTimes(hero).find((x) => x.node["Node Type"] === "Aggregate");
    expect(agg?.label).toBe("GroupAggregate");
    // Bitmap Index Scan は「リレーション名」ではなく「索引名」を出す
    const bi = selfTimes(bitmap).find((x) => x.node["Node Type"] === "Bitmap Index Scan");
    expect(bi?.label).toMatch(/^Bitmap Index Scan on members_city_idx$/);
  });

  it("レッスン用の計画も描画できる（Bitmap / Merge / Heap Blocks）", () => {
    expect(renderPlan(bitmap)).toContain("Heap Blocks: exact=");
    expect(renderPlan(bitmap)).toContain("Recheck Cond:");
    expect(renderPlan(merge)).toContain("Merge Cond:");
    expect(nodeLabel(merge.Plan)).toBe("Merge Join");
  });
});
