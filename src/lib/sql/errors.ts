import type { Position } from "./ast";

/**
 * エラーは `src/lib/pseudo/errors.ts` と同じ形にそろえている
 * (`message` は表示用、`detail` は位置とヒントを含まない素の文言)。
 * UI 側が message から接頭辞を正規表現で剥がす実装にならないようにするため。
 */

export class SqlLexError extends Error {
  readonly pos: Position;
  readonly hint: string | undefined;
  readonly detail: string;
  constructor(message: string, pos: Position, hint?: string) {
    const hintText = hint ? `\nヒント: ${hint}` : "";
    super(`${pos.line}行目 ${pos.column}文字目: ${message}${hintText}`);
    this.name = "SqlLexError";
    this.pos = pos;
    this.hint = hint;
    this.detail = message;
  }
}

export class SqlParseError extends Error {
  readonly pos: Position;
  readonly hint: string | undefined;
  readonly detail: string;
  constructor(message: string, pos: Position, hint?: string) {
    const hintText = hint ? `\nヒント: ${hint}` : "";
    super(`${pos.line}行目: ${message}${hintText}`);
    this.name = "SqlParseError";
    this.pos = pos;
    this.hint = hint;
    this.detail = message;
  }
}

/**
 * **試験範囲ではあるが、このツールでは実行できない**構文にぶつかったときのエラー。
 *
 * 無言の構文エラーにしないために専用の型を立てている。過去問 22 問中 4〜5 問が
 * ここ (カーソル 2 / GRANT 2〜3) なので、「書き方が間違っている」ではなく
 * 「実行の対象外なので解説を読んでほしい」と伝える必要がある
 * (docs/wip/20260815-fe-sql/00-overview.md §2-3)。
 */
export type SqlUnsupportedTopic = "grant" | "cursor" | "transaction" | "other";

export class SqlUnsupportedError extends Error {
  readonly pos: Position;
  readonly topic: SqlUnsupportedTopic;
  /** 解説ページへのパス。UI がリンクとして出す */
  readonly lessonPath: string | null;
  readonly detail: string;
  constructor(
    topic: SqlUnsupportedTopic,
    message: string,
    pos: Position,
    lessonPath: string | null,
  ) {
    super(`${pos.line}行目: ${message}`);
    this.name = "SqlUnsupportedError";
    this.topic = topic;
    this.pos = pos;
    this.lessonPath = lessonPath;
    this.detail = message;
  }
}

export type SqlRuntimeErrorKind =
  | "UNKNOWN_TABLE"
  | "UNKNOWN_COLUMN"
  | "AMBIGUOUS_COLUMN"
  | "TYPE_MISMATCH"
  | "DIVISION_BY_ZERO"
  /** GROUP BY に無い非集約列を SELECT / HAVING に書いた。標準 SQL ではエラー */
  | "NOT_GROUPED"
  /** 集約関数を WHERE に書いた (WHERE はグループ化の前に評価される) */
  | "AGGREGATE_IN_WHERE"
  /** スカラ副問合せが 2 行以上返した */
  | "SUBQUERY_RETURNED_MULTIPLE_ROWS"
  /** 副問合せの列数が文脈に合わない */
  | "SUBQUERY_COLUMN_COUNT"
  | "COLUMN_COUNT_MISMATCH"
  | "DUPLICATE_TABLE"
  | "UNIQUE_VIOLATION"
  | "NOT_NULL_VIOLATION"
  | "FOREIGN_KEY_VIOLATION"
  | "CHECK_VIOLATION"
  | "ROW_LIMIT_EXCEEDED";

export class SqlRuntimeError extends Error {
  readonly kind: SqlRuntimeErrorKind;
  readonly pos: Position;
  readonly hint: string | undefined;
  readonly detail: string;
  /**
   * 制約違反のとき、どの行が引っかかったか。
   * 「エラー文言だけで終わらせず表の上で指す」ための情報
   * (docs/wip/20260815-fe-sql/01-implementation-design.md §3-3)。
   */
  readonly offendingRowIndex: number | undefined;
  /**
   * その行が **どの表の** 行か。
   * **行番号だけでは足りない。** 表名が無いと UI は全部の表の同じ行番号を
   * 光らせることになり、在庫表の 3 行目で落ちたのに商品表の 3 行目まで赤くなる。
   */
  readonly offendingTable: string | undefined;
  constructor(
    kind: SqlRuntimeErrorKind,
    message: string,
    pos: Position,
    options?: {
      hint?: string;
      offendingRowIndex?: number;
      offendingTable?: string;
    },
  ) {
    const hint = options?.hint;
    const hintText = hint ? `\nヒント: ${hint}` : "";
    super(`${message}${hintText}`);
    this.name = "SqlRuntimeError";
    this.kind = kind;
    this.pos = pos;
    this.hint = hint;
    this.detail = message;
    this.offendingRowIndex = options?.offendingRowIndex;
    this.offendingTable = options?.offendingTable;
  }
}
