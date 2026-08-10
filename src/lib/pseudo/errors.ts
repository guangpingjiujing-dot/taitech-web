import type { Position } from "./ast";

export class PseudoLexError extends Error {
  readonly pos: Position;
  readonly hint: string | undefined;
  /**
   * 位置とヒントを含まない、素の説明文。
   *
   * `message` から接頭辞を正規表現で剥がす実装が UI 側にあったが、
   * ここのフォーマットを変えた瞬間に壊れるので、素の文言を持たせておく。
   */
  readonly detail: string;
  constructor(message: string, pos: Position, hint?: string) {
    const hintText = hint ? `\nヒント: ${hint}` : "";
    super(`${pos.line}行目 ${pos.column}文字目: ${message}${hintText}`);
    this.name = "PseudoLexError";
    this.pos = pos;
    this.hint = hint;
    this.detail = message;
  }
}

export class PseudoParseError extends Error {
  readonly pos: Position;
  readonly hint: string | undefined;
  /** 位置とヒントを含まない、素の説明文 (PseudoLexError の detail と同じ意図) */
  readonly detail: string;
  constructor(message: string, pos: Position, hint?: string) {
    const hintText = hint ? `\nヒント: ${hint}` : "";
    super(`${pos.line}行目: ${message}${hintText}`);
    this.name = "PseudoParseError";
    this.pos = pos;
    this.hint = hint;
    this.detail = message;
  }
}

export type PseudoRuntimeErrorKind =
  | "UNDEFINED_VARIABLE"
  | "TYPE_MISMATCH"
  | "DIVISION_BY_ZERO"
  | "ARRAY_INDEX_OUT_OF_BOUNDS"
  | "ARRAY_INDEX_NOT_INT"
  | "ARGUMENT_COUNT_MISMATCH"
  | "UNKNOWN_FUNCTION"
  | "STEP_LIMIT_EXCEEDED"
  | "NOT_ASSIGNABLE"
  | "NOT_CALLABLE";

export class PseudoRuntimeError extends Error {
  readonly kind: PseudoRuntimeErrorKind;
  readonly pos: Position;
  readonly hint: string | undefined;
  /** 位置とヒントを含まない、素の説明文 (PseudoLexError の detail と同じ意図) */
  readonly detail: string;
  constructor(
    kind: PseudoRuntimeErrorKind,
    message: string,
    pos: Position,
    hint?: string,
  ) {
    const hintText = hint ? `\nヒント: ${hint}` : "";
    super(`${pos.line}行目: ${message}${hintText}`);
    this.name = "PseudoRuntimeError";
    this.kind = kind;
    this.pos = pos;
    this.hint = hint;
    this.detail = message;
  }
}
