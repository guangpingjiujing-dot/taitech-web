import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { ExplainJson, ExplainResult, PlanNode } from "./types";
import { renderPlan } from "./render";

/*
 * **本文に手で書いた「計画についての数値」が、実出力に存在することを守る。**
 *
 * 実装レビュー（05-implementation-review.md §A）で、`explain-basics` の `cost=9927.00` と
 * `explain-analyze` の `cost=0.43..43.71` が**どの計画にも存在しない値**だったことが見つかった。
 * どちらも「計画を採り直したのに、本文に手で書いた数値を直し忘れた」もので、
 * `43.71` は 03-pre-implementation-review.md に残っている**前の run の値**だった。
 *
 * 第 2 巡（§L-2）で、初版の検査が `(cost=A..B rows=N width=W)` という**完全な断片形しか
 * 見ていなかった**ため、本文の cost 引用 8 個のうち 2 個しか対象になっていないことが判明した。
 * とくに `estimated-rows` は 0 件だった。そこで検査を 2 段にしてある。
 *
 *   1. **断片の完全一致** — `(cost=...)` / `(actual ...)` 形は、描画結果に丸ごと存在すること
 *   2. **値の所属** — `cost=` / `rows=` / `width=` / `loops=` に続く値が、
 *      そのページが読んでいる計画のどこかに実在すること（`cost=10417.00` のような
 *      部分引用はこちらで拾う。描画文字列には `cost=10417.00` という並びが無いので、
 *      正規表現を広げるだけでは拾えない）
 *
 * ★ 行番号・ページ数・件数のように「計画についての主張だが `key=値` の形をしていない」ものは
 *   どう広げてもここでは拾えない（§L-1 のハブの行番号がそれだった）。
 *   **そうした派生値は本文に書かず計算する**（`render.ts` の `lineOf` /
 *   `PlanBlock.tsx` の `SubtractionSketch`）のが唯一の構造的な解になる。
 *
 * ここが落ちたときにやること:
 *   1. 落ちた値を、同じページが読んでいる計画の実出力の値に書き換える
 *   2. 「実出力には無いが説明のために書いた」数値なら、`cost=` / `rows=` などの
 *      キーを外して散文にする（キーの形をしていなければ、この検査は拾わない）
 */

const PAGES_DIR = path.resolve(__dirname, "../../app/query-plan");
const PLANS_DIR = path.resolve(__dirname, "../../content/query-plan/plans");

function loadPlan(name: string): ExplainResult {
  return (JSON.parse(readFileSync(path.join(PLANS_DIR, `${name}.json`), "utf8")) as ExplainJson)[0];
}

/** そのページが import している計画（＝実際に描画している計画）だけを正とする */
function importedPlansOf(source: string): ExplainResult[] {
  return [...source.matchAll(/from "@\/content\/query-plan\/plans\/([\w.-]+)\.json"/g)].map((m) =>
    loadPlan(m[1]),
  );
}

/**
 * **他ページの計画から借りてきた数値の宣言**を拾う。
 * ソースの JSX コメントに `cite: <計画ファイル名>.json | <借りた断片>` の 1 行を書く
 * （例: `cite: hero-plan.json | Rows Removed by Filter: 4`）。
 *
 * 借りた数値は、そのページが描画している計画のどこにも無いので素通りしてしまう
 * （§M-2 の `estimated-rows` の `rows=23`、§N-1 の `index-cond-vs-filter` の
 * `Rows Removed by Filter: 4` がそれだった）。
 *
 * ★ 宣言は**断片ごと**に書く。「このページは hero-plan も読む」という**ページ単位**の
 *   宣言にすると、そのページの他の全主張まで hero の値を受け入れてしまう（§N-2）。
 *   ここでは宣言した断片だけが、宣言した計画に対して照合される。
 *
 * 借りている数値を全部数えたいときは `grep -rn "cite:" src/app/query-plan/` で出る。
 */
function citationsOf(source: string): Map<string, ExplainResult> {
  const out = new Map<string, ExplainResult>();
  for (const m of source.matchAll(/cite: ([\w.-]+)\.json \| (.+?)\s*(?:\*\/|$)/gm)) {
    out.set(m[2], loadPlan(m[1]));
  }
  return out;
}

/** hideBuffers の有無で本文が引用しうる行が変わるので、両方を正とする */
function renderedOf(plans: ExplainResult[]): string[] {
  return plans.flatMap((p) => [renderPlan(p), renderPlan(p, { hideBuffers: true })]);
}

type Key = "cost" | "rows" | "width" | "loops" | "actual time";

/** 計画に実在する値を key ごとに集める。部分引用を照合するのに使う */
function valuesOf(plans: ExplainResult[]): Record<Key, Set<string>> {
  const sets: Record<Key, Set<string>> = {
    cost: new Set(),
    rows: new Set(),
    width: new Set(),
    loops: new Set(),
    "actual time": new Set(),
  };
  const walk = (n: PlanNode) => {
    sets.cost.add(n["Startup Cost"].toFixed(2));
    sets.cost.add(n["Total Cost"].toFixed(2));
    sets.rows.add(String(n["Plan Rows"]));
    sets.width.add(String(n["Plan Width"]));
    if (n["Actual Rows"] !== undefined) {
      // psql は小数 2 桁で出すが、本文は整数で引くこともある
      sets.rows.add(n["Actual Rows"].toFixed(2));
      sets.rows.add(String(n["Actual Rows"]));
    }
    if (n["Actual Loops"] !== undefined) sets.loops.add(String(n["Actual Loops"]));
    if (n["Actual Startup Time"] !== undefined) {
      sets["actual time"].add(n["Actual Startup Time"].toFixed(3));
    }
    if (n["Actual Total Time"] !== undefined) {
      sets["actual time"].add(n["Actual Total Time"].toFixed(3));
    }
    (n.Plans ?? []).forEach(walk);
  };
  plans.forEach((p) => walk(p.Plan));
  return sets;
}

/** 本文中の `(cost=0.00..10417.00 rows=500000 width=34)` 形の断片 */
const COST_RE = /\(cost=[\d.]+\.\.[\d.]+ rows=[\d.]+ width=\d+\)/g;
/** 本文中の `(actual time=... rows=... loops=...)` 形の断片 */
const ACTUAL_RE = /\(actual time=[\d.]+\.\.[\d.]+ rows=[\d.]+ loops=\d+\)/g;
/**
 * 補足行（`key: 値` 形）からの転記。`Rows Removed by Filter: 6667` /
 * `Heap Blocks: exact=4167` / `Disk: 16656kB` など。
 *
 * ノード行と違って `key=値` の形をしていないので、初版と第 2 版はここを 1 件も見ていなかった
 * （§N-1。11 ページ中 3 ページが検査対象ゼロだった）。**描画結果の literal な部分文字列**
 * なので、値の集合を作らず断片の完全一致でそのまま照合できる。
 */
const DETAIL_RE =
  /(?:Rows Removed by (?:Filter|Index Recheck|Join Filter)|Heap Fetches|Index Searches): \d+|Heap Blocks: (?:exact|lossy)=\d+|(?:Memory Usage|Disk|Memory): \d+kB|Batches: \d+/g;

/** 本文中の部分引用。`cost=18.50` / `cost=0.00..18.50` / `rows=850` / `width=68` / `loops=250000` */
const VALUE_RES: Record<Key, RegExp> = {
  cost: /cost=(\d+\.\d+)(?:\.\.(\d+\.\d+))?/g,
  rows: /\brows=(\d+(?:\.\d+)?)/g,
  width: /\bwidth=(\d+)/g,
  loops: /\bloops=(\d+)/g,
  "actual time": /actual time=(\d+\.\d+)\.\.(\d+\.\d+)/g,
};

type Claim = {
  label: string;
  /** この主張を照合する相手。宣言された引用だけ、そのページの計画ではなく引用元を見る */
  against: "imported" | ExplainResult;
  ok: (r: string[], v: Record<Key, Set<string>>) => boolean;
};

function claimsIn(source: string): Claim[] {
  const cites = citationsOf(source);
  const out: Claim[] = [];
  for (const m of [
    ...source.matchAll(COST_RE),
    ...source.matchAll(ACTUAL_RE),
    ...source.matchAll(DETAIL_RE),
  ]) {
    const f = m[0];
    out.push({
      label: f,
      against: cites.get(f) ?? "imported",
      ok: (rendered) => rendered.some((r) => r.includes(f)),
    });
  }
  for (const key of Object.keys(VALUE_RES) as Key[]) {
    for (const m of source.matchAll(VALUE_RES[key])) {
      for (const v of m.slice(1)) {
        if (v === undefined) continue;
        const label = `${key}=${v}`;
        out.push({
          label,
          against: cites.get(label) ?? "imported",
          ok: (_r, values) => values[key].has(v),
        });
      }
    }
  }
  return out;
}

function pageFiles(): { name: string; file: string }[] {
  const out = [{ name: "(hub)", file: path.join(PAGES_DIR, "page.tsx") }];
  for (const e of readdirSync(PAGES_DIR, { withFileTypes: true })) {
    if (e.isDirectory()) out.push({ name: e.name, file: path.join(PAGES_DIR, e.name, "page.tsx") });
  }
  return out;
}

describe("本文に書いた実行計画の数値が実出力に存在する", () => {
  let checked = 0;

  for (const { name, file } of pageFiles()) {
    const source = readFileSync(file, "utf8");
    const claims = claimsIn(source);
    if (claims.length === 0) continue;
    checked += claims.length;

    it(`${name} — ${claims.length} 件`, () => {
      const imported = importedPlansOf(source);
      expect(
        imported.length,
        `${name} は計画の数値を本文に書いているのに plans/*.json を 1 つも import していない`,
      ).toBeGreaterThan(0);

      for (const c of claims) {
        const plans = c.against === "imported" ? imported : [c.against];
        const where =
          c.against === "imported"
            ? "このページが読んでいる計画"
            : "cite: で宣言した引用元の計画";
        expect(
          c.ok(renderedOf(plans), valuesOf(plans)),
          `${name} の本文にある「${c.label}」が、${where}のどれにも存在しない`,
        ).toBe(true);
      }
    });
  }

  it("検査対象が実際に集まっている（正規表現が空振りしていない）", () => {
    // 正規表現が壊れると全ページが「主張ゼロ」になって全部緑になる。それを防ぐ。
    // ★ /g 付き正規表現の .test() は lastIndex を持ち越して偽陰性になるので、
    //   ここでは使わない（§L-3。実際にファイル順しだいで壊れることを再現した）
    // 下限は実態（9 ページ / 83 件）の少し下に置く。網が縮んだら気づけるが、
    // 本文を 1 段落削った程度では落ちない水準（§N-1）
    const pages = pageFiles().filter((p) => claimsIn(readFileSync(p.file, "utf8")).length > 0);
    expect(pages.length).toBeGreaterThanOrEqual(8);
    expect(checked).toBeGreaterThanOrEqual(70);
  });
});
