import { describe, expect, it } from "vitest";
import { parse } from "./parser";
import { run, runToEnd, formatValue } from "./interpreter";
import { PseudoRuntimeError } from "./errors";

function exec(src: string) {
  return runToEnd(parse(src));
}

function collect(src: string) {
  const events = [...run(parse(src))];
  return events;
}

describe("interpreter: variables and assignment", () => {
  it("stores integer values", () => {
    const state = exec("整数型: x ← 5");
    expect(state.callStack[0].variables.get("x")).toEqual({
      type: "int",
      value: 5,
    });
  });

  it("computes arithmetic", () => {
    const state = exec(`
整数型: x ← 2 + 3 * 4
`);
    expect(state.callStack[0].variables.get("x")).toEqual({
      type: "int",
      value: 14,
    });
  });

  it("computes mod", () => {
    const state = exec("整数型: x ← 10 mod 3");
    expect(state.callStack[0].variables.get("x")?.type).toBe("int");
    expect((state.callStack[0].variables.get("x") as { value: number }).value).toBe(1);
  });

  it("reassigns variables", () => {
    const state = exec(`
整数型: x ← 1
x ← x + 10
`);
    expect((state.callStack[0].variables.get("x") as { value: number }).value).toBe(
      11,
    );
  });
});

describe("interpreter: control flow", () => {
  it("executes if branch", () => {
    const state = exec(`
整数型: x ← 5
整数型: y ← 0
if (x > 3) then
  y ← 100
else
  y ← 200
endif
`);
    expect((state.callStack[0].variables.get("y") as { value: number }).value).toBe(
      100,
    );
  });

  it("executes elseif branch", () => {
    const state = exec(`
整数型: x ← 0
整数型: y ← 0
if (x > 0) then
  y ← 1
elseif (x = 0) then
  y ← 2
else
  y ← 3
endif
`);
    expect((state.callStack[0].variables.get("y") as { value: number }).value).toBe(
      2,
    );
  });

  it("executes while loop", () => {
    const state = exec(`
整数型: i ← 0
整数型: sum ← 0
while (i < 5)
  sum ← sum + i
  i ← i + 1
endwhile
`);
    expect((state.callStack[0].variables.get("sum") as { value: number }).value).toBe(
      0 + 1 + 2 + 3 + 4,
    );
  });

  it("executes for loop (inc)", () => {
    const state = exec(`
整数型: 合計 ← 0
for (i を 1 から 10 まで 1 ずつ増やす)
  合計 ← 合計 + i
endfor
`);
    expect(
      (state.callStack[0].variables.get("合計") as { value: number }).value,
    ).toBe(55);
  });

  it("executes for loop (dec)", () => {
    const state = exec(`
整数型: 合計 ← 0
for (i を 5 から 1 まで 1 ずつ減らす)
  合計 ← 合計 + i
endfor
`);
    expect(
      (state.callStack[0].variables.get("合計") as { value: number }).value,
    ).toBe(15);
  });
});

describe("interpreter: arrays", () => {
  it("declares and reads array", () => {
    const state = exec(`
整数型の配列: arr ← {10, 20, 30}
整数型: x ← arr[2]
`);
    expect((state.callStack[0].variables.get("x") as { value: number }).value).toBe(
      20,
    );
  });

  it("assigns to array element", () => {
    const state = exec(`
整数型の配列: arr ← {1, 2, 3}
arr[2] ← 99
整数型: x ← arr[2]
`);
    expect((state.callStack[0].variables.get("x") as { value: number }).value).toBe(
      99,
    );
  });

  it("errors on out-of-bounds", () => {
    expect(() =>
      exec(`
整数型の配列: arr ← {1, 2, 3}
整数型: x ← arr[10]
`),
    ).not.toThrow();
    // runToEnd catches into state.error
    const state = exec(`
整数型の配列: arr ← {1, 2, 3}
整数型: x ← arr[10]
`);
    expect(state.status).toBe("error");
    expect(state.error?.kind).toBe("ARRAY_INDEX_OUT_OF_BOUNDS");
  });
});

describe("interpreter: functions", () => {
  it("calls a function with return", () => {
    const state = exec(`
○整数型: add(整数型: a, 整数型: b)
  return a + b

整数型: x ← add(3, 4)
`);
    expect((state.callStack[0].variables.get("x") as { value: number }).value).toBe(
      7,
    );
  });

  it("recursive function (factorial)", () => {
    const state = exec(`
○整数型: fact(整数型: n)
  if (n ≦ 1) then
    return 1
  endif
  return n * fact(n - 1)

整数型: x ← fact(5)
`);
    expect((state.callStack[0].variables.get("x") as { value: number }).value).toBe(
      120,
    );
  });

  it("errors on unknown function", () => {
    const state = exec("整数型: x ← unknownfn(1)");
    expect(state.status).toBe("error");
    expect(state.error?.kind).toBe("UNKNOWN_FUNCTION");
  });

  it("errors on argument count mismatch", () => {
    const state = exec(`
○整数型: sum(整数型: a, 整数型: b)
  return a + b

整数型: x ← sum(1)
`);
    expect(state.status).toBe("error");
    expect(state.error?.kind).toBe("ARGUMENT_COUNT_MISMATCH");
  });
});

describe("interpreter: runtime errors", () => {
  it("division by zero", () => {
    const state = exec("整数型: x ← 10 / 0");
    expect(state.status).toBe("error");
    expect(state.error?.kind).toBe("DIVISION_BY_ZERO");
  });

  it("undefined variable", () => {
    const state = exec("整数型: x ← y");
    expect(state.status).toBe("error");
    expect(state.error?.kind).toBe("UNDEFINED_VARIABLE");
  });

  it("type mismatch (string + int)", () => {
    const state = exec(`整数型: x ← "abc" + 1`);
    expect(state.status).toBe("error");
    expect(state.error?.kind).toBe("TYPE_MISMATCH");
  });
});

describe("interpreter: step events", () => {
  it("emits before/after for each statement", () => {
    const events = collect(`
整数型: x ← 0
x ← x + 1
x ← x + 2
`);
    const before = events.filter((e) => e.type === "before-stmt");
    const after = events.filter((e) => e.type === "after-stmt");
    expect(before.length).toBe(3);
    expect(after.length).toBe(3);
  });

  it("emits output events from print()", () => {
    const events = collect(`
print(42)
print("hello")
`);
    const outputs = events.filter((e) => e.type === "output");
    expect(outputs.length).toBe(2);
    expect((outputs[0] as { text: string }).text).toBe("42");
    expect((outputs[1] as { text: string }).text).toBe("hello");
  });

  it("stops execution on runtime error and emits error event", () => {
    const events = collect("整数型: x ← 1 / 0");
    const errorEvents = events.filter((e) => e.type === "error");
    expect(errorEvents.length).toBe(1);
  });

  it("re-emits before-stmt for the for line on each iteration + at exit", () => {
    const events = collect(`
for (i を 1 から 3 まで 1 ずつ増やす)
  print(i)
endfor
`);
    const forStmtBefore = events.filter(
      (e) => e.type === "before-stmt" && e.node.kind === "ForStmt",
    );
    // 3 iterations + 1 exit check = 4 highlights on the for line
    expect(forStmtBefore.length).toBe(4);
  });

  it("emits exactly one output event per print inside an if body", () => {
    // Regression: previously the outer execStatement for IfStmt re-yielded
    // output events for prints inside the branch body, so 良 was emitted twice.
    const events = collect(`
整数型: 点数 ← 72
if (点数 ≧ 80)
  print("優")
elseif (点数 ≧ 60)
  print("良")
else
  print("不可")
endif
`);
    const outputs = events.filter((e) => e.type === "output");
    expect(outputs.length).toBe(1);
    expect((outputs[0] as { text: string }).text).toBe("良");
  });

  it("yields a before-stmt on each if/elseif/else/endif keyword line for step highlight", () => {
    // Regression: previously execIf jumped straight to a matching branch body
    // without highlighting the elseif/else condition line first, and never
    // touched the endif line on exit.
    const events = collect(`
整数型: 点数 ← 30
if (点数 ≧ 80)
  print("優")
elseif (点数 ≧ 60)
  print("良")
else
  print("不可")
endif
`);
    const beforeLines = events
      .filter((e) => e.type === "before-stmt")
      .map((e) => (e as { node: { pos: { line: number } } }).node.pos.line);
    // 変数宣言 line 2, if line 3, elseif line 5, else line 7, print("不可") line 8, endif line 9
    expect(beforeLines).toEqual([2, 3, 5, 7, 8, 9]);
  });

  it("highlights endif after a matched branch body", () => {
    const events = collect(`
整数型: x ← 5
if (x > 0)
  x ← x + 1
endif
`);
    const beforeLines = events
      .filter((e) => e.type === "before-stmt")
      .map((e) => (e as { node: { pos: { line: number } } }).node.pos.line);
    // 変数宣言 line 2, if line 3, body line 4, endif line 5
    expect(beforeLines).toEqual([2, 3, 4, 5]);
  });

  it("highlights endwhile after the exit check", () => {
    const events = collect(`
整数型: i ← 0
while (i < 2)
  i ← i + 1
endwhile
`);
    const beforeLines = events
      .filter((e) => e.type === "before-stmt")
      .map((e) => (e as { node: { pos: { line: number } } }).node.pos.line);
    // decl(2), while(3), body(4), while(3), body(4), while(3) exit, endwhile(5)
    expect(beforeLines).toEqual([2, 3, 4, 3, 4, 3, 5]);
  });

  it("highlights endfor after the exit check", () => {
    const events = collect(`
for (i を 1 から 2 まで 1 ずつ増やす)
  print(i)
endfor
`);
    const beforeLines = events
      .filter((e) => e.type === "before-stmt")
      .map((e) => (e as { node: { pos: { line: number } } }).node.pos.line);
    // for(2), body(3), for(2), body(3), for(2) exit, endfor(4)
    expect(beforeLines).toEqual([2, 3, 2, 3, 2, 4]);
  });

  it("re-emits before-stmt for the while line on each check + at exit", () => {
    const events = collect(`
整数型: i ← 0
while (i < 3)
  i ← i + 1
endwhile
`);
    const whileBefore = events.filter(
      (e) => e.type === "before-stmt" && e.node.kind === "WhileStmt",
    );
    // 3 successful checks + 1 failing check = 4 highlights on the while line
    expect(whileBefore.length).toBe(4);
  });
});

describe("interpreter: format", () => {
  it("formats values", () => {
    expect(formatValue({ type: "int", value: 42 })).toBe("42");
    expect(formatValue({ type: "bool", value: true })).toBe("true");
    expect(formatValue({ type: "string", value: "hi" })).toBe("hi");
    expect(formatValue({ type: "undefined" })).toBe("未定義");
    expect(
      formatValue({
        type: "array",
        base: "int",
        elements: [
          { type: "int", value: 1 },
          { type: "int", value: 2 },
        ],
      }),
    ).toBe("{1, 2}");
  });
});
