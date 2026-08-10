import type {
  ArrayLit,
  Assignment,
  BinaryOp,
  Call,
  Expr,
  ForStmt,
  FuncDecl,
  Ident,
  IfStmt,
  IndexAccess,
  Node,
  Position,
  ProcDecl,
  Program,
  ReturnStmt,
  Statement,
  UnaryOp,
  VarDecl,
  WhileStmt,
} from "./ast";
import { PseudoRuntimeError } from "./errors";

export type Value =
  | { type: "int"; value: number }
  | { type: "float"; value: number }
  | { type: "string"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "undefined" }
  | {
      type: "array";
      base: "int" | "float" | "string" | "bool";
      elements: Value[];
    };

export interface Frame {
  funcName: string;
  variables: Map<string, Value>;
  returnValue: Value | null;
}

/**
 * 言語ごとに差し込む実行時の設定。
 *
 * このインタプリタは IPA 擬似言語 (`/fe`) と共通テスト用プログラム表記 (`/joho1`) で
 * 共有している。両者は AST は同じだが、配列の添字の基点と、使える組み込み関数が違う。
 * **既定値は `/fe` の挙動**なので、FE 側の呼び出しは options を渡さなくてよい。
 */
export interface InterpreterOptions {
  /**
   * 配列の添字の基点。IPA 擬似言語は 1 固定。
   * 共通テスト用プログラム表記は **問題ごとに 0 か 1 かが宣言される**ので呼び出し側が決める
   * (試作問題 = 0 / 令和7・8年度本試験 = 1 / 令和8年度追試験 = 0)。
   */
  indexBase?: 0 | 1;
  /**
   * 問題文の【関数の説明】で与えられる関数。共通テスト用プログラム表記には
   * 固定の組み込み関数セットが存在せず、`要素数` `最大値` などは出題ごとに定義される。
   * 呼び出し順は print → builtins → ユーザー定義関数。
   */
  builtins?: Map<string, BuiltinFn>;
  /**
   * ブロックの閉じ行 (`endif` / `endwhile` / `endfor`) をステップとして発火するか。
   *
   * IPA 擬似言語には閉じ行が実在するので既定は true。
   * **共通テスト用プログラム表記にはブロックの閉じ行が無い** (コロンと罫線で閉じる) ため
   * false にする。true のままだと、書かれていない行をハイライトしてしまう。
   */
  emitBlockEndMarkers?: boolean;
  /**
   * エラーのヒント文をどちらの言語向けに出すか。
   *
   * ヒントは **「代わりにこう書け」と記法を指示する文章**なので、言語が違うと
   * そのまま嘘になる。`/joho1` に FE 用のヒントが出ると、型宣言も `←` も無い
   * 情報I の受験者に、試験で使えない記法を教えることになる。
   */
  dialect?: Dialect;
}

export type Dialect = "fe" | "joho1";

/**
 * 言語ごとのヒント文。**記法を含む文言はすべてここに集約する**。
 * 新しい方言を足すときにコンパイラが漏れを検出できるよう Record で持つ。
 */
const HINTS: Record<Dialect, {
  undefinedVariable: (name: string) => string;
  divisionByZero: string;
  indexBase: (base: 0 | 1) => string;
}> = {
  fe: {
    undefinedVariable: (name) =>
      `変数を使う前に '整数型: ${name} ← 0' のように宣言してください。`,
    divisionByZero: "割る数が 0 でないか '(y ≠ 0)' のようにチェックしましょう。",
    indexBase: () =>
      "この擬似言語では配列の添字は 1 から始まります (0 ではありません)。",
  },
  joho1: {
    undefinedVariable: (name) =>
      `変数は代入すると使えるようになります。先に '${name} = 0' のように値を入れてください。`,
    divisionByZero: "割る数が 0 でないか '(y != 0)' のようにチェックしましょう。",
    indexBase: (base) =>
      base === 1
        ? "この問題では配列の添字は 1 から始まります。先頭の要素は添字 1 です。共通テストでは問題文で毎回指定されます。"
        : "この問題では配列の添字は 0 から始まります。先頭の要素は添字 0 です。共通テストでは問題文で毎回指定されます。",
  },
};

export type BuiltinFn = (
  args: Value[],
  ctx: { pos: Position; output: (text: string) => void },
) => Value;

export interface ExecutionState {
  callStack: Frame[];
  output: string[];
  currentNode: Node | null;
  steps: number;
  status: "running" | "finished" | "error";
  error: PseudoRuntimeError | null;
  functions: Map<string, FuncDecl | ProcDecl>;
  indexBase: 0 | 1;
  builtins: Map<string, BuiltinFn>;
  emitBlockEndMarkers: boolean;
  dialect: Dialect;
}

export type StepEvent =
  | { type: "before-stmt"; node: Statement }
  | { type: "after-stmt"; node: Statement }
  | { type: "call-enter"; funcName: string; pos: Position }
  | { type: "call-exit"; funcName: string; returnValue: Value | null; pos: Position }
  | { type: "output"; text: string; pos: Position }
  | { type: "error"; error: PseudoRuntimeError };

const STEP_LIMIT = 100_000;

const UNDEFINED_VALUE: Value = { type: "undefined" };

function isStatement(node: unknown): node is Statement {
  if (typeof node !== "object" || node === null) return false;
  const kind = (node as { kind?: string }).kind;
  return (
    kind === "VarDecl" ||
    kind === "Assignment" ||
    kind === "IfStmt" ||
    kind === "WhileStmt" ||
    kind === "ForStmt" ||
    kind === "ReturnStmt" ||
    kind === "ExprStmt"
  );
}

class ReturnSignal {
  constructor(public value: Value | null) {}
}

function currentFrame(state: ExecutionState): Frame {
  const f = state.callStack[state.callStack.length - 1];
  if (!f) throw new Error("Internal: no active frame");
  return f;
}

function defaultValueFor(base: Value["type"]): Value {
  // Values are undefined until explicitly initialised.
  // We only reach here for aliases; keep for future use.
  return UNDEFINED_VALUE;
}

function ensureInt(v: Value, pos: Position, ctx: string): number {
  if (v.type === "int") return v.value;
  if (v.type === "float" && Number.isInteger(v.value)) return v.value;
  throw new PseudoRuntimeError(
    "TYPE_MISMATCH",
    `${ctx} には整数が必要ですが、${describeValue(v)} でした`,
    pos,
  );
}

function ensureNumeric(v: Value, pos: Position, ctx: string): number {
  if (v.type === "int" || v.type === "float") return v.value;
  throw new PseudoRuntimeError(
    "TYPE_MISMATCH",
    `${ctx} には数値が必要ですが、${describeValue(v)} でした`,
    pos,
  );
}

function ensureBool(v: Value, pos: Position, ctx: string): boolean {
  if (v.type === "bool") return v.value;
  throw new PseudoRuntimeError(
    "TYPE_MISMATCH",
    `${ctx} には真偽値 (true / false) が必要ですが、${describeValue(v)} でした`,
    pos,
  );
}

function describeValue(v: Value): string {
  switch (v.type) {
    case "int":
      return `整数 (${v.value})`;
    case "float":
      return `実数 (${v.value})`;
    case "string":
      return `文字列 ("${v.value}")`;
    case "bool":
      return `真偽値 (${v.value})`;
    case "undefined":
      return "未定義の値";
    case "array":
      return `配列 (要素数 ${v.elements.length})`;
  }
}

export function formatValue(v: Value): string {
  switch (v.type) {
    case "int":
    case "float":
      return String(v.value);
    case "string":
      return v.value;
    case "bool":
      return v.value ? "true" : "false";
    case "undefined":
      return "未定義";
    case "array":
      return `{${v.elements.map(formatValue).join(", ")}}`;
  }
}

function valuesEqual(a: Value, b: Value): boolean {
  if (a.type === "undefined" && b.type === "undefined") return true;
  if (
    (a.type === "int" || a.type === "float") &&
    (b.type === "int" || b.type === "float")
  ) {
    return a.value === b.value;
  }
  if (a.type === b.type && a.type !== "array") {
    // string, bool
    return (a as { value: unknown }).value === (b as { value: unknown }).value;
  }
  return false;
}

function evaluate(expr: Expr, state: ExecutionState): Value {
  switch (expr.kind) {
    case "IntLit":
      return { type: "int", value: expr.value };
    case "FloatLit":
      return { type: "float", value: expr.value };
    case "StringLit":
      return { type: "string", value: expr.value };
    case "BoolLit":
      return { type: "bool", value: expr.value };
    case "UndefinedLit":
      return UNDEFINED_VALUE;
    case "Ident": {
      const frame = currentFrame(state);
      const v = frame.variables.get(expr.name);
      if (v === undefined) {
        throw new PseudoRuntimeError(
          "UNDEFINED_VARIABLE",
          `変数 '${expr.name}' が宣言されていません`,
          expr.pos,
          HINTS[state.dialect].undefinedVariable(expr.name),
        );
      }
      return v;
    }
    case "ArrayLit": {
      const elements = expr.elements.map((e) => evaluate(e, state));
      const base = elements[0]?.type === "int" ||
        elements[0]?.type === "float" ||
        elements[0]?.type === "string" ||
        elements[0]?.type === "bool"
        ? elements[0].type
        : "int";
      return { type: "array", base: base as "int" | "float" | "string" | "bool", elements };
    }
    case "IndexAccess": {
      const arrVal = evaluate(expr.array, state);
      if (arrVal.type !== "array") {
        throw new PseudoRuntimeError(
          "TYPE_MISMATCH",
          `変数 '${expr.array.name}' は配列ではありません (${describeValue(arrVal)})`,
          expr.pos,
        );
      }
      const idxVal = evaluate(expr.index, state);
      const idx = ensureInt(idxVal, expr.pos, "配列の添字");
      const offset = idx - state.indexBase;
      if (offset < 0 || offset >= arrVal.elements.length) {
        throw new PseudoRuntimeError(
          "ARRAY_INDEX_OUT_OF_BOUNDS",
          `配列 '${expr.array.name}' の要素は ${arrVal.elements.length} 個しかありませんが、添字 ${idx} にアクセスしようとしました`,
          expr.pos,
          indexBaseHint(state),
        );
      }
      return arrVal.elements[offset];
    }
    case "UnaryOp":
      return evalUnary(expr, state);
    case "BinaryOp":
      return evalBinary(expr, state);
    case "Call":
      return evalCall(expr, state);
  }
}

function evalUnary(expr: UnaryOp, state: ExecutionState): Value {
  const v = evaluate(expr.operand, state);
  if (expr.op === "-") {
    const n = ensureNumeric(v, expr.pos, "単項マイナス");
    return v.type === "int"
      ? { type: "int", value: -n }
      : { type: "float", value: -n };
  }
  // not
  const b = ensureBool(v, expr.pos, "not 演算子");
  return { type: "bool", value: !b };
}

function evalBinary(expr: BinaryOp, state: ExecutionState): Value {
  // Short-circuit for logical operators
  if (expr.op === "and") {
    const l = evaluate(expr.left, state);
    if (!ensureBool(l, expr.pos, "and の左辺")) return { type: "bool", value: false };
    const r = evaluate(expr.right, state);
    return { type: "bool", value: ensureBool(r, expr.pos, "and の右辺") };
  }
  if (expr.op === "or") {
    const l = evaluate(expr.left, state);
    if (ensureBool(l, expr.pos, "or の左辺")) return { type: "bool", value: true };
    const r = evaluate(expr.right, state);
    return { type: "bool", value: ensureBool(r, expr.pos, "or の右辺") };
  }

  const l = evaluate(expr.left, state);
  const r = evaluate(expr.right, state);

  switch (expr.op) {
    case "+":
    case "-":
    case "*":
    case "/":
    case "div":
    case "mod": {
      const ln = ensureNumeric(l, expr.pos, "算術演算");
      const rn = ensureNumeric(r, expr.pos, "算術演算");
      let result: number;
      switch (expr.op) {
        case "+":
          result = ln + rn;
          break;
        case "-":
          result = ln - rn;
          break;
        case "*":
          result = ln * rn;
          break;
        case "/":
          if (rn === 0) {
            throw new PseudoRuntimeError(
              "DIVISION_BY_ZERO",
              "0 で割ることはできません",
              expr.pos,
              HINTS[state.dialect].divisionByZero,
            );
          }
          result = ln / rn;
          break;
        case "div":
          if (rn === 0) {
            throw new PseudoRuntimeError(
              "DIVISION_BY_ZERO",
              "0 で割ることはできません",
              expr.pos,
              "割る数が 0 でないかチェックしましょう。",
            );
          }
          // 整数の商。負の数は 0 方向に切り捨てる (試験の出題は非負のみ)
          result = Math.trunc(ln / rn);
          break;
        case "mod":
          if (rn === 0) {
            throw new PseudoRuntimeError(
              "DIVISION_BY_ZERO",
              "0 で割った余りは定義されません",
              expr.pos,
            );
          }
          result = ((ln % rn) + rn) % rn;
          break;
        default:
          result = 0;
      }
      // `div` (整数の商) は定義上つねに整数。それ以外は両辺が整数のときだけ整数
      const isInt =
        expr.op === "div" ||
        (l.type === "int" && r.type === "int" && expr.op !== "/");
      // Note: integer division truncates in this pseudo-lang. For now we
      // preserve mathematical division and coerce to float when needed.
      if (isInt) return { type: "int", value: Math.trunc(result) };
      return { type: "float", value: result };
    }
    case "=":
      return { type: "bool", value: valuesEqual(l, r) };
    case "≠":
      return { type: "bool", value: !valuesEqual(l, r) };
    case "<":
    case "≦":
    case ">":
    case "≧": {
      const ln = ensureNumeric(l, expr.pos, "比較");
      const rn = ensureNumeric(r, expr.pos, "比較");
      let result: boolean;
      switch (expr.op) {
        case "<":
          result = ln < rn;
          break;
        case "≦":
          result = ln <= rn;
          break;
        case ">":
          result = ln > rn;
          break;
        case "≧":
          result = ln >= rn;
          break;
        default:
          result = false;
      }
      return { type: "bool", value: result };
    }
    default:
      throw new PseudoRuntimeError(
        "TYPE_MISMATCH",
        `未対応の演算子: ${expr.op}`,
        expr.pos,
      );
  }
}

function evalCall(expr: Call, state: ExecutionState): Value {
  // Built-in: print
  if (expr.callee === "print") {
    const args = expr.args.map((a) => evaluate(a, state));
    const text = args.map(formatValue).join(" ");
    state.output.push(text);
    // Emit an output event via a side channel would need the generator;
    // for simplicity, expression eval pushes to state.output directly.
    // The step wrapper picks it up.
    return UNDEFINED_VALUE;
  }

  // 問題ごとに注入される関数 (共通テスト用プログラム表記の 要素数 / 最大値 / 表示する)。
  // ユーザー定義関数より先に引く: 出題側が与える関数の意味を上書きさせない。
  const builtin = state.builtins.get(expr.callee);
  if (builtin) {
    const args = expr.args.map((a) => evaluate(a, state));
    return builtin(args, {
      pos: expr.pos,
      output: (text) => state.output.push(text),
    });
  }

  const fn = state.functions.get(expr.callee);
  if (!fn) {
    throw new PseudoRuntimeError(
      "UNKNOWN_FUNCTION",
      `関数または手続き '${expr.callee}' が定義されていません`,
      expr.pos,
    );
  }

  if (fn.params.length !== expr.args.length) {
    throw new PseudoRuntimeError(
      "ARGUMENT_COUNT_MISMATCH",
      `'${expr.callee}' は ${fn.params.length} 個の引数を取りますが、${expr.args.length} 個渡されました`,
      expr.pos,
    );
  }

  const argValues = expr.args.map((a) => evaluate(a, state));
  const frame: Frame = {
    funcName: fn.name,
    variables: new Map(),
    returnValue: null,
  };
  for (let i = 0; i < fn.params.length; i++) {
    frame.variables.set(fn.params[i].name, argValues[i]);
  }
  state.callStack.push(frame);
  try {
    // Run the function body synchronously (drain the generator).
    // Step events from function bodies are not yielded to the outer runner
    // in this simplified model — the design allows this trade-off (see 02
    // §5.1: step granularity is one statement at the current frame).
    for (const _event of execBlock(fn.body, state)) {
      // Drain
    }
  } catch (e) {
    if (e instanceof ReturnSignal) {
      state.callStack.pop();
      return e.value ?? UNDEFINED_VALUE;
    }
    state.callStack.pop();
    throw e;
  }
  state.callStack.pop();
  return frame.returnValue ?? UNDEFINED_VALUE;
}

function assignTo(
  target: Ident | IndexAccess,
  value: Value,
  state: ExecutionState,
): void {
  const frame = currentFrame(state);
  if (target.kind === "Ident") {
    frame.variables.set(target.name, value);
    return;
  }
  const arrVal = frame.variables.get(target.array.name);
  if (!arrVal) {
    throw new PseudoRuntimeError(
      "UNDEFINED_VARIABLE",
      `配列 '${target.array.name}' が宣言されていません`,
      target.pos,
    );
  }
  if (arrVal.type !== "array") {
    throw new PseudoRuntimeError(
      "TYPE_MISMATCH",
      `'${target.array.name}' は配列ではありません`,
      target.pos,
    );
  }
  const idxVal = evaluate(target.index, state);
  const idx = ensureInt(idxVal, target.pos, "配列の添字");
  const offset = idx - state.indexBase;
  if (offset < 0 || offset >= arrVal.elements.length) {
    throw new PseudoRuntimeError(
      "ARRAY_INDEX_OUT_OF_BOUNDS",
      `配列 '${target.array.name}' の要素は ${arrVal.elements.length} 個しかありませんが、添字 ${idx} に代入しようとしました`,
      target.pos,
      indexBaseHint(state),
    );
  }
  arrVal.elements[offset] = value;
}

/**
 * 添字の基点に応じたヒント文。
 * **基点は言語ではなく実行時の設定なので、文言を固定にすると嘘を表示する**
 * (共通テスト用プログラム表記は 0 始まりの回がある)。
 */
function indexBaseHint(state: ExecutionState): string {
  return HINTS[state.dialect].indexBase(state.indexBase);
}

function execVarDecl(stmt: VarDecl, state: ExecutionState): void {
  const frame = currentFrame(state);
  for (const b of stmt.bindings) {
    if (b.init) {
      frame.variables.set(b.name, evaluate(b.init, state));
    } else if (stmt.varType.isArray) {
      // Empty array by default
      frame.variables.set(b.name, {
        type: "array",
        base: stmt.varType.base,
        elements: [],
      });
    } else {
      frame.variables.set(b.name, UNDEFINED_VALUE);
    }
  }
}

function execAssignment(stmt: Assignment, state: ExecutionState): void {
  const value = evaluate(stmt.value, state);
  assignTo(stmt.target, value, state);
}

/** Build a Statement-shaped marker whose only meaningful field is `pos`.
 *  Used to yield a `before-stmt` event that highlights the `if`,
 *  `elseif`, or `else` line even though these are not standalone
 *  statements in the AST. Consumers of StepEvent only read `.pos`. */
function makeLineMarker(pos: Position): Statement {
  return {
    kind: "ExprStmt",
    pos,
    expr: { kind: "Ident", name: "__marker__", pos },
  };
}

function* execIf(
  stmt: IfStmt,
  state: ExecutionState,
): Generator<StepEvent> {
  for (const branch of stmt.branches) {
    const marker = makeLineMarker(branch.keywordPos);
    state.currentNode = marker;
    yield { type: "before-stmt", node: marker };
    incrementSteps(state, marker);
    const cond = evaluate(branch.cond, state);
    const b = ensureBool(cond, branch.keywordPos, "if の条件");
    if (b) {
      yield* execBlock(branch.body, state);
      yield* yieldEndMarker(stmt.endPos, state);
      return;
    }
  }
  if (stmt.elseBody) {
    if (stmt.elsePos) {
      const marker = makeLineMarker(stmt.elsePos);
      state.currentNode = marker;
      yield { type: "before-stmt", node: marker };
      incrementSteps(state, marker);
    }
    yield* execBlock(stmt.elseBody, state);
  }
  // Always highlight the `endif` line on exit — including when no branch
  // matched and there is no else — so the learner sees the block close.
  yield* yieldEndMarker(stmt.endPos, state);
}

/** Yield a before-stmt highlighting the closing keyword line
 *  (endif / endwhile / endfor). */
function* yieldEndMarker(
  pos: Position,
  state: ExecutionState,
): Generator<StepEvent> {
  // 閉じ行が存在しない言語では、書かれていない行をハイライトすることになる
  if (!state.emitBlockEndMarkers) return;
  const marker = makeLineMarker(pos);
  state.currentNode = marker;
  yield { type: "before-stmt", node: marker };
  incrementSteps(state, marker);
}

function* execWhile(
  stmt: WhileStmt,
  state: ExecutionState,
): Generator<StepEvent> {
  while (true) {
    // Yield the while-line highlight for every condition check (including the
    // exit check that fails). The evaluation happens *after* the highlight so
    // the variables pane reflects the values the loop is about to inspect.
    state.currentNode = stmt;
    yield { type: "before-stmt", node: stmt };
    incrementSteps(state, stmt);

    const cond = evaluate(stmt.cond, state);
    const b = ensureBool(cond, stmt.pos, "while の条件");
    if (!b) break;
    yield* execBlock(stmt.body, state);
  }

  // Highlight the `endwhile` line after the exit check so the learner sees
  // where the loop closes.
  yield* yieldEndMarker(stmt.endPos, state);
  yield { type: "after-stmt", node: stmt };
}

function* execFor(
  stmt: ForStmt,
  state: ExecutionState,
): Generator<StepEvent> {
  const startVal = evaluate(stmt.start, state);
  const endVal = evaluate(stmt.end, state);
  const stepVal = evaluate(stmt.step, state);
  const start = ensureInt(startVal, stmt.pos, "for の開始値");
  const end = ensureInt(endVal, stmt.pos, "for の終了値");
  const step = ensureInt(stepVal, stmt.pos, "for のステップ");
  if (step <= 0) {
    throw new PseudoRuntimeError(
      "TYPE_MISMATCH",
      "for のステップは 1 以上の整数である必要があります",
      stmt.pos,
    );
  }
  const frame = currentFrame(state);
  let i = start;
  const cond =
    stmt.direction === "inc" ? () => i <= end : () => i >= end;
  const advance =
    stmt.direction === "inc" ? () => (i += step) : () => (i -= step);

  while (true) {
    // For iterations that will actually run the body, publish the iterator
    // value to the frame *before* the highlight fires so the variables pane
    // shows `i` on the for-line highlight.
    if (cond()) {
      frame.variables.set(stmt.iterVar, { type: "int", value: i });
    }
    state.currentNode = stmt;
    yield { type: "before-stmt", node: stmt };
    incrementSteps(state, stmt);

    if (!cond()) break;
    yield* execBlock(stmt.body, state);
    advance();
  }

  // Highlight the `endfor` line after the exit check so the learner sees
  // where the loop closes.
  yield* yieldEndMarker(stmt.endPos, state);
  yield { type: "after-stmt", node: stmt };
}

function incrementSteps(state: ExecutionState, stmt: Statement) {
  state.steps++;
  if (state.steps > STEP_LIMIT) {
    throw new PseudoRuntimeError(
      "STEP_LIMIT_EXCEEDED",
      `実行ステップが ${STEP_LIMIT} を超えました。無限ループになっていませんか?`,
      stmt.pos,
    );
  }
}

function execReturn(stmt: ReturnStmt, state: ExecutionState): void {
  const value = stmt.value ? evaluate(stmt.value, state) : null;
  const frame = currentFrame(state);
  frame.returnValue = value;
  throw new ReturnSignal(value);
}

function* execStatement(
  stmt: Statement,
  state: ExecutionState,
): Generator<StepEvent> {
  // Compound constructs manage their own before/after-stmt yields:
  //  - For/While need to publish the iterator to the frame BEFORE the first
  //    highlight fires, so the variables pane shows `i` on the loop line.
  //  - If needs to yield a before-stmt for each branch's keyword (if /
  //    elseif / else) so learners can watch condition evaluation
  //    line-by-line, and to avoid the outer output-emission block below
  //    from re-yielding output events already yielded by nested print
  //    statements inside the branch bodies.
  if (stmt.kind === "ForStmt") {
    yield* execFor(stmt, state);
    return;
  }
  if (stmt.kind === "WhileStmt") {
    yield* execWhile(stmt, state);
    return;
  }
  if (stmt.kind === "IfStmt") {
    yield* execIf(stmt, state);
    return;
  }

  state.currentNode = stmt;
  yield { type: "before-stmt", node: stmt };

  const outputBefore = state.output.length;

  switch (stmt.kind) {
    case "VarDecl":
      execVarDecl(stmt, state);
      break;
    case "Assignment":
      execAssignment(stmt, state);
      break;
    case "ReturnStmt":
      execReturn(stmt, state);
      break;
    case "ExprStmt":
      evaluate(stmt.expr, state);
      break;
  }

  // Emit output events for anything print() added during this step.
  while (state.output.length > outputBefore) {
    const text = state.output[outputBefore];
    yield { type: "output", text, pos: stmt.pos };
    // Guard against infinite loop if output is somehow consumed; break after
    // emitting all new lines.
    if (state.output.length > outputBefore + 1) {
      // Continue in loop
      // (we can't shift because state.output is the canonical log)
      // Advance a phantom cursor instead.
      // Simplest: emit all remaining then break.
      for (let k = outputBefore + 1; k < state.output.length; k++) {
        yield { type: "output", text: state.output[k], pos: stmt.pos };
      }
      break;
    }
    break;
  }

  state.steps++;
  if (state.steps > STEP_LIMIT) {
    throw new PseudoRuntimeError(
      "STEP_LIMIT_EXCEEDED",
      `実行ステップが ${STEP_LIMIT} を超えました。無限ループになっていませんか?`,
      stmt.pos,
    );
  }

  yield { type: "after-stmt", node: stmt };
}

function* execBlock(
  body: Statement[],
  state: ExecutionState,
): Generator<StepEvent> {
  for (const stmt of body) {
    yield* execStatement(stmt, state);
  }
}

export function createInitialState(
  program: Program,
  options: InterpreterOptions = {},
): ExecutionState {
  const functions = new Map<string, FuncDecl | ProcDecl>();
  for (const item of program.body) {
    if (item.kind === "FuncDecl" || item.kind === "ProcDecl") {
      functions.set(item.name, item);
    }
  }
  const mainFrame: Frame = {
    funcName: "main",
    variables: new Map(),
    returnValue: null,
  };
  return {
    callStack: [mainFrame],
    output: [],
    currentNode: null,
    steps: 0,
    status: "running",
    error: null,
    functions,
    indexBase: options.indexBase ?? 1,
    builtins: options.builtins ?? new Map(),
    emitBlockEndMarkers: options.emitBlockEndMarkers ?? true,
    dialect: options.dialect ?? "fe",
  };
}

export function* run(
  program: Program,
  options: InterpreterOptions = {},
): Generator<StepEvent, void, void> {
  const state = createInitialState(program, options);
  yield* runFromState(program, state);
}

export function* runFromState(
  program: Program,
  state: ExecutionState,
): Generator<StepEvent, void, void> {
  try {
    for (const item of program.body) {
      if (item.kind === "FuncDecl" || item.kind === "ProcDecl") {
        // 関数 / 手続きの定義行にもハイライトを 1 回発火する。
        // 定義自体は既に createInitialState で登録済みなので実行は不要
        // だが、学習者が「ここで関数が宣言される」ことを目で追える
        // ようにするため、○ の行で一旦停止する。
        yield* yieldDeclarationMarker(item, state);
        continue;
      }
      if (isStatement(item)) {
        yield* execStatement(item, state);
      }
    }
    state.status = "finished";
  } catch (e) {
    if (e instanceof PseudoRuntimeError) {
      state.status = "error";
      state.error = e;
      yield { type: "error", error: e };
      return;
    }
    if (e instanceof ReturnSignal) {
      state.status = "finished";
      return;
    }
    throw e;
  }
}

function* yieldDeclarationMarker(
  decl: FuncDecl | ProcDecl,
  state: ExecutionState,
): Generator<StepEvent> {
  const marker = makeLineMarker(decl.pos);
  state.currentNode = marker;
  yield { type: "before-stmt", node: marker };
  incrementSteps(state, marker);
}

export function runToEnd(
  program: Program,
  options: InterpreterOptions = {},
): ExecutionState {
  const state = createInitialState(program, options);
  try {
    for (const item of program.body) {
      if (isStatement(item)) {
        for (const _e of execStatement(item, state)) {
          // drain
        }
      }
    }
    state.status = "finished";
  } catch (e) {
    if (e instanceof PseudoRuntimeError) {
      state.status = "error";
      state.error = e;
    } else if (e instanceof ReturnSignal) {
      state.status = "finished";
    } else {
      throw e;
    }
  }
  return state;
}

export { PseudoRuntimeError };
