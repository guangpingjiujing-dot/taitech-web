import type { Position } from "./ast";
import { SqlRuntimeError } from "./errors";

/**
 * 値と比較の規則。
 *
 * **SQLite の動的型付けは真似しない。** 標準 SQL の三値論理と型の厳しさを守るのが
 * 試験対策としての価値なので、暗黙の型変換は入れない
 * (docs/wip/20260815-fe-sql/00-overview.md §4)。
 */

export type SqlValue = number | string | boolean | null;

/** SQL の真理値は TRUE / FALSE / UNKNOWN の三値。UNKNOWN を null で表す */
export type Truth = boolean | null;

export function isNull(v: SqlValue): boolean {
  return v === null;
}

export function typeNameOf(v: SqlValue): string {
  if (v === null) return "NULL";
  if (typeof v === "number") return "数値";
  if (typeof v === "boolean") return "真理値";
  return "文字列";
}

/**
 * 大小比較。**どちらかが NULL なら結果は UNKNOWN (null)**。
 * 戻り値は -1 / 0 / 1 / null。
 */
export function compareValues(
  a: SqlValue,
  b: SqlValue,
  pos: Position,
): -1 | 0 | 1 | null {
  if (a === null || b === null) return null;
  if (typeof a === "number" && typeof b === "number") {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (typeof a === "string" && typeof b === "string") {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? 1 : -1;
  }
  throw new SqlRuntimeError(
    "TYPE_MISMATCH",
    `${typeNameOf(a)}と${typeNameOf(b)}は比較できません`,
    pos,
    {
      hint: "数値どうし・文字列どうしでのみ比較できます。文字列は '100' のように引用符で囲みます。",
    },
  );
}

/**
 * ORDER BY / DISTINCT / 集合演算で使う全順序。比較不能でも例外を投げない。
 *
 * **NULL は最小として扱う** (SQLite と同じ)。標準 SQL では実装依存なので、
 * 差分テストのオラクルに合わせて固定してある
 * (docs/wip/20260815-fe-sql/01-implementation-design.md §5-1)。
 */
export function totalOrder(a: SqlValue, b: SqlValue): number {
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  const rank = (v: SqlValue) =>
    typeof v === "boolean" ? 0 : typeof v === "number" ? 1 : 2;
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

/**
 * DISTINCT・集合演算・GROUP BY のキー比較。
 * **ここでは NULL どうしを「同じ」と見なす** (標準 SQL の規定)。
 * WHERE の `=` が NULL を UNKNOWN にするのとは別の規則なので混同しないこと。
 */
export function valuesEqualForGrouping(a: SqlValue, b: SqlValue): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a === b;
}

export function rowKey(row: SqlValue[]): string {
  return JSON.stringify(
    row.map((v) => (v === null ? ["null"] : [typeof v, v])),
  );
}

/* ---------------- 三値論理 ---------------- */

export function truthAnd(a: Truth, b: Truth): Truth {
  if (a === false || b === false) return false;
  if (a === null || b === null) return null;
  return true;
}

export function truthOr(a: Truth, b: Truth): Truth {
  if (a === true || b === true) return true;
  if (a === null || b === null) return null;
  return false;
}

export function truthNot(a: Truth): Truth {
  if (a === null) return null;
  return !a;
}

/** WHERE / HAVING / ON が行を通すのは **TRUE のときだけ**。UNKNOWN は通さない */
export function keepsRow(t: Truth): boolean {
  return t === true;
}

export function asTruth(v: SqlValue, pos: Position): Truth {
  if (v === null) return null;
  if (typeof v === "boolean") return v;
  throw new SqlRuntimeError(
    "TYPE_MISMATCH",
    `条件には真理値が必要です (${typeNameOf(v)}が来ています)`,
    pos,
    { hint: "`WHERE 在庫数` ではなく `WHERE 在庫数 > 0` のように比較の形で書きます。" },
  );
}

/* ---------------- LIKE ---------------- */

/**
 * パターン文字列 (シラバス 24 番)。`%` は 0 文字以上、`_` は任意の 1 文字。
 * 正規表現に変換するとき、パターン側のメタ文字はすべてエスケープする。
 */
export function likeMatches(value: string, pattern: string): boolean {
  let regex = "";
  for (const ch of pattern) {
    if (ch === "%") regex += "[\\s\\S]*";
    else if (ch === "_") regex += "[\\s\\S]";
    else regex += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${regex}$`).test(value);
}

/** 表示用。NULL は空欄ではなく `NULL` と出す (空文字列と区別させるため) */
export function formatValue(v: SqlValue): string {
  if (v === null) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}
