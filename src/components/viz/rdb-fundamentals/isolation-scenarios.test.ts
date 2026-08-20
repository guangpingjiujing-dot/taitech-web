import { describe, expect, it } from "vitest";
import {
  ISOLATION_LEVELS,
  ISOLATION_LEVEL_INFO,
  ISOLATION_LOCK_MODEL,
  isolationMatrix,
  isolationScenarios,
  occursAtLevel,
  type IsolationLevel,
} from "./isolation-scenarios";

/*
 * 手で書いたシナリオデータが、SQL 標準の定義と食い違っていないことを固定する。
 * `/fe/sql` のように実エンジンをオラクルにできない (DBMS を持たない) ので、
 * ここで守れるのは「定義の整合性」まで。実挙動の主張は page.tsx の本文が持つ。
 */

const LEVEL_INDEX = Object.fromEntries(
  ISOLATION_LEVELS.map((l, i) => [l, i]),
) as Record<IsolationLevel, number>;

describe("isolation scenarios", () => {
  it("3 つの読み取り異常が揃っている", () => {
    expect(isolationScenarios.map((s) => s.key)).toEqual([
      "dirty-read",
      "non-repeatable-read",
      "phantom-read",
    ]);
  });

  it("SQL 標準どおりの occursAt になっている", () => {
    const expected: Record<string, IsolationLevel[]> = {
      "dirty-read": ["READ UNCOMMITTED"],
      "non-repeatable-read": ["READ UNCOMMITTED", "READ COMMITTED"],
      "phantom-read": [
        "READ UNCOMMITTED",
        "READ COMMITTED",
        "REPEATABLE READ",
      ],
    };
    for (const s of isolationScenarios) {
      expect(s.occursAt).toEqual(expected[s.key]);
    }
  });

  it("SERIALIZABLE ではどの異常も起きない", () => {
    for (const s of isolationScenarios) {
      expect(occursAtLevel(s, "SERIALIZABLE")).toBe(false);
    }
  });

  it("分離レベルを上げると異常は増えない (単調性)", () => {
    for (const s of isolationScenarios) {
      const levels = s.occursAt.map((l) => LEVEL_INDEX[l]);
      // 起きうるのは常に「弱いレベルから連続した区間」でなければならない
      expect(levels).toEqual(levels.map((_, i) => i));
    }
  });

  it("各シナリオに観測ステップがちょうど 1 つある", () => {
    for (const s of isolationScenarios) {
      const observes = s.steps.filter((step) => step.observe);
      expect(observes).toHaveLength(1);
    }
  });

  it("観測ステップは T1 (actor 0) が行う", () => {
    for (const s of isolationScenarios) {
      const observe = s.steps.find((step) => step.observe)!;
      expect(observe.actor).toBe(0);
    }
  });

  it("異常あり / 防がれた の見え方が必ず違う", () => {
    for (const s of isolationScenarios) {
      const observe = s.steps.find((step) => step.observe)!.observe!;
      expect(observe.anomaly).not.toEqual(observe.prevented);
    }
  });

  it("すべてのステップが確定済みデータを持つ", () => {
    for (const s of isolationScenarios) {
      expect(s.steps.length).toBeGreaterThan(0);
      for (const step of s.steps) {
        expect(Array.isArray(step.committed)).toBe(true);
      }
    }
  });

  it("4 段階すべてに説明がある", () => {
    for (const level of ISOLATION_LEVELS) {
      expect(ISOLATION_LEVEL_INFO[level].headline.length).toBeGreaterThan(0);
      expect(ISOLATION_LEVEL_INFO[level].visibility.length).toBeGreaterThan(0);
    }
  });

  /*
   * 4 段階の説明は 3 つの読み取り異常より「前」に出す。
   * 異常名で説明すると、まだ説明していない語で説明することになり循環する。
   */
  it("4 段階の説明が異常名を使っていない", () => {
    const forbidden = [
      "ダーティリード",
      "ノンリピータブルリード",
      "ファントム",
      "dirty read",
      "phantom",
    ];
    for (const level of ISOLATION_LEVELS) {
      const text =
        ISOLATION_LEVEL_INFO[level].headline +
        ISOLATION_LEVEL_INFO[level].visibility;
      for (const word of forbidden) {
        expect(text.toLowerCase()).not.toContain(word.toLowerCase());
      }
    }
  });

  /*
   * ロック表の主張は「4 段階の違いは読み取りロックの持ち方だけ」。
   * 書き込みロックの列に差が入ると本文の説明と矛盾するので固定する。
   */
  it("ロックモデルは全段階を網羅し、書き込みロックは全段階で同じ", () => {
    const writeLocks = new Set(
      ISOLATION_LEVELS.map((l) => ISOLATION_LOCK_MODEL[l].writeLock),
    );
    expect(writeLocks.size).toBe(1);
    for (const level of ISOLATION_LEVELS) {
      expect(ISOLATION_LOCK_MODEL[level].readLock.length).toBeGreaterThan(0);
      expect(ISOLATION_LOCK_MODEL[level].consequence.length).toBeGreaterThan(0);
    }
  });

  it("読み取りロックは段階ごとに違う", () => {
    const readLocks = new Set(
      ISOLATION_LEVELS.map((l) => ISOLATION_LOCK_MODEL[l].readLock),
    );
    expect(readLocks.size).toBe(ISOLATION_LEVELS.length);
  });

  it("マトリクスは 4 段階 × 3 異常になる", () => {
    const matrix = isolationMatrix();
    expect(matrix).toHaveLength(4);
    for (const row of matrix) {
      expect(row.cells).toHaveLength(3);
    }
    // 防げる異常は下の段ほど多い
    const occurCounts = matrix.map(
      (row) => row.cells.filter((c) => c.occurs).length,
    );
    expect(occurCounts).toEqual([3, 2, 1, 0]);
  });
});
