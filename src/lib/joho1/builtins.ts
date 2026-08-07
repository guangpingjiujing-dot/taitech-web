import type { Position } from "@/lib/pseudo/ast";
import { PseudoRuntimeError } from "@/lib/pseudo/errors";
import { formatValue, type BuiltinFn, type Value } from "@/lib/pseudo/interpreter";

/**
 * 問題ごとに与えられる関数のカタログ。
 *
 * 共通テスト用プログラム表記には **固定の組み込み関数セットが存在しない**。
 * `要素数` も `最大値` も、問題文の【関数の説明】ボックスでその場で定義される
 * (00-overview.md §7-4 (1))。したがってここは「言語の仕様」ではなく
 * **過去に出題された関数の実装置き場**であり、どれを有効にするかはページ側が決める。
 *
 * **実際に出題された関数だけを置く。** 便利そうという理由で足すと、
 * 試験に出ない関数を学習者に覚えさせることになる。
 */

function argError(
  name: string,
  message: string,
  pos: Position,
): PseudoRuntimeError {
  return new PseudoRuntimeError(
    "TYPE_MISMATCH",
    `${name}: ${message}`,
    pos,
  );
}

function requireNumber(
  name: string,
  v: Value | undefined,
  pos: Position,
): number {
  if (v && (v.type === "int" || v.type === "float")) return v.value;
  throw argError(name, "引数には数値が必要です", pos);
}

/**
 * `表示する(…)` — 引数を**区切り文字なしで連結**して 1 行出力する。
 *
 * 令和8年度本試験の実行結果が「体験時間1分間：最長待ち時間0分間」
 * (`表示する("体験時間", taiken, "分間：", "最長待ち時間", saichou, "分間")`)
 * なので、区切りは入らない。
 */
export const hyoujisuru: BuiltinFn = (args, ctx) => {
  ctx.output(args.map(formatValue).join(""));
  return { type: "undefined" };
};

/** `要素数(配列)` — 令和8年度本試験 / 追試験で出題 */
export const yousosuu: BuiltinFn = (args, ctx) => {
  const a = args[0];
  if (!a || a.type !== "array") {
    throw argError("要素数", "引数には配列が必要です", ctx.pos);
  }
  return { type: "int", value: a.elements.length };
};

/** `最大値(x, y)` — 令和8年度本試験で出題 */
export const saidaichi: BuiltinFn = (args, ctx) => {
  const x = requireNumber("最大値", args[0], ctx.pos);
  const y = requireNumber("最大値", args[1], ctx.pos);
  const both = args[0]?.type === "int" && args[1]?.type === "int";
  return both
    ? { type: "int", value: Math.max(x, y) }
    : { type: "float", value: Math.max(x, y) };
};

/** 出題実績のある関数の全体。ページ側はここから必要な分だけ選ぶ */
export const JOHO1_BUILTINS: Record<string, BuiltinFn> = {
  表示する: hyoujisuru,
  要素数: yousosuu,
  最大値: saidaichi,
};

/**
 * シミュレーター単体 (`/joho1`) の既定。
 * 出題実績のある関数はすべて有効にする — ここだけは利便性を優先する
 * (01-implementation-design.md §2-4)。
 */
export function defaultBuiltins(): Map<string, BuiltinFn> {
  return new Map(Object.entries(JOHO1_BUILTINS));
}

/** 練習問題・レッスン用。その問題で与えられた関数だけを有効にする */
export function builtinsFor(names: readonly string[]): Map<string, BuiltinFn> {
  const map = new Map<string, BuiltinFn>();
  for (const name of names) {
    const fn = JOHO1_BUILTINS[name];
    if (fn) map.set(name, fn);
  }
  return map;
}
