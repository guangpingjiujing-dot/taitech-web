import { describe, expect, it } from "vitest";
import { tokenize } from "./lexer";
import { PseudoLexError } from "./errors";

describe("lexer", () => {
  it("tokenizes integer literals with position", () => {
    const tokens = tokenize("42");
    expect(tokens[0]).toMatchObject({
      kind: "INT",
      value: "42",
      pos: { line: 1, column: 1 },
    });
    expect(tokens[1].kind).toBe("EOF");
  });

  it("tokenizes float literals", () => {
    const tokens = tokenize("3.14");
    expect(tokens[0]).toMatchObject({ kind: "FLOAT", value: "3.14" });
  });

  it("tokenizes string literals with escapes", () => {
    const tokens = tokenize('"hello\\nworld"');
    expect(tokens[0]).toMatchObject({ kind: "STRING", value: "hello\nworld" });
  });

  it("errors on unterminated string", () => {
    expect(() => tokenize('"abc')).toThrow(PseudoLexError);
  });

  it("recognises full-width and half-width assignment", () => {
    const full = tokenize("x ← 1");
    const half = tokenize("x <- 1");
    expect(full[1].kind).toBe("ASSIGN");
    expect(half[1].kind).toBe("ASSIGN");
  });

  it("recognises comparison operators (full/half)", () => {
    const t = tokenize("a ≠ b ≦ c ≧ d != e <= f >= g");
    const kinds = t.map((x) => x.kind);
    expect(kinds).toEqual([
      "IDENT",
      "NEQ",
      "IDENT",
      "LE",
      "IDENT",
      "GE",
      "IDENT",
      "NEQ",
      "IDENT",
      "LE",
      "IDENT",
      "GE",
      "IDENT",
      "EOF",
    ]);
  });

  it("recognises type keywords and の配列", () => {
    const t = tokenize("整数型の配列: arr");
    expect(t.map((x) => x.kind)).toEqual([
      "TY_INT",
      "KW_ARRAY_OF",
      "COLON",
      "IDENT",
      "EOF",
    ]);
  });

  it("recognises for-loop Japanese keywords", () => {
    const t = tokenize("for (i を 1 から n まで 1 ずつ増やす)");
    const kinds = t.map((x) => x.kind);
    expect(kinds).toEqual([
      "KW_FOR",
      "LPAREN",
      "IDENT",
      "KW_WO",
      "INT",
      "KW_FROM",
      "IDENT",
      "KW_TO",
      "INT",
      "KW_STEP",
      "KW_INC",
      "RPAREN",
      "EOF",
    ]);
  });

  it("recognises English keywords", () => {
    const t = tokenize("if while for return and or not mod true false");
    expect(t.map((x) => x.kind)).toEqual([
      "KW_IF",
      "KW_WHILE",
      "KW_FOR",
      "KW_RETURN",
      "KW_AND",
      "KW_OR",
      "KW_NOT",
      "KW_MOD",
      "TRUE",
      "FALSE",
      "EOF",
    ]);
  });

  it("recognises 未定義の値", () => {
    const t = tokenize("x ← 未定義の値");
    expect(t[2].kind).toBe("UNDEFINED");
  });

  it("skips single-line and multi-line comments", () => {
    const t = tokenize(`
      // this is a comment
      x /* inline */ ← 1
    `);
    expect(t.map((x) => x.kind)).toEqual([
      "IDENT",
      "ASSIGN",
      "INT",
      "EOF",
    ]);
  });

  it("tracks line/column position across newlines", () => {
    const t = tokenize("x\ny");
    expect(t[0].pos).toEqual({ line: 1, column: 1 });
    expect(t[1].pos).toEqual({ line: 2, column: 1 });
  });

  it("allows Kanji identifiers", () => {
    const t = tokenize("整数型: 合計 ← 0");
    expect(t.map((x) => x.kind)).toEqual([
      "TY_INT",
      "COLON",
      "IDENT",
      "ASSIGN",
      "INT",
      "EOF",
    ]);
    expect(t[2].value).toBe("合計");
  });

  it("recognises ○ marker for function/procedure", () => {
    const t = tokenize("○整数型: f()");
    expect(t.map((x) => x.kind)).toEqual([
      "MARKER_FUNC",
      "TY_INT",
      "COLON",
      "IDENT",
      "LPAREN",
      "RPAREN",
      "EOF",
    ]);
  });
});
