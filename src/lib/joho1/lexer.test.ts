import { describe, expect, it } from "vitest";
import { tokenize, type TokenKind } from "./lexer";
import { PseudoLexError } from "@/lib/pseudo/errors";

/** 検証しやすいように kind だけ並べる (INDENT/DEDENT/NEWLINE も含む) */
function kinds(src: string): TokenKind[] {
  return tokenize(src).map((t) => t.kind);
}

/** 位置情報とレイアウトを除いた「意味のあるトークン」だけ */
function values(src: string): string[] {
  return tokenize(src)
    .filter(
      (t) =>
        t.kind !== "NEWLINE" &&
        t.kind !== "INDENT" &&
        t.kind !== "DEDENT" &&
        t.kind !== "EOF",
    )
    .map((t) => t.value);
}

describe("joho1 lexer: 基本", () => {
  it("代入と数値", () => {
    expect(values("kingaku = 46")).toEqual(["kingaku", "=", "46"]);
    expect(kinds("kingaku = 46")).toEqual(["IDENT", "ASSIGN", "INT", "NEWLINE", "EOF"]);
  });

  it("複数代入 (実物: 試作問題 図1 / 令和7年度追試験 図4)", () => {
    expect(values("maisu = 0, nokori = kingaku")).toEqual([
      "maisu", "=", "0", ",", "nokori", "=", "kingaku",
    ]);
  });

  it("配列リテラル", () => {
    expect(values("Kouka = [1,5,10,50,100]")).toEqual([
      "Kouka", "=", "[", "1", ",", "5", ",", "10", ",", "50", ",", "100", "]",
    ]);
  });

  it("文字列の中身は正規化しない", () => {
    // 全角の `：` や `，` が出力に出るので、中まで半角化すると表示が変わる
    const toks = tokenize('表示する("体験時間", taiken, "分間：")');
    const strings = toks.filter((t) => t.kind === "STRING").map((t) => t.value);
    expect(strings).toEqual(["体験時間", "分間："]);
  });
});

describe("joho1 lexer: 全角と半角の揺れ", () => {
  // 試作問題は全角 (`＜` `＋`)、本試験 2 回は半角。入力は両方受ける
  it("全角の演算子を半角に寄せる", () => {
    expect(kinds("a ＝ b ＋ c")).toEqual([
      "IDENT", "ASSIGN", "IDENT", "PLUS", "IDENT", "NEWLINE", "EOF",
    ]);
    expect(kinds("もし a ＜ b ならば:")).toEqual([
      "KW_IF", "IDENT", "LT", "IDENT", "KW_THEN", "COLON", "NEWLINE", "EOF",
    ]);
  });

  it("全角のコロン・カッコ・カンマ", () => {
    expect(kinds("表示する（a，b）：")).toEqual([
      "IDENT", "LPAREN", "IDENT", "COMMA", "IDENT", "RPAREN", "COLON",
      "NEWLINE", "EOF",
    ]);
  });

  it("÷ と ％ は演算子として扱う", () => {
    expect(kinds("a = 46 ÷ 10")).toEqual([
      "IDENT", "ASSIGN", "INT", "DIV", "INT", "NEWLINE", "EOF",
    ]);
    expect(kinds("a = 46 ％ 10")).toEqual([
      "IDENT", "ASSIGN", "INT", "MOD", "INT", "NEWLINE", "EOF",
    ]);
  });

  it("PDF からコピペした en dash を マイナスとして読む", () => {
    expect(kinds("a = Touchaku[i – 1]")).toEqual([
      "IDENT", "ASSIGN", "IDENT", "LBRACK", "IDENT", "MINUS", "INT", "RBRACK",
      "NEWLINE", "EOF",
    ]);
  });
});

describe("joho1 lexer: キーワードと識別子の切り分け", () => {
  // ここが `/joho1` レキサの最重要ポイント。
  // `表示する` はひらがなを含む関数名だが、`を` `から` `まで` `ずつ` はキーワード
  it("ひらがなを含む関数名を 1 つの識別子として読む", () => {
    const toks = tokenize("表示する(maisu)");
    expect(toks[0]).toMatchObject({ kind: "IDENT", value: "表示する" });
  });

  it("実物の外部関数名を識別子として読む", () => {
    expect(values("kyakusu = 要素数(Touchaku)")).toEqual([
      "kyakusu", "=", "要素数", "(", "Touchaku", ")",
    ]);
    expect(values("Kaishi[i] = 最大値(a, b)")).toContain("最大値");
  });

  it("識別子の直後のキーワードで切る", () => {
    // 日本語の変数名が来ても `を` に食い込まない
    expect(values("合計 を 1 から 5 まで 1 ずつ増やしながら繰り返す:")).toEqual([
      "合計", "を", "1", "から", "5", "まで", "1", "ずつ",
      "増やしながら繰り返す", ":",
    ]);
  });

  it("順次繰返し (実物: 令和8年度本試験 図3)", () => {
    expect(kinds("taiken を 1 から 15 まで 1 ずつ増やしながら繰り返す：")).toEqual([
      "IDENT", "KW_WO", "INT", "KW_FROM", "INT", "KW_TO", "INT", "KW_STEP",
      "KW_LOOP_INC", "COLON", "NEWLINE", "EOF",
    ]);
  });

  it("減らす方向 (実物: 試作問題 図1)", () => {
    expect(kinds("i を 4 から 0 まで 1 ずつ減らしながら繰り返す：")).toEqual([
      "IDENT", "KW_WO", "INT", "KW_FROM", "INT", "KW_TO", "INT", "KW_STEP",
      "KW_LOOP_DEC", "COLON", "NEWLINE", "EOF",
    ]);
  });

  it("条件繰返し (実物: 令和8年度本試験 問4)", () => {
    expect(kinds("(taiken <= 15) and (saichou < 10) の間繰り返す：")).toEqual([
      "LPAREN", "IDENT", "LE", "INT", "RPAREN", "KW_AND",
      "LPAREN", "IDENT", "LT", "INT", "RPAREN", "KW_LOOP_WHILE", "COLON",
      "NEWLINE", "EOF",
    ]);
  });

  it("== は代入の = と別トークン (実物: 令和7年度追試験)", () => {
    expect(kinds("もし Shurui[i] == 1 ならば:")).toEqual([
      "KW_IF", "IDENT", "LBRACK", "IDENT", "RBRACK", "EQ", "INT", "KW_THEN",
      "COLON", "NEWLINE", "EOF",
    ]);
  });

  it("そうでなければ (実物: 令和7年度追試験 図4)", () => {
    expect(kinds("そうでなければ:")).toEqual([
      "KW_ELSE", "COLON", "NEWLINE", "EOF",
    ]);
  });
});

describe("joho1 lexer: インデントによるブロック", () => {
  it("INDENT / DEDENT を出す", () => {
    const src = `もし a == 1 ならば:
  b = 1
c = 2`;
    expect(kinds(src)).toEqual([
      "KW_IF", "IDENT", "EQ", "INT", "KW_THEN", "COLON", "NEWLINE",
      "INDENT", "IDENT", "ASSIGN", "INT", "NEWLINE",
      "DEDENT", "IDENT", "ASSIGN", "INT", "NEWLINE",
      "EOF",
    ]);
  });

  it("入れ子の DEDENT をまとめて閉じる", () => {
    const src = `i を 1 から 3 まで 1 ずつ増やしながら繰り返す:
  もし a == 1 ならば:
    b = 1
c = 2`;
    const k = kinds(src);
    expect(k.filter((x) => x === "INDENT")).toHaveLength(2);
    expect(k.filter((x) => x === "DEDENT")).toHaveLength(2);
  });

  it("末尾で開いたままのブロックを閉じる", () => {
    const src = `もし a == 1 ならば:
  b = 1`;
    expect(kinds(src).slice(-2)).toEqual(["DEDENT", "EOF"]);
  });

  it("空行はブロック構造に影響しない", () => {
    const src = `もし a == 1 ならば:

  b = 1
`;
    expect(kinds(src).filter((x) => x === "INDENT")).toHaveLength(1);
  });

  it("揃っていないインデントはエラーにする", () => {
    const src = `もし a == 1 ならば:
    b = 1
  c = 2`;
    expect(() => tokenize(src)).toThrow(PseudoLexError);
  });
});

describe("joho1 lexer: 括弧の中の折り返し", () => {
  // 実物の試験でも 表示する( と 配列リテラル [ が複数行に折り返されている
  it("表示する(...) の途中の改行を無視する", () => {
    const src = `表示する("体験時間", taiken, "分間：",
        "最長待ち時間", saichou, "分間")`;
    const k = kinds(src);
    expect(k.filter((x) => x === "NEWLINE")).toHaveLength(1);
    expect(k).not.toContain("INDENT");
  });

  it("配列リテラルの折り返しを無視する (実物: 令和7年度追試験 図6)", () => {
    const src = `Namae = ["可燃ごみ", "不燃ごみ", "ペットボトル",
          "かん", "びん", "金属", "落ち葉"]`;
    const toks = tokenize(src);
    expect(toks.filter((t) => t.kind === "STRING")).toHaveLength(7);
    expect(toks.filter((t) => t.kind === "NEWLINE")).toHaveLength(1);
  });
});

describe("joho1 lexer: エラー", () => {
  it("閉じていない文字列", () => {
    expect(() => tokenize('表示する("あ)')).toThrow(/文字列が閉じられていません/);
  });

  it("読み取れない文字", () => {
    expect(() => tokenize("a = 1 @ 2")).toThrow(/読み取れない文字/);
  });

  it("位置情報を持つ", () => {
    try {
      tokenize("a = 1 @ 2");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(PseudoLexError);
      expect((e as PseudoLexError).pos).toEqual({ line: 1, column: 7 });
    }
  });
});
