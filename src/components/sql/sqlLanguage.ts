import { StreamLanguage } from "@codemirror/language";

/**
 * CodeMirror の SQL ハイライト。
 *
 * `@codemirror/lang-sql` を入れないのは、既存の 2 言語
 * (`components/fe/pseudoLanguage.ts` / `components/joho1/joho1Language.ts`) が
 * 手書きの StreamLanguage で揃っていて、ここだけ外部パッケージにすると
 * ハイライトの見た目が揃わないため。
 *
 * 日本語識別子の判定は `pseudoLanguage.ts` と同じ範囲を使う
 * (過去問の識別子は「商品番号」「在庫」のように漢字・カタカナで書かれる)。
 */

const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC",
  "DISTINCT", "AS", "AND", "OR", "NOT", "IN", "IS", "LIKE", "BETWEEN",
  "EXISTS", "UNION", "ALL", "EXCEPT", "INTERSECT", "JOIN", "INNER", "LEFT",
  "RIGHT", "FULL", "OUTER", "CROSS", "ON",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "VIEW", "PRIMARY", "KEY", "UNIQUE", "FOREIGN",
  "REFERENCES", "CHECK", "CONSTRAINT", "DEFAULT",
  "GRANT", "REVOKE", "TO", "PUBLIC", "WITH", "OPTION",
  "DECLARE", "CURSOR", "FETCH", "OPEN", "CLOSE", "COMMIT", "ROLLBACK",
]);

/** 集約関数は色を分けて「ここが集約」と分かるようにする */
const FUNCTIONS = new Set(["COUNT", "SUM", "AVG", "MAX", "MIN"]);

/*
 * 返すトークン名は `@lezer/highlight` の tags に存在するものだけにすること。
 *
 * **`function` はタグではなく修飾子**なので、単体で返すと
 * 「Modifier function used at start of tag」を console.warn する
 * (`@codemirror/language` の `createTokenType`)。基底タグを先に書いて
 * `variableName.function` とすれば通る。
 *
 * なお `type` や `variable` のような CodeMirror 5 時代の名前は、
 * `defaultTable` が `typeName` / `variableName` へ正式にマッピングしているので
 * そのまま使える (`pseudoLanguage.ts` はこの経路)。**別名にあるかタグにあるかの
 * どちらかを確認してから足すこと。** どちらでもない名前は
 * 「Unknown highlighting tag」を warn する。
 *
 * いずれも E2E の「console warning ゼロ」で落ちるので、気づかず入ることはない。
 */
const AGGREGATE_TAG = "variableName.function";

const ATOMS = new Set(["NULL", "TRUE", "FALSE"]);

const TYPES = new Set([
  "CHAR", "VARCHAR", "VARCHAR2", "TEXT", "NCHAR",
  "INT", "INTEGER", "SMALLINT", "BIGINT", "DECIMAL", "NUMERIC",
  "REAL", "FLOAT", "DOUBLE", "DATE", "TIMESTAMP", "DATETIME",
]);

function isCjk(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0x4e00 && code <= 0x9fff) return true; // CJK 統合漢字
  if (code >= 0x3005 && code <= 0x3006) return true; // 々 〆
  if (code >= 0x30a0 && code <= 0x30ff) return true; // カタカナ
  if (code >= 0xff10 && code <= 0xff5a) return true; // 全角英数
  return false;
}

export const sqlLanguage = StreamLanguage.define({
  name: "sql",
  startState() {
    return { inBlockComment: false };
  },
  token(stream, state: { inBlockComment: boolean }) {
    // 複数行にまたがるブロックコメントは状態で追う
    if (state.inBlockComment) {
      while (!stream.eol()) {
        if (stream.match("*/")) {
          state.inBlockComment = false;
          return "comment";
        }
        stream.next();
      }
      return "comment";
    }

    if (stream.eatSpace()) return null;

    if (stream.match("--")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/*")) {
      state.inBlockComment = true;
      while (!stream.eol()) {
        if (stream.match("*/")) {
          state.inBlockComment = false;
          return "comment";
        }
        stream.next();
      }
      return "comment";
    }

    // 文字列リテラル。'' はエスケープなので閉じたと見なさない
    if (stream.match(/^'(?:[^']|'')*'/)) return "string";
    // 閉じていない文字列も行末まで文字列として色付けする (書きかけの状態)
    if (stream.match(/^'[^']*$/)) return "string";

    // 区切り識別子
    if (stream.match(/^"(?:[^"])*"/)) return "variableName";

    if (stream.match(/^\d+(\.\d+)?/)) return "number";

    if (stream.match(/^(<>|!=|<=|>=|\|\|)/)) return "operator";
    if (stream.match(/^[=<>+\-*/]/)) return "operator";
    if (stream.match(/^[(),.;]/)) return "punctuation";

    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      const upper = stream.current().toUpperCase();
      if (FUNCTIONS.has(upper)) return AGGREGATE_TAG;
      if (ATOMS.has(upper)) return "atom";
      if (KEYWORDS.has(upper)) return "keyword";
      if (TYPES.has(upper)) return "typeName";
      return "variableName";
    }

    if (isCjk(stream.peek() ?? "")) {
      while (!stream.eol() && isCjk(stream.peek() ?? "")) stream.next();
      return "variableName";
    }

    stream.next();
    return null;
  },
  tokenTable: {},
  languageData: {
    commentTokens: { line: "--", block: { open: "/*", close: "*/" } },
  },
});
