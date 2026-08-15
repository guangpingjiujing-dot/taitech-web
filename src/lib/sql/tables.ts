import type { Expr, Query, SqlProgram } from "./ast";

/**
 * SQL が参照している表の名前を、書かれた順に重複なく集める。
 *
 * **文字列に対する部分一致で数えないこと。** 文字列リテラルの中の語や、
 * 表名を含む列名 (`商品番号` に `商品` が含まれる) を拾ってしまう。
 * AST を辿れば「表として書かれた位置」だけを正確に取れる。
 *
 * 用途は練習問題ページで「この問題が使う表」だけを出すこと。
 * データセットの全表を並べると、問題に無関係な表がノイズになる。
 */
export function collectTableNames(program: SqlProgram): string[] {
  const names: string[] = [];
  const add = (name: string) => {
    if (!names.some((n) => n.toUpperCase() === name.toUpperCase())) {
      names.push(name);
    }
  };

  const walkExpr = (expr: Expr): void => {
    switch (expr.kind) {
      case "ScalarSubquery":
        walkQuery(expr.query);
        break;
      case "ExistsExpr":
        walkQuery(expr.subquery);
        break;
      case "InExpr":
        if (expr.subquery) walkQuery(expr.subquery);
        expr.list?.forEach(walkExpr);
        walkExpr(expr.operand);
        break;
      case "UnaryExpr":
        walkExpr(expr.operand);
        break;
      case "BinaryExpr":
        walkExpr(expr.left);
        walkExpr(expr.right);
        break;
      case "BetweenExpr":
        walkExpr(expr.operand);
        walkExpr(expr.lower);
        walkExpr(expr.upper);
        break;
      case "LikeExpr":
        walkExpr(expr.operand);
        walkExpr(expr.pattern);
        break;
      case "IsNullExpr":
        walkExpr(expr.operand);
        break;
      case "FuncCall":
        if (expr.arg) walkExpr(expr.arg);
        break;
      default:
        break;
    }
  };

  const walkQuery = (query: Query): void => {
    if (query.kind === "SetOperation") {
      walkQuery(query.left);
      walkQuery(query.right);
      query.orderBy.forEach((o) => walkExpr(o.expr));
      return;
    }
    query.from.forEach((t) => add(t.name));
    query.joins.forEach((j) => {
      add(j.table.name);
      if (j.on) walkExpr(j.on);
    });
    if (query.where) walkExpr(query.where);
    query.groupBy.forEach(walkExpr);
    if (query.having) walkExpr(query.having);
    query.columns.forEach((c) => walkExpr(c.expr));
    query.orderBy.forEach((o) => walkExpr(o.expr));
  };

  for (const stmt of program.statements) {
    switch (stmt.kind) {
      case "SelectStmt":
        walkQuery(stmt.query);
        break;
      case "InsertStmt":
        add(stmt.table);
        stmt.values.forEach((row) => row.forEach(walkExpr));
        break;
      case "UpdateStmt":
        add(stmt.table);
        stmt.assignments.forEach((a) => walkExpr(a.value));
        if (stmt.where) walkExpr(stmt.where);
        break;
      case "DeleteStmt":
        add(stmt.table);
        if (stmt.where) walkExpr(stmt.where);
        break;
      case "CreateTableStmt":
        add(stmt.table);
        for (const c of stmt.constraints) {
          if (c.kind === "ForeignKey") add(c.refTable);
        }
        break;
      case "CreateViewStmt":
        walkQuery(stmt.query);
        break;
    }
  }

  return names;
}
