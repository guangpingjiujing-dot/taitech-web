import type {
  ArrayLit,
  Assignment,
  BinaryOp,
  BinaryOperator,
  BoolLit,
  Call,
  Expr,
  ExprStmt,
  FloatLit,
  ForStmt,
  FuncDecl,
  Ident,
  IfBranch,
  IfStmt,
  IndexAccess,
  IntLit,
  Param,
  Position,
  ProcDecl,
  Program,
  ReturnStmt,
  Statement,
  StringLit,
  TopLevel,
  TypeSpec,
  UnaryOp,
  UnaryOperator,
  UndefinedLit,
  VarDecl,
  WhileStmt,
} from "./ast";
import { PseudoParseError } from "./errors";
import { tokenize, type Token, type TokenKind } from "./lexer";

const TYPE_KINDS: readonly TokenKind[] = [
  "TY_INT",
  "TY_FLOAT",
  "TY_STRING",
  "TY_BOOL",
];

function isTypeStart(kind: TokenKind): boolean {
  return TYPE_KINDS.includes(kind);
}

function typeBase(kind: TokenKind): TypeSpec["base"] {
  switch (kind) {
    case "TY_INT":
      return "int";
    case "TY_FLOAT":
      return "float";
    case "TY_STRING":
      return "string";
    case "TY_BOOL":
      return "bool";
    default:
      throw new Error(`Not a type token: ${kind}`);
  }
}

function binOpOf(kind: TokenKind): BinaryOperator | null {
  switch (kind) {
    case "PLUS":
      return "+";
    case "MINUS":
      return "-";
    case "MUL":
      return "*";
    case "DIV":
      return "/";
    case "KW_MOD":
      return "mod";
    case "EQ":
      return "=";
    case "NEQ":
      return "≠";
    case "LT":
      return "<";
    case "LE":
      return "≦";
    case "GT":
      return ">";
    case "GE":
      return "≧";
    case "KW_AND":
      return "and";
    case "KW_OR":
      return "or";
    default:
      return null;
  }
}

class Parser {
  private tokens: Token[];
  private cursor = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token {
    return this.tokens[this.cursor + offset];
  }

  private consume(): Token {
    return this.tokens[this.cursor++];
  }

  private check(kind: TokenKind): boolean {
    return this.peek().kind === kind;
  }

  private match(...kinds: TokenKind[]): Token | null {
    if (kinds.includes(this.peek().kind)) {
      return this.consume();
    }
    return null;
  }

  private expect(kind: TokenKind, hint?: string): Token {
    const tk = this.peek();
    if (tk.kind !== kind) {
      throw new PseudoParseError(
        `${describeToken(kind)} が来るべきところに '${tk.value || tk.kind}' がありました`,
        tk.pos,
        hint,
      );
    }
    return this.consume();
  }

  parseProgram(): Program {
    const start: Position = this.peek().pos;
    const body: TopLevel[] = [];
    while (!this.check("EOF")) {
      body.push(this.parseTopLevel());
    }
    return { kind: "Program", body, pos: start };
  }

  private parseTopLevel(): TopLevel {
    const tk = this.peek();
    if (tk.kind === "MARKER_FUNC") return this.parseFuncOrProcDecl();
    return this.parseStatement();
  }

  private parseTypeSpec(): TypeSpec {
    const tk = this.consume();
    if (!isTypeStart(tk.kind)) {
      throw new PseudoParseError(
        `型 (整数型 / 実数型 / 文字列型 / 論理型) が期待されるところに '${tk.value}' がありました`,
        tk.pos,
      );
    }
    const base = typeBase(tk.kind);
    const isArray = this.match("KW_ARRAY_OF") !== null;
    return { base, isArray };
  }

  private parseVarDecl(): VarDecl {
    const pos = this.peek().pos;
    const varType = this.parseTypeSpec();
    this.expect(
      "COLON",
      "型と変数名の間には ':' が必要です。例: 整数型: x",
    );
    const bindings: VarDecl["bindings"] = [];
    bindings.push(this.parseBinding());
    while (this.match("COMMA")) {
      bindings.push(this.parseBinding());
    }
    return { kind: "VarDecl", varType, bindings, pos };
  }

  private parseBinding(): { name: string; init: Expr | null } {
    const nameTk = this.expect(
      "IDENT",
      "変数名は英字/アンダースコアで始まる ASCII 名か、漢字/カタカナで書きます。",
    );
    let init: Expr | null = null;
    if (this.match("ASSIGN")) {
      init = this.parseExpr();
    }
    return { name: nameTk.value, init };
  }

  private parseFuncOrProcDecl(): FuncDecl | ProcDecl {
    const startPos = this.peek().pos;
    this.expect("MARKER_FUNC");
    const next = this.peek();
    if (isTypeStart(next.kind)) {
      // FuncDecl
      const returnType = this.parseTypeSpec();
      this.expect("COLON");
      const nameTk = this.expect("IDENT");
      this.expect("LPAREN");
      const params = this.parseParamList();
      this.expect("RPAREN");
      const body = this.parseFunctionBody(startPos.column);
      return {
        kind: "FuncDecl",
        returnType,
        name: nameTk.value,
        params,
        body,
        pos: startPos,
      };
    }
    if (next.kind === "IDENT") {
      // ProcDecl
      const nameTk = this.consume();
      this.expect("LPAREN");
      const params = this.parseParamList();
      this.expect("RPAREN");
      const body = this.parseFunctionBody(startPos.column);
      return {
        kind: "ProcDecl",
        name: nameTk.value,
        params,
        body,
        pos: startPos,
      };
    }
    throw new PseudoParseError(
      `'○' の後に型 (関数) か 手続き名 (手続き) が来るべきところに '${next.value}' がありました`,
      next.pos,
    );
  }

  private parseParamList(): Param[] {
    if (this.check("RPAREN")) return [];
    const params: Param[] = [];
    params.push(this.parseParam());
    while (this.match("COMMA")) {
      params.push(this.parseParam());
    }
    return params;
  }

  private parseParam(): Param {
    const paramType = this.parseTypeSpec();
    this.expect("COLON");
    const nameTk = this.expect("IDENT");
    return { paramType, name: nameTk.value };
  }

  private parseFunctionBody(declCol: number): Statement[] {
    // Body ends when EOF, another top-level MARKER_FUNC, or a statement
    // whose starting column is <= the declaration column (indentation-based).
    // This lets users write multiple function definitions and main code in
    // one program without an explicit "endfunction" marker.
    const body: Statement[] = [];
    while (!this.check("EOF") && !this.check("MARKER_FUNC")) {
      const next = this.peek();
      if (next.pos.column <= declCol) break;
      body.push(this.parseStatement());
    }
    return body;
  }

  // parseBlock: for use inside if/while/for. Ends when we see one of the
  // provided terminator kinds (also EOF).
  private parseBlock(terminators: TokenKind[]): Statement[] {
    const body: Statement[] = [];
    while (!this.check("EOF") && !terminators.includes(this.peek().kind)) {
      body.push(this.parseStatement());
    }
    return body;
  }

  private parseStatement(): Statement {
    const tk = this.peek();
    if (isTypeStart(tk.kind)) return this.parseVarDecl();
    if (tk.kind === "KW_IF") return this.parseIfStmt();
    if (tk.kind === "KW_WHILE") return this.parseWhileStmt();
    if (tk.kind === "KW_FOR") return this.parseForStmt();
    if (tk.kind === "KW_RETURN") return this.parseReturnStmt();
    return this.parseAssignmentOrExprStmt();
  }

  private parseIfStmt(): IfStmt {
    const pos = this.peek().pos;
    this.expect("KW_IF");
    this.expect(
      "LPAREN",
      "if の後は '(' で条件式を囲む必要があります。例: if (x > 0)",
    );
    const firstCond = this.parseExpr();
    this.expect("RPAREN");
    this.match("KW_THEN"); // optional
    const firstBody = this.parseBlock([
      "KW_ELSEIF",
      "KW_ELSE",
      "KW_ENDIF",
    ]);
    const branches: IfBranch[] = [{ cond: firstCond, body: firstBody }];
    while (this.check("KW_ELSEIF")) {
      this.consume();
      this.expect("LPAREN");
      const cond = this.parseExpr();
      this.expect("RPAREN");
      this.match("KW_THEN");
      const body = this.parseBlock(["KW_ELSEIF", "KW_ELSE", "KW_ENDIF"]);
      branches.push({ cond, body });
    }
    let elseBody: Statement[] | null = null;
    if (this.match("KW_ELSE")) {
      elseBody = this.parseBlock(["KW_ENDIF"]);
    }
    this.expect(
      "KW_ENDIF",
      "if 文は 'endif' で閉じます。elseif や else のブロックが閉じているかも確認してください。",
    );
    return { kind: "IfStmt", branches, elseBody, pos };
  }

  private parseWhileStmt(): WhileStmt {
    const pos = this.peek().pos;
    this.expect("KW_WHILE");
    this.expect("LPAREN");
    const cond = this.parseExpr();
    this.expect("RPAREN");
    const body = this.parseBlock(["KW_ENDWHILE"]);
    this.expect(
      "KW_ENDWHILE",
      "while ループは 'endwhile' で閉じます。",
    );
    return { kind: "WhileStmt", cond, body, pos };
  }

  private parseForStmt(): ForStmt {
    const pos = this.peek().pos;
    this.expect("KW_FOR");
    this.expect(
      "LPAREN",
      "for の後は '(' で反復条件を囲む必要があります。例: for (i を 1 から n まで 1 ずつ増やす)",
    );
    const iterTk = this.expect("IDENT");
    this.expect("KW_WO", "「を」を入れる位置です。例: 'i を 1 から...'");
    const start = this.parseExpr();
    this.expect("KW_FROM", "「から」を入れる位置です。");
    const end = this.parseExpr();
    this.expect("KW_TO", "「まで」を入れる位置です。");
    const step = this.parseExpr();
    this.expect("KW_STEP", "「ずつ」を入れる位置です。");
    const dirTk = this.peek();
    let direction: "inc" | "dec";
    if (dirTk.kind === "KW_INC") {
      direction = "inc";
      this.consume();
    } else if (dirTk.kind === "KW_DEC") {
      direction = "dec";
      this.consume();
    } else {
      throw new PseudoParseError(
        `'増やす' か '減らす' が来るべきところに '${dirTk.value}' がありました`,
        dirTk.pos,
      );
    }
    this.expect("RPAREN");
    const body = this.parseBlock(["KW_ENDFOR"]);
    this.expect("KW_ENDFOR", "for ループは 'endfor' で閉じます。");
    return {
      kind: "ForStmt",
      iterVar: iterTk.value,
      start,
      end,
      step,
      direction,
      body,
      pos,
    };
  }

  private parseReturnStmt(): ReturnStmt {
    const pos = this.peek().pos;
    this.expect("KW_RETURN");
    // Return with or without value. Terminate at a token that clearly starts
    // a new statement or ends a block.
    const next = this.peek().kind;
    const noValue: TokenKind[] = [
      "EOF",
      "KW_ENDIF",
      "KW_ENDWHILE",
      "KW_ENDFOR",
      "KW_ELSE",
      "KW_ELSEIF",
      "MARKER_FUNC",
    ];
    if (noValue.includes(next)) {
      return { kind: "ReturnStmt", value: null, pos };
    }
    const value = this.parseExpr();
    return { kind: "ReturnStmt", value, pos };
  }

  private parseAssignmentOrExprStmt(): Statement {
    const pos = this.peek().pos;
    const expr = this.parseExpr();
    if (this.match("ASSIGN")) {
      if (expr.kind !== "Ident" && expr.kind !== "IndexAccess") {
        throw new PseudoParseError(
          "代入の左辺は変数名または配列要素である必要があります",
          pos,
        );
      }
      const target = expr as Ident | IndexAccess;
      const value = this.parseExpr();
      const stmt: Assignment = { kind: "Assignment", target, value, pos };
      return stmt;
    }
    const stmt: ExprStmt = { kind: "ExprStmt", expr, pos };
    return stmt;
  }

  // Expression parsing with precedence
  parseExpr(): Expr {
    return this.parseLogicOr();
  }

  private parseLogicOr(): Expr {
    let left = this.parseLogicAnd();
    while (this.check("KW_OR")) {
      const tk = this.consume();
      const right = this.parseLogicAnd();
      left = { kind: "BinaryOp", op: "or", left, right, pos: tk.pos } as BinaryOp;
    }
    return left;
  }

  private parseLogicAnd(): Expr {
    let left = this.parseNot();
    while (this.check("KW_AND")) {
      const tk = this.consume();
      const right = this.parseNot();
      left = { kind: "BinaryOp", op: "and", left, right, pos: tk.pos } as BinaryOp;
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.check("KW_NOT")) {
      const tk = this.consume();
      const operand = this.parseNot();
      return { kind: "UnaryOp", op: "not", operand, pos: tk.pos } as UnaryOp;
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    let left = this.parseAddSub();
    while (
      this.peek().kind === "EQ" ||
      this.peek().kind === "NEQ" ||
      this.peek().kind === "LT" ||
      this.peek().kind === "LE" ||
      this.peek().kind === "GT" ||
      this.peek().kind === "GE"
    ) {
      const tk = this.consume();
      const op = binOpOf(tk.kind);
      if (!op) throw new PseudoParseError("内部エラー: 比較演算子", tk.pos);
      const right = this.parseAddSub();
      left = { kind: "BinaryOp", op, left, right, pos: tk.pos } as BinaryOp;
    }
    return left;
  }

  private parseAddSub(): Expr {
    let left = this.parseMulDiv();
    while (this.peek().kind === "PLUS" || this.peek().kind === "MINUS") {
      const tk = this.consume();
      const op = binOpOf(tk.kind)!;
      const right = this.parseMulDiv();
      left = { kind: "BinaryOp", op, left, right, pos: tk.pos } as BinaryOp;
    }
    return left;
  }

  private parseMulDiv(): Expr {
    let left = this.parseUnary();
    while (
      this.peek().kind === "MUL" ||
      this.peek().kind === "DIV" ||
      this.peek().kind === "KW_MOD"
    ) {
      const tk = this.consume();
      const op = binOpOf(tk.kind)!;
      const right = this.parseUnary();
      left = { kind: "BinaryOp", op, left, right, pos: tk.pos } as BinaryOp;
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.check("MINUS")) {
      const tk = this.consume();
      const operand = this.parseUnary();
      return { kind: "UnaryOp", op: "-", operand, pos: tk.pos } as UnaryOp;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const tk = this.peek();
    switch (tk.kind) {
      case "INT": {
        this.consume();
        return { kind: "IntLit", value: parseInt(tk.value, 10), pos: tk.pos } as IntLit;
      }
      case "FLOAT": {
        this.consume();
        return { kind: "FloatLit", value: parseFloat(tk.value), pos: tk.pos } as FloatLit;
      }
      case "STRING": {
        this.consume();
        return { kind: "StringLit", value: tk.value, pos: tk.pos } as StringLit;
      }
      case "TRUE": {
        this.consume();
        return { kind: "BoolLit", value: true, pos: tk.pos } as BoolLit;
      }
      case "FALSE": {
        this.consume();
        return { kind: "BoolLit", value: false, pos: tk.pos } as BoolLit;
      }
      case "UNDEFINED": {
        this.consume();
        return { kind: "UndefinedLit", pos: tk.pos } as UndefinedLit;
      }
      case "LPAREN": {
        this.consume();
        const inner = this.parseExpr();
        this.expect("RPAREN");
        return inner;
      }
      case "LBRACE": {
        this.consume();
        const elements: Expr[] = [];
        if (!this.check("RBRACE")) {
          elements.push(this.parseExpr());
          while (this.match("COMMA")) {
            elements.push(this.parseExpr());
          }
        }
        this.expect("RBRACE");
        return { kind: "ArrayLit", elements, pos: tk.pos } as ArrayLit;
      }
      case "IDENT": {
        this.consume();
        if (this.match("LPAREN")) {
          const args: Expr[] = [];
          if (!this.check("RPAREN")) {
            args.push(this.parseExpr());
            while (this.match("COMMA")) {
              args.push(this.parseExpr());
            }
          }
          this.expect("RPAREN");
          return {
            kind: "Call",
            callee: tk.value,
            args,
            pos: tk.pos,
          } as Call;
        }
        if (this.match("LBRACK")) {
          const index = this.parseExpr();
          this.expect("RBRACK");
          return {
            kind: "IndexAccess",
            array: { kind: "Ident", name: tk.value, pos: tk.pos } as Ident,
            index,
            pos: tk.pos,
          } as IndexAccess;
        }
        return { kind: "Ident", name: tk.value, pos: tk.pos } as Ident;
      }
      default:
        throw new PseudoParseError(
          `式が期待されるところに '${tk.value || tk.kind}' がありました`,
          tk.pos,
        );
    }
  }
}

function describeToken(kind: TokenKind): string {
  const map: Partial<Record<TokenKind, string>> = {
    LPAREN: "'('",
    RPAREN: "')'",
    LBRACE: "'{'",
    RBRACE: "'}'",
    LBRACK: "'['",
    RBRACK: "']'",
    COMMA: "','",
    COLON: "':'",
    ASSIGN: "'←'",
    KW_ENDIF: "'endif'",
    KW_ENDWHILE: "'endwhile'",
    KW_ENDFOR: "'endfor'",
    KW_WO: "「を」",
    KW_FROM: "「から」",
    KW_TO: "「まで」",
    KW_STEP: "「ずつ」",
    IDENT: "識別子",
    INT: "整数",
  };
  return map[kind] ?? kind;
}

export function parse(source: string): Program {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  return parser.parseProgram();
}

export function parseTokens(tokens: Token[]): Program {
  return new Parser(tokens).parseProgram();
}
