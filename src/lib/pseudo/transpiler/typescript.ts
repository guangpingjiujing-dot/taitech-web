import type {
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

const INDEX_COMMENT = " // 擬似言語は1始まりなので-1";

function typeAnnotation(t: TypeSpec): string {
  const base =
    t.base === "int" || t.base === "float"
      ? "number"
      : t.base === "string"
        ? "string"
        : "boolean";
  return t.isArray ? `${base}[]` : base;
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
      return expr.value ? "true" : "false";
    case "UndefinedLit":
      return "undefined";
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
  return `!${emitExpr(expr.operand)}`;
}

function emitBinary(expr: BinaryOp): string {
  const l = emitExpr(expr.left);
  const r = emitExpr(expr.right);
  switch (expr.op) {
    case "+":
    case "-":
    case "*":
    case "/":
      return `(${l} ${expr.op} ${r})`;
    case "mod":
      return `(${l} % ${r})`;
    case "=":
      return `(${l} === ${r})`;
    case "≠":
      return `(${l} !== ${r})`;
    case "<":
      return `(${l} < ${r})`;
    case "≦":
      return `(${l} <= ${r})`;
    case ">":
      return `(${l} > ${r})`;
    case "≧":
      return `(${l} >= ${r})`;
    case "and":
      return `(${l} && ${r})`;
    case "or":
      return `(${l} || ${r})`;
  }
}

function emitCall(expr: Call): string {
  // Rewrite print(x) to console.log(x).
  if (expr.callee === "print") {
    return `console.log(${expr.args.map(emitExpr).join(", ")})`;
  }
  return `${expr.callee}(${expr.args.map(emitExpr).join(", ")})`;
}

function emitParam(p: Param): string {
  return `${p.name}: ${typeAnnotation(p.paramType)}`;
}

function indent(lines: string[], level: number): string[] {
  const pad = "  ".repeat(level);
  return lines.map((l) => (l === "" ? "" : pad + l));
}

function emitVarDecl(stmt: VarDecl): string[] {
  const t = typeAnnotation(stmt.varType);
  return stmt.bindings.map((b) => {
    if (b.init) {
      return `let ${b.name}: ${t} = ${emitExpr(b.init)};`;
    }
    if (stmt.varType.isArray) {
      return `let ${b.name}: ${t} = [];`;
    }
    // Union with undefined so declaration compiles cleanly.
    return `let ${b.name}: ${t} | undefined = undefined;`;
  });
}

function emitAssignment(stmt: Assignment): string[] {
  if (stmt.target.kind === "IndexAccess") {
    const idx = stmt.target as IndexAccess;
    return [
      `${idx.array.name}[${emitExpr(idx.index)} - 1] = ${emitExpr(stmt.value)};${INDEX_COMMENT}`,
    ];
  }
  return [`${(stmt.target as Ident).name} = ${emitExpr(stmt.value)};`];
}

function emitIf(stmt: IfStmt): string[] {
  const out: string[] = [];
  stmt.branches.forEach((branch, i) => {
    const kw = i === 0 ? "if" : "else if";
    out.push(`${kw} (${emitExpr(branch.cond)}) {`);
    out.push(...indent(emitBlock(branch.body), 1));
    out.push("}");
  });
  if (stmt.elseBody) {
    // Attach else to previous }
    const last = out.length - 1;
    out[last] = "} else {";
    out.push(...indent(emitBlock(stmt.elseBody), 1));
    out.push("}");
  }
  return out;
}

function emitWhile(stmt: WhileStmt): string[] {
  const out: string[] = [`while (${emitExpr(stmt.cond)}) {`];
  out.push(...indent(emitBlock(stmt.body), 1));
  out.push("}");
  return out;
}

function emitFor(stmt: ForStmt): string[] {
  const start = emitExpr(stmt.start);
  const end = emitExpr(stmt.end);
  const step = emitExpr(stmt.step);
  const cmp = stmt.direction === "inc" ? "<=" : ">=";
  const upd =
    stmt.direction === "inc"
      ? `${stmt.iterVar} += ${step}`
      : `${stmt.iterVar} -= ${step}`;
  const out: string[] = [
    `for (let ${stmt.iterVar} = ${start}; ${stmt.iterVar} ${cmp} ${end}; ${upd}) {`,
  ];
  out.push(...indent(emitBlock(stmt.body), 1));
  out.push("}");
  return out;
}

function emitReturn(stmt: ReturnStmt): string[] {
  return [stmt.value ? `return ${emitExpr(stmt.value)};` : "return;"];
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
      return [`${emitExpr(stmt.expr)};`];
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
  const out: string[] = [`function ${fn.name}(${params}): ${ret} {`];
  out.push(...indent(emitBlock(fn.body), 1));
  out.push("}");
  return out;
}

function emitProcDecl(fn: ProcDecl): string[] {
  const params = fn.params.map(emitParam).join(", ");
  const out: string[] = [`function ${fn.name}(${params}): void {`];
  out.push(...indent(emitBlock(fn.body), 1));
  out.push("}");
  return out;
}

export function transpileToTypeScript(ast: Program): string {
  const lines: string[] = [];
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
