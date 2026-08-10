import type {
  Assignment,
  BinaryOp,
  Call,
  Expr,
  ForStmt,
  Ident,
  IfStmt,
  IndexAccess,
  Program,
  Statement,
  TopLevel,
  UnaryOp,
  WhileStmt,
} from "@/lib/pseudo/ast";

/**
 * 共通テスト用プログラム表記 → Python。
 *
 * FE の `lib/pseudo/transpiler/python.ts` とは **別実装**。AST は共有しているが、
 * 出力すべき Python が根本的に違うため:
 *
 * - FE は型宣言 (`整数型: x ← 0`) を持つので `x: int = 0` を出す。
 *   プログラム表記に型宣言は無いので、注釈を付けると原文に無い情報が増える
 * - FE の配列は常に 1 始まりなので `-1` を固定で出せる。
 *   プログラム表記の基点は **問題ごとに宣言される** ので引数で受ける (00-overview.md §7-4 (2))
 * - `表示する` は区切り文字なしで連結するので、素の `print` ではなく `sep=""` が要る
 *
 * 1 つの emitter に両方を担わせると、どちらの分岐なのかを常に意識して読むことになる。
 */

export interface Joho1PythonOptions {
  /** その問題での配列の添字の基点。1 なら Python の 0 始まりへ -1 する */
  indexBase: 0 | 1;
}

/** 添字を -1 する行に付ける説明。毎行に出ると読めないので配列アクセスにだけ付ける */
const INDEX_COMMENT = "  # 添字が1から始まるので-1";

/** 共有 AST 経由でしか現れない記法。消さずに見えるようにする */
const UNSUPPORTED = "# この記法は共通テストのプログラム表記にはありません";

export function transpileJoho1ToPython(
  program: Program,
  options: Joho1PythonOptions,
): string {
  const emitter = createEmitter(options);
  const lines = program.body.flatMap((node) => emitter.topLevel(node));
  return lines.length > 0 ? lines.join("\n") + "\n" : "";
}

function createEmitter({ indexBase }: Joho1PythonOptions) {
  /** `A[i]` の添字。1 始まりの問題だけ -1 する */
  function index(expr: IndexAccess): string {
    return indexBase === 1 ? `${emit(expr.index)} - 1` : emit(expr.index);
  }

  function emit(expr: Expr): string {
    switch (expr.kind) {
      case "IntLit":
      case "FloatLit":
        return String(expr.value);
      case "StringLit":
        return JSON.stringify(expr.value);
      case "BoolLit":
        return expr.value ? "True" : "False";
      case "UndefinedLit":
        return "None";
      case "Ident":
        return expr.name;
      case "ArrayLit":
        return `[${expr.elements.map(emit).join(", ")}]`;
      case "IndexAccess":
        return `${expr.array.name}[${index(expr)}]`;
      case "UnaryOp":
        return emitUnary(expr);
      case "BinaryOp":
        return emitBinary(expr);
      case "Call":
        return emitCall(expr);
    }
  }

  function emitUnary(expr: UnaryOp): string {
    return expr.op === "-"
      ? `-${operand(expr.operand, PREC_NEG)}`
      : `not ${operand(expr.operand, PREC_NOT)}`;
  }

  /**
   * 括弧は **意味が変わるときだけ** 付ける。
   *
   * 全部の二項演算を括弧で包むほうが実装は楽だが、このページの目的は
   * 「授業で書いた Python と読み比べる」こと。`g = (g + i)` のような
   * 人が書かない形が並ぶと、対応関係より先に括弧が目に入る。
   */
  function operand(expr: Expr, minPrec: number): string {
    const s = emit(expr);
    return precedenceOf(expr) < minPrec ? `(${s})` : s;
  }

  function emitBinary(expr: BinaryOp): string {
    const prec = PREC[expr.op];
    // 比較の連鎖 (a < b < c) は Python では意味が変わるので、左にも括弧を付ける
    const left = operand(expr.left, prec === PREC_COMPARE ? prec + 1 : prec);
    // 結合しない演算 (- / // % と比較) は、右が同じ優先度でも括弧が要る:
    // a - (b - c) は a - b - c と等しくない
    const right = operand(
      expr.right,
      ASSOCIATIVE.has(expr.op) ? prec : prec + 1,
    );
    return `${left} ${PY_OPERATOR[expr.op]} ${right}`;
  }

  /**
   * 問題文の【関数の説明】で与えられる関数を Python の相当物へ写す。
   * ここに無い名前は、その問題だけで定義された関数なのでそのまま残す
   * (Python 側では未定義になるが、対応が無いことを隠すより正直)。
   */
  function emitCall(expr: Call): string {
    const args = expr.args.map(emit);
    switch (expr.callee) {
      case "表示する":
        // 表示する は引数を区切らずに連結する。素の print は空白を挟むので sep="" が要る
        return args.length > 1
          ? `print(${args.join(", ")}, sep="")`
          : `print(${args.join(", ")})`;
      case "要素数":
        return `len(${args.join(", ")})`;
      case "最大値":
        return `max(${args.join(", ")})`;
      default:
        return `${expr.callee}(${args.join(", ")})`;
    }
  }

  function emitAssignment(stmt: Assignment): string[] {
    if (stmt.target.kind === "IndexAccess") {
      const target = stmt.target as IndexAccess;
      const comment = indexBase === 1 ? INDEX_COMMENT : "";
      return [
        `${target.array.name}[${index(target)}] = ${emit(stmt.value)}${comment}`,
      ];
    }
    return [`${(stmt.target as Ident).name} = ${emit(stmt.value)}`];
  }

  function emitIf(stmt: IfStmt): string[] {
    const out: string[] = [];
    stmt.branches.forEach((branch, i) => {
      out.push(`${i === 0 ? "if" : "elif"} ${emit(branch.cond)}:`);
      out.push(...indent(bodyOrPass(branch.body)));
    });
    if (stmt.elseBody) {
      out.push("else:");
      out.push(...indent(bodyOrPass(stmt.elseBody)));
    }
    return out;
  }

  function emitWhile(stmt: WhileStmt): string[] {
    return [`while ${emit(stmt.cond)}:`, ...indent(bodyOrPass(stmt.body))];
  }

  function emitFor(stmt: ForStmt): string[] {
    const start = emit(stmt.start);
    const end = emit(stmt.end);
    const step = emit(stmt.step);
    // プログラム表記の「〜まで」は終わりの値を含むが、range は含まない
    const range =
      stmt.direction === "inc"
        ? `range(${start}, ${end} + 1, ${step})`
        : `range(${start}, ${end} - 1, -${step})`;
    return [
      `for ${stmt.iterVar} in ${range}:`,
      ...indent(bodyOrPass(stmt.body)),
    ];
  }

  function statement(stmt: Statement): string[] {
    switch (stmt.kind) {
      case "Assignment":
        return emitAssignment(stmt);
      case "IfStmt":
        return emitIf(stmt);
      case "WhileStmt":
        return emitWhile(stmt);
      case "ForStmt":
        return emitFor(stmt);
      case "ExprStmt":
        return [emit(stmt.expr)];
      // プログラム表記に型宣言・関数定義・return は無い (00-overview.md §7-3)。
      // 共有 AST の型には存在するので、黙って消さずコメントで見えるようにする
      case "VarDecl":
      case "ReturnStmt":
        return [UNSUPPORTED];
    }
  }

  /** Program.body は関数宣言も取りうる型だが、この言語のパーサは生成しない */
  function topLevel(node: TopLevel): string[] {
    if (node.kind === "FuncDecl" || node.kind === "ProcDecl") {
      return [UNSUPPORTED];
    }
    return statement(node);
  }

  function block(body: Statement[]): string[] {
    const out: string[] = [];
    for (const s of body) out.push(...statement(s));
    return out;
  }

  function bodyOrPass(body: Statement[]): string[] {
    const lines = block(body);
    return lines.length > 0 ? lines : ["pass"];
  }

  return { topLevel };
}

function indent(lines: string[]): string[] {
  return lines.map((l) => (l === "" ? "" : "    " + l));
}

/* Python の優先順位。数が大きいほど強く結びつく */
const PREC_COMPARE = 4;
const PREC_NOT = 3;
const PREC_NEG = 7;
/** 括弧を付けない atom (リテラル・変数・関数呼び出し・添字) の強さ */
const PREC_ATOM = 100;

const PREC: Record<BinaryOp["op"], number> = {
  or: 1,
  and: 2,
  "=": PREC_COMPARE,
  "≠": PREC_COMPARE,
  "<": PREC_COMPARE,
  "≦": PREC_COMPARE,
  ">": PREC_COMPARE,
  "≧": PREC_COMPARE,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  div: 6,
  mod: 6,
};

/** 右側が同じ優先度でも括弧の要らない演算 */
const ASSOCIATIVE = new Set<BinaryOp["op"]>(["+", "*", "and", "or"]);

function precedenceOf(expr: Expr): number {
  if (expr.kind === "BinaryOp") return PREC[expr.op];
  if (expr.kind === "UnaryOp") return expr.op === "-" ? PREC_NEG : PREC_NOT;
  return PREC_ATOM;
}

const PY_OPERATOR: Record<BinaryOp["op"], string> = {
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  // 整数の商。Python の // は負数で床除算になるが、試験の出題は非負のみ
  div: "//",
  mod: "%",
  "=": "==",
  "≠": "!=",
  "<": "<",
  "≦": "<=",
  ">": ">",
  "≧": ">=",
  and: "and",
  or: "or",
};
