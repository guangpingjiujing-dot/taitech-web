import { describe, expect, it } from "vitest";
import { tokenize } from "./lexer";
import { PseudoLexError } from "./errors";

/** tokenize が投げた PseudoLexError を返す。投げなければテストを失敗させる */
function lexErr(source: string): PseudoLexError {
  try {
    tokenize(source);
  } catch (e) {
    if (e instanceof PseudoLexError) return e;
    throw e;
  }
  throw new Error(`tokenize(${JSON.stringify(source)}) did not throw`);
}

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

  it("rejects hiragana identifiers with a dedicated message", () => {
    const err = lexErr("文字列型： あいさつ");
    // 名前全体を名指しし、カタカナ化した候補まで出す
    expect(err.message).toContain("ひらがなは使えません: 'あいさつ'");
    expect(err.message).toContain("'あいさつ' → 'アイサツ'");
    // 位置は違反文字ではなく名前の先頭を指す
    expect(err.pos).toEqual({ line: 1, column: 7 });
  });

  it("points at the head of a mixed kanji+hiragana identifier", () => {
    const err = lexErr("挨拶する ← 1");
    expect(err.message).toContain("ひらがなは使えません: '挨拶する'");
    // 混在名は送り仮名を落とす。'挨拶スル' のような機械的カタカナ化はしない
    expect(err.message).toContain("'挨拶する' → '挨拶'");
    expect(err.pos).toEqual({ line: 1, column: 1 });
  });

  it("omits the example when the rewrite would not be a valid identifier", () => {
    // 後方スキャンが数字まで遡るため word は '1あ'。'1' は識別子として不正
    const err = lexErr("1あ");
    expect(err.message).toContain("ひらがなは使えません: '1あ'");
    expect(err.message).not.toContain("→");
  });

  it("does not flag hiragana inside string literals or comments", () => {
    expect(() =>
      tokenize(
        [
          '文字列型: 挨拶 ← "こんにちは"',
          "// ここに説明を書く",
          "/* あいさつを表示する */",
          "print(挨拶)",
        ].join("\n"),
      ),
    ).not.toThrow();
  });

  it("keeps the generic message for non-hiragana unexpected chars", () => {
    expect(() => tokenize("x ← @")).toThrow(/予期しない文字 '@' です/);
    // 濁点単体 ゛(U+309B) は「ひらがな」とは呼ばない
    expect(() => tokenize("x ← ゛")).toThrow(/予期しない文字 '゛' です/);
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
