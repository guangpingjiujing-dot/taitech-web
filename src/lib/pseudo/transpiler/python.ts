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
  Param,
  ProcDecl,
  Program,
  ReturnStmt,
  Statement,
  TypeSpec,
  UnaryOp,
  VarDecl,
  WhileStmt,
} from "../ast";

const INDEX_COMMENT = "  # 擬似言語は1始まりなので-1";

function typeAnnotation(t: TypeSpec): string {
  const base =
    t.base === "int"
      ? "int"
      : t.base === "float"
        ? "float"
        : t.base === "string"
          ? "str"
          : "bool";
  return t.isArray ? `list[${base}]` : base;
}

function emitExpr(expr: Expr): string {
  switch (expr.kind) {
    case "IntLit":
      return String(expr.value);
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
      return `[${expr.elements.map(emitExpr).join(", ")}]`;
    case "IndexAccess":
      return `${expr.array.name}[${emitExpr(expr.index)} - 1]`;
    case "UnaryOp":
      return emitUnary(expr);
    case "BinaryOp":
      return emitBinary(expr);
    case "Call":
      return emitCall(expr);
  }
}

function emitUnary(expr: UnaryOp): string {
  if (expr.op === "-") return `-${emitExpr(expr.operand)}`;
  return `not ${emitExpr(expr.operand)}`;
}

function emitBinary(expr: BinaryOp): string {
  const l = emitExpr(expr.left);
  const r = emitExpr(expr.right);
  switch (expr.op) {
    case "+":
    case "-":
    case "*":
      return `(${l} ${expr.op} ${r})`;
    case "/":
      // Ambiguous: use / for now; integer users should use //
      return `(${l} / ${r})`;
    case "div":
      // 整数の商。Python の // は負数で床除算になるが、試験の出題は非負のみ
      return `(${l} // ${r})`;
    case "mod":
      return `(${l} % ${r})`;
    case "=":
      return `(${l} == ${r})`;
    case "≠":
      return `(${l} != ${r})`;
    case "<":
      return `(${l} < ${r})`;
    case "≦":
      return `(${l} <= ${r})`;
    case ">":
      return `(${l} > ${r})`;
    case "≧":
      return `(${l} >= ${r})`;
    case "and":
      return `(${l} and ${r})`;
    case "or":
      return `(${l} or ${r})`;
  }
}

function emitCall(expr: Call): string {
  return `${expr.callee}(${expr.args.map(emitExpr).join(", ")})`;
}

function emitParam(p: Param): string {
  return `${p.name}: ${typeAnnotation(p.paramType)}`;
}

function indent(lines: string[], level: number): string[] {
  const pad = "    ".repeat(level);
  return lines.map((l) => (l === "" ? "" : pad + l));
}

function emitVarDecl(stmt: VarDecl): string[] {
  const t = typeAnnotation(stmt.varType);
  return stmt.bindings.map((b) => {
    if (b.init) {
      return `${b.name}: ${t} = ${emitExpr(b.init)}`;
    }
    if (stmt.varType.isArray) {
      return `${b.name}: ${t} = []`;
    }
    return `${b.name}: ${t} = None`;
  });
}

function emitAssignment(stmt: Assignment): string[] {
  if (stmt.target.kind === "IndexAccess") {
    const idx = stmt.target as IndexAccess;
    return [
      `${idx.array.name}[${emitExpr(idx.index)} - 1] = ${emitExpr(stmt.value)}${INDEX_COMMENT}`,
    ];
  }
  return [`${(stmt.target as Ident).name} = ${emitExpr(stmt.value)}`];
}

function emitIf(stmt: IfStmt): string[] {
  const out: string[] = [];
  stmt.branches.forEach((branch, i) => {
    const kw = i === 0 ? "if" : "elif";
    out.push(`${kw} ${emitExpr(branch.cond)}:`);
    const bodyLines = emitBlock(branch.body);
    out.push(...indent(bodyLines.length > 0 ? bodyLines : ["pass"], 1));
  });
  if (stmt.elseBody) {
    out.push("else:");
    const bodyLines = emitBlock(stmt.elseBody);
    out.push(...indent(bodyLines.length > 0 ? bodyLines : ["pass"], 1));
  }
  return out;
}

function emitWhile(stmt: WhileStmt): string[] {
  const out: string[] = [`while ${emitExpr(stmt.cond)}:`];
  const bodyLines = emitBlock(stmt.body);
  out.push(...indent(bodyLines.length > 0 ? bodyLines : ["pass"], 1));
  return out;
}

function emitFor(stmt: ForStmt): string[] {
  // for i in range(start, end + 1, step) for inc
  // for i in range(start, end - 1, -step) for dec
  const start = emitExpr(stmt.start);
  const end = emitExpr(stmt.end);
  const step = emitExpr(stmt.step);
  let rangeExpr: string;
  if (stmt.direction === "inc") {
    rangeExpr = `range(${start}, ${end} + 1, ${step})`;
  } else {
    rangeExpr = `range(${start}, ${end} - 1, -${step})`;
  }
  const out: string[] = [`for ${stmt.iterVar} in ${rangeExpr}:`];
  const bodyLines = emitBlock(stmt.body);
  out.push(...indent(bodyLines.length > 0 ? bodyLines : ["pass"], 1));
  return out;
}

function emitReturn(stmt: ReturnStmt): string[] {
  return [stmt.value ? `return ${emitExpr(stmt.value)}` : "return"];
}

function emitStatement(stmt: Statement): string[] {
  switch (stmt.kind) {
    case "VarDecl":
      return emitVarDecl(stmt);
    case "Assignment":
      return emitAssignment(stmt);
    case "IfStmt":
      return emitIf(stmt);
    case "WhileStmt":
      return emitWhile(stmt);
    case "ForStmt":
      return emitFor(stmt);
    case "ReturnStmt":
      return emitReturn(stmt);
    case "ExprStmt":
      return [emitExpr(stmt.expr)];
  }
}

function emitBlock(body: Statement[]): string[] {
  const out: string[] = [];
  for (const s of body) out.push(...emitStatement(s));
  return out;
}

function emitFuncDecl(fn: FuncDecl): string[] {
  const params = fn.params.map(emitParam).join(", ");
  const ret = typeAnnotation(fn.returnType);
  const out: string[] = [`def ${fn.name}(${params}) -> ${ret}:`];
  const body = emitBlock(fn.body);
  out.push(...indent(body.length > 0 ? body : ["pass"], 1));
  return out;
}

function emitProcDecl(fn: ProcDecl): string[] {
  const params = fn.params.map(emitParam).join(", ");
  const out: string[] = [`def ${fn.name}(${params}) -> None:`];
  const body = emitBlock(fn.body);
  out.push(...indent(body.length > 0 ? body : ["pass"], 1));
  return out;
}

export function transpileToPython(ast: Program): string {
  const lines: string[] = [];
  // Emit function/procedure declarations first (Python needs them defined
  // before use), then main statements.
  for (const item of ast.body) {
    if (item.kind === "FuncDecl") {
      lines.push(...emitFuncDecl(item), "");
    } else if (item.kind === "ProcDecl") {
      lines.push(...emitProcDecl(item), "");
    }
  }
  for (const item of ast.body) {
    if (item.kind !== "FuncDecl" && item.kind !== "ProcDecl") {
      lines.push(...emitStatement(item));
    }
  }
  return lines.join("\n").replace(/\n+$/, "") + "\n";
}
