import type { Position } from "./ast";
import { PseudoLexError } from "./errors";

export type TokenKind =
  | "INT"
  | "FLOAT"
  | "STRING"
  | "TRUE"
  | "FALSE"
  | "UNDEFINED"
  | "IDENT"
  | "KW_IF"
  | "KW_THEN"
  | "KW_ELSEIF"
  | "KW_ELSE"
  | "KW_ENDIF"
  | "KW_WHILE"
  | "KW_ENDWHILE"
  | "KW_FOR"
  | "KW_ENDFOR"
  | "KW_RETURN"
  | "KW_AND"
  | "KW_OR"
  | "KW_NOT"
  | "KW_MOD"
  | "KW_FROM"
  | "KW_TO"
  | "KW_STEP"
  | "KW_INC"
  | "KW_DEC"
  | "KW_WO"
  | "TY_INT"
  | "TY_FLOAT"
  | "TY_STRING"
  | "TY_BOOL"
  | "KW_ARRAY_OF"
  | "ASSIGN"
  | "PLUS"
  | "MINUS"
  | "MUL"
  | "DIV"
  | "EQ"
  | "NEQ"
  | "LT"
  | "LE"
  | "GT"
  | "GE"
  | "LPAREN"
  | "RPAREN"
  | "LBRACE"
  | "RBRACE"
  | "LBRACK"
  | "RBRACK"
  | "COMMA"
  | "COLON"
  | "MARKER_FUNC"
  | "EOF";

export interface Token {
  kind: TokenKind;
  value: string;
  pos: Position;
}

const ENGLISH_KEYWORDS: Record<string, TokenKind> = {
  if: "KW_IF",
  then: "KW_THEN",
  elseif: "KW_ELSEIF",
  else: "KW_ELSE",
  endif: "KW_ENDIF",
  while: "KW_WHILE",
  endwhile: "KW_ENDWHILE",
  for: "KW_FOR",
  endfor: "KW_ENDFOR",
  return: "KW_RETURN",
  and: "KW_AND",
  or: "KW_OR",
  not: "KW_NOT",
  mod: "KW_MOD",
  true: "TRUE",
  false: "FALSE",
};

const JP_KEYWORDS: Array<{ str: string; kind: TokenKind }> = [
  { str: "未定義の値", kind: "UNDEFINED" },
  { str: "整数型", kind: "TY_INT" },
  { str: "実数型", kind: "TY_FLOAT" },
  { str: "文字列型", kind: "TY_STRING" },
  { str: "論理型", kind: "TY_BOOL" },
  { str: "の配列", kind: "KW_ARRAY_OF" },
  { str: "増やす", kind: "KW_INC" },
  { str: "減らす", kind: "KW_DEC" },
  { str: "から", kind: "KW_FROM" },
  { str: "まで", kind: "KW_TO" },
  { str: "ずつ", kind: "KW_STEP" },
  { str: "を", kind: "KW_WO" },
];

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isAsciiIdentStart(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    ch === "_"
  );
}

function isAsciiIdentCont(ch: string): boolean {
  return isAsciiIdentStart(ch) || isDigit(ch);
}

function isKanjiOrKatakana(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  // CJK Unified Ideographs
  if (code >= 0x4e00 && code <= 0x9fff) return true;
  // Katakana
  if (code >= 0x30a0 && code <= 0x30ff) return true;
  return false;
}

function isJpIdentStart(ch: string): boolean {
  return isKanjiOrKatakana(ch);
}

function isJpIdentCont(ch: string): boolean {
  return isKanjiOrKatakana(ch) || isDigit(ch);
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const currentPos = (): Position => ({ line, column });

  const advance = (n = 1) => {
    for (let k = 0; k < n; k++) {
      const ch = source[i];
      if (ch === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
      i++;
    }
  };

  const startsWith = (s: string): boolean => {
    return source.startsWith(s, i);
  };

  while (i < source.length) {
    const startPos = currentPos();
    const ch = source[i];

    // Whitespace (including newlines — statements are newline-terminated but
    // the parser is whitespace-insensitive because it uses tokens directly)
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      advance();
      continue;
    }

    // Comments: // ... to end of line
    if (startsWith("//")) {
      while (i < source.length && source[i] !== "\n") advance();
      continue;
    }
    // Comments: /* ... */
    if (startsWith("/*")) {
      advance(2);
      while (i < source.length && !startsWith("*/")) advance();
      if (i < source.length) advance(2);
      continue;
    }

    // Multi-char symbols (half-width alternatives for full-width ops)
    if (startsWith("<-")) {
      tokens.push({ kind: "ASSIGN", value: "<-", pos: startPos });
      advance(2);
      continue;
    }
    if (startsWith("!=")) {
      tokens.push({ kind: "NEQ", value: "!=", pos: startPos });
      advance(2);
      continue;
    }
    if (startsWith("<=")) {
      tokens.push({ kind: "LE", value: "<=", pos: startPos });
      advance(2);
      continue;
    }
    if (startsWith(">=")) {
      tokens.push({ kind: "GE", value: ">=", pos: startPos });
      advance(2);
      continue;
    }

    // Single-char full-width operators
    if (ch === "←") {
      tokens.push({ kind: "ASSIGN", value: "←", pos: startPos });
      advance();
      continue;
    }
    if (ch === "≠") {
      tokens.push({ kind: "NEQ", value: "≠", pos: startPos });
      advance();
      continue;
    }
    if (ch === "≦") {
      tokens.push({ kind: "LE", value: "≦", pos: startPos });
      advance();
      continue;
    }
    if (ch === "≧") {
      tokens.push({ kind: "GE", value: "≧", pos: startPos });
      advance();
      continue;
    }

    // Single-char symbols
    const singleSymbol: Record<string, TokenKind> = {
      "(": "LPAREN",
      ")": "RPAREN",
      "{": "LBRACE",
      "}": "RBRACE",
      "[": "LBRACK",
      "]": "RBRACK",
      ",": "COMMA",
      ":": "COLON",
      "：": "COLON",
      "+": "PLUS",
      "-": "MINUS",
      "*": "MUL",
      "/": "DIV",
      "=": "EQ",
      "<": "LT",
      ">": "GT",
      "○": "MARKER_FUNC",
    };
    if (ch in singleSymbol) {
      tokens.push({ kind: singleSymbol[ch], value: ch, pos: startPos });
      advance();
      continue;
    }

    // Numbers
    if (isDigit(ch)) {
      let start = i;
      while (i < source.length && isDigit(source[i])) advance();
      let isFloat = false;
      if (i < source.length && source[i] === "." && isDigit(source[i + 1])) {
        isFloat = true;
        advance();
        while (i < source.length && isDigit(source[i])) advance();
      }
      const value = source.slice(start, i);
      tokens.push({
        kind: isFloat ? "FLOAT" : "INT",
        value,
        pos: startPos,
      });
      continue;
    }

    // Strings
    if (ch === '"') {
      advance();
      let value = "";
      while (i < source.length && source[i] !== '"') {
        if (source[i] === "\\") {
          advance();
          const esc = source[i];
          const map: Record<string, string> = {
            n: "\n",
            t: "\t",
            r: "\r",
            "\\": "\\",
            '"': '"',
          };
          value += map[esc] ?? esc;
          advance();
        } else {
          value += source[i];
          advance();
        }
      }
      if (i >= source.length) {
        throw new PseudoLexError(
          "文字列リテラルが閉じられていません (`\"` が不足)",
          startPos,
        );
      }
      advance(); // closing "
      tokens.push({ kind: "STRING", value, pos: startPos });
      continue;
    }

    // Japanese keywords (multi-char). Try before identifier consumption.
    let matched = false;
    for (const kw of JP_KEYWORDS) {
      if (startsWith(kw.str)) {
        tokens.push({ kind: kw.kind, value: kw.str, pos: startPos });
        advance(kw.str.length);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Identifiers (ASCII or Kanji/Katakana)
    if (isAsciiIdentStart(ch)) {
      const start = i;
      while (i < source.length && isAsciiIdentCont(source[i])) advance();
      const value = source.slice(start, i);
      const keyword = ENGLISH_KEYWORDS[value];
      tokens.push({
        kind: keyword ?? "IDENT",
        value,
        pos: startPos,
      });
      continue;
    }
    if (isJpIdentStart(ch)) {
      const start = i;
      while (i < source.length && isJpIdentCont(source[i])) advance();
      const value = source.slice(start, i);
      tokens.push({ kind: "IDENT", value, pos: startPos });
      continue;
    }

    throw new PseudoLexError(
      `予期しない文字 '${ch}' です`,
      startPos,
    );
  }

  tokens.push({ kind: "EOF", value: "", pos: currentPos() });
  return tokens;
}
