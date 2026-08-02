export interface Position {
  line: number;
  column: number;
}

export interface BaseNode {
  pos: Position;
}

/** Alias kept for readable call sites like `Node | null`. */
export type Node = BaseNode;

export type PrimitiveType = "int" | "float" | "string" | "bool";

export interface TypeSpec {
  base: PrimitiveType;
  isArray: boolean;
}

export interface Param {
  paramType: TypeSpec;
  name: string;
}

export interface VarDecl extends BaseNode {
  kind: "VarDecl";
  varType: TypeSpec;
  bindings: { name: string; init: Expr | null }[];
}

export interface FuncDecl extends BaseNode {
  kind: "FuncDecl";
  returnType: TypeSpec;
  name: string;
  params: Param[];
  body: Statement[];
}

export interface ProcDecl extends BaseNode {
  kind: "ProcDecl";
  name: string;
  params: Param[];
  body: Statement[];
}

export type TopLevel = FuncDecl | ProcDecl | Statement;

export interface Program extends BaseNode {
  kind: "Program";
  body: TopLevel[];
}

export interface Assignment extends BaseNode {
  kind: "Assignment";
  target: Ident | IndexAccess;
  value: Expr;
}

export interface IfBranch {
  cond: Expr;
  body: Statement[];
  /** Position of the `if` / `elseif` keyword — used to highlight the
   *  condition line in step execution even when the previous branch's
   *  condition was false. */
  keywordPos: Position;
}

export interface IfStmt extends BaseNode {
  kind: "IfStmt";
  branches: IfBranch[];
  elseBody: Statement[] | null;
  /** Position of the `else` keyword when `elseBody` is present, so the
   *  else line can be highlighted before entering its body. */
  elsePos: Position | null;
  /** Position of the `endif` keyword, so the closing line can be
   *  highlighted on exit. */
  endPos: Position;
}

export interface WhileStmt extends BaseNode {
  kind: "WhileStmt";
  cond: Expr;
  body: Statement[];
  /** Position of the `endwhile` keyword, so the closing line can be
   *  highlighted after the loop exits. */
  endPos: Position;
}

export interface ForStmt extends BaseNode {
  kind: "ForStmt";
  iterVar: string;
  start: Expr;
  end: Expr;
  step: Expr;
  direction: "inc" | "dec";
  body: Statement[];
  /** Position of the `endfor` keyword, so the closing line can be
   *  highlighted after the loop exits. */
  endPos: Position;
}

export interface ReturnStmt extends BaseNode {
  kind: "ReturnStmt";
  value: Expr | null;
}

export interface ExprStmt extends BaseNode {
  kind: "ExprStmt";
  expr: Expr;
}

export type Statement =
  | VarDecl
  | Assignment
  | IfStmt
  | WhileStmt
  | ForStmt
  | ReturnStmt
  | ExprStmt;

export interface IntLit extends BaseNode {
  kind: "IntLit";
  value: number;
}
export interface FloatLit extends BaseNode {
  kind: "FloatLit";
  value: number;
}
export interface StringLit extends BaseNode {
  kind: "StringLit";
  value: string;
}
export interface BoolLit extends BaseNode {
  kind: "BoolLit";
  value: boolean;
}
export interface UndefinedLit extends BaseNode {
  kind: "UndefinedLit";
}
export interface Ident extends BaseNode {
  kind: "Ident";
  name: string;
}

export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "mod"
  | "="
  | "≠"
  | "<"
  | "≦"
  | ">"
  | "≧"
  | "and"
  | "or";

export interface BinaryOp extends BaseNode {
  kind: "BinaryOp";
  op: BinaryOperator;
  left: Expr;
  right: Expr;
}

export type UnaryOperator = "-" | "not";

export interface UnaryOp extends BaseNode {
  kind: "UnaryOp";
  op: UnaryOperator;
  operand: Expr;
}

export interface Call extends BaseNode {
  kind: "Call";
  callee: string;
  args: Expr[];
}

export interface IndexAccess extends BaseNode {
  kind: "IndexAccess";
  array: Ident;
  index: Expr;
}

export interface ArrayLit extends BaseNode {
  kind: "ArrayLit";
  elements: Expr[];
}

export type Expr =
  | IntLit
  | FloatLit
  | StringLit
  | BoolLit
  | UndefinedLit
  | Ident
  | BinaryOp
  | UnaryOp
  | Call
  | IndexAccess
  | ArrayLit;

export function isStatement(node: TopLevel | Statement): node is Statement {
  return node.kind !== "FuncDecl" && node.kind !== "ProcDecl";
}
