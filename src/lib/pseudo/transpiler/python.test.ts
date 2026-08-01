import { describe, expect, it } from "vitest";
import { parse } from "../parser";
import { transpileToPython } from "./python";

function py(src: string): string {
  return transpileToPython(parse(src));
}

describe("transpile to python", () => {
  it("emits simple variable declaration", () => {
    expect(py("整数型: x ← 5")).toContain("x: int = 5");
  });

  it("emits array declaration", () => {
    expect(py("整数型の配列: arr ← {1, 2, 3}")).toContain(
      "arr: list[int] = [1, 2, 3]",
    );
  });

  it("emits if/elif/else", () => {
    const out = py(`
整数型: x ← 1
if (x > 0) then
  x ← 10
elseif (x = 0) then
  x ← 0
else
  x ← -1
endif
`);
    expect(out).toContain("if (x > 0):");
    expect(out).toContain("elif (x == 0):");
    expect(out).toContain("else:");
  });

  it("emits while", () => {
    expect(py("while (1 = 1)\n  x ← 1\nendwhile")).toContain("while (1 == 1):");
  });

  it("emits for (inc)", () => {
    expect(
      py("for (i を 1 から 10 まで 1 ずつ増やす)\n  x ← i\nendfor"),
    ).toContain("for i in range(1, 10 + 1, 1):");
  });

  it("emits for (dec)", () => {
    expect(
      py("for (i を 10 から 1 まで 1 ずつ減らす)\n  x ← i\nendfor"),
    ).toContain("for i in range(10, 1 - 1, -1):");
  });

  it("emits array index with -1 comment", () => {
    const out = py(`
整数型の配列: arr ← {1, 2, 3}
arr[2] ← 99
`);
    expect(out).toContain("arr[2 - 1] = 99  # 擬似言語は1始まりなので-1");
  });

  it("emits function definition", () => {
    const out = py(`
○整数型: add(整数型: a, 整数型: b)
  return a + b
`);
    expect(out).toContain("def add(a: int, b: int) -> int:");
    expect(out).toContain("return (a + b)");
  });

  it("preserves print", () => {
    expect(py("print(42)")).toContain("print(42)");
  });
});
