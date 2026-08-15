import type { Position } from "./ast";
import { SqlLexError } from "./errors";

export type TokenKind =
  | "keyword"
  | "identifier"
  | "number"
  | "string"
  | "operator"
  | "punct"
  | "eof";

export interface Token {
  kind: TokenKind;
  /** 原文どおりの綴り。識別子の表示に使う */
  text: string;
  /**
   * キーワード判定用に大文字化した綴り。
   * SQL のキーワードは大文字小文字を区別しないので、パーサはこちらだけを見る。
   */
  upper: string;
  pos: Position;
  /** 終端の文字オフセット。Span を組むのに使う */
  end: number;
}

/**
 * FE の範囲で必要なキーワード。
 *
 * **`GRANT` / `REVOKE` / `DECLARE` / `FETCH` / `CURSOR` もここに入れている。**
 * 識別子として素通しすると意味不明な構文エラーになるので、キーワードとして
 * 認識したうえでパーサが `SqlUnsupportedError` を投げて解説へ誘導する
 * (docs/wip/20260815-fe-sql/00-overview.md §5-5)。
 */
const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC",
  "DISTINCT", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN",
  "EXISTS", "UNION", "ALL", "EXCEPT", "INTERSECT", "JOIN", "INNER", "LEFT",
  "RIGHT", "FULL", "OUTER", "CROSS", "ON", "COUNT", "SUM", "AVG", "MAX", "MIN",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "VIEW", "PRIMARY", "KEY", "UNIQUE", "FOREIGN",
  "REFERENCES", "CHECK", "CONSTRAINT", "DEFAULT",
  "TRUE", "FALSE",
  // 実行対象外。パーサが解説へ誘導するために語彙としては持つ
  "GRANT", "REVOKE", "TO", "PUBLIC", "WITH", "OPTION",
  "DECLARE", "CURSOR", "FETCH", "OPEN", "CLOSE",
  "COMMIT", "ROLLBACK", "BEGIN",
]);

/** 型名は識別子として読んでからパーサ側で解釈する (列名に使われうるので) */

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isAsciiIdentStart(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function isAsciiIdentPart(ch: string): boolean {
  return isAsciiIdentStart(ch) || isDigit(ch);
}

/**
 * 日本語の識別子。過去問の識別子は「商品番号」「在庫」のように
 * 漢字・カタカナで書かれる (H26春問28)。
 *
 * **ひらがなも許可する。** 擬似言語 (`src/lib/pseudo/lexer.ts`) はひらがなを弾いて
 * いるが、あれは `i を 1 から 5 まで` の「を」「から」「まで」がキーワードで、
 * ひらがなを識別子に許すと境界が曖昧になるため。**SQL のキーワードはすべて英字**なので
 * その問題が起きない。弾くと `SELECT ふりがな FROM 商品` が
 * 「予期しない文字 'ふ' です」になるだけで、学習者に何の利益も無い。
 */
function isCjkIdentPart(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0x3041 && code <= 0x309f) return true; // ひらがな
  if (code >= 0x4e00 && code <= 0x9fff) return true; // CJK 統合漢字
  if (code >= 0x3005 && code <= 0x3006) return true; // 々 〆
  if (code >= 0x30a0 && code <= 0x30ff) return true; // カタカナ
  if (code >= 0xff10 && code <= 0xff19) return true; // 全角数字
  if (code >= 0xff21 && code <= 0xff3a) return true; // 全角英大文字
  if (code >= 0xff41 && code <= 0xff5a) return true; // 全角英小文字
  return false;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let lineStart = 0;

  /**
   * `line` / `lineStart` は走査中に進むので、**この関数はいつ呼ぶかで結果が変わる**。
   *
   * 文字列やブロックコメントのように中に改行を含みうるトークンでは、
   * **中身を読み進める前に開始位置を捕まえておくこと**。読み終えてから呼ぶと
   * 行がずれ、`offset - lineStart + 1` が負になることすらある
   * (未終端リテラルのエラー位置がこれで壊れていた)。
   */
  const posAt = (offset: number): Position => ({
    line,
    column: offset - lineStart + 1,
    offset,
  });

  const push = (
    kind: TokenKind,
    text: string,
    start: number,
    upper?: string,
  ) => {
    tokens.push({
      kind,
      text,
      upper: upper ?? text.toUpperCase(),
      pos: posAt(start),
      end: i,
    });
  };

  while (i < source.length) {
    const ch = source[i];

    // 改行と空白
    if (ch === "\n") {
      i++;
      line++;
      lineStart = i;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "　") {
      i++;
      continue;
    }

    // 行コメント
    if (ch === "-" && source[i + 1] === "-") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    // ブロックコメント
    if (ch === "/" && source[i + 1] === "*") {
      const start = i;
      const startPos = posAt(start);
      i += 2;
      let closed = false;
      while (i < source.length) {
        if (source[i] === "*" && source[i + 1] === "/") {
          i += 2;
          closed = true;
          break;
        }
        if (source[i] === "\n") {
          line++;
          lineStart = i + 1;
        }
        i++;
      }
      if (!closed) {
        throw new SqlLexError(
          "ブロックコメントが閉じられていません",
          startPos,
          "`/*` に対応する `*/` を書いてください。",
        );
      }
      continue;
    }

    // 文字列リテラル。標準 SQL はシングルクォートで、'' がエスケープ
    if (ch === "'") {
      const start = i;
      const startPos = posAt(start);
      i++;
      let value = "";
      let closed = false;
      while (i < source.length) {
        if (source[i] === "'") {
          if (source[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i++;
          closed = true;
          break;
        }
        if (source[i] === "\n") {
          line++;
          lineStart = i + 1;
        }
        value += source[i];
        i++;
      }
      if (!closed) {
        throw new SqlLexError(
          "文字列が閉じられていません",
          startPos,
          "文字列はシングルクォートで囲みます。例: '2026-08-15'",
        );
      }
      tokens.push({
        kind: "string",
        text: value,
        upper: value,
        pos: startPos,
        end: i,
      });
      continue;
    }

    // ダブルクォートで囲んだ区切り識別子
    if (ch === '"') {
      const start = i;
      const startPos = posAt(start);
      i++;
      let value = "";
      let closed = false;
      while (i < source.length) {
        if (source[i] === '"') {
          i++;
          closed = true;
          break;
        }
        value += source[i];
        i++;
      }
      if (!closed) {
        throw new SqlLexError(
          "識別子の二重引用符が閉じられていません",
          startPos,
        );
      }
      tokens.push({
        kind: "identifier",
        text: value,
        upper: value.toUpperCase(),
        pos: startPos,
        end: i,
      });
      continue;
    }

    // 数値
    if (isDigit(ch)) {
      const start = i;
      while (i < source.length && isDigit(source[i])) i++;
      if (source[i] === "." && isDigit(source[i + 1] ?? "")) {
        i++;
        while (i < source.length && isDigit(source[i])) i++;
      }
      push("number", source.slice(start, i), start);
      continue;
    }

    // 識別子・キーワード
    if (isAsciiIdentStart(ch) || isCjkIdentPart(ch)) {
      const start = i;
      while (
        i < source.length &&
        (isAsciiIdentPart(source[i]) || isCjkIdentPart(source[i]))
      ) {
        i++;
      }
      const text = source.slice(start, i);
      const upper = text.toUpperCase();
      push(KEYWORDS.has(upper) ? "keyword" : "identifier", text, start, upper);
      continue;
    }

    // 2 文字の演算子
    const two = source.slice(i, i + 2);
    if (two === "<>" || two === "!=" || two === "<=" || two === ">=" || two === "||") {
      const start = i;
      i += 2;
      // `!=` は方言だが受け付けて `<>` に正規化する (入力の受け口は広く取る)
      push("operator", two === "!=" ? "<>" : two, start);
      continue;
    }

    // 1 文字の演算子・区切り
    if ("=<>+-*/".includes(ch)) {
      const start = i;
      i++;
      push("operator", ch, start);
      continue;
    }
    if ("(),.;".includes(ch)) {
      const start = i;
      i++;
      push("punct", ch, start);
      continue;
    }

    // 全角の記号は打ち間違いとして名指しする (日本語入力のまま書くと必ず踏む)
    const fullWidth: Record<string, string> = {
      "（": "(",
      "）": ")",
      "，": ",",
      "、": ",",
      "．": ".",
      "＝": "=",
      "＊": "*",
      "；": ";",
      "’": "'",
      "‘": "'",
    };
    if (fullWidth[ch]) {
      throw new SqlLexError(
        `全角の「${ch}」は使えません`,
        posAt(i),
        `半角の「${fullWidth[ch]}」に書き換えてください。日本語入力のままだと全角になります。`,
      );
    }

    throw new SqlLexError(`予期しない文字 '${ch}' です`, posAt(i));
  }

  tokens.push({
    kind: "eof",
    text: "",
    upper: "",
    pos: posAt(i),
    end: i,
  });
  return tokens;
}
