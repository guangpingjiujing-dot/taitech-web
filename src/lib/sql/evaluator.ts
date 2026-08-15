import type {
  Expr,
  Join,
  Position,
  Query,
  SelectCore,
  SetOperation,
  Span,
  SqlProgram,
  Statement,
  TableRef,
} from "./ast";
import { SqlRuntimeError } from "./errors";
import {
  cloneDatabase,
  findTable,
  findView,
  sameName,
  viewFromStatement,
  type Database,
  type TableData,
} from "./database";
import {
  asTruth,
  compareValues,
  keepsRow,
  likeMatches,
  rowKey,
  totalOrder,
  truthAnd,
  truthNot,
  truthOr,
  typeNameOf,
  valuesEqualForGrouping,
  type SqlValue,
  type Truth,
} from "./values";

/**
 * 評価器。
 *
 * **最終結果ではなく「評価順の段階」を返すのがこのファイルの存在理由。**
 * FE 受験者が最も間違えるのは「SELECT が最後に評価されること」と
 * 「WHERE と HAVING の違い」で、それを見せるには評価器を自前で持つしかない
 * (docs/wip/20260815-fe-sql/00-overview.md §4)。
 */

/* ========================================================================
 * 外に出る型
 * ==================================================================== */

export interface ResultColumn {
  /** 表示名 */
  name: string;
  /** 中間表で `商品.商品番号` と出すための修飾子 */
  qualifier: string | null;
}

export interface ResultTable {
  columns: ResultColumn[];
  rows: SqlValue[][];
}

export type StageKind =
  | "from"
  | "join"
  | "where"
  | "group-by"
  | "having"
  | "select"
  | "distinct"
  | "order-by"
  | "set-op";

/** GROUP BY 直後の中間表は「行の集合」ではなく「グループの集合」 */
export interface StageGroup {
  key: { column: string; value: SqlValue }[];
  rows: SqlValue[][];
}

export interface Stage {
  kind: StageKind;
  /** 「WHERE: 12 行 → 3 行」のような一行説明 */
  label: string;
  /** エディタでハイライトする句の範囲 */
  clauseRange: Span | null;
  table: ResultTable;
  /** `kind === "group-by"` のときだけ入る */
  groups?: StageGroup[];
}

export type RowChange = "unchanged" | "inserted" | "deleted" | "updated";

export interface DiffRow {
  change: RowChange;
  values: SqlValue[];
  /** `updated` のときの変更前の値 */
  before?: SqlValue[];
  /** `updated` のとき、変わった列の添字 */
  changedColumns?: number[];
}

export interface DiffTable {
  columns: ResultColumn[];
  rows: DiffRow[];
}

export type StatementResult =
  | {
      kind: "select";
      stages: Stage[];
      table: ResultTable;
    }
  | {
      kind: "dml";
      op: "INSERT" | "UPDATE" | "DELETE";
      table: string;
      stages: Stage[];
      /** 実行前後の差分。DML は中間表ではなくこれで見せる */
      diff: DiffTable;
      affected: number;
    }
  | {
      kind: "ddl";
      op: "CREATE TABLE" | "CREATE VIEW";
      name: string;
      message: string;
    };

export interface EvaluateResult {
  results: StatementResult[];
  /** 実行後のデータベース。DML の結果が反映されている */
  database: Database;
}

/** 直積が爆発したときの保険。教材のデータは数十行なので十分に緩い */
const MAX_ROWS = 20000;

/* ========================================================================
 * 内部表現
 * ==================================================================== */

interface Field {
  /** 相関名またはテーブル名 */
  qualifier: string;
  name: string;
}

interface WorkingSet {
  fields: Field[];
  rows: SqlValue[][];
}

/** 相関副問合せのために外側の行を辿れるようにする */
interface Scope {
  fields: Field[];
  row: SqlValue[];
  parent: Scope | null;
}

/** 集約を評価する文脈。GROUP BY / HAVING / SELECT で使う */
interface GroupContext {
  fields: Field[];
  rows: SqlValue[][];
  /** GROUP BY に書かれた式のキー。ここに無い列を裸で使うとエラー */
  groupedKeys: Set<string>;
}

/** 位置情報を落とした構造キー。GROUP BY との照合に使う */
function exprKey(expr: Expr): string {
  return JSON.stringify(expr, (key, value) =>
    key === "pos" || key === "spans" || key === "span" ? undefined : value,
  );
}

/* ========================================================================
 * 評価器
 * ==================================================================== */

class Evaluator {
  private db: Database;

  constructor(db: Database) {
    this.db = cloneDatabase(db);
  }

  get database(): Database {
    return this.db;
  }

  run(program: SqlProgram): StatementResult[] {
    return program.statements.map((stmt) => this.runStatement(stmt));
  }

  private runStatement(stmt: Statement): StatementResult {
    switch (stmt.kind) {
      case "SelectStmt": {
        const stages: Stage[] = [];
        const set = this.evalQuery(stmt.query, null, stages);
        return { kind: "select", stages, table: toResultTable(set) };
      }
      case "InsertStmt":
        return this.runInsert(stmt);
      case "UpdateStmt":
        return this.runUpdate(stmt);
      case "DeleteStmt":
        return this.runDelete(stmt);
      case "CreateTableStmt": {
        if (findTable(this.db, stmt.table) || findView(this.db, stmt.table)) {
          throw new SqlRuntimeError(
            "DUPLICATE_TABLE",
            `表「${stmt.table}」はすでに存在します`,
            stmt.pos,
          );
        }
        this.db.tables.push({
          schema: {
            name: stmt.table,
            columns: stmt.columns,
            constraints: stmt.constraints,
          },
          rows: [],
        });
        return {
          kind: "ddl",
          op: "CREATE TABLE",
          name: stmt.table,
          message: `表「${stmt.table}」を作成しました (${stmt.columns.length} 列)`,
        };
      }
      case "CreateViewStmt": {
        if (findTable(this.db, stmt.name) || findView(this.db, stmt.name)) {
          throw new SqlRuntimeError(
            "DUPLICATE_TABLE",
            `「${stmt.name}」はすでに存在します`,
            stmt.pos,
          );
        }
        this.db.views.push(viewFromStatement(stmt));
        return {
          kind: "ddl",
          op: "CREATE VIEW",
          name: stmt.name,
          message: `ビュー「${stmt.name}」を作成しました (実表ではないので、元の表が変わると内容も変わります)`,
        };
      }
    }
  }

  /* ---------------- SELECT ---------------- */

  /**
   * `stages` に段階を積みながらクエリを評価する。
   * 副問合せの評価では `stages` に null を渡して段階を積まない
   * (外側のクエリの段階表示に内側の中間表が混ざると読めなくなる)。
   */
  private evalQuery(
    query: Query,
    outer: Scope | null,
    stages: Stage[] | null,
  ): WorkingSet {
    if (query.kind === "SetOperation") return this.evalSetOp(query, outer, stages);
    return this.evalSelectCore(query, outer, stages);
  }

  private evalSetOp(
    node: SetOperation,
    outer: Scope | null,
    stages: Stage[] | null,
  ): WorkingSet {
    const left = this.evalQuery(node.left, outer, stages);
    const right = this.evalQuery(node.right, outer, null);

    if (left.fields.length !== right.fields.length) {
      throw new SqlRuntimeError(
        "COLUMN_COUNT_MISMATCH",
        `${node.op} で結合する 2 つの SELECT は列数を揃える必要があります (左 ${left.fields.length} 列 / 右 ${right.fields.length} 列)`,
        node.pos,
      );
    }

    const rightKeys = new Set(right.rows.map(rowKey));
    const leftKeys = new Set(left.rows.map(rowKey));
    let rows: SqlValue[][];
    switch (node.op) {
      case "UNION ALL":
        rows = [...left.rows, ...right.rows];
        break;
      case "UNION":
        rows = dedupe([...left.rows, ...right.rows]);
        break;
      case "EXCEPT":
        rows = dedupe(left.rows.filter((r) => !rightKeys.has(rowKey(r))));
        break;
      case "INTERSECT":
        rows = dedupe(left.rows.filter((r) => leftKeys.has(rowKey(r)) && rightKeys.has(rowKey(r))));
        break;
    }

    const result: WorkingSet = { fields: left.fields, rows };
    if (stages) {
      stages.push({
        kind: "set-op",
        label: `${node.op}: 左 ${left.rows.length} 行 / 右 ${right.rows.length} 行 → ${rows.length} 行`,
        clauseRange: node.span,
        table: toResultTable(result),
      });
    }
    return result;
  }

  private evalSelectCore(
    node: SelectCore,
    outer: Scope | null,
    stages: Stage[] | null,
  ): WorkingSet {
    // 1. FROM — 直積
    let set = this.buildFrom(node.from, node.pos);
    if (stages && node.from.length > 0) {
      stages.push({
        kind: "from",
        label:
          node.from.length === 1
            ? `FROM: ${node.from[0].name} を読み込み (${set.rows.length} 行)`
            : `FROM: ${node.from.map((t) => t.name).join(" × ")} の直積 (${set.rows.length} 行)`,
        clauseRange: node.spans.from ?? null,
        table: toResultTable(set),
      });
    }

    // 2. JOIN
    for (const join of node.joins) {
      const before = set.rows.length;
      set = this.applyJoin(set, join, outer);
      if (stages) {
        stages.push({
          kind: "join",
          label: `${join.type} JOIN ${join.table.name}: ${before} 行 → ${set.rows.length} 行`,
          clauseRange: node.spans.from ?? null,
          table: toResultTable(set),
        });
      }
    }

    // 3. WHERE — グループ化より前なので集約関数は使えない
    if (node.where) {
      assertNoAggregate(node.where, "WHERE");
      const before = set.rows.length;
      set = {
        fields: set.fields,
        rows: set.rows.filter((row) =>
          keepsRow(
            this.evalTruth(node.where!, { fields: set.fields, row, parent: outer }),
          ),
        ),
      };
      if (stages) {
        stages.push({
          kind: "where",
          label: `WHERE: ${before} 行 → ${set.rows.length} 行`,
          clauseRange: node.spans.where ?? null,
          table: toResultTable(set),
        });
      }
    }

    // 4. GROUP BY
    const hasAggregate =
      node.columns.some((c) => containsAggregate(c.expr)) ||
      (node.having !== null && containsAggregate(node.having));
    const grouping = node.groupBy.length > 0 || hasAggregate;

    let groups: { keyValues: SqlValue[]; rows: SqlValue[][] }[];
    let groupCtx: GroupContext | null = null;

    if (grouping) {
      const groupedKeys = new Set(node.groupBy.map(exprKey));
      groupCtx = { fields: set.fields, rows: [], groupedKeys };
      groups = this.groupRows(set, node.groupBy, outer);

      if (stages) {
        stages.push({
          kind: "group-by",
          label:
            node.groupBy.length > 0
              ? `GROUP BY: ${set.rows.length} 行 → ${groups.length} グループ`
              : `集約関数があるので、表全体が 1 グループになります (${set.rows.length} 行 → 1 グループ)`,
          clauseRange: node.spans.groupBy ?? null,
          table: toResultTable(set),
          groups: groups.map((g) => ({
            key: node.groupBy.map((expr, i) => ({
              column: describeExpr(expr, set.fields),
              value: g.keyValues[i],
            })),
            rows: g.rows,
          })),
        });
      }

      // 5. HAVING — グループに対する絞り込み
      if (node.having) {
        const before = groups.length;
        groups = groups.filter((g) =>
          keepsRow(
            this.evalTruth(
              node.having!,
              g.rows.length > 0
                ? { fields: set.fields, row: g.rows[0], parent: outer }
                : { fields: set.fields, row: [], parent: outer },
              { ...groupCtx!, rows: g.rows },
            ),
          ),
        );
        if (stages) {
          stages.push({
            kind: "having",
            label: `HAVING: ${before} グループ → ${groups.length} グループ`,
            clauseRange: node.spans.having ?? null,
            table: {
              columns: set.fields.map(fieldToColumn),
              rows: groups.flatMap((g) => g.rows),
            },
            groups: groups.map((g) => ({
              key: node.groupBy.map((expr, i) => ({
                column: describeExpr(expr, set.fields),
                value: g.keyValues[i],
              })),
              rows: g.rows,
            })),
          });
        }
      }
    } else {
      groups = set.rows.map((row) => ({ keyValues: [], rows: [row] }));
    }

    // 6. SELECT — ここでようやく列が決まる
    let projected = this.project(node, set, groups, grouping, groupCtx, outer);
    if (stages) {
      stages.push({
        kind: "select",
        label: `SELECT: ${projected.fields.length} 列を取り出し (${projected.rows.length} 行)`,
        clauseRange: node.spans.select ?? null,
        table: toResultTable(projected),
      });
    }

    // 7. DISTINCT
    if (node.distinct) {
      const before = projected.rows.length;
      projected = { fields: projected.fields, rows: dedupe(projected.rows) };
      if (stages) {
        stages.push({
          kind: "distinct",
          label: `DISTINCT: ${before} 行 → ${projected.rows.length} 行 (重複を除去)`,
          clauseRange: node.spans.select ?? null,
          table: toResultTable(projected),
        });
      }
    }

    // 8. ORDER BY
    if (node.orderBy.length > 0) {
      projected = this.applyOrderBy(node, projected, set, groups, grouping, groupCtx, outer);
      if (stages) {
        stages.push({
          kind: "order-by",
          label: `ORDER BY: ${projected.rows.length} 行を並べ替え`,
          clauseRange: node.spans.orderBy ?? null,
          table: toResultTable(projected),
        });
      }
    }

    return projected;
  }

  private buildFrom(refs: TableRef[], pos: Position): WorkingSet {
    if (refs.length === 0) {
      // `SELECT 1` のように FROM が無い形。1 行だけの無名の表として扱う
      return { fields: [], rows: [[]] };
    }
    let set: WorkingSet | null = null;
    for (const ref of refs) {
      const next = this.readTableRef(ref);
      set = set === null ? next : crossJoin(set, next, pos);
    }
    return set!;
  }

  private readTableRef(ref: TableRef): WorkingSet {
    const qualifier = ref.alias ?? ref.name;

    const table = findTable(this.db, ref.name);
    if (table) {
      return {
        fields: table.schema.columns.map((c) => ({ qualifier, name: c.name })),
        rows: table.rows.map((r) => [...r]),
      };
    }

    const view = findView(this.db, ref.name);
    if (view) {
      // ビューは実表ではないので、参照のたびに元のクエリを評価する
      const inner = this.evalQuery(view.query, null, null);
      const names = view.columns ?? inner.fields.map((f) => f.name);
      return {
        fields: names.map((name) => ({ qualifier, name })),
        rows: inner.rows.map((r) => [...r]),
      };
    }

    throw new SqlRuntimeError(
      "UNKNOWN_TABLE",
      `表「${ref.name}」がありません`,
      ref.pos,
      { hint: `使える表: ${this.availableNames()}` },
    );
  }

  private availableNames(): string {
    const names = [
      ...this.db.tables.map((t) => t.schema.name),
      ...this.db.views.map((v) => v.name),
    ];
    return names.length > 0 ? names.join(" / ") : "(まだ 1 つもありません)";
  }

  private applyJoin(
    left: WorkingSet,
    join: Join,
    outer: Scope | null,
  ): WorkingSet {
    const right = this.readTableRef(join.table);
    const fields = [...left.fields, ...right.fields];

    if (join.type === "CROSS") return crossJoin(left, right, join.table.pos);

    const rows: SqlValue[][] = [];
    const nullsForRight = right.fields.map(() => null as SqlValue);
    const nullsForLeft = left.fields.map(() => null as SqlValue);
    const matchedRight = new Set<number>();

    for (const l of left.rows) {
      let matched = false;
      for (let ri = 0; ri < right.rows.length; ri++) {
        const combined = [...l, ...right.rows[ri]];
        const truth = join.on
          ? this.evalTruth(join.on, { fields, row: combined, parent: outer })
          : true;
        if (keepsRow(truth)) {
          rows.push(combined);
          matched = true;
          matchedRight.add(ri);
          if (rows.length > MAX_ROWS) throw rowLimitError(join.table.pos);
        }
      }
      // 左外部結合は、相手が見つからなくても左の行を残す
      if (!matched && join.type === "LEFT") {
        rows.push([...l, ...nullsForRight]);
      }
    }

    // 右外部結合は、左に相手がいない右の行を残す
    if (join.type === "RIGHT") {
      for (let ri = 0; ri < right.rows.length; ri++) {
        if (!matchedRight.has(ri)) {
          rows.push([...nullsForLeft, ...right.rows[ri]]);
        }
      }
    }

    return { fields, rows };
  }

  private groupRows(
    set: WorkingSet,
    groupBy: Expr[],
    outer: Scope | null,
  ): { keyValues: SqlValue[]; rows: SqlValue[][] }[] {
    if (groupBy.length === 0) {
      // 集約関数だけがある形。表全体が 1 グループ (行が 0 でもグループは 1 つ)
      return [{ keyValues: [], rows: set.rows }];
    }
    const groups: { keyValues: SqlValue[]; rows: SqlValue[][] }[] = [];
    for (const row of set.rows) {
      const scope: Scope = { fields: set.fields, row, parent: outer };
      const keyValues = groupBy.map((e) => this.evalExpr(e, scope));
      const found = groups.find((g) =>
        g.keyValues.every((v, i) => valuesEqualForGrouping(v, keyValues[i])),
      );
      if (found) found.rows.push(row);
      else groups.push({ keyValues, rows: [row] });
    }
    return groups;
  }

  private project(
    node: SelectCore,
    set: WorkingSet,
    groups: { keyValues: SqlValue[]; rows: SqlValue[][] }[],
    grouping: boolean,
    groupCtx: GroupContext | null,
    outer: Scope | null,
  ): WorkingSet {
    const fields: Field[] = [];
    const rows: SqlValue[][] = [];

    // 列の見出しを先に確定させる
    for (const item of node.columns) {
      if (item.expr.kind === "StarRef") {
        const q = item.expr.qualifier;
        const matched = set.fields.filter(
          (f) => q === null || sameName(f.qualifier, q),
        );
        if (q !== null && matched.length === 0) {
          throw new SqlRuntimeError(
            "UNKNOWN_TABLE",
            `「${q}」という表または相関名がありません`,
            item.expr.pos,
          );
        }
        fields.push(...matched);
      } else {
        fields.push({
          qualifier: "",
          name: item.alias ?? describeExpr(item.expr, set.fields),
        });
      }
    }

    const buildRow = (scope: Scope, ctx: GroupContext | null): SqlValue[] => {
      const values: SqlValue[] = [];
      for (const item of node.columns) {
        if (item.expr.kind === "StarRef") {
          const q = item.expr.qualifier;
          set.fields.forEach((f, i) => {
            if (q === null || sameName(f.qualifier, q)) values.push(scope.row[i]);
          });
        } else {
          values.push(this.evalExpr(item.expr, scope, ctx));
        }
      }
      return values;
    };

    if (grouping) {
      for (const g of groups) {
        const scope: Scope = {
          fields: set.fields,
          row: g.rows[0] ?? set.fields.map(() => null),
          parent: outer,
        };
        rows.push(buildRow(scope, { ...groupCtx!, rows: g.rows }));
      }
    } else {
      for (const row of set.rows) {
        rows.push(buildRow({ fields: set.fields, row, parent: outer }, null));
      }
    }

    return { fields, rows };
  }

  private applyOrderBy(
    node: SelectCore,
    projected: WorkingSet,
    set: WorkingSet,
    groups: { keyValues: SqlValue[]; rows: SqlValue[][] }[],
    grouping: boolean,
    groupCtx: GroupContext | null,
    outer: Scope | null,
  ): WorkingSet {
    /*
     * ORDER BY は SELECT のあとに評価されるので、**出力の列名 (別名を含む) で並べ替えできる**。
     * まず出力列で解決し、見つからなければ元の表の列として解決する。
     */
    const keys = node.orderBy.map((item) => {
      if (item.expr.kind === "ColumnRef" && item.expr.qualifier === null) {
        const idx = projected.fields.findIndex((f) =>
          sameName(f.name, (item.expr as { name: string }).name),
        );
        if (idx >= 0) return { outputIndex: idx, expr: null };
      }
      return { outputIndex: -1, expr: item.expr };
    });

    // 元の表の列で並べ替える場合に備えて、出力行と入力行を対応づけておく
    const sourceScopes: { scope: Scope; ctx: GroupContext | null }[] = grouping
      ? groups.map((g) => ({
          scope: {
            fields: set.fields,
            row: g.rows[0] ?? set.fields.map(() => null),
            parent: outer,
          },
          ctx: { ...groupCtx!, rows: g.rows } as GroupContext,
        }))
      : set.rows.map((row) => ({
          scope: { fields: set.fields, row, parent: outer },
          ctx: null,
        }));

    const indexed = projected.rows.map((row, i) => ({ row, i }));
    indexed.sort((a, b) => {
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const direction = node.orderBy[k].direction === "DESC" ? -1 : 1;
        let av: SqlValue;
        let bv: SqlValue;
        if (key.outputIndex >= 0) {
          av = a.row[key.outputIndex];
          bv = b.row[key.outputIndex];
        } else {
          const sa = sourceScopes[a.i];
          const sb = sourceScopes[b.i];
          av = this.evalExpr(key.expr!, sa.scope, sa.ctx);
          bv = this.evalExpr(key.expr!, sb.scope, sb.ctx);
        }
        const cmp = totalOrder(av, bv);
        if (cmp !== 0) return cmp * direction;
      }
      return a.i - b.i; // 安定ソート
    });

    return { fields: projected.fields, rows: indexed.map((x) => x.row) };
  }

  /* ---------------- 式の評価 ---------------- */

  private evalTruth(
    expr: Expr,
    scope: Scope,
    ctx: GroupContext | null = null,
  ): Truth {
    return asTruth(this.evalExpr(expr, scope, ctx), expr.pos);
  }

  private evalExpr(
    expr: Expr,
    scope: Scope,
    ctx: GroupContext | null = null,
  ): SqlValue {
    switch (expr.kind) {
      case "NumberLit":
        return expr.value;
      case "StringLit":
        return expr.value;
      case "BoolLit":
        return expr.value;
      case "NullLit":
        return null;

      case "StarRef":
        throw new SqlRuntimeError(
          "TYPE_MISMATCH",
          "`*` は値として使えません",
          expr.pos,
          { hint: "件数を数えるなら COUNT(*) と書きます。" },
        );

      case "ColumnRef": {
        if (ctx && !ctx.groupedKeys.has(exprKey(expr))) {
          throw new SqlRuntimeError(
            "NOT_GROUPED",
            `「${expr.name}」は GROUP BY に含まれていないので、そのままでは取り出せません`,
            expr.pos,
            {
              hint: "GROUP BY で 1 グループに複数行がまとまるため、どの行の値を出すか決まりません。GROUP BY に加えるか、MAX(...) などの集約関数で包んでください。",
            },
          );
        }
        return this.lookupColumn(expr.qualifier, expr.name, scope, expr.pos);
      }

      case "UnaryExpr": {
        if (expr.op === "NOT") {
          return truthNot(this.evalTruth(expr.operand, scope, ctx));
        }
        const v = this.evalExpr(expr.operand, scope, ctx);
        if (v === null) return null;
        if (typeof v !== "number") {
          throw new SqlRuntimeError(
            "TYPE_MISMATCH",
            `${typeNameOf(v)}にマイナスは付けられません`,
            expr.pos,
          );
        }
        return -v;
      }

      case "BinaryExpr":
        return this.evalBinary(expr, scope, ctx);

      case "BetweenExpr": {
        const v = this.evalExpr(expr.operand, scope, ctx);
        const lo = this.evalExpr(expr.lower, scope, ctx);
        const hi = this.evalExpr(expr.upper, scope, ctx);
        const geLo = compareValues(v, lo, expr.pos);
        const leHi = compareValues(v, hi, expr.pos);
        if (geLo === null || leHi === null) return null;
        const inside = geLo >= 0 && leHi <= 0;
        return expr.negated ? !inside : inside;
      }

      case "InExpr": {
        const v = this.evalExpr(expr.operand, scope, ctx);
        const candidates: SqlValue[] = expr.subquery
          ? this.evalSubqueryColumn(expr.subquery, scope, expr.pos)
          : expr.list!.map((e) => this.evalExpr(e, scope, ctx));

        if (v === null) return null;
        let sawNull = false;
        for (const c of candidates) {
          if (c === null) {
            sawNull = true;
            continue;
          }
          if (compareValues(v, c, expr.pos) === 0) {
            return !expr.negated;
          }
        }
        // 一致が無く NULL が混ざっていたら UNKNOWN (NOT IN が真にならない有名な罠)
        if (sawNull) return null;
        return expr.negated;
      }

      case "LikeExpr": {
        const v = this.evalExpr(expr.operand, scope, ctx);
        const p = this.evalExpr(expr.pattern, scope, ctx);
        if (v === null || p === null) return null;
        if (typeof v !== "string" || typeof p !== "string") {
          throw new SqlRuntimeError(
            "TYPE_MISMATCH",
            "LIKE は文字列にだけ使えます",
            expr.pos,
          );
        }
        const matched = likeMatches(v, p);
        return expr.negated ? !matched : matched;
      }

      case "IsNullExpr": {
        const v = this.evalExpr(expr.operand, scope, ctx);
        const isNullValue = v === null;
        return expr.negated ? !isNullValue : isNullValue;
      }

      case "ExistsExpr": {
        const inner = this.evalQuery(expr.subquery, scope, null);
        const exists = inner.rows.length > 0;
        return expr.negated ? !exists : exists;
      }

      case "ScalarSubquery": {
        const values = this.evalSubqueryColumn(expr.query, scope, expr.pos);
        if (values.length === 0) return null;
        if (values.length > 1) {
          throw new SqlRuntimeError(
            "SUBQUERY_RETURNED_MULTIPLE_ROWS",
            `副問合せが ${values.length} 行を返しました (値として使うには 1 行以下である必要があります)`,
            expr.pos,
            { hint: "IN や EXISTS を使うか、副問合せ側を集約関数で 1 行にまとめてください。" },
          );
        }
        return values[0];
      }

      case "FuncCall":
        return this.evalAggregate(expr, scope, ctx);
    }
  }

  private evalBinary(
    expr: Extract<Expr, { kind: "BinaryExpr" }>,
    scope: Scope,
    ctx: GroupContext | null,
  ): SqlValue {
    if (expr.op === "AND") {
      return truthAnd(
        this.evalTruth(expr.left, scope, ctx),
        this.evalTruth(expr.right, scope, ctx),
      );
    }
    if (expr.op === "OR") {
      return truthOr(
        this.evalTruth(expr.left, scope, ctx),
        this.evalTruth(expr.right, scope, ctx),
      );
    }

    const l = this.evalExpr(expr.left, scope, ctx);
    const r = this.evalExpr(expr.right, scope, ctx);

    switch (expr.op) {
      case "=":
      case "<>":
      case "<":
      case "<=":
      case ">":
      case ">=": {
        const cmp = compareValues(l, r, expr.pos);
        if (cmp === null) return null;
        switch (expr.op) {
          case "=":
            return cmp === 0;
          case "<>":
            return cmp !== 0;
          case "<":
            return cmp < 0;
          case "<=":
            return cmp <= 0;
          case ">":
            return cmp > 0;
          case ">=":
            return cmp >= 0;
        }
        break;
      }
      case "||": {
        if (l === null || r === null) return null;
        return `${stringify(l)}${stringify(r)}`;
      }
      case "+":
      case "-":
      case "*":
      case "/": {
        if (l === null || r === null) return null;
        if (typeof l !== "number" || typeof r !== "number") {
          throw new SqlRuntimeError(
            "TYPE_MISMATCH",
            `${typeNameOf(l)}と${typeNameOf(r)}では ${expr.op} の計算ができません`,
            expr.pos,
            { hint: "文字列をつなぐときは `||` を使います。" },
          );
        }
        if (expr.op === "/" && r === 0) {
          throw new SqlRuntimeError("DIVISION_BY_ZERO", "0 で割ることはできません", expr.pos);
        }
        switch (expr.op) {
          case "+":
            return l + r;
          case "-":
            return l - r;
          case "*":
            return l * r;
          case "/":
            return l / r;
        }
      }
    }
    /* c8 ignore next */
    throw new SqlRuntimeError("TYPE_MISMATCH", `演算子 ${expr.op} を評価できません`, expr.pos);
  }

  private evalAggregate(
    expr: Extract<Expr, { kind: "FuncCall" }>,
    scope: Scope,
    ctx: GroupContext | null,
  ): SqlValue {
    if (!ctx) {
      throw new SqlRuntimeError(
        "NOT_GROUPED",
        `${expr.name} はここでは使えません`,
        expr.pos,
        { hint: "集約関数は SELECT 句か HAVING 句で使います。WHERE では使えません。" },
      );
    }

    // COUNT(*) は NULL も数える。それ以外の集約は NULL を無視する
    if (expr.star) return ctx.rows.length;

    const values = ctx.rows
      .map((row) =>
        this.evalExpr(expr.arg!, { fields: ctx.fields, row, parent: scope.parent }),
      )
      .filter((v) => v !== null);

    const distinct = expr.distinct
      ? values.filter(
          (v, i) => values.findIndex((w) => valuesEqualForGrouping(v, w)) === i,
        )
      : values;

    if (expr.name === "COUNT") return distinct.length;
    if (distinct.length === 0) return null; // 対象が無ければ NULL (COUNT だけ 0)

    if (expr.name === "MAX" || expr.name === "MIN") {
      return distinct.reduce((acc, v) => {
        const cmp = totalOrder(v, acc);
        if (expr.name === "MAX") return cmp > 0 ? v : acc;
        return cmp < 0 ? v : acc;
      });
    }

    // SUM / AVG は数値だけ
    for (const v of distinct) {
      if (typeof v !== "number") {
        throw new SqlRuntimeError(
          "TYPE_MISMATCH",
          `${expr.name} は数値にしか使えません (${typeNameOf(v)}が来ています)`,
          expr.pos,
        );
      }
    }
    const nums = distinct as number[];
    const sum = nums.reduce((a, b) => a + b, 0);
    return expr.name === "SUM" ? sum : sum / nums.length;
  }

  /** 副問合せを 1 列として読む。IN / スカラ副問合せで使う */
  private evalSubqueryColumn(
    query: Query,
    scope: Scope,
    pos: Position,
  ): SqlValue[] {
    const inner = this.evalQuery(query, scope, null);
    if (inner.fields.length !== 1) {
      throw new SqlRuntimeError(
        "SUBQUERY_COLUMN_COUNT",
        `副問合せは 1 列だけを返す必要があります (${inner.fields.length} 列あります)`,
        pos,
      );
    }
    return inner.rows.map((r) => r[0]);
  }

  private lookupColumn(
    qualifier: string | null,
    name: string,
    scope: Scope | null,
    pos: Position,
  ): SqlValue {
    let current = scope;
    while (current) {
      const matches: number[] = [];
      current.fields.forEach((f, i) => {
        if (!sameName(f.name, name)) return;
        if (qualifier !== null && !sameName(f.qualifier, qualifier)) return;
        matches.push(i);
      });
      if (matches.length === 1) return current.row[matches[0]] ?? null;
      if (matches.length > 1) {
        const owners = matches.map((i) => current!.fields[i].qualifier);
        throw new SqlRuntimeError(
          "AMBIGUOUS_COLUMN",
          `列「${name}」がどの表のものか決まりません (${owners.join(" と ")} の両方にあります)`,
          pos,
          { hint: `表名で修飾してください。例: ${owners[0]}.${name}` },
        );
      }
      current = current.parent;
    }

    const available = scope
      ? [...new Set(scope.fields.map((f) => `${f.qualifier}.${f.name}`))].join(" / ")
      : "";
    throw new SqlRuntimeError(
      "UNKNOWN_COLUMN",
      `列「${qualifier ? `${qualifier}.${name}` : name}」がありません`,
      pos,
      available ? { hint: `使える列: ${available}` } : undefined,
    );
  }

  /* ---------------- DML ---------------- */

  private runInsert(
    stmt: Extract<Statement, { kind: "InsertStmt" }>,
  ): StatementResult {
    const table = this.requireTable(stmt.table, stmt.pos);
    const before = table.rows.map((r) => [...r]);
    const schemaNames = table.schema.columns.map((c) => c.name);

    const targetIndices = (stmt.columns ?? schemaNames).map((name) => {
      const idx = schemaNames.findIndex((n) => sameName(n, name));
      if (idx < 0) {
        throw new SqlRuntimeError(
          "UNKNOWN_COLUMN",
          `列「${name}」は表「${table.schema.name}」にありません`,
          stmt.pos,
          { hint: `使える列: ${schemaNames.join(" / ")}` },
        );
      }
      return idx;
    });

    for (const valueRow of stmt.values) {
      if (valueRow.length !== targetIndices.length) {
        throw new SqlRuntimeError(
          "COLUMN_COUNT_MISMATCH",
          `列の数と値の数が合いません (列 ${targetIndices.length} 個に対して値 ${valueRow.length} 個)`,
          stmt.pos,
        );
      }
      const row: SqlValue[] = schemaNames.map(() => null);
      valueRow.forEach((expr, i) => {
        row[targetIndices[i]] = this.evalExpr(expr, {
          fields: [],
          row: [],
          parent: null,
        });
      });
      table.rows.push(row);
    }

    this.validate(stmt.pos);
    return {
      kind: "dml",
      op: "INSERT",
      table: table.schema.name,
      stages: [],
      diff: diffForInsert(table, before, table.rows),
      affected: stmt.values.length,
    };
  }

  private runUpdate(
    stmt: Extract<Statement, { kind: "UpdateStmt" }>,
  ): StatementResult {
    const table = this.requireTable(stmt.table, stmt.pos);
    const before = table.rows.map((r) => [...r]);
    const fields: Field[] = table.schema.columns.map((c) => ({
      qualifier: table.schema.name,
      name: c.name,
    }));
    const schemaNames = table.schema.columns.map((c) => c.name);
    const stages: Stage[] = [];

    const targets = table.rows.map((row) =>
      stmt.where
        ? keepsRow(this.evalTruth(stmt.where, { fields, row, parent: null }))
        : true,
    );
    const affected = targets.filter(Boolean).length;

    stages.push({
      kind: "where",
      label: stmt.where
        ? `WHERE: ${table.rows.length} 行のうち ${affected} 行が対象`
        : `WHERE が無いので全 ${affected} 行が対象になります`,
      clauseRange: stmt.spans.where ?? null,
      table: {
        columns: fields.map(fieldToColumn),
        rows: table.rows.filter((_, i) => targets[i]),
      },
    });

    table.rows.forEach((row, i) => {
      if (!targets[i]) return;
      // 右辺は「更新前の行」に対して評価する (同じ文の中で連鎖しない)
      const snapshot = [...row];
      for (const assign of stmt.assignments) {
        const idx = schemaNames.findIndex((n) => sameName(n, assign.column));
        if (idx < 0) {
          throw new SqlRuntimeError(
            "UNKNOWN_COLUMN",
            `列「${assign.column}」は表「${table.schema.name}」にありません`,
            stmt.pos,
            { hint: `使える列: ${schemaNames.join(" / ")}` },
          );
        }
        row[idx] = this.evalExpr(assign.value, {
          fields,
          row: snapshot,
          parent: null,
        });
      }
    });

    this.validate(stmt.pos);
    return {
      kind: "dml",
      op: "UPDATE",
      table: table.schema.name,
      stages,
      diff: diffForUpdate(table, before, table.rows),
      affected,
    };
  }

  private runDelete(
    stmt: Extract<Statement, { kind: "DeleteStmt" }>,
  ): StatementResult {
    const table = this.requireTable(stmt.table, stmt.pos);
    const before = table.rows.map((r) => [...r]);
    const fields: Field[] = table.schema.columns.map((c) => ({
      qualifier: table.schema.name,
      name: c.name,
    }));
    const stages: Stage[] = [];

    const doomed = table.rows.map((row) =>
      stmt.where
        ? keepsRow(this.evalTruth(stmt.where, { fields, row, parent: null }))
        : true,
    );
    const affected = doomed.filter(Boolean).length;

    stages.push({
      kind: "where",
      label: stmt.where
        ? `WHERE: ${table.rows.length} 行のうち ${affected} 行が削除対象`
        : `WHERE が無いので全 ${affected} 行が削除対象になります`,
      clauseRange: stmt.spans.where ?? null,
      table: {
        columns: fields.map(fieldToColumn),
        rows: table.rows.filter((_, i) => doomed[i]),
      },
    });

    table.rows = table.rows.filter((_, i) => !doomed[i]);

    this.validate(stmt.pos);
    return {
      kind: "dml",
      op: "DELETE",
      table: table.schema.name,
      stages,
      diff: diffForDelete(table, before, doomed),
      affected,
    };
  }

  private requireTable(name: string, pos: Position): TableData {
    const table = findTable(this.db, name);
    if (!table) {
      if (findView(this.db, name)) {
        throw new SqlRuntimeError(
          "UNKNOWN_TABLE",
          `「${name}」はビューなので、直接は更新できません`,
          pos,
          { hint: "ビューは実表ではありません。元の実表を更新してください。" },
        );
      }
      throw new SqlRuntimeError(
        "UNKNOWN_TABLE",
        `表「${name}」がありません`,
        pos,
        { hint: `使える表: ${this.availableNames()}` },
      );
    }
    return table;
  }

  /* ---------------- 制約 ---------------- */

  /**
   * 変更のあと、**データベース全体**を検査する。
   *
   * 変更した表だけを見ないのは、親表から行を消したときに子表が孤児になる形
   * (参照制約違反) を拾うため。教材のデータは数十行なので全件検査で足りる。
   */
  private validate(pos: Position): void {
    for (const table of this.db.tables) {
      const names = table.schema.columns.map((c) => c.name);
      const indexOf = (col: string) => names.findIndex((n) => sameName(n, col));

      for (const c of table.schema.constraints) {
        if (c.kind === "NotNull") {
          const idx = indexOf(c.column);
          const bad = table.rows.findIndex((r) => r[idx] === null);
          if (bad >= 0) {
            throw new SqlRuntimeError(
              "NOT_NULL_VIOLATION",
              `非NULL制約に違反しました: ${table.schema.name}.${c.column} に NULL は入れられません`,
              pos,
              { offendingRowIndex: bad },
            );
          }
        }

        if (c.kind === "PrimaryKey" || c.kind === "Unique") {
          const indices = c.columns.map(indexOf);
          // 主キーは NULL を許さない
          if (c.kind === "PrimaryKey") {
            const bad = table.rows.findIndex((r) =>
              indices.some((i) => r[i] === null),
            );
            if (bad >= 0) {
              throw new SqlRuntimeError(
                "NOT_NULL_VIOLATION",
                `主キー ${table.schema.name}.${c.columns.join(", ")} に NULL は入れられません`,
                pos,
                { offendingRowIndex: bad },
              );
            }
          }
          const seen = new Map<string, number>();
          for (let i = 0; i < table.rows.length; i++) {
            const key = rowKey(indices.map((idx) => table.rows[i][idx]));
            // UNIQUE 制約では NULL は重複と見なさない
            if (
              c.kind === "Unique" &&
              indices.some((idx) => table.rows[i][idx] === null)
            ) {
              continue;
            }
            if (seen.has(key)) {
              throw new SqlRuntimeError(
                "UNIQUE_VIOLATION",
                `一意性制約に違反しました: ${table.schema.name}.${c.columns.join(", ")} の値が重複しています`,
                pos,
                {
                  offendingRowIndex: i,
                  hint: `${seen.get(key)! + 1} 行目と同じ値です。`,
                },
              );
            }
            seen.set(key, i);
          }
        }

        if (c.kind === "Check") {
          const fields: Field[] = table.schema.columns.map((col) => ({
            qualifier: table.schema.name,
            name: col.name,
          }));
          for (let i = 0; i < table.rows.length; i++) {
            const truth = this.evalTruth(c.expr, {
              fields,
              row: table.rows[i],
              parent: null,
            });
            // 検査制約は UNKNOWN を通す (標準 SQL の規定)
            if (truth === false) {
              throw new SqlRuntimeError(
                "CHECK_VIOLATION",
                `検査制約に違反しました: ${table.schema.name} の条件を満たさない行があります`,
                pos,
                { offendingRowIndex: i },
              );
            }
          }
        }

        if (c.kind === "ForeignKey") {
          const parent = findTable(this.db, c.refTable);
          if (!parent) {
            throw new SqlRuntimeError(
              "UNKNOWN_TABLE",
              `参照先の表「${c.refTable}」がありません`,
              pos,
            );
          }
          const parentNames = parent.schema.columns.map((col) => col.name);
          const refCols =
            c.refColumns.length > 0
              ? c.refColumns
              : (parent.schema.constraints.find((x) => x.kind === "PrimaryKey")
                  ?.columns ?? []);
          const childIdx = c.columns.map(indexOf);
          const parentIdx = refCols.map((col) =>
            parentNames.findIndex((n) => sameName(n, col)),
          );
          const parentKeys = new Set(
            parent.rows.map((r) => rowKey(parentIdx.map((i) => r[i]))),
          );

          for (let i = 0; i < table.rows.length; i++) {
            const values = childIdx.map((idx) => table.rows[i][idx]);
            // どれかが NULL なら参照制約は課されない
            if (values.some((v) => v === null)) continue;
            if (!parentKeys.has(rowKey(values))) {
              throw new SqlRuntimeError(
                "FOREIGN_KEY_VIOLATION",
                `参照制約に違反しました: ${table.schema.name}.${c.columns.join(", ")} の値「${values.join(", ")}」が ${c.refTable} に存在しません`,
                pos,
                {
                  offendingRowIndex: i,
                  hint: `先に ${c.refTable} 側の行を用意するか、${table.schema.name} 側を先に消してください。`,
                },
              );
            }
          }
        }
      }
    }
  }
}

/* ========================================================================
 * 補助
 * ==================================================================== */

function crossJoin(a: WorkingSet, b: WorkingSet, pos: Position): WorkingSet {
  if (a.rows.length * b.rows.length > MAX_ROWS) throw rowLimitError(pos);
  const rows: SqlValue[][] = [];
  for (const l of a.rows) for (const r of b.rows) rows.push([...l, ...r]);
  return { fields: [...a.fields, ...b.fields], rows };
}

function rowLimitError(pos: Position): SqlRuntimeError {
  return new SqlRuntimeError(
    "ROW_LIMIT_EXCEEDED",
    `結果が ${MAX_ROWS} 行を超えました`,
    pos,
    {
      hint: "表をカンマで並べると直積 (すべての組み合わせ) になります。WHERE か JOIN ... ON で結合条件を書いてください。",
    },
  );
}

function dedupe(rows: SqlValue[][]): SqlValue[][] {
  const seen = new Set<string>();
  const out: SqlValue[][] = [];
  for (const row of rows) {
    const key = rowKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function fieldToColumn(field: Field): ResultColumn {
  return { name: field.name, qualifier: field.qualifier || null };
}

function toResultTable(set: WorkingSet): ResultTable {
  return { columns: set.fields.map(fieldToColumn), rows: set.rows };
}

function stringify(v: Exclude<SqlValue, null>): string {
  return typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v);
}

/** 列見出しに出す式の表現。`COUNT(*)` や `単価 * 2` をそれらしく見せる */
function describeExpr(expr: Expr, fields: Field[]): string {
  switch (expr.kind) {
    case "ColumnRef":
      return expr.qualifier ? `${expr.qualifier}.${expr.name}` : expr.name;
    case "NumberLit":
      return String(expr.value);
    case "StringLit":
      return `'${expr.value}'`;
    case "NullLit":
      return "NULL";
    case "BoolLit":
      return expr.value ? "TRUE" : "FALSE";
    case "StarRef":
      return expr.qualifier ? `${expr.qualifier}.*` : "*";
    case "FuncCall":
      if (expr.star) return `${expr.name}(*)`;
      return `${expr.name}(${expr.distinct ? "DISTINCT " : ""}${describeExpr(expr.arg!, fields)})`;
    case "BinaryExpr":
      return `${describeExpr(expr.left, fields)} ${expr.op} ${describeExpr(expr.right, fields)}`;
    case "UnaryExpr":
      return expr.op === "NOT"
        ? `NOT ${describeExpr(expr.operand, fields)}`
        : `-${describeExpr(expr.operand, fields)}`;
    case "ScalarSubquery":
      return "(副問合せ)";
    case "ExistsExpr":
      return expr.negated ? "NOT EXISTS(...)" : "EXISTS(...)";
    case "InExpr":
      return `${describeExpr(expr.operand, fields)} ${expr.negated ? "NOT " : ""}IN (...)`;
    case "LikeExpr":
      return `${describeExpr(expr.operand, fields)} ${expr.negated ? "NOT " : ""}LIKE ${describeExpr(expr.pattern, fields)}`;
    case "BetweenExpr":
      return `${describeExpr(expr.operand, fields)} ${expr.negated ? "NOT " : ""}BETWEEN ...`;
    case "IsNullExpr":
      return `${describeExpr(expr.operand, fields)} IS ${expr.negated ? "NOT " : ""}NULL`;
  }
}

function containsAggregate(expr: Expr): boolean {
  switch (expr.kind) {
    case "FuncCall":
      return true;
    case "UnaryExpr":
      return containsAggregate(expr.operand);
    case "BinaryExpr":
      return containsAggregate(expr.left) || containsAggregate(expr.right);
    case "BetweenExpr":
      return (
        containsAggregate(expr.operand) ||
        containsAggregate(expr.lower) ||
        containsAggregate(expr.upper)
      );
    case "InExpr":
      return (
        containsAggregate(expr.operand) ||
        (expr.list?.some(containsAggregate) ?? false)
      );
    case "LikeExpr":
      return containsAggregate(expr.operand) || containsAggregate(expr.pattern);
    case "IsNullExpr":
      return containsAggregate(expr.operand);
    default:
      // 副問合せの内側は別のクエリなので、外側の集約とは無関係
      return false;
  }
}

function assertNoAggregate(expr: Expr, clause: string): void {
  if (!containsAggregate(expr)) return;
  throw new SqlRuntimeError(
    "AGGREGATE_IN_WHERE",
    `${clause} では集約関数は使えません`,
    expr.pos,
    {
      hint: `${clause} は 1 行ずつの絞り込みで、グループ化より前に評価されます。グループに対する条件は HAVING に書きます。`,
    },
  );
}

/*
 * 差分は **操作ごとに作り分ける**。
 *
 * 変更前後の 2 つの配列を突き合わせて推測する実装にしてはいけない:
 * DELETE は後続の行を詰めるので位置がずれ、「削除された行」と「1 つ前にずれた行」を
 * 区別できなくなる。どの行が対象だったかは実行した側が知っているので、それを渡す。
 */

function diffColumns(table: TableData): ResultColumn[] {
  return table.schema.columns.map((c) => ({ name: c.name, qualifier: null }));
}

function diffForInsert(
  table: TableData,
  before: SqlValue[][],
  after: SqlValue[][],
): DiffTable {
  return {
    columns: diffColumns(table),
    rows: [
      ...before.map((values): DiffRow => ({ change: "unchanged", values })),
      ...after
        .slice(before.length)
        .map((values): DiffRow => ({ change: "inserted", values })),
    ],
  };
}

function diffForUpdate(
  table: TableData,
  before: SqlValue[][],
  after: SqlValue[][],
): DiffTable {
  return {
    columns: diffColumns(table),
    rows: before.map((b, i): DiffRow => {
      const a = after[i];
      const changedColumns = b
        .map((v, j) => (valuesEqualForGrouping(v, a[j]) ? -1 : j))
        .filter((j) => j >= 0);
      if (changedColumns.length === 0) return { change: "unchanged", values: a };
      return { change: "updated", values: a, before: b, changedColumns };
    }),
  };
}

function diffForDelete(
  table: TableData,
  before: SqlValue[][],
  doomed: boolean[],
): DiffTable {
  return {
    columns: diffColumns(table),
    rows: before.map(
      (values, i): DiffRow => ({
        change: doomed[i] ? "deleted" : "unchanged",
        values,
      }),
    ),
  };
}

/* ========================================================================
 * 公開 API
 * ==================================================================== */

export function evaluate(program: SqlProgram, db: Database): EvaluateResult {
  const evaluator = new Evaluator(db);
  const results = evaluator.run(program);
  return { results, database: evaluator.database };
}
