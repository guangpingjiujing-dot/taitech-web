/**
 * 基本情報技術者試験 (FE) 科目A のデータベース分野で問われる SQL の AST。
 *
 * **対象はシラバス Ver.9.2 の 9-3「データ操作」に出る範囲だけ**
 * (docs/wip/20260815-fe-sql/00-overview.md §2-1)。汎用 SQL エンジンではないので、
 * ウィンドウ関数・CTE・自己結合以外の複雑な派生表などは意図的に持たない。
 */

/**
 * 文字オフセットの範囲。CodeMirror の range decoration にそのまま渡せる形にしてある。
 * 評価器が「今どの句を評価しているか」を Stage.clauseRange として返すのに使う。
 */
export interface Span {
  from: number;
  to: number;
}

export interface Position {
  line: number;
  column: number;
  /** 先頭からの文字オフセット。Span を組み立てるのに使う */
  offset: number;
}

export interface BaseNode {
  pos: Position;
}

/* ========================================================================
 * 式
 * ==================================================================== */

export interface NumberLit extends BaseNode {
  kind: "NumberLit";
  value: number;
}

export interface StringLit extends BaseNode {
  kind: "StringLit";
  value: string;
}

export interface NullLit extends BaseNode {
  kind: "NullLit";
}

export interface BoolLit extends BaseNode {
  kind: "BoolLit";
  value: boolean;
}

/** `商品番号` / `商品.商品番号` / `S.商品番号` (相関名つき) */
export interface ColumnRef extends BaseNode {
  kind: "ColumnRef";
  /** 相関名またはテーブル名。`商品番号` のように修飾なしなら null */
  qualifier: string | null;
  name: string;
}

/** `*` / `商品.*` */
export interface StarRef extends BaseNode {
  kind: "StarRef";
  qualifier: string | null;
}

export type UnaryOperator = "NOT" | "-";

export interface UnaryExpr extends BaseNode {
  kind: "UnaryExpr";
  op: UnaryOperator;
  operand: Expr;
}

export type BinaryOperator =
  | "OR"
  | "AND"
  | "="
  | "<>"
  | "<"
  | "<="
  | ">"
  | ">="
  | "+"
  | "-"
  | "*"
  | "/"
  /** 文字列連結。標準 SQL の `||` */
  | "||";

export interface BinaryExpr extends BaseNode {
  kind: "BinaryExpr";
  op: BinaryOperator;
  left: Expr;
  right: Expr;
}

/** `列 BETWEEN a AND b` */
export interface BetweenExpr extends BaseNode {
  kind: "BetweenExpr";
  negated: boolean;
  operand: Expr;
  lower: Expr;
  upper: Expr;
}

/** `列 IN (値, ...)` / `列 IN (SELECT ...)` */
export interface InExpr extends BaseNode {
  kind: "InExpr";
  negated: boolean;
  operand: Expr;
  list: Expr[] | null;
  subquery: Query | null;
}

/** `列 LIKE 'パターン文字列'`。シラバス 24 番「パターン文字列」 */
export interface LikeExpr extends BaseNode {
  kind: "LikeExpr";
  negated: boolean;
  operand: Expr;
  pattern: Expr;
}

/** `列 IS NULL` / `列 IS NOT NULL`。シラバス 20 番「非NULL制約」と対になる */
export interface IsNullExpr extends BaseNode {
  kind: "IsNullExpr";
  negated: boolean;
  operand: Expr;
}

/** `EXISTS (SELECT ...)` / `NOT EXISTS (...)`。H26春問28 の主題 */
export interface ExistsExpr extends BaseNode {
  kind: "ExistsExpr";
  negated: boolean;
  subquery: Query;
}

export type AggregateName = "COUNT" | "SUM" | "AVG" | "MAX" | "MIN";

/**
 * 集約関数。シラバス 23 番「集約関数」。
 * FE の範囲ではスカラ関数は問われないので、関数呼び出しは集約だけに絞っている。
 */
export interface FuncCall extends BaseNode {
  kind: "FuncCall";
  name: AggregateName;
  /** `COUNT(*)` のときだけ true。他の集約に `*` は使えない */
  star: boolean;
  distinct: boolean;
  arg: Expr | null;
}

/** `(SELECT ...)` を値として使う形 (スカラ副問合せ) */
export interface ScalarSubquery extends BaseNode {
  kind: "ScalarSubquery";
  query: Query;
}

export type Expr =
  | NumberLit
  | StringLit
  | NullLit
  | BoolLit
  | ColumnRef
  | StarRef
  | UnaryExpr
  | BinaryExpr
  | BetweenExpr
  | InExpr
  | LikeExpr
  | IsNullExpr
  | ExistsExpr
  | FuncCall
  | ScalarSubquery;

/* ========================================================================
 * SELECT
 * ==================================================================== */

export interface SelectItem {
  expr: Expr;
  /** `AS 別名`。シラバス 25 番「相関名」 */
  alias: string | null;
}

/** `FROM 商品 S` の 1 要素 */
export interface TableRef extends BaseNode {
  kind: "TableRef";
  name: string;
  /** 相関名 (`AS` は省略可) */
  alias: string | null;
}

export type JoinType = "INNER" | "LEFT" | "RIGHT" | "CROSS";

export interface Join {
  type: JoinType;
  table: TableRef;
  /** CROSS JOIN では null */
  on: Expr | null;
}

export interface OrderByItem {
  expr: Expr;
  direction: "ASC" | "DESC";
}

/**
 * SELECT 1 本分。
 *
 * `from` を配列で持つのは **旧式のカンマ結合 (`FROM A, B WHERE A.x = B.x`) が
 * 過去問で最頻出**だから (00-overview.md §2-2)。`INNER JOIN` 記法だけの対応では足りない。
 */
export interface SelectCore extends BaseNode {
  kind: "SelectCore";
  distinct: boolean;
  columns: SelectItem[];
  from: TableRef[];
  joins: Join[];
  where: Expr | null;
  groupBy: Expr[];
  having: Expr | null;
  orderBy: OrderByItem[];
  /** 句ごとのハイライト範囲。評価器が Stage.clauseRange に載せる */
  spans: ClauseSpans;
}

/**
 * 句の位置。**無い句は undefined** にして、評価器側が
 * 「その句が書かれていないので Stage を作らない」を判定できるようにする。
 */
export interface ClauseSpans {
  select?: Span;
  from?: Span;
  where?: Span;
  groupBy?: Span;
  having?: Span;
  orderBy?: Span;
}

export type SetOperator = "UNION" | "UNION ALL" | "EXCEPT" | "INTERSECT";

/** 集合演算。シラバス 2 番「集合演算」(和・差・積) に対応する */
export interface SetOperation extends BaseNode {
  kind: "SetOperation";
  op: SetOperator;
  left: Query;
  right: Query;
  span: Span;
}

export type Query = SelectCore | SetOperation;

/* ========================================================================
 * DML — INSERT / UPDATE / DELETE
 * ==================================================================== */

export interface InsertStmt extends BaseNode {
  kind: "InsertStmt";
  table: string;
  /** 省略時は null (表定義の全列を順に埋める) */
  columns: string[] | null;
  /** `VALUES (...), (...)` */
  values: Expr[][];
}

export interface UpdateStmt extends BaseNode {
  kind: "UpdateStmt";
  table: string;
  assignments: { column: string; value: Expr }[];
  where: Expr | null;
  spans: { set?: Span; where?: Span };
}

export interface DeleteStmt extends BaseNode {
  kind: "DeleteStmt";
  table: string;
  where: Expr | null;
  spans: { where?: Span };
}

/* ========================================================================
 * DDL — CREATE TABLE / CREATE VIEW
 * ==================================================================== */

/** シラバス 14〜16 番。SQLite の動的型付けは真似せず、宣言した型を守る */
export type ColumnType = "文字型" | "数値型" | "日付型";

/**
 * 列制約と表制約。シラバス 17〜20 番
 * (一意性制約 / 参照制約 / 検査制約 / 非NULL制約)。
 */
export type Constraint =
  | { kind: "PrimaryKey"; columns: string[] }
  | { kind: "Unique"; columns: string[] }
  | { kind: "NotNull"; column: string }
  | {
      kind: "ForeignKey";
      columns: string[];
      refTable: string;
      refColumns: string[];
    }
  | { kind: "Check"; columns: string[]; expr: Expr };

export interface ColumnDef {
  name: string;
  type: ColumnType;
  /** `CHAR(10)` などの長さ。挙動には効かせず表示にだけ使う */
  length: number | null;
}

export interface CreateTableStmt extends BaseNode {
  kind: "CreateTableStmt";
  table: string;
  columns: ColumnDef[];
  constraints: Constraint[];
}

/** シラバス 13 番「実表」との対比で問われる。H21春問33 / H24秋問29 */
export interface CreateViewStmt extends BaseNode {
  kind: "CreateViewStmt";
  name: string;
  columns: string[] | null;
  query: Query;
}

/* ========================================================================
 * 文
 * ==================================================================== */

export interface SelectStmt extends BaseNode {
  kind: "SelectStmt";
  query: Query;
}

export type Statement =
  | SelectStmt
  | InsertStmt
  | UpdateStmt
  | DeleteStmt
  | CreateTableStmt
  | CreateViewStmt;

export interface SqlProgram extends BaseNode {
  kind: "SqlProgram";
  statements: Statement[];
}
