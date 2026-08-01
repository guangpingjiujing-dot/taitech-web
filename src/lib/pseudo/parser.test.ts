import { describe, expect, it } from "vitest";
import { parse } from "./parser";
import { PseudoParseError } from "./errors";

describe("parser: variable declarations", () => {
  it("parses single variable with init", () => {
    const ast = parse("整数型: x ← 0");
    expect(ast.body).toHaveLength(1);
    const decl = ast.body[0];
    expect(decl.kind).toBe("VarDecl");
    if (decl.kind === "VarDecl") {
      expect(decl.varType).toEqual({ base: "int", isArray: false });
      expect(decl.bindings).toHaveLength(1);
      expect(decl.bindings[0].name).toBe("x");
      expect(decl.bindings[0].init?.kind).toBe("IntLit");
    }
  });

  it("parses multiple variables", () => {
    const ast = parse("整数型: x, y ← 3, z");
    const decl = ast.body[0];
    expect(decl.kind).toBe("VarDecl");
    if (decl.kind === "VarDecl") {
      expect(decl.bindings).toHaveLength(3);
      expect(decl.bindings[0].init).toBeNull();
      expect(decl.bindings[1].init?.kind).toBe("IntLit");
    }
  });

  it("parses array declaration with literal", () => {
    const ast = parse("整数型の配列: arr ← {1, 2, 3}");
    const decl = ast.body[0];
    expect(decl.kind).toBe("VarDecl");
    if (decl.kind === "VarDecl") {
      expect(decl.varType.isArray).toBe(true);
      expect(decl.bindings[0].init?.kind).toBe("ArrayLit");
    }
  });
});

describe("parser: expressions", () => {
  it("respects operator precedence", () => {
    const ast = parse("整数型: x ← 1 + 2 * 3");
    const decl = ast.body[0];
    if (decl.kind !== "VarDecl") throw new Error("expected VarDecl");
    const init = decl.bindings[0].init!;
    if (init.kind !== "BinaryOp") throw new Error("expected BinaryOp");
    expect(init.op).toBe("+");
    if (init.right.kind !== "BinaryOp") throw new Error("expected nested BinaryOp");
    expect(init.right.op).toBe("*");
  });

  it("parses comparison and logical operators", () => {
    const ast = parse("整数型: x ← 1\nif (x > 0 and x < 10) then\n  x ← 5\nendif");
    expect(ast.body).toHaveLength(2);
    const ifStmt = ast.body[1];
    expect(ifStmt.kind).toBe("IfStmt");
  });

  it("parses function call", () => {
    const ast = parse("整数型: x ← f(1, 2)");
    const decl = ast.body[0];
    if (decl.kind !== "VarDecl") throw new Error();
    const init = decl.bindings[0].init!;
    expect(init.kind).toBe("Call");
    if (init.kind === "Call") {
      expect(init.callee).toBe("f");
      expect(init.args).toHaveLength(2);
    }
  });

  it("parses array index access", () => {
    const ast = parse("整数型: x ← arr[1]");
    const decl = ast.body[0];
    if (decl.kind !== "VarDecl") throw new Error();
    const init = decl.bindings[0].init!;
    expect(init.kind).toBe("IndexAccess");
  });
});

describe("parser: control flow", () => {
  it("parses if / elseif / else / endif", () => {
    const src = `
整数型: x ← 1
if (x > 0) then
  x ← 10
elseif (x = 0) then
  x ← 0
else
  x ← -1
endif
`;
    const ast = parse(src);
    const ifStmt = ast.body[1];
    expect(ifStmt.kind).toBe("IfStmt");
    if (ifStmt.kind === "IfStmt") {
      expect(ifStmt.branches).toHaveLength(2);
      expect(ifStmt.elseBody).not.toBeNull();
    }
  });

  it("parses while loop", () => {
    const src = `
整数型: i ← 0
while (i < 5)
  i ← i + 1
endwhile
`;
    const ast = parse(src);
    const w = ast.body[1];
    expect(w.kind).toBe("WhileStmt");
  });

  it("parses for loop with increment", () => {
    const src = `
整数型: 合計 ← 0
for (i を 1 から 10 まで 1 ずつ増やす)
  合計 ← 合計 + i
endfor
`;
    const ast = parse(src);
    const f = ast.body[1];
    expect(f.kind).toBe("ForStmt");
    if (f.kind === "ForStmt") {
      expect(f.iterVar).toBe("i");
      expect(f.direction).toBe("inc");
    }
  });

  it("parses for loop with decrement", () => {
    const src = `
for (i を 10 から 1 まで 1 ずつ減らす)
  i ← i
endfor
`;
    const ast = parse(src);
    const f = ast.body[0];
    if (f.kind === "ForStmt") expect(f.direction).toBe("dec");
    else throw new Error();
  });
});

describe("parser: functions and procedures", () => {
  it("parses function definition", () => {
    const src = `
○整数型: sum(整数型: a, 整数型: b)
  return a + b
`;
    const ast = parse(src);
    const f = ast.body[0];
    expect(f.kind).toBe("FuncDecl");
    if (f.kind === "FuncDecl") {
      expect(f.name).toBe("sum");
      expect(f.params).toHaveLength(2);
      expect(f.returnType.base).toBe("int");
    }
  });

  it("parses procedure definition (no return type)", () => {
    const src = `
○greet(文字列型: name)
  print(name)
`;
    const ast = parse(src);
    const p = ast.body[0];
    expect(p.kind).toBe("ProcDecl");
    if (p.kind === "ProcDecl") {
      expect(p.name).toBe("greet");
      expect(p.params[0].paramType.base).toBe("string");
    }
  });
});

describe("parser: assignment", () => {
  it("parses simple assignment", () => {
    const ast = parse("整数型: x ← 0\nx ← 5");
    const assn = ast.body[1];
    expect(assn.kind).toBe("Assignment");
  });

  it("parses array element assignment", () => {
    const ast = parse(`
整数型の配列: arr ← {0, 0, 0}
arr[1] ← 99
`);
    const assn = ast.body[1];
    expect(assn.kind).toBe("Assignment");
    if (assn.kind === "Assignment") {
      expect(assn.target.kind).toBe("IndexAccess");
    }
  });
});

describe("parser: errors", () => {
  it("errors on missing colon in var decl", () => {
    expect(() => parse("整数型 x ← 1")).toThrow(PseudoParseError);
  });

  it("errors on missing endif", () => {
    expect(() =>
      parse(`
if (1 = 1) then
  整数型: x ← 0
`),
    ).toThrow(PseudoParseError);
  });

  it("errors on assignment with non-lvalue", () => {
    expect(() => parse("1 + 2 ← 3")).toThrow(PseudoParseError);
  });
});
