/**
 * `EXPLAIN (ANALYZE, FORMAT JSON)` の出力を受ける型。
 *
 * **実出力に存在したキーだけを持つ。** 楽観的に足さない（無いキーを参照すると
 * `undefined` がそのまま画面に出る）。追加するときは必ず実際の JSON で確認してから。
 *
 * 採取環境は PostgreSQL 18.6。18 で変わった点が 3 つあり、いずれもこの型に影響する:
 *   - `EXPLAIN ANALYZE` が `BUFFERS` を暗黙で有効化する（`Shared * Blocks` が常に来る）
 *   - `Index Searches` が増えた
 *   - **`Actual Rows` が小数**（`6.0`）。`loops` 1 回あたりの平均だから
 */
export type PlanNode = {
  "Node Type": string;
  "Parent Relationship"?: "Outer" | "Inner" | "Member" | "InitPlan" | "SubPlan";
  "Startup Cost": number;
  "Total Cost": number;
  "Plan Rows": number;
  "Plan Width": number;
  "Actual Startup Time"?: number;
  /** loops 1 回あたり。総量に戻すには `Actual Loops` を掛ける */
  "Actual Total Time"?: number;
  /** ★ PostgreSQL 18 は小数。loops 1 回あたりの平均だから */
  "Actual Rows"?: number;
  "Actual Loops"?: number;

  // 表示名の決定に要る（JSON と psql で名前が違う）
  Strategy?: "Plain" | "Sorted" | "Hashed" | "Mixed";
  "Join Type"?: string;
  "Scan Direction"?: string;

  "Index Name"?: string;
  "Relation Name"?: string;
  Alias?: string;

  "Index Cond"?: string;
  "Recheck Cond"?: string;
  "Merge Cond"?: string;
  "Hash Cond"?: string;
  "Join Filter"?: string;
  Filter?: string;
  "Rows Removed by Filter"?: number;
  "Rows Removed by Join Filter"?: number;
  "One-Time Filter"?: string;

  /** Index Only Scan。0 ならヒープを 1 回も触っていない */
  "Heap Fetches"?: number;
  "Index Searches"?: number;
  "Exact Heap Blocks"?: number;
  "Lossy Heap Blocks"?: number;

  // ソートとメモリ
  "Sort Method"?: string;
  "Sort Space Used"?: number;
  "Sort Space Type"?: "Memory" | "Disk";
  "Sort Key"?: string[];
  "Group Key"?: string[];

  // Hash 側のあふれ
  "Hash Buckets"?: number;
  "Hash Batches"?: number;
  "Original Hash Buckets"?: number;
  "Original Hash Batches"?: number;
  "Peak Memory Usage"?: number;

  // 並列
  "Workers Planned"?: number;
  "Workers Launched"?: number;

  "Shared Hit Blocks"?: number;
  "Shared Read Blocks"?: number;
  "Shared Dirtied Blocks"?: number;
  "Shared Written Blocks"?: number;
  "Temp Read Blocks"?: number;
  "Temp Written Blocks"?: number;

  Plans?: PlanNode[];
};

/** JSON 形式の出力は 1 要素の配列。その中身 */
export type ExplainResult = {
  Plan: PlanNode;
  /** PostgreSQL 18 は BUFFERS 既定 ON なのでプラン時のバッファもここに出る */
  Planning?: Record<string, number>;
  /**
   * ★ `ANALYZE` 無しの素の `EXPLAIN` では **この 2 つが出ない**。
   * `estimated-rows` の 4 計画は見積りだけを見せるので素の EXPLAIN で採っている。
   */
  "Planning Time"?: number;
  "Execution Time"?: number;
  Triggers?: unknown[];
  /** `SET jit = off` で採っているので、サイトが持つ計画には出てこない */
  JIT?: unknown;
};

export type ExplainJson = [ExplainResult, ...ExplainResult[]];
