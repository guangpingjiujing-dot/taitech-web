/**
 * トランザクション分離レベルのビジュアライザ用シナリオ定義。
 *
 * **ここが持つのは SQL 標準の定義だけ。** 「PostgreSQL の REPEATABLE READ は
 * ファントムリードも防ぐ」「MySQL InnoDB はギャップロックで防ぐ」といった実装差は
 * **本文側 (page.tsx の「標準と実装は違う」節) が持つ**。両者を混ぜた解説は世に多く、
 * 混ぜないこと自体がこのページの差別化点なので、データ構造の側で混ざらないようにしてある。
 *
 * SQL エンジンは使わない。表示するのは手で書いた固定データで、
 * 「どの分離レベルでこの異常が起きうるか」だけを `occursAt` が持ち、
 * 観測ステップの見え方はそこから導出する (`observedAt`)。
 * 分離レベルごとに全ステップを書き下すと 3 シナリオ × 4 レベル分の重複になり、
 * 手で書いたデータ同士が食い違う事故が起きるため、導出できるものは導出する。
 */

export const ISOLATION_LEVELS = [
  "READ UNCOMMITTED",
  "READ COMMITTED",
  "REPEATABLE READ",
  "SERIALIZABLE",
] as const;

export type IsolationLevel = (typeof ISOLATION_LEVELS)[number];

/**
 * 4 段階それぞれの説明。
 *
 * **異常の語彙 (ダーティリード等) を使わずに書くこと。** このページでは
 * 3 つの読み取り異常より **前** にこの表を出す。異常を知らない読者が
 * 4 段階を理解できるようにするのが目的なので、異常名で説明すると循環する。
 * 「何が見えるか」だけで言い切れる範囲に留める。
 */
export const ISOLATION_LEVEL_INFO: Record<
  IsolationLevel,
  { headline: string; visibility: string }
> = {
  "READ UNCOMMITTED": {
    headline: "書きかけまで見える",
    visibility:
      "他のトランザクションがまだ確定していない、書きかけの変更まで見える。最も制限が緩く、取り消される予定の値まで読んでしまう。",
  },
  "READ COMMITTED": {
    headline: "確定したものだけ見える",
    visibility:
      "確定 (COMMIT) された変更だけが見える。ただし見えるのは「読んだその瞬間」の最新状態なので、同じトランザクションの中でも読むたびに結果が変わりうる。",
  },
  "REPEATABLE READ": {
    headline: "読み始めた時点を見続ける",
    visibility:
      "自分が読み始めた時点の状態を、トランザクションが終わるまで見続ける。途中で他人が確定させても自分の視界は変わらない。",
  },
  SERIALIZABLE: {
    headline: "順番に実行したのと同じ",
    visibility:
      "並行して走っていても、トランザクションを 1 つずつ順番に実行した場合と同じ結果になることを保証する。最も厳しく、最もコストが高い。",
  },
};

/**
 * ロック (2PL) で実装した場合の 4 段階。
 *
 * **これは「定義」ではなく「実装の 1 つ」。** ANSI の定義は異常の有無で書かれており、
 * ロックの掛け方そのものは規定していない。実際 PostgreSQL / InnoDB の通常の SELECT は
 * ロックを取らない (スナップショット) ので、この表を唯一の説明にすると
 * 本文の「標準と実装は違う」節と矛盾する。**「なぜこの 4 段階なのか」の説明として置く**。
 *
 * 書き込みロックが全段階で同じ (終了まで保持) なのが要点で、
 * 4 段階の違いは読み取りロックの保持期間だけに現れる。
 */
export const ISOLATION_LOCK_MODEL: Record<
  IsolationLevel,
  { readLock: string; writeLock: string; consequence: string }
> = {
  "READ UNCOMMITTED": {
    readLock: "取らない",
    writeLock: "終了まで保持",
    consequence:
      "書き込み中の行もそのまま読めるので、確定していない値が見える。",
  },
  "READ COMMITTED": {
    readLock: "取るが、読んだ直後に解放",
    writeLock: "終了まで保持",
    consequence:
      "読む瞬間だけは他人の書き込みと衝突しない。ただし解放後は他人が更新できるので、次に読むと値が変わる。",
  },
  "REPEATABLE READ": {
    readLock: "読んだ行に対して終了まで保持",
    writeLock: "終了まで保持",
    consequence:
      "一度読んだ行は誰にも変更されない。ただしロックを掛けられるのは既にある行だけなので、新しく挿入される行は止められない。",
  },
  SERIALIZABLE: {
    readLock: "行に加えて、検索条件の範囲にも掛ける (述語 / ギャップロック)",
    writeLock: "終了まで保持",
    consequence:
      "「条件に合う行が後から増える」ことまで止まる。その代わり待ちと競合が最も多い。",
  },
};

export type StockRow = { id: number; item: string; qty: number };

export type ScenarioStep = {
  /** 0 = T1, 1 = T2 */
  actor: 0 | 1;
  /** レーンに出す 1 行説明 */
  label: string;
  /** レーンに出す SQL (等幅) */
  sql: string;
  /** 確定済み (COMMIT 済み) のデータ。このステップ実行後の状態 */
  committed: StockRow[];
  /**
   * T1 の観測ステップ。ここでだけ分離レベルによって見えるものが変わる。
   * `anomaly` = 異常が起きたときに T1 が見るもの / `prevented` = 防がれたときに見るもの。
   */
  observe?: {
    anomaly: StockRow[];
    prevented: StockRow[];
    /** 異常が起きたときの一行説明 */
    anomalyNote: string;
    /** 防がれたときの一行説明 */
    preventedNote: string;
  };
};

export type IsolationScenario = {
  key: "dirty-read" | "non-repeatable-read" | "phantom-read";
  /** セレクタに出す短いラベル */
  label: string;
  /** 異常の名前 (日本語 + 英語) */
  anomaly: string;
  /** 一行で言うと何が起きるか */
  summary: string;
  /** SQL 標準の定義上、この異常が起きうる分離レベル */
  occursAt: readonly IsolationLevel[];
  /** 初期状態 */
  initial: StockRow[];
  steps: ScenarioStep[];
};

const INITIAL: StockRow[] = [
  { id: 1, item: "ノート", qty: 5 },
  { id: 2, item: "消しゴム", qty: 8 },
];

/** 在庫が 0 になった (T2 が未コミットで書き換えた) 版 */
const AFTER_UNCOMMITTED_ZERO: StockRow[] = INITIAL;

export const isolationScenarios: IsolationScenario[] = [
  {
    key: "dirty-read",
    label: "ダーティリード",
    anomaly: "ダーティリード (dirty read)",
    summary: "まだ COMMIT されていない、後で取り消される値を読んでしまう。",
    occursAt: ["READ UNCOMMITTED"],
    initial: INITIAL,
    steps: [
      {
        actor: 1,
        label: "トランザクション開始",
        sql: "BEGIN;",
        committed: INITIAL,
      },
      {
        actor: 1,
        label: "在庫を 0 にする (まだ COMMIT しない)",
        sql: "UPDATE stock SET qty = 0 WHERE id = 1;",
        committed: AFTER_UNCOMMITTED_ZERO,
      },
      {
        actor: 0,
        label: "トランザクション開始",
        sql: "BEGIN;",
        committed: AFTER_UNCOMMITTED_ZERO,
      },
      {
        actor: 0,
        label: "在庫を読む",
        sql: "SELECT * FROM stock WHERE id = 1;",
        committed: AFTER_UNCOMMITTED_ZERO,
        observe: {
          anomaly: [{ id: 1, item: "ノート", qty: 0 }],
          prevented: [{ id: 1, item: "ノート", qty: 5 }],
          anomalyNote:
            "T2 がまだ COMMIT していない qty = 0 が見えている。確定済みデータは 5 のまま。",
          preventedNote:
            "未コミットの変更は見えない。確定済みの qty = 5 が返る。",
        },
      },
      {
        actor: 1,
        label: "やっぱり取り消す",
        sql: "ROLLBACK;",
        committed: INITIAL,
      },
    ],
  },
  {
    key: "non-repeatable-read",
    label: "ノンリピータブルリード",
    anomaly: "ノンリピータブルリード (non-repeatable read)",
    summary:
      "同じ行を 2 回読んだのに、間に他人が COMMIT したせいで値が変わる。",
    occursAt: ["READ UNCOMMITTED", "READ COMMITTED"],
    initial: INITIAL,
    steps: [
      {
        actor: 0,
        label: "トランザクション開始",
        sql: "BEGIN;",
        committed: INITIAL,
      },
      {
        actor: 0,
        label: "在庫を読む (1 回目)",
        sql: "SELECT * FROM stock WHERE id = 1;",
        committed: INITIAL,
      },
      {
        actor: 1,
        label: "在庫を 3 に変えて確定",
        sql: "UPDATE stock SET qty = 3 WHERE id = 1; COMMIT;",
        committed: [
          { id: 1, item: "ノート", qty: 3 },
          { id: 2, item: "消しゴム", qty: 8 },
        ],
      },
      {
        actor: 0,
        label: "同じ行をもう一度読む (2 回目)",
        sql: "SELECT * FROM stock WHERE id = 1;",
        committed: [
          { id: 1, item: "ノート", qty: 3 },
          { id: 2, item: "消しゴム", qty: 8 },
        ],
        observe: {
          anomaly: [{ id: 1, item: "ノート", qty: 3 }],
          prevented: [{ id: 1, item: "ノート", qty: 5 }],
          anomalyNote:
            "1 回目は 5、2 回目は 3。同じトランザクションの中で同じ行の値が変わった。",
          preventedNote:
            "2 回目も 5。T2 の COMMIT より後でも、1 回目と同じ値が返る。",
        },
      },
    ],
  },
  {
    key: "phantom-read",
    label: "ファントムリード",
    anomaly: "ファントムリード (phantom read)",
    summary:
      "同じ条件で 2 回検索したのに、間に他人が INSERT したせいで行数が変わる。",
    occursAt: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ"],
    initial: INITIAL,
    steps: [
      {
        actor: 0,
        label: "トランザクション開始",
        sql: "BEGIN;",
        committed: INITIAL,
      },
      {
        actor: 0,
        label: "在庫 10 未満を検索 (1 回目)",
        sql: "SELECT * FROM stock WHERE qty < 10;",
        committed: INITIAL,
      },
      {
        actor: 1,
        label: "行を 1 本足して確定",
        sql: "INSERT INTO stock VALUES (3, 'ペン', 4); COMMIT;",
        committed: [
          { id: 1, item: "ノート", qty: 5 },
          { id: 2, item: "消しゴム", qty: 8 },
          { id: 3, item: "ペン", qty: 4 },
        ],
      },
      {
        actor: 0,
        label: "同じ条件でもう一度検索 (2 回目)",
        sql: "SELECT * FROM stock WHERE qty < 10;",
        committed: [
          { id: 1, item: "ノート", qty: 5 },
          { id: 2, item: "消しゴム", qty: 8 },
          { id: 3, item: "ペン", qty: 4 },
        ],
        observe: {
          anomaly: [
            { id: 1, item: "ノート", qty: 5 },
            { id: 2, item: "消しゴム", qty: 8 },
            { id: 3, item: "ペン", qty: 4 },
          ],
          prevented: [
            { id: 1, item: "ノート", qty: 5 },
            { id: 2, item: "消しゴム", qty: 8 },
          ],
          anomalyNote:
            "1 回目は 2 行、2 回目は 3 行。存在しなかったはずの行が現れた (ファントム)。",
          preventedNote:
            "2 回目も 2 行。検索条件に合う行が後から増えても、このトランザクションには現れない。",
        },
      },
    ],
  },
];

/** SQL 標準の定義上、その分離レベルでその異常が起きるか */
export function occursAtLevel(
  scenario: IsolationScenario,
  level: IsolationLevel,
): boolean {
  return scenario.occursAt.includes(level);
}

/**
 * 4 段階 × 3 異常のマトリクス。本文の表とビジュアライザで同じ定義を使うための単一の出所。
 * 「起きうる = true」。
 */
export function isolationMatrix(): {
  level: IsolationLevel;
  cells: { scenario: IsolationScenario; occurs: boolean }[];
}[] {
  return ISOLATION_LEVELS.map((level) => ({
    level,
    cells: isolationScenarios.map((scenario) => ({
      scenario,
      occurs: occursAtLevel(scenario, level),
    })),
  }));
}
