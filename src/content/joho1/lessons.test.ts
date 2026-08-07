import { describe, expect, it } from "vitest";
import { joho1Lessons } from "./lessons";
import { parse } from "@/lib/joho1/parser";
import { runJoho1ToEnd } from "@/lib/joho1";

/**
 * レッスンのサンプルコードと表示結果を、**実際にインタプリタへ通して**保証する。
 *
 * FE 側で同じ仕組みを入れた理由と同じ (docs/sections/fe-playground.md §4):
 * 「ページに書いてある実行結果」と「シミュレーターで動かした結果」が食い違うのが
 * 最悪の事故なので、期待値を手で書かずテストで固定する。
 */
describe("joho1 レッスンのサンプルコード", () => {
  for (const lesson of joho1Lessons) {
    it(`${lesson.slug}: 実行できて表示結果が一致する`, () => {
      const state = runJoho1ToEnd(parse(lesson.sampleCode), {
        indexBase: lesson.indexBase,
      });
      expect(state.error, `${lesson.slug} で実行時エラー`).toBeNull();
      if (lesson.sampleOutput !== undefined) {
        expect(state.output.join("\n")).toBe(lesson.sampleOutput);
      }
    });
  }

  it("slug と order に重複がない", () => {
    const slugs = joho1Lessons.map((l) => l.slug);
    const orders = joho1Lessons.map((l) => l.order);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("配列レッスンは 0 始まりで書かれている", () => {
    // 「情報I の配列は 1 始まり」と思い込ませないための回帰テスト。
    // 実物は試作 = 0 / 令和7・8年度本試験 = 1 / 令和8年度追試験 = 0 と割れている
    const array = joho1Lessons.find((l) => l.slug === "array");
    expect(array?.indexBase).toBe(0);
  });
});
