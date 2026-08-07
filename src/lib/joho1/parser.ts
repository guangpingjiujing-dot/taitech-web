import type {
  Expr,
  Ident,
  IfBranch,
  IndexAccess,
  Position,
  Program,
  Statement,
  BinaryOperator,
} from "@/lib/pseudo/ast";
import { PseudoParseError } from "@/lib/pseudo/errors";
import { tokenize, type Token, type TokenKind } from "./lexer";

/**
 * 共通テスト用プログラム表記のパーサ。
 *
 * **出力は `src/lib/pseudo/ast.ts` の AST**。インタプリタ・ステップ実行 UI・
 * 変数の可視化はすべて `/fe` と共有する (01-implementation-design.md §1-1)。
 *
 * 文法は実物 (試作問題 + 令和7・8年度の本試験/追試験) から起こした。
 * **実物に出ていない構文は実装しない** — 特に「関数定義」は 5 回とも出ておらず、
 * 外部関数は問題文の【関数の説明】で与えられるので、呼び出しだけを解釈する。
 */
export function parse(source: string): Program {
  return parseTokens(tokenize(source));
}

export function parseTokens(tokens: Token[]): Program {
  const p = new Parser(tokens);
  return p.parseProgram();
}

const COMPARISON_OPS: Partial<Record<TokenKind, BinaryOperator>> = {
  EQ: "=",
  NEQ: "≠",
  LT: "<",
  LE: "≦",
  GT: ">",
  GE: "≧",
};

const ADDITIVE_OPS: Partial<Record<TokenKind, BinaryOperator>> = {
  PLUS: "+",
  MINUS: "-",
};

const MULTIPLICATIVE_OPS: Partial<Record<TokenKind, BinaryOperator>> = {
  MUL: "*",
  SLASH: "/",
  DIV: "div",
  MOD: "mod",
};

class Parser {
  private i = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.i + offset, this.tokens.length - 1)];
  }

  private at(kind: TokenKind): boolean {
    return this.peek().kind === kind;
  }

  private next(): Token {
    const t = this.peek();
    if (this.i < this.tokens.length - 1) this.i++;
    return t;
  }

  private accept(kind: TokenKind): Token | null {
    return this.at(kind) ? this.next() : null;
  }

  private expect(kind: TokenKind, what: string, hint?: string): Token {
    if (!this.at(kind)) {
      const got = this.peek();
      throw new PseudoParseError(
        `${what}が必要です (見つかったのは ${describeToken(got)})`,
        got.pos,
        hint,
      );
    }
    return this.next();
  }

  /** 空行由来の余分な NEWLINE を読み飛ばす */
  private skipNewlines(): void {
    while (this.at("NEWLINE")) this.next();
  }

  parseProgram(): Program {
    const body: Statement[] = [];
    this.skipNewlines();
    while (!this.at("EOF")) {
      this.parseStatementInto(body);
      this.skipNewlines();
    }
    return {
      kind: "Program",
      pos: { line: 1, column: 1 },
      body,
    };
  }

  /**
   * 文を 1 つ読んで `into` に足す。
   * `maisu = 0, nokori = kingaku` のような複数代入は **2 つの Assignment に展開する**
   * ので、戻り値ではなく配列に push する形にしている。
   */
  private parseStatementInto(into: Statement[]): void {
    if (this.at("KW_IF")) {
      into.push(this.parseIf());
      return;
    }

    // 順次繰返し: `i を 0 から 4 まで 1 ずつ増やしながら繰り返す：`
    if (this.at("IDENT") && this.peek(1).kind === "KW_WO") {
      into.push(this.parseSequentialLoop());
      return;
    }

    const start = this.peek();
    const expr = this.parseExpr();

    // 条件繰返し: `(taiken <= 15) and (saichou < 10) の間繰り返す：`
    if (this.at("KW_LOOP_WHILE")) {
      into.push(this.parseWhileTail(expr, start.pos));
      return;
    }

    if (this.at("ASSIGN")) {
      this.parseAssignmentTail(expr, start, into);
      return;
    }

    this.expectStatementEnd();
    into.push({ kind: "ExprStmt", pos: start.pos, expr });
  }

  private parseAssignmentTail(
    first: Expr,
    firstToken: Token,
    into: Statement[],
  ): void {
    let target = toAssignTarget(first, firstToken.pos);
    let pos = firstToken.pos;
    for (;;) {
      this.expect("ASSIGN", "'='");
      const value = this.parseExpr();
      into.push({ kind: "Assignment", pos, target, value });
      if (!this.accept("COMMA")) break;
      const nextToken = this.peek();
      pos = nextToken.pos;
      target = toAssignTarget(this.parseExpr(), nextToken.pos);
    }
    this.expectStatementEnd();
  }

  private parseIf(): Statement {
    const ifToken = this.expect("KW_IF", "'もし'");
    const cond = this.parseExpr();
    this.expect("KW_THEN", "'ならば'", "条件のあとに 'ならば：' が必要です。");
    const body = this.parseBlock();

    const branches: IfBranch[] = [
      { cond, body, keywordPos: ifToken.pos },
    ];

    let elseBody: Statement[] | null = null;
    let elsePos: Position | null = null;
    if (this.at("KW_ELSE")) {
      const elseToken = this.next();
      elsePos = elseToken.pos;
      elseBody = this.parseBlock();
    }

    return {
      kind: "IfStmt",
      pos: ifToken.pos,
      branches,
      elseBody,
      elsePos,
      // この言語にブロックの閉じ行は無い。閉じ行のハイライトは
      // interpreter の `emitBlockEndMarkers: false` で止める前提で、
      // 位置だけ最後の文に合わせておく (01-implementation-design.md §1-3)
      endPos: lastPosOf(elseBody ?? body, ifToken.pos),
    };
  }

  private parseSequentialLoop(): Statement {
    const iter = this.expect("IDENT", "繰り返しの変数名");
    this.expect("KW_WO", "'を'");
    const start = this.parseExpr();
    this.expect("KW_FROM", "'から'");
    const end = this.parseExpr();
    this.expect("KW_TO", "'まで'");
    const step = this.parseExpr();
    this.expect("KW_STEP", "'ずつ'");

    let direction: "inc" | "dec";
    if (this.accept("KW_LOOP_INC")) direction = "inc";
    else if (this.accept("KW_LOOP_DEC")) direction = "dec";
    else {
      const got = this.peek();
      throw new PseudoParseError(
        `'増やしながら繰り返す' または '減らしながら繰り返す' が必要です (見つかったのは ${describeToken(got)})`,
        got.pos,
      );
    }

    const body = this.parseBlock();
    return {
      kind: "ForStmt",
      pos: iter.pos,
      iterVar: iter.value,
      start,
      end,
      step,
      direction,
      body,
      endPos: lastPosOf(body, iter.pos),
    };
  }

  private parseWhileTail(cond: Expr, pos: Position): Statement {
    this.expect("KW_LOOP_WHILE", "'の間繰り返す'");
    const body = this.parseBlock();
    return {
      kind: "WhileStmt",
      pos,
      cond,
      body,
      endPos: lastPosOf(body, pos),
    };
  }

  /** `：` 改行 INDENT …文… DEDENT */
  private parseBlock(): Statement[] {
    this.expect(
      "COLON",
      "'：'",
      "繰り返しや条件分岐の見出しの行末には '：' が必要です。",
    );
    this.expect("NEWLINE", "改行");
    this.skipNewlines();
    this.expect(
      "INDENT",
      "字下げされたブロック",
      "'：' の次の行から、中の処理を字下げして書きます。",
    );

    const body: Statement[] = [];
    this.skipNewlines();
    while (!this.at("DEDENT") && !this.at("EOF")) {
      this.parseStatementInto(body);
      this.skipNewlines();
    }
    this.accept("DEDENT");
    return body;
  }

  private expectStatementEnd(): void {
    if (this.at("EOF") || this.at("DEDENT")) return;
    this.expect("NEWLINE", "改行");
  }

  // --- 式 ---------------------------------------------------------------

  private parseExpr(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.at("KW_OR")) {
      const op = this.next();
      const right = this.parseAnd();
      left = { kind: "BinaryOp", pos: op.pos, op: "or", left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.at("KW_AND")) {
      const op = this.next();
      const right = this.parseNot();
      left = { kind: "BinaryOp", pos: op.pos, op: "and", left, right };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.at("KW_NOT")) {
      const op = this.next();
      return {
        kind: "UnaryOp",
        pos: op.pos,
        op: "not",
        operand: this.parseNot(),
      };
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    let left = this.parseAdditive();
    for (;;) {
      const op = COMPARISON_OPS[this.peek().kind];
      if (!op) return left;
      const token = this.next();
      const right = this.parseAdditive();
      left = { kind: "BinaryOp", pos: token.pos, op, left, right };
    }
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    for (;;) {
      const op = ADDITIVE_OPS[this.peek().kind];
      if (!op) return left;
      const token = this.next();
      const right = this.parseMultiplicative();
      left = { kind: "BinaryOp", pos: token.pos, op, left, right };
    }
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    for (;;) {
      const op = MULTIPLICATIVE_OPS[this.peek().kind];
      if (!op) return left;
      const token = this.next();
      const right = this.parseUnary();
      left = { kind: "BinaryOp", pos: token.pos, op, left, right };
    }
  }

  private parseUnary(): Expr {
    if (this.at("MINUS")) {
      const op = this.next();
      return {
        kind: "UnaryOp",
        pos: op.pos,
        op: "-",
        operand: this.parseUnary(),
      };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (this.at("LBRACK")) {
      const bracket = this.next();
      if (expr.kind !== "Ident") {
        throw new PseudoParseError(
          "添字を付けられるのは配列の名前だけです",
          bracket.pos,
        );
      }
      const index = this.parseExpr();
      this.expect("RBRACK", "']'");
      const access: IndexAccess = {
        kind: "IndexAccess",
        pos: expr.pos,
        array: expr,
        index,
      };
      expr = access;
    }
    return expr;
  }

  private parsePrimary(): Expr {
    const token = this.peek();
    switch (token.kind) {
      case "INT":
        this.next();
        return { kind: "IntLit", pos: token.pos, value: Number(token.value) };
      case "FLOAT":
        this.next();
        return { kind: "FloatLit", pos: token.pos, value: Number(token.value) };
      case "STRING":
        this.next();
        return { kind: "StringLit", pos: token.pos, value: token.value };
      case "IDENT": {
        this.next();
        if (this.at("LPAREN")) {
          this.next();
          const args: Expr[] = [];
          if (!this.at("RPAREN")) {
            do {
              args.push(this.parseExpr());
            } while (this.accept("COMMA"));
          }
          this.expect("RPAREN", "')'");
          return { kind: "Call", pos: token.pos, callee: token.value, args };
        }
        return { kind: "Ident", pos: token.pos, name: token.value };
      }
      case "LBRACK": {
        this.next();
        const elements: Expr[] = [];
        if (!this.at("RBRACK")) {
          do {
            elements.push(this.parseExpr());
          } while (this.accept("COMMA"));
        }
        this.expect("RBRACK", "']'");
        return { kind: "ArrayLit", pos: token.pos, elements };
      }
      case "LPAREN": {
        this.next();
        const inner = this.parseExpr();
        this.expect("RPAREN", "')'");
        return inner;
      }
      default:
        throw new PseudoParseError(
          `式が必要です (見つかったのは ${describeToken(token)})`,
          token.pos,
        );
    }
  }
}

function toAssignTarget(expr: Expr, pos: Position): Ident | IndexAccess {
  if (expr.kind === "Ident" || expr.kind === "IndexAccess") return expr;
  throw new PseudoParseError(
    "'=' の左辺には変数名か配列の要素を書きます",
    pos,
  );
}

/** ブロックの最後の文の位置。空ブロックなら見出し行の位置 */
function lastPosOf(body: Statement[], fallback: Position): Position {
  return body.length > 0 ? body[body.length - 1].pos : fallback;
}

function describeToken(t: Token): string {
  switch (t.kind) {
    case "EOF":
      return "プログラムの終わり";
    case "NEWLINE":
      return "改行";
    case "INDENT":
      return "字下げ";
    case "DEDENT":
      return "字下げの終わり";
    default:
      return `'${t.value}'`;
  }
}
