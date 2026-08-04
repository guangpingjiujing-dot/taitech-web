import { describe, expect, it } from "vitest";
import { parse } from "@/lib/pseudo/parser";
import { runToEnd } from "@/lib/pseudo/interpreter";
import {
  feQuizRunnableCode,
  feQuizzes,
  findFeQuiz,
  type FeQuizMeta,
} from "@/content/fe/quiz";
import { findFeLesson } from "@/content/fe/lessons";

function outputOf(quiz: FeQuizMeta): string {
  return runToEnd(parse(feQuizRunnableCode(quiz))).output.join("\n");
}

describe("FE quiz registry", () => {
  it("slug / order が一意で連番になっている", () => {
    const slugs = feQuizzes.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(feQuizzes.map((q) => q.order)).toEqual(
      feQuizzes.map((_, i) => i + 1),
    );
  });

  it("Phase 2 の完了条件である 10 問以上を満たす", () => {
    expect(feQuizzes.length).toBeGreaterThanOrEqual(10);
  });

  it("すべてのレッスンが 1 問以上でカバーされている", () => {
    for (const lesson of ["variable", "if", "while", "for", "array", "function"]) {
      expect(
        feQuizzes.some((q) => q.lesson === lesson),
        lesson,
      ).toBe(true);
    }
  });

  it("lesson が実在する", () => {
    for (const q of feQuizzes) {
      expect(findFeLesson(q.lesson), q.slug).toBeDefined();
    }
  });

  it("findFeQuiz が slug で引ける", () => {
    expect(findFeQuiz("assign-swap")?.order).toBe(1);
    expect(findFeQuiz("no-such-quiz")).toBeUndefined();
  });
});

describe("FE quiz の選択肢", () => {
  it("4 択で、id と本文が重複しない", () => {
    for (const q of feQuizzes) {
      expect(q.choices.map((c) => c.id), q.slug).toEqual(["ア", "イ", "ウ", "エ"]);
      const texts = q.choices.map((c) => c.text);
      expect(new Set(texts).size, q.slug).toBe(4);
    }
  });

  it("answer が実在する選択肢を指している", () => {
    for (const q of feQuizzes) {
      expect(
        q.choices.some((c) => c.id === q.answer),
        q.slug,
      ).toBe(true);
    }
  });

  it("一覧カード用の challenge が一意 (同じ文が並ばない)", () => {
    const challenges = feQuizzes.map((q) => q.challenge);
    expect(new Set(challenges).size).toBe(challenges.length);
  });

  it("解説が 2 段落以上ある", () => {
    for (const q of feQuizzes) {
      expect(q.explanation.length, q.slug).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("FE quiz の解答キー (実行して検証)", () => {
  it.each(feQuizzes.map((q) => [q.slug, q] as const))(
    "%s: 実行結果が expectedOutput と一致する",
    (_slug, quiz) => {
      expect(outputOf(quiz)).toBe(quiz.expectedOutput);
    },
  );

  it("trace 問題は「正解の選択肢 = 実際の出力」になっている", () => {
    for (const q of feQuizzes.filter((q) => q.kind === "trace")) {
      const correct = q.choices.find((c) => c.id === q.answer);
      expect(correct?.text, q.slug).toBe(q.expectedOutput);
    }
  });

  it("trace 問題の誤答は実際の出力と一致しない", () => {
    for (const q of feQuizzes.filter((q) => q.kind === "trace")) {
      for (const c of q.choices.filter((c) => c.id !== q.answer)) {
        expect(c.text, `${q.slug} / ${c.id}`).not.toBe(q.expectedOutput);
      }
    }
  });

  it("fill 問題は空欄 [ a ] を持ち、正解を埋めた verifyCode がある", () => {
    for (const q of feQuizzes.filter((q) => q.kind === "fill")) {
      expect(q.code, q.slug).toContain("[ a ]");
      expect(q.verifyCode, q.slug).toBeDefined();
      // 正解の選択肢を空欄に差し込んだものが verifyCode と一致すること
      const correct = q.choices.find((c) => c.id === q.answer)!;
      expect(q.code.replace("[ a ]", correct.text), q.slug).toBe(q.verifyCode);
    }
  });

  it("trace 問題には verifyCode を持たせない", () => {
    for (const q of feQuizzes.filter((q) => q.kind === "trace")) {
      expect(q.verifyCode, q.slug).toBeUndefined();
    }
  });
});
