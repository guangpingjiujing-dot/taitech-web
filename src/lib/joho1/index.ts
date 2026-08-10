import type { Program } from "@/lib/pseudo/ast";
import {
  createInitialState,
  run,
  runToEnd,
  type ExecutionState,
  type InterpreterOptions,
  type StepEvent,
} from "@/lib/pseudo/interpreter";
import { defaultBuiltins } from "./builtins";

export { tokenize, type Token, type TokenKind } from "./lexer";
export { parse, parseTokens } from "./parser";
export {
  defaultBuiltins,
  builtinsFor,
  JOHO1_BUILTINS,
} from "./builtins";

/**
 * 共通テスト用プログラム表記の実行オプション。
 *
 * `indexBase` に既定値を置かないのは意図的。**添字の基点は問題ごとに宣言される**もので
 * (試作 = 0 / 令和7・8年度本試験 = 1 / 令和8年度追試験 = 0)、
 * 言語の性質ではないため、呼び出し側が毎回決める (00-overview.md §7-4 (2))。
 */
export interface Joho1RunOptions {
  indexBase: 0 | 1;
  /** 問題文の【関数の説明】で与えられる関数。省略時は出題実績のある関数すべて */
  builtins?: InterpreterOptions["builtins"];
}

function toInterpreterOptions(options: Joho1RunOptions): InterpreterOptions {
  return {
    indexBase: options.indexBase,
    builtins: options.builtins ?? defaultBuiltins(),
    // この言語にブロックの閉じ行は無いので、閉じ行のハイライトを出さない
    emitBlockEndMarkers: false,
    // エラーのヒントに FE の記法 (型宣言 / ← / ≠) を出させない
    dialect: "joho1",
  };
}

export function createJoho1State(
  program: Program,
  options: Joho1RunOptions,
): ExecutionState {
  return createInitialState(program, toInterpreterOptions(options));
}

export function runJoho1(
  program: Program,
  options: Joho1RunOptions,
): Generator<StepEvent, void, void> {
  return run(program, toInterpreterOptions(options));
}

export function runJoho1ToEnd(
  program: Program,
  options: Joho1RunOptions,
): ExecutionState {
  return runToEnd(program, toInterpreterOptions(options));
}
