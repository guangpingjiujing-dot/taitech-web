import type { Value } from "@/lib/pseudo/interpreter";

/**
 * 変数ペインでの値の見せ方 (共通テスト用プログラム表記)。
 *
 * FE の既定は配列を `{1, 2}` と書くが、**情報I の配列リテラルは `[1, 2]`**。
 * エディタに `Touchaku = [0, 3, ...]` と書いてあるのに変数ペインが `{...}` を出すと、
 * 教える記法と見せる記法が食い違う。
 */
export function formatJoho1Value(v: Value): string {
  switch (v.type) {
    case "int":
    case "float":
      return String(v.value);
    case "string":
      return `"${v.value}"`;
    case "bool":
      return v.value ? "true" : "false";
    case "undefined":
      return "未定義";
    case "array":
      return `[${v.elements.map(formatJoho1Value).join(", ")}]`;
  }
}
