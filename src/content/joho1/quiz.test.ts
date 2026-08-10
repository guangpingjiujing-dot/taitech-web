import { describe, expect, it } from "vitest";
import { parse } from "@/lib/joho1/parser";
import { runJoho1ToEnd } from "@/lib/joho1";
import { builtinsFor, JOHO1_BUILTINS } from "@/lib/joho1/builtins";
import {
  joho1QuizRunnableCode,
  joho1Quizzes,
  findJoho1Quiz,
  JOHO1_FUNCTION_NOTES,
  type Joho1QuizMeta,
} from "@/content/joho1/quiz";
import { findJoho1Lesson, joho1Lessons } from "@/content/joho1/lessons";

/**
 * その問題で **与えられた関数だけ** を有効にして実行する。
 * `表示する` は全問共通で使うので常に足す (問題文の【関数の説明】に載らない)。
 */
function outputOf(quiz: Joho1QuizMeta): string {
  const state = runJoho1ToEnd(parse(joho1QuizRunnableCode(quiz)), {
    indexBase: quiz.indexBase,
    builtins: builtinsFor(["表示する", ...quiz.functions]),
  });
  if (state.error) {
    throw new Error(
      `${quiz.slug}: ${state.error.pos.line} 行目 ${state.error.message}`,
    );
  }
  return state.output.join("\n");
}

describe("joho1 quiz registry", () => {
  it("slug / order が一意で連番になっている", () => {
    const slugs = joho1Quizzes.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(joho1Quizzes.map((q) => q.order)).toEqual(
      joho1Quizzes.map((_, i) => i + 1),
    );
  });

  it("Phase 2 の完了条件である 15 問以上を満たす", () => {
    expect(joho1Quizzes.length).toBeGreaterThanOrEqual(15);
  });

  it("すべてのレッスンが 1 問以上でカバーされている", () => {
    for (const lesson of joho1Lessons) {
      expect(
        joho1Quizzes.some((q) => q.lesson === lesson.slug),
        lesson.slug,
      ).toBe(true);
    }
  });

  it("lesson が実在する", () => {
    for (const q of joho1Quizzes) {
      expect(findJoho1Lesson(q.lesson), q.slug).toBeDefined();
    }
  });

  it("findJoho1Quiz が slug で引ける", () => {
    expect(findJoho1Quiz("display-no-separator")?.order).toBe(1);
    expect(findJoho1Quiz("no-such-quiz")).toBeUndefined();
  });

  it("basic / exam の両方に問題がある", () => {
    expect(joho1Quizzes.some((q) => q.tier === "basic")).toBe(true);
    expect(joho1Quizzes.some((q) => q.tier === "exam")).toBe(true);
  });
});

describe("joho1 quiz の前提 (添字の基点 / 与えられる関数)", () => {
  // 添字の基点は問題ごとに宣言されるものなので、0 始まりの出題が
  // 1 問も無い状態は「言語の性質だ」という誤解を残す (00-overview.md §7-4 (2))
  it("0 始まりの問題も 1 始まりの問題も出題されている", () => {
    expect(joho1Quizzes.some((q) => q.indexBase === 0)).toBe(true);
    expect(joho1Quizzes.some((q) => q.indexBase === 1)).toBe(true);
  });

  it("functions に書いた関数は実装が存在し、説明文も用意されている", () => {
    for (const q of joho1Quizzes) {
      for (const name of q.functions) {
        expect(JOHO1_BUILTINS[name], `${q.slug} / ${name}`).toBeDefined();
        expect(JOHO1_FUNCTION_NOTES[name], `${q.slug} / ${name}`).toBeDefined();
      }
    }
  });

  it("与えられていない関数を本文で使っていない", () => {
    // 与えた関数だけを有効にして実行できることが、そのまま検証になる。
    // 未宣言の関数を使っていれば outputOf が実行時エラーで落ちる
    for (const q of joho1Quizzes) {
      expect(() => outputOf(q), q.slug).not.toThrow();
    }
  });
});

describe("joho1 quiz の選択肢", () => {
  it("4 択で、id と本文が重複しない", () => {
    for (const q of joho1Quizzes) {
      expect(q.choices.map((c) => c.id), q.slug).toEqual([
        "ア",
        "イ",
        "ウ",
        "エ",
      ]);
      const texts = q.choices.map((c) => c.text);
      expect(new Set(texts).size, q.slug).toBe(4);
    }
  });

  it("answer が実在する選択肢を指している", () => {
    for (const q of joho1Quizzes) {
      expect(
        q.choices.some((c) => c.id === q.answer),
        q.slug,
      ).toBe(true);
    }
  });

  it("正解の位置が特定の記号に偏っていない", () => {
    // 全部 ア にすると「迷ったら ア」で解けてしまう
    const counts = new Map<string, number>();
    for (const q of joho1Quizzes) {
      counts.set(q.answer, (counts.get(q.answer) ?? 0) + 1);
    }
    for (const [id, n] of counts) {
      expect(n, id).toBeLessThan(joho1Quizzes.length * 0.75);
    }
  });

  it("一覧カード用の challenge が一意 (同じ文が並ばない)", () => {
    const challenges = joho1Quizzes.map((q) => q.challenge);
    expect(new Set(challenges).size).toBe(challenges.length);
  });

  it("解説が 2 段落以上ある", () => {
    for (const q of joho1Quizzes) {
      expect(q.explanation.length, q.slug).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("joho1 quiz の解答キー (実行して検証)", () => {
  it.each(joho1Quizzes.map((q) => [q.slug, q] as const))(
    "%s: 実行結果が expectedOutput と一致する",
    (_slug, quiz) => {
      expect(outputOf(quiz)).toBe(quiz.expectedOutput);
    },
  );

  it("trace 問題は「正解の選択肢 = 実際の出力」になっている", () => {
    for (const q of joho1Quizzes.filter((q) => q.kind === "trace")) {
      const correct = q.choices.find((c) => c.id === q.answer);
      expect(correct?.text, q.slug).toBe(q.expectedOutput);
    }
  });

  it("trace 問題の誤答は実際の出力と一致しない", () => {
    for (const q of joho1Quizzes.filter((q) => q.kind === "trace")) {
      for (const c of q.choices.filter((c) => c.id !== q.answer)) {
        expect(c.text, `${q.slug} / ${c.id}`).not.toBe(q.expectedOutput);
      }
    }
  });

  it("fill 問題は空欄 [ a ] を持ち、正解を埋めた verifyCode がある", () => {
    for (const q of joho1Quizzes.filter((q) => q.kind === "fill")) {
      expect(q.code, q.slug).toContain("[ a ]");
      expect(q.verifyCode, q.slug).toBeDefined();
      // 正解の選択肢を空欄に差し込んだものが verifyCode と一致すること
      const correct = q.choices.find((c) => c.id === q.answer)!;
      expect(q.code.replace("[ a ]", correct.text), q.slug).toBe(q.verifyCode);
    }
  });

  it("trace 問題には verifyCode を持たせない", () => {
    for (const q of joho1Quizzes.filter((q) => q.kind === "trace")) {
      expect(q.verifyCode, q.slug).toBeUndefined();
    }
  });

  /**
   * fill 問題は「誤答を選ぶと本当に違う結果になるか」まで見る。
   * 正解以外を入れても同じ出力になる選択肢があると、答えが 2 つある問題になる。
   * 実行できない (構文エラー / 実行時エラー) 誤答は、それ自体が「違う結果」なので通す。
   */
  it("fill 問題の誤答は、正解と同じ出力にならない", () => {
    for (const q of joho1Quizzes.filter((q) => q.kind === "fill")) {
      for (const c of q.choices.filter((c) => c.id !== q.answer)) {
        let out: string | null = null;
        try {
          const state = runJoho1ToEnd(parse(q.code.replace("[ a ]", c.text)), {
            indexBase: q.indexBase,
            builtins: builtinsFor(["表示する", ...q.functions]),
          });
          out = state.error ? null : state.output.join("\n");
        } catch {
          out = null;
        }
        expect(out, `${q.slug} / ${c.id}`).not.toBe(q.expectedOutput);
      }
    }
  });
});
