import { describe, expect, it } from "vitest";
import { parse } from "../parser";
import { transpileToTypeScript } from "./typescript";

function ts(src: string): string {
  return transpileToTypeScript(parse(src));
}

describe("transpile to typescript", () => {
  it("emits variable declaration", () => {
    expect(ts("整数型: x ← 5")).toContain("let x: number = 5;");
  });

  it("emits array declaration", () => {
    expect(ts("整数型の配列: arr ← {1, 2, 3}")).toContain(
      "let arr: number[] = [1, 2, 3];",
    );
  });

  it("emits if/else", () => {
    const out = ts(`
整数型: x ← 1
if (x > 0) then
  x ← 10
else
  x ← -1
endif
`);
    expect(out).toContain("if ((x > 0)) {");
    expect(out).toContain("} else {");
  });

  it("emits while", () => {
    expect(ts("while (1 = 1)\n  x ← 1\nendwhile")).toContain(
      "while ((1 === 1)) {",
    );
  });

  it("emits for (inc)", () => {
    expect(
      ts("for (i を 1 から 10 まで 1 ずつ増やす)\n  x ← i\nendfor"),
    ).toContain("for (let i = 1; i <= 10; i += 1) {");
  });

  it("emits for (dec)", () => {
    expect(
      ts("for (i を 10 から 1 まで 1 ずつ減らす)\n  x ← i\nendfor"),
    ).toContain("for (let i = 10; i >= 1; i -= 1) {");
  });

  it("emits array index with -1 comment", () => {
    const out = ts(`
整数型の配列: arr ← {1, 2, 3}
arr[2] ← 99
`);
    expect(out).toContain("arr[2 - 1] = 99; // 擬似言語は1始まりなので-1");
  });

  it("emits function definition", () => {
    const out = ts(`
○整数型: add(整数型: a, 整数型: b)
  return a + b
`);
    expect(out).toContain("function add(a: number, b: number): number {");
    expect(out).toContain("return (a + b);");
  });

  it("rewrites print to console.log", () => {
    expect(ts("print(42)")).toContain("console.log(42)");
  });

  it("uses !== and ===", () => {
    expect(ts(`if (1 = 2) then\n  x ← 1\nendif`)).toContain("(1 === 2)");
    expect(ts(`if (1 ≠ 2) then\n  x ← 1\nendif`)).toContain("(1 !== 2)");
  });
});
