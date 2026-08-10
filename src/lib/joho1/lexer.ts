import type { Position } from "@/lib/pseudo/ast";
import { PseudoLexError } from "@/lib/pseudo/errors";

/**
 * 共通テスト用プログラム表記のレキサ。
 *
 * IPA 擬似言語 (`src/lib/pseudo/lexer.ts`) とは別言語なので独立実装だが、
 * **出力する AST は共有** (`src/lib/pseudo/ast.ts`)。設計は
 * docs/wip/20260807-joho1/01-implementation-design.md
 *
 * 記法の根拠は試作問題 + 令和7・8年度の本試験/ 追試験の実物 (計 10 プログラム)。
 * 仕様書は存在せず「例示」しかないので、**実物に出ていない記法は実装しない**。
 */
export type TokenKind =
  | "INT"
  | "FLOAT"
  | "STRING"
  | "IDENT"
  | "KW_IF"
  | "KW_THEN"
  | "KW_ELSE"
  | "KW_WO"
  | "KW_FROM"
  | "KW_TO"
  | "KW_STEP"
  | "KW_LOOP_INC"
  | "KW_LOOP_DEC"
  | "KW_LOOP_WHILE"
  | "KW_AND"
  | "KW_OR"
  | "KW_NOT"
  | "ASSIGN"
  | "EQ"
  | "NEQ"
  | "LT"
  | "LE"
  | "GT"
  | "GE"
  | "PLUS"
  | "MINUS"
  | "MUL"
  | "SLASH"
  | "DIV"
  | "MOD"
  | "LPAREN"
  | "RPAREN"
  | "LBRACK"
  | "RBRACK"
  | "COMMA"
  | "COLON"
  | "NEWLINE"
  | "INDENT"
  | "DEDENT"
  | "EOF";

export interface Token {
  kind: TokenKind;
  value: string;
  pos: Position;
}

/**
 * 日本語キーワード。**長い順に並べて最長一致で取る**。
 *
 * これが `/joho1` のレキサで最も重要な点。`表示する` のように
 * **ひらがなを含む関数名**が実際の試験に出る一方、`を` `から` `まで` `ずつ` も
 * キーワードなので、FE 側のように「ひらがなを識別子に使えない」と割り切れない
 * (FE の判断は docs/sections/fe-playground.md §3-1)。
 *
 * 識別子の走査中も 1 文字ごとにこの表と照合し、キーワードが始まる位置で切る
 * (`scanJapaneseIdent`)。
 */
const JP_KEYWORDS: Array<{ str: string; kind: TokenKind }> = [
  { str: "増やしながら繰り返す", kind: "KW_LOOP_INC" },
  { str: "減らしながら繰り返す", kind: "KW_LOOP_DEC" },
  { str: "そうでなければ", kind: "KW_ELSE" },
  { str: "の間繰り返す", kind: "KW_LOOP_WHILE" },
  { str: "ならば", kind: "KW_THEN" },
  { str: "もし", kind: "KW_IF" },
  { str: "ずつ", kind: "KW_STEP" },
  { str: "から", kind: "KW_FROM" },
  { str: "まで", kind: "KW_TO" },
  { str: "を", kind: "KW_WO" },
];

/** 英字のキーワード。実物で確認できたのは `and` / `or` のみ (`not` は未出現) */
const EN_KEYWORDS: Record<string, TokenKind> = {
  and: "KW_AND",
  or: "KW_OR",
  not: "KW_NOT",
};

/**
 * 全角 → 半角の正規化表。
 *
 * **試作問題は全角 (`＜` `＋`)、本試験 2 回は半角 (`<` `+`) で割れている**
 * (00-overview.md §7-4 (4))。教材の表記は半角に寄せるが、入力は両方受ける。
 * `÷` は ASCII に対応がないのでそのまま演算子として扱う。
 */
const WIDE_TO_NARROW: Record<string, string> = {
  // 全角数字。全角の記号を使う出題なら数字も全角で来る
  "０": "0",
  "１": "1",
  "２": "2",
  "３": "3",
  "４": "4",
  "５": "5",
  "６": "6",
  "７": "7",
  "８": "8",
  "９": "9",
  // smart quote をここに入れてはいけない。normalizeOutsideStrings は引用符で
  // 「文字列の内か外か」を判定しているので、置換表に入れると **判定に使われる前に
  // ただの文字として素通りし、文字列の中身まで正規化されてしまう**
  // (`表示する(“分間：”)` の `：` が `:` になる)。引用符の扱いは QUOTE_CHARS 側の役目
  "＋": "+",
  "－": "-",
  "−": "-", // U+2212 MINUS SIGN
  "–": "-", // U+2013 EN DASH。PDF からコピペすると混ざる
  // 長音記号 `ー` は入れない。カタカナ識別子 (`データ`) を壊すため
  "＊": "*",
  "×": "*",
  "／": "/",
  "％": "%",
  "＜": "<",
  "＞": ">",
  "＝": "=",
  "！": "!",
  "（": "(",
  "）": ")",
  "［": "[",
  "］": "]",
  "，": ",",
  "、": ",",
  "：": ":",
  "　": " ",
  "＿": "_",
};

const TAB_WIDTH = 4;

function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}

function isAsciiIdentStart(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
}

function isAsciiIdentPart(c: string): boolean {
  return isAsciiIdentStart(c) || isDigit(c);
}

/** 漢字・ひらがな・カタカナ。関数名 (`表示する` `要素数` `最大値`) に使われる */
function isJapaneseIdentChar(c: string): boolean {
  const code = c.codePointAt(0) ?? 0;
  return (
    (code >= 0x3041 && code <= 0x309f) || // ひらがな
    (code >= 0x30a0 && code <= 0x30ff) || // カタカナ
    (code >= 0x4e00 && code <= 0x9fff) || // CJK 統合漢字
    (code >= 0x3005 && code <= 0x3006) // 々 〆
  );
}

/**
 * 引用符として認める字。PDF からコピペすると素の `"` が smart quote に化ける。
 *
 * **これらは WIDE_TO_NARROW ではなくここで扱う。** 置換表に入れると
 * 下の内外判定より先にただの文字として素通りしてしまい、
 * smart quote で囲まれた部分が「文字列の外」と誤認されて中身まで正規化される。
 */
const QUOTE_CHARS = new Set(['"', "\u201c", "\u201d", "\u2033"]);

/**
 * 文字列リテラルの外側だけを正規化する。
 *
 * 文字列の中身は問題文の日本語 (`"可燃ごみ"` `"分間："`) なので、
 * **中まで正規化すると出力が変わってしまう**。全角文字はいずれも BMP の 1 文字なので、
 * 置換しても列番号は 1:1 でずれない (引用符の置換も 1 文字 → 1 文字)。
 */
function normalizeOutsideStrings(source: string): string {
  let out = "";
  let inString = false;
  for (const ch of source) {
    if (QUOTE_CHARS.has(ch)) {
      inString = !inString;
      out += '"';
      continue;
    }
    out += inString ? ch : (WIDE_TO_NARROW[ch] ?? ch);
  }
  return out;
}

/** 行頭のインデント幅。タブは 4 として数える */
function indentWidthOf(line: string): { width: number; offset: number } {
  let width = 0;
  let offset = 0;
  while (offset < line.length) {
    const c = line[offset];
    if (c === " ") width += 1;
    else if (c === "\t") width += TAB_WIDTH;
    else break;
    offset++;
  }
  return { width, offset };
}

export function tokenize(source: string): Token[] {
  const lines = normalizeOutsideStrings(source).split(/\r?\n/);
  const tokens: Token[] = [];
  const indents: number[] = [0];
  /**
   * 括弧の深さ。0 より大きい間は改行とインデントを無視する。
   * 実物の試験でも `表示する(` と配列リテラル `[` が複数行に折り返されている
   * (00-overview.md §7-3)。
   */
  let depth = 0;

  const push = (kind: TokenKind, value: string, line: number, column: number) =>
    tokens.push({ kind, value, pos: { line, column } });

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo];
    const lineNum = lineNo + 1;
    const { width, offset } = indentWidthOf(line);

    // 空行はブロック構造に影響しない
    if (line.slice(offset).trim() === "") continue;

    if (depth === 0) {
      const top = indents[indents.length - 1];
      if (width > top) {
        indents.push(width);
        push("INDENT", "", lineNum, offset + 1);
      } else if (width < top) {
        while (indents.length > 1 && width < indents[indents.length - 1]) {
          indents.pop();
          push("DEDENT", "", lineNum, offset + 1);
        }
        if (indents[indents.length - 1] !== width) {
          throw new PseudoLexError(
            "インデントの深さが揃っていません",
            { line: lineNum, column: offset + 1 },
            "ブロックの中の行は、同じ深さで字下げをそろえてください。",
          );
        }
      }
    }

    let i = offset;
    while (i < line.length) {
      const c = line[i];
      const column = i + 1;

      if (c === " " || c === "\t") {
        i++;
        continue;
      }

      // 文字列
      if (c === '"') {
        let j = i + 1;
        let value = "";
        while (j < line.length && line[j] !== '"') {
          value += line[j];
          j++;
        }
        if (j >= line.length) {
          throw new PseudoLexError(
            "文字列が閉じられていません",
            { line: lineNum, column },
            '文字列は "…" のように " で囲みます。',
          );
        }
        push("STRING", value, lineNum, column);
        i = j + 1;
        continue;
      }

      // 数値
      if (isDigit(c)) {
        let j = i;
        while (j < line.length && isDigit(line[j])) j++;
        let isFloat = false;
        if (j < line.length && line[j] === "." && isDigit(line[j + 1] ?? "")) {
          isFloat = true;
          j++;
          while (j < line.length && isDigit(line[j])) j++;
        }
        push(isFloat ? "FLOAT" : "INT", line.slice(i, j), lineNum, column);
        i = j;
        continue;
      }

      // 英字の識別子 / キーワード
      if (isAsciiIdentStart(c)) {
        let j = i;
        while (j < line.length && isAsciiIdentPart(line[j])) j++;
        const word = line.slice(i, j);
        const kw = EN_KEYWORDS[word];
        push(kw ?? "IDENT", word, lineNum, column);
        i = j;
        continue;
      }

      // 日本語キーワード (最長一致)
      const kw = matchKeyword(line, i);
      if (kw) {
        push(kw.kind, kw.str, lineNum, column);
        i += kw.str.length;
        continue;
      }

      // 日本語の識別子 (問題文で与えられる関数名)
      if (isJapaneseIdentChar(c)) {
        const name = scanJapaneseIdent(line, i);
        push("IDENT", name, lineNum, column);
        i += name.length;
        continue;
      }

      // 記号
      const two = line.slice(i, i + 2);
      if (two === "==") {
        push("EQ", two, lineNum, column);
        i += 2;
        continue;
      }
      if (two === "!=") {
        push("NEQ", two, lineNum, column);
        i += 2;
        continue;
      }
      if (two === "<=") {
        push("LE", two, lineNum, column);
        i += 2;
        continue;
      }
      if (two === ">=") {
        push("GE", two, lineNum, column);
        i += 2;
        continue;
      }

      const single = SINGLE_TOKENS[c];
      if (single) {
        if (c === "(" || c === "[") depth++;
        if (c === ")" || c === "]") depth = Math.max(0, depth - 1);
        push(single, c, lineNum, column);
        i++;
        continue;
      }

      throw new PseudoLexError(
        `読み取れない文字です: '${c}'`,
        { line: lineNum, column },
      );
    }

    if (depth === 0) push("NEWLINE", "", lineNum, line.length + 1);
  }

  const lastLine = lines.length;
  while (indents.length > 1) {
    indents.pop();
    push("DEDENT", "", lastLine, 1);
  }
  push("EOF", "", lastLine, 1);
  return tokens;
}

const SINGLE_TOKENS: Record<string, TokenKind> = {
  "=": "ASSIGN",
  "<": "LT",
  ">": "GT",
  "+": "PLUS",
  "-": "MINUS",
  "*": "MUL",
  "/": "SLASH",
  "÷": "DIV",
  "%": "MOD",
  "(": "LPAREN",
  ")": "RPAREN",
  "[": "LBRACK",
  "]": "RBRACK",
  ",": "COMMA",
  ":": "COLON",
};

function matchKeyword(
  line: string,
  at: number,
): { str: string; kind: TokenKind } | null {
  for (const kw of JP_KEYWORDS) {
    if (line.startsWith(kw.str, at)) return kw;
  }
  return null;
}

/**
 * 日本語の識別子を読む。**1 文字進むごとにキーワードの開始位置かを確認し、
 * キーワードが始まるところで切る**。
 *
 * これがないと `合計を` が丸ごと 1 識別子に食われる。FE 側は同じ問題を
 * 「ひらがなを識別子に使えない」と割り切って解決したが、`/joho1` は
 * `表示する` という**ひらがなを含む関数名が実際の試験に出る**ので同じ手が使えない。
 */
function scanJapaneseIdent(line: string, start: number): string {
  let j = start;
  while (j < line.length && isJapaneseIdentChar(line[j])) {
    // 先頭以外でキーワードが始まったらそこで打ち切る
    if (j > start && matchKeyword(line, j)) break;
    j++;
  }
  return line.slice(start, j);
}
