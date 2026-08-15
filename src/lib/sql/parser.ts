import type {
  AggregateName,
  BinaryOperator,
  ClauseSpans,
  ColumnDef,
  ColumnType,
  Constraint,
  CreateTableStmt,
  CreateViewStmt,
  DeleteStmt,
  Expr,
  InsertStmt,
  Join,
  JoinType,
  OrderByItem,
  Position,
  Query,
  SelectCore,
  SelectItem,
  Span,
  SqlProgram,
  Statement,
  TableRef,
  UpdateStmt,
} from "./ast";
import { SqlParseError, SqlUnsupportedError } from "./errors";
import { tokenize, type Token } from "./lexer";

/**
 * 手書きの再帰下降パーサ。
 *
 * パーサジェネレータを使わないのは擬似言語 (`src/lib/pseudo/parser.ts`) と同じ理由で、
 * **エラーメッセージ自体が教材になる**から。「FROM が見つかりません」ではなく
 * 「SELECT の次に FROM が必要です」と書けることに価値がある。
 */

const AGGREGATES: ReadonlySet<string> = new Set([
  "COUNT",
  "SUM",
  "AVG",
  "MAX",
  "MIN",
]);

/** 実行対象外の構文と、その解説ページ */
const UNSUPPORTED: Record<
  string,
  { topic: "grant" | "cursor" | "transaction"; message: string; path: string }
> = {
  GRANT: {
    topic: "grant",
    message:
      "GRANT は試験範囲ですが、この実行シミュレーターでは動かせません (利用者とアクセス権の概念を持たないため)",
    path: "/fe/sql/lessons/grant",
  },
  REVOKE: {
    topic: "grant",
    message:
      "REVOKE は試験範囲ですが、この実行シミュレーターでは動かせません (利用者とアクセス権の概念を持たないため)",
    path: "/fe/sql/lessons/grant",
  },
  DECLARE: {
    topic: "cursor",
    message:
      "カーソル (DECLARE CURSOR) は試験範囲ですが、この実行シミュレーターでは動かせません (埋込み SQL はホスト言語が必要なため)",
    path: "/fe/sql/lessons/cursor",
  },
  FETCH: {
    topic: "cursor",
    message:
      "FETCH は試験範囲ですが、この実行シミュレーターでは動かせません (埋込み SQL はホスト言語が必要なため)",
    path: "/fe/sql/lessons/cursor",
  },
  OPEN: {
    topic: "cursor",
    message: "OPEN (カーソル) はこの実行シミュレーターでは動かせません",
    path: "/fe/sql/lessons/cursor",
  },
  CLOSE: {
    topic: "cursor",
    message: "CLOSE (カーソル) はこの実行シミュレーターでは動かせません",
    path: "/fe/sql/lessons/cursor",
  },
  COMMIT: {
    topic: "transaction",
    message:
      "COMMIT はこの実行シミュレーターでは動かせません (トランザクションは科目 A の別分野です)",
    path: "/why-need-rdb/atomicity",
  },
  ROLLBACK: {
    topic: "transaction",
    message:
      "ROLLBACK はこの実行シミュレーターでは動かせません (トランザクションは科目 A の別分野です)",
    path: "/why-need-rdb/atomicity",
  },
};

class Parser {
  private readonly tokens: Token[];
  private index = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /* ---------------- トークン操作 ---------------- */

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.index + offset, this.tokens.length - 1)];
  }

  private get current(): Token {
    return this.peek();
  }

  private advance(): Token {
    const token = this.current;
    if (this.index < this.tokens.length - 1) this.index++;
    return token;
  }

  private atEof(): boolean {
    return this.current.kind === "eof";
  }

  /** 直前に消費したトークンの終端オフセット。句の Span を閉じるのに使う */
  private get lastEnd(): number {
    return this.tokens[Math.max(0, this.index - 1)].end;
  }

  private isKeyword(...names: string[]): boolean {
    return (
      this.current.kind === "keyword" && names.includes(this.current.upper)
    );
  }

  private isPunct(ch: string): boolean {
    return this.current.kind === "punct" && this.current.text === ch;
  }

  private isOperator(...ops: string[]): boolean {
    return (
      this.current.kind === "operator" && ops.includes(this.current.text)
    );
  }

  private eatKeyword(...names: string[]): boolean {
    if (this.isKeyword(...names)) {
      this.advance();
      return true;
    }
    return false;
  }

  private eatPunct(ch: string): boolean {
    if (this.isPunct(ch)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expectKeyword(name: string, hint?: string): Token {
    if (!this.isKeyword(name)) {
      throw new SqlParseError(
        `${name} が必要です (見つかったのは ${this.describe(this.current)})`,
        this.current.pos,
        hint,
      );
    }
    return this.advance();
  }

  private expectPunct(ch: string, hint?: string): Token {
    if (!this.isPunct(ch)) {
      throw new SqlParseError(
        `${ch} が必要です (見つかったのは ${this.describe(this.current)})`,
        this.current.pos,
        hint,
      );
    }
    return this.advance();
  }

  /** 識別子。キーワードでない任意の名前を受ける */
  private expectIdentifier(what: string): Token {
    if (this.current.kind !== "identifier") {
      throw new SqlParseError(
        `${what}が必要です (見つかったのは ${this.describe(this.current)})`,
        this.current.pos,
        this.current.kind === "keyword"
          ? `「${this.current.text}」は SQL の予約語なので、そのままでは名前に使えません。`
          : undefined,
      );
    }
    return this.advance();
  }

  private describe(token: Token): string {
    if (token.kind === "eof") return "文の終わり";
    return `「${token.text}」`;
  }

  private span(from: number): Span {
    return { from, to: this.lastEnd };
  }

  /* ---------------- 文 ---------------- */

  parseProgram(): SqlProgram {
    const start = this.current.pos;
    const statements: Statement[] = [];
    while (!this.atEof()) {
      if (this.eatPunct(";")) continue;
      statements.push(this.parseStatement());
      if (!this.atEof() && !this.isPunct(";")) {
        throw new SqlParseError(
          `文の区切りが必要です (見つかったのは ${this.describe(this.current)})`,
          this.current.pos,
          "複数の SQL を続けて書くときは、間をセミコロン `;` で区切ってください。",
        );
      }
    }
    if (statements.length === 0) {
      throw new SqlParseError("SQL が書かれていません", start);
    }
    return { kind: "SqlProgram", pos: start, statements };
  }

  private parseStatement(): Statement {
    const token = this.current;

    const unsupported = UNSUPPORTED[token.upper];
    if (token.kind === "keyword" && unsupported) {
      throw new SqlUnsupportedError(
        unsupported.topic,
        unsupported.message,
        token.pos,
        unsupported.path,
      );
    }

    if (this.isKeyword("SELECT")) {
      const pos = token.pos;
      return { kind: "SelectStmt", pos, query: this.parseQuery() };
    }
    if (this.isKeyword("INSERT")) return this.parseInsert();
    if (this.isKeyword("UPDATE")) return this.parseUpdate();
    if (this.isKeyword("DELETE")) return this.parseDelete();
    if (this.isKeyword("CREATE")) return this.parseCreate();

    throw new SqlParseError(
      `SQL の先頭が解釈できません (${this.describe(token)})`,
      token.pos,
      "SELECT / INSERT / UPDATE / DELETE / CREATE TABLE / CREATE VIEW のいずれかで始めてください。",
    );
  }

  /* ---------------- SELECT と集合演算 ---------------- */

  /**
   * 集合演算は左結合。`A UNION B EXCEPT C` は `(A UNION B) EXCEPT C`。
   * シラバス 2 番「集合演算」の和・差・積に対応する。
   */
  parseQuery(): Query {
    let left: Query = this.parseSelectCore();
    while (this.isKeyword("UNION", "EXCEPT", "INTERSECT")) {
      const opToken = this.advance();
      let op = opToken.upper;
      if (opToken.upper === "UNION" && this.eatKeyword("ALL")) {
        op = "UNION ALL";
      }
      const right = this.parseSelectCore();
      left = {
        kind: "SetOperation",
        pos: opToken.pos,
        op: op as "UNION" | "UNION ALL" | "EXCEPT" | "INTERSECT",
        left,
        right,
        span: { from: opToken.pos.offset, to: opToken.end },
      };
    }
    return left;
  }

  private parseSelectCore(): SelectCore {
    const selectToken = this.expectKeyword("SELECT");
    const spans: ClauseSpans = {};

    const distinct = this.eatKeyword("DISTINCT");
    // ALL は既定値なので読み飛ばすだけ
    if (!distinct) this.eatKeyword("ALL");

    const columns = this.parseSelectItems();
    spans.select = this.span(selectToken.pos.offset);

    const from: TableRef[] = [];
    const joins: Join[] = [];
    if (this.isKeyword("FROM")) {
      const fromToken = this.advance();
      do {
        from.push(this.parseTableRef());
      } while (this.eatPunct(","));
      this.parseJoins(joins);
      spans.from = this.span(fromToken.pos.offset);
    }

    let where: Expr | null = null;
    if (this.isKeyword("WHERE")) {
      const whereToken = this.advance();
      where = this.parseExpr();
      spans.where = this.span(whereToken.pos.offset);
    }

    const groupBy: Expr[] = [];
    if (this.isKeyword("GROUP")) {
      const groupToken = this.advance();
      this.expectKeyword("BY", "GROUP のあとには BY が必要です。");
      do {
        groupBy.push(this.parseExpr());
      } while (this.eatPunct(","));
      spans.groupBy = this.span(groupToken.pos.offset);
    }

    let having: Expr | null = null;
    if (this.isKeyword("HAVING")) {
      const havingToken = this.advance();
      having = this.parseExpr();
      spans.having = this.span(havingToken.pos.offset);
    }

    const orderBy: OrderByItem[] = [];
    if (this.isKeyword("ORDER")) {
      const orderToken = this.advance();
      this.expectKeyword("BY", "ORDER のあとには BY が必要です。");
      do {
        const expr = this.parseExpr();
        let direction: "ASC" | "DESC" = "ASC";
        if (this.eatKeyword("DESC")) direction = "DESC";
        else this.eatKeyword("ASC");
        orderBy.push({ expr, direction });
      } while (this.eatPunct(","));
      spans.orderBy = this.span(orderToken.pos.offset);
    }

    return {
      kind: "SelectCore",
      pos: selectToken.pos,
      distinct,
      columns,
      from,
      joins,
      where,
      groupBy,
      having,
      orderBy,
      spans,
    };
  }

  private parseSelectItems(): SelectItem[] {
    const items: SelectItem[] = [];
    do {
      const expr = this.parseExpr();
      let alias: string | null = null;
      if (this.eatKeyword("AS")) {
        alias = this.expectIdentifier("別名").text;
      } else if (this.current.kind === "identifier") {
        // `AS` は省略できる
        alias = this.advance().text;
      }
      items.push({ expr, alias });
    } while (this.eatPunct(","));
    return items;
  }

  private parseTableRef(): TableRef {
    const token = this.expectIdentifier("表名");
    let alias: string | null = null;
    if (this.eatKeyword("AS")) {
      alias = this.expectIdentifier("相関名").text;
    } else if (this.current.kind === "identifier") {
      alias = this.advance().text;
    }
    return { kind: "TableRef", pos: token.pos, name: token.text, alias };
  }

  private parseJoins(joins: Join[]): void {
    for (;;) {
      let type: JoinType;
      if (this.isKeyword("JOIN")) {
        type = "INNER";
      } else if (this.isKeyword("INNER")) {
        this.advance();
        type = "INNER";
      } else if (this.isKeyword("CROSS")) {
        this.advance();
        type = "CROSS";
      } else if (this.isKeyword("LEFT")) {
        this.advance();
        this.eatKeyword("OUTER");
        type = "LEFT";
      } else if (this.isKeyword("RIGHT")) {
        this.advance();
        this.eatKeyword("OUTER");
        type = "RIGHT";
      } else if (this.isKeyword("FULL")) {
        const token = this.current;
        throw new SqlParseError(
          "FULL OUTER JOIN には対応していません",
          token.pos,
          "基本情報の出題範囲では内部結合と左右の外部結合までです。",
        );
      } else {
        return;
      }
      this.expectKeyword("JOIN");
      const table = this.parseTableRef();
      let on: Expr | null = null;
      if (this.eatKeyword("ON")) {
        on = this.parseExpr();
      } else if (type !== "CROSS") {
        throw new SqlParseError(
          "JOIN には ON で結合条件が必要です",
          this.current.pos,
          "例: FROM 商品 JOIN 在庫 ON 商品.商品番号 = 在庫.商品番号",
        );
      }
      joins.push({ type, table, on });
    }
  }

  /* ---------------- 式 ---------------- */

  /**
   * 優先順位 (低い順):
   *   1. OR
   *   2. AND
   *   3. NOT
   *   4. 比較 (`=` `<>` `<` `<=` `>` `>=` / BETWEEN / IN / LIKE / IS NULL)
   *   5. 文字列連結 (`||`)
   *   6. 加減算
   *   7. 乗除算
   *   8. 単項マイナス
   *   9. リテラル・列参照・集約関数・括弧・副問合せ
   */
  parseExpr(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.isKeyword("OR")) {
      const token = this.advance();
      const right = this.parseAnd();
      left = { kind: "BinaryExpr", pos: token.pos, op: "OR", left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.isKeyword("AND")) {
      const token = this.advance();
      const right = this.parseNot();
      left = { kind: "BinaryExpr", pos: token.pos, op: "AND", left, right };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.isKeyword("NOT")) {
      const token = this.advance();
      return {
        kind: "UnaryExpr",
        pos: token.pos,
        op: "NOT",
        operand: this.parseNot(),
      };
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    const left = this.parseConcat();

    if (this.isOperator("=", "<>", "<", "<=", ">", ">=")) {
      const token = this.advance();
      const right = this.parseConcat();
      return {
        kind: "BinaryExpr",
        pos: token.pos,
        op: token.text as BinaryOperator,
        left,
        right,
      };
    }

    // NOT BETWEEN / NOT IN / NOT LIKE
    let negated = false;
    const checkpoint = this.index;
    if (this.isKeyword("NOT")) {
      this.advance();
      negated = true;
    }

    if (this.isKeyword("BETWEEN")) {
      const token = this.advance();
      const lower = this.parseConcat();
      this.expectKeyword("AND", "BETWEEN は `BETWEEN 下限 AND 上限` と書きます。");
      const upper = this.parseConcat();
      return {
        kind: "BetweenExpr",
        pos: token.pos,
        negated,
        operand: left,
        lower,
        upper,
      };
    }

    if (this.isKeyword("IN")) {
      const token = this.advance();
      this.expectPunct("(", "IN のあとは括弧です。例: IN (10, 20) / IN (SELECT ...)");
      if (this.isKeyword("SELECT")) {
        const subquery = this.parseQuery();
        this.expectPunct(")");
        return {
          kind: "InExpr",
          pos: token.pos,
          negated,
          operand: left,
          list: null,
          subquery,
        };
      }
      const list: Expr[] = [];
      do {
        list.push(this.parseExpr());
      } while (this.eatPunct(","));
      this.expectPunct(")");
      return {
        kind: "InExpr",
        pos: token.pos,
        negated,
        operand: left,
        list,
        subquery: null,
      };
    }

    if (this.isKeyword("LIKE")) {
      const token = this.advance();
      const pattern = this.parseConcat();
      return {
        kind: "LikeExpr",
        pos: token.pos,
        negated,
        operand: left,
        pattern,
      };
    }

    if (negated) {
      // `NOT` を食べたが BETWEEN / IN / LIKE ではなかった。戻す
      this.index = checkpoint;
      return left;
    }

    if (this.isKeyword("IS")) {
      const token = this.advance();
      const isNegated = this.eatKeyword("NOT");
      this.expectKeyword("NULL", "IS のあとに書けるのは NULL だけです。");
      return {
        kind: "IsNullExpr",
        pos: token.pos,
        negated: isNegated,
        operand: left,
      };
    }

    return left;
  }

  private parseConcat(): Expr {
    let left = this.parseAdditive();
    while (this.isOperator("||")) {
      const token = this.advance();
      const right = this.parseAdditive();
      left = { kind: "BinaryExpr", pos: token.pos, op: "||", left, right };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.isOperator("+", "-")) {
      const token = this.advance();
      const right = this.parseMultiplicative();
      left = {
        kind: "BinaryExpr",
        pos: token.pos,
        op: token.text as BinaryOperator,
        left,
        right,
      };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.isOperator("*", "/")) {
      const token = this.advance();
      const right = this.parseUnary();
      left = {
        kind: "BinaryExpr",
        pos: token.pos,
        op: token.text as BinaryOperator,
        left,
        right,
      };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.isOperator("-")) {
      const token = this.advance();
      return {
        kind: "UnaryExpr",
        pos: token.pos,
        op: "-",
        operand: this.parseUnary(),
      };
    }
    if (this.isOperator("+")) {
      this.advance();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const token = this.current;

    if (this.isKeyword("EXISTS")) {
      this.advance();
      this.expectPunct("(", "EXISTS のあとは (SELECT ...) です。");
      const subquery = this.parseQuery();
      this.expectPunct(")");
      return {
        kind: "ExistsExpr",
        pos: token.pos,
        negated: false,
        subquery,
      };
    }

    if (token.kind === "number") {
      this.advance();
      return { kind: "NumberLit", pos: token.pos, value: Number(token.text) };
    }
    if (token.kind === "string") {
      this.advance();
      return { kind: "StringLit", pos: token.pos, value: token.text };
    }
    if (this.isKeyword("NULL")) {
      this.advance();
      return { kind: "NullLit", pos: token.pos };
    }
    if (this.isKeyword("TRUE", "FALSE")) {
      this.advance();
      return {
        kind: "BoolLit",
        pos: token.pos,
        value: token.upper === "TRUE",
      };
    }

    if (this.isOperator("*")) {
      this.advance();
      return { kind: "StarRef", pos: token.pos, qualifier: null };
    }

    // 集約関数
    if (token.kind === "keyword" && AGGREGATES.has(token.upper)) {
      this.advance();
      this.expectPunct("(", `${token.text} のあとは括弧です。`);
      const name = token.upper as AggregateName;
      if (this.isOperator("*")) {
        this.advance();
        this.expectPunct(")");
        if (name !== "COUNT") {
          throw new SqlParseError(
            `${name}(*) とは書けません`,
            token.pos,
            "`*` を渡せるのは COUNT だけです。ほかの集約関数には列名を渡してください。",
          );
        }
        return {
          kind: "FuncCall",
          pos: token.pos,
          name,
          star: true,
          distinct: false,
          arg: null,
        };
      }
      const distinct = this.eatKeyword("DISTINCT");
      const arg = this.parseExpr();
      this.expectPunct(")");
      return {
        kind: "FuncCall",
        pos: token.pos,
        name,
        star: false,
        distinct,
        arg,
      };
    }

    if (this.eatPunct("(")) {
      if (this.isKeyword("SELECT")) {
        const query = this.parseQuery();
        this.expectPunct(")");
        return { kind: "ScalarSubquery", pos: token.pos, query };
      }
      const inner = this.parseExpr();
      this.expectPunct(")");
      return inner;
    }

    if (token.kind === "identifier") {
      this.advance();
      // `商品.商品番号` / `商品.*`
      if (this.isPunct(".")) {
        this.advance();
        if (this.isOperator("*")) {
          this.advance();
          return { kind: "StarRef", pos: token.pos, qualifier: token.text };
        }
        const column = this.expectIdentifier("列名");
        return {
          kind: "ColumnRef",
          pos: token.pos,
          qualifier: token.text,
          name: column.text,
        };
      }
      return {
        kind: "ColumnRef",
        pos: token.pos,
        qualifier: null,
        name: token.text,
      };
    }

    throw new SqlParseError(
      `値または列名が必要です (見つかったのは ${this.describe(token)})`,
      token.pos,
    );
  }

  /* ---------------- DML ---------------- */

  private parseInsert(): InsertStmt {
    const insertToken = this.expectKeyword("INSERT");
    this.expectKeyword("INTO", "INSERT のあとには INTO が必要です。");
    const table = this.expectIdentifier("表名").text;

    let columns: string[] | null = null;
    if (this.isPunct("(")) {
      this.advance();
      columns = [];
      do {
        columns.push(this.expectIdentifier("列名").text);
      } while (this.eatPunct(","));
      this.expectPunct(")");
    }

    this.expectKeyword(
      "VALUES",
      "INSERT INTO 表名 (列, ...) VALUES (値, ...) の形で書きます。",
    );
    const values: Expr[][] = [];
    do {
      this.expectPunct("(");
      const row: Expr[] = [];
      do {
        row.push(this.parseExpr());
      } while (this.eatPunct(","));
      this.expectPunct(")");
      values.push(row);
    } while (this.eatPunct(","));

    return {
      kind: "InsertStmt",
      pos: insertToken.pos,
      table,
      columns,
      values,
    };
  }

  private parseUpdate(): UpdateStmt {
    const updateToken = this.expectKeyword("UPDATE");
    const table = this.expectIdentifier("表名").text;
    const spans: { set?: Span; where?: Span } = {};

    const setToken = this.expectKeyword(
      "SET",
      "UPDATE 表名 SET 列 = 値 の形で書きます。",
    );
    const assignments: { column: string; value: Expr }[] = [];
    do {
      const column = this.expectIdentifier("列名").text;
      if (!this.isOperator("=")) {
        throw new SqlParseError(
          "= が必要です",
          this.current.pos,
          "SET 句は `列 = 値` の形です。",
        );
      }
      this.advance();
      assignments.push({ column, value: this.parseExpr() });
    } while (this.eatPunct(","));
    spans.set = this.span(setToken.pos.offset);

    let where: Expr | null = null;
    if (this.isKeyword("WHERE")) {
      const whereToken = this.advance();
      where = this.parseExpr();
      spans.where = this.span(whereToken.pos.offset);
    }

    return {
      kind: "UpdateStmt",
      pos: updateToken.pos,
      table,
      assignments,
      where,
      spans,
    };
  }

  private parseDelete(): DeleteStmt {
    const deleteToken = this.expectKeyword("DELETE");
    this.expectKeyword("FROM", "DELETE のあとには FROM が必要です。");
    const table = this.expectIdentifier("表名").text;
    const spans: { where?: Span } = {};

    let where: Expr | null = null;
    if (this.isKeyword("WHERE")) {
      const whereToken = this.advance();
      where = this.parseExpr();
      spans.where = this.span(whereToken.pos.offset);
    }

    return { kind: "DeleteStmt", pos: deleteToken.pos, table, where, spans };
  }

  /* ---------------- DDL ---------------- */

  private parseCreate(): CreateTableStmt | CreateViewStmt {
    const createToken = this.expectKeyword("CREATE");
    if (this.isKeyword("VIEW")) return this.parseCreateView(createToken.pos);
    if (this.isKeyword("TABLE")) return this.parseCreateTable(createToken.pos);
    throw new SqlParseError(
      `CREATE のあとが解釈できません (${this.describe(this.current)})`,
      this.current.pos,
      "CREATE TABLE か CREATE VIEW が書けます。",
    );
  }

  private parseCreateView(pos: Position): CreateViewStmt {
    this.expectKeyword("VIEW");
    const name = this.expectIdentifier("ビュー名").text;
    let columns: string[] | null = null;
    if (this.isPunct("(")) {
      this.advance();
      columns = [];
      do {
        columns.push(this.expectIdentifier("列名").text);
      } while (this.eatPunct(","));
      this.expectPunct(")");
    }
    this.expectKeyword("AS", "CREATE VIEW ビュー名 AS SELECT ... の形で書きます。");
    const query = this.parseQuery();
    return { kind: "CreateViewStmt", pos, name, columns, query };
  }

  private parseCreateTable(pos: Position): CreateTableStmt {
    this.expectKeyword("TABLE");
    const table = this.expectIdentifier("表名").text;
    this.expectPunct("(", "CREATE TABLE 表名 (列定義, ...) の形で書きます。");

    const columns: ColumnDef[] = [];
    const constraints: Constraint[] = [];

    do {
      if (this.parseTableConstraint(constraints)) continue;
      columns.push(this.parseColumnDef(constraints));
    } while (this.eatPunct(","));

    this.expectPunct(")");
    return { kind: "CreateTableStmt", pos, table, columns, constraints };
  }

  /** 表制約なら読んで true。列定義なら何も消費せず false */
  private parseTableConstraint(constraints: Constraint[]): boolean {
    let named = false;
    if (this.isKeyword("CONSTRAINT")) {
      // 制約名は挙動に効かないので読み飛ばす
      this.advance();
      this.expectIdentifier("制約名");
      named = true;
    }
    if (this.isKeyword("PRIMARY")) {
      this.advance();
      this.expectKeyword("KEY");
      constraints.push({ kind: "PrimaryKey", columns: this.parseColumnList() });
      return true;
    }
    if (this.isKeyword("UNIQUE")) {
      this.advance();
      constraints.push({ kind: "Unique", columns: this.parseColumnList() });
      return true;
    }
    if (this.isKeyword("FOREIGN")) {
      this.advance();
      this.expectKeyword("KEY");
      const cols = this.parseColumnList();
      this.expectKeyword("REFERENCES", "FOREIGN KEY のあとには REFERENCES が必要です。");
      const refTable = this.expectIdentifier("参照先の表名").text;
      const refColumns = this.isPunct("(") ? this.parseColumnList() : [];
      constraints.push({
        kind: "ForeignKey",
        columns: cols,
        refTable,
        refColumns,
      });
      return true;
    }
    if (this.isKeyword("CHECK")) {
      this.advance();
      this.expectPunct("(");
      const expr = this.parseExpr();
      this.expectPunct(")");
      constraints.push({ kind: "Check", columns: [], expr });
      return true;
    }
    if (named) {
      // CONSTRAINT 名 まで読んだのに制約が来なかった。ここで戻すとトークンを失うので明示的に落とす
      throw new SqlParseError(
        `CONSTRAINT のあとに制約が必要です (見つかったのは ${this.describe(this.current)})`,
        this.current.pos,
        "PRIMARY KEY / UNIQUE / FOREIGN KEY / CHECK のいずれかが書けます。",
      );
    }
    return false;
  }

  private parseColumnList(): string[] {
    this.expectPunct("(");
    const columns: string[] = [];
    do {
      columns.push(this.expectIdentifier("列名").text);
    } while (this.eatPunct(","));
    this.expectPunct(")");
    return columns;
  }

  private parseColumnDef(constraints: Constraint[]): ColumnDef {
    const nameToken = this.expectIdentifier("列名");
    const name = nameToken.text;
    const type = this.parseColumnType();

    let length: number | null = null;
    if (this.isPunct("(")) {
      this.advance();
      if (this.current.kind !== "number") {
        throw new SqlParseError("桁数には数値が必要です", this.current.pos);
      }
      length = Number(this.advance().text);
      // NUMERIC(5,2) のような小数部指定は読み飛ばす
      if (this.eatPunct(",")) this.advance();
      this.expectPunct(")");
    }

    // 列制約
    for (;;) {
      if (this.isKeyword("NOT")) {
        this.advance();
        this.expectKeyword("NULL", "NOT のあとは NULL です (非NULL制約)。");
        constraints.push({ kind: "NotNull", column: name });
        continue;
      }
      if (this.isKeyword("PRIMARY")) {
        this.advance();
        this.expectKeyword("KEY");
        constraints.push({ kind: "PrimaryKey", columns: [name] });
        continue;
      }
      if (this.isKeyword("UNIQUE")) {
        this.advance();
        constraints.push({ kind: "Unique", columns: [name] });
        continue;
      }
      if (this.isKeyword("REFERENCES")) {
        this.advance();
        const refTable = this.expectIdentifier("参照先の表名").text;
        const refColumns = this.isPunct("(") ? this.parseColumnList() : [];
        constraints.push({
          kind: "ForeignKey",
          columns: [name],
          refTable,
          refColumns,
        });
        continue;
      }
      if (this.isKeyword("CHECK")) {
        this.advance();
        this.expectPunct("(");
        const expr = this.parseExpr();
        this.expectPunct(")");
        constraints.push({ kind: "Check", columns: [name], expr });
        continue;
      }
      break;
    }

    return { name, type, length };
  }

  /**
   * 型名。シラバスは「文字型 / 数値型 / 日付型」の 3 つしか挙げていないので、
   * 実際の SQL の型名をこの 3 つに寄せて読む。
   */
  private parseColumnType(): ColumnType {
    const token = this.current;
    if (token.kind !== "identifier" && token.kind !== "keyword") {
      throw new SqlParseError(
        `列の型が必要です (見つかったのは ${this.describe(token)})`,
        token.pos,
        "文字型は CHAR / VARCHAR、数値型は INT / DECIMAL、日付型は DATE と書きます。",
      );
    }
    this.advance();
    const upper = token.upper;
    if (["CHAR", "VARCHAR", "VARCHAR2", "TEXT", "NCHAR", "文字型"].includes(upper)) {
      return "文字型";
    }
    if (
      [
        "INT", "INTEGER", "SMALLINT", "BIGINT", "DECIMAL", "NUMERIC",
        "REAL", "FLOAT", "DOUBLE", "数値型",
      ].includes(upper)
    ) {
      return "数値型";
    }
    if (["DATE", "TIMESTAMP", "DATETIME", "日付型"].includes(upper)) {
      return "日付型";
    }
    throw new SqlParseError(
      `型「${token.text}」には対応していません`,
      token.pos,
      "基本情報の範囲では 文字型 (CHAR / VARCHAR)、数値型 (INT / DECIMAL)、日付型 (DATE) を使います。",
    );
  }
}

export function parseTokens(tokens: Token[]): SqlProgram {
  return new Parser(tokens).parseProgram();
}

export function parse(source: string): SqlProgram {
  return parseTokens(tokenize(source));
}
