import { describe, expect, it } from "vitest";
import { parse } from "@/lib/sql/parser";
import { evaluate } from "@/lib/sql/evaluator";
import { formatValue, type ResultTable } from "@/lib/sql";
import {
  formatSqlResult,
  sqlQuizRunnableSql,
  sqlQuizzes,
  type SqlQuizMeta,
} from "@/content/fe/sql/quiz";
import { findDataset } from "@/content/fe/sql/datasets";
import { sqlLessons } from "@/content/fe/sql/lessons";

/**
 * **解答キーを人力でレビューしない。**
 *
 * 作問で最も怖いのは「解説では 2 行と書いてあるのに、同じサイトの
 * シミュレーターで動かすと 3 行出る」という食い違い。それを構造的に防ぐため、
 * 全問を実際にエンジンへ通して検証する（擬似言語の練習問題と同じ方針。
 * `src/content/fe/quiz.test.ts` 参照）。
 */

/** 問題の SQL を実行して、最後の SELECT の結果表を返す */
function resultTableOf(quiz: SqlQuizMeta): ResultTable {
  const db = findDataset(quiz.datasetKey).build();
  const results = evaluate(parse(sqlQuizRunnableSql(quiz)), db).results;
  const last = results[results.length - 1];
  if (last.kind !== "select") {
    throw new Error(`${quiz.slug}: 最後の文が SELECT ではない (${last.kind})`);
  }
  return last.table;
}

/**
 * 選択肢が正解かどうかを、実行結果だけから判定する。
 *
 * 選択肢の形は 3 通りある:
 *   1. 結果表をそのまま書いたもの
 *   2. 「3 行」のように行数だけを書いたもの
 *   3. 結果表の一部の行だけを書いたもの (「監査室 | 0」など)
 *
 * **3 の判定に単純な部分一致を使ってはいけない。**「結果が 0 行」を表す
 * 見出しだけの選択肢 (「商品番号」) が、行のある結果の見出しにも一致してしまう。
 * データ行として突き合わせる。
 */
function choiceMatchesResult(choiceText: string, table: ResultTable): boolean {
  if (choiceText === formatSqlResult(table)) return true;

  const rowCount = choiceText.match(/^(\d+) 行$/);
  if (rowCount) return Number(rowCount[1]) === table.rows.length;

  const dataRows = table.rows.map((r) => r.map(formatValue).join(" | "));
  const lines = choiceText.split("\n").filter((l) => l.trim().length > 0);
  return lines.length > 0 && lines.every((l) => dataRows.includes(l));
}

describe("SQL 練習問題", () => {
  it("slug が重複していない", () => {
    const slugs = sqlQuizzes.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("order が 1 から連番になっている", () => {
    expect(sqlQuizzes.map((q) => q.order)).toEqual(
      sqlQuizzes.map((_, i) => i + 1),
    );
  });

  it("関連レッスンが実在する", () => {
    const slugs = new Set(sqlLessons.map((l) => l.slug));
    for (const q of sqlQuizzes) {
      expect(slugs.has(q.lesson), `${q.slug} の lesson: ${q.lesson}`).toBe(true);
    }
  });

  it("選択肢が 4 つあり、id が ア〜エ で重複しない", () => {
    for (const q of sqlQuizzes) {
      expect(q.choices, q.slug).toHaveLength(4);
      expect(q.choices.map((c) => c.id), q.slug).toEqual(["ア", "イ", "ウ", "エ"]);
    }
  });

  it("正解の id が選択肢に存在する", () => {
    for (const q of sqlQuizzes) {
      expect(
        q.choices.some((c) => c.id === q.answer),
        `${q.slug} の answer: ${q.answer}`,
      ).toBe(true);
    }
  });

  it.each(sqlQuizzes.map((q) => [q.slug, q] as const))(
    "%s: expectedResult が実行結果と一致する",
    (_slug, quiz) => {
      expect(formatSqlResult(resultTableOf(quiz))).toBe(quiz.expectedResult);
    },
  );

  it.each(sqlQuizzes.map((q) => [q.slug, q] as const))(
    "%s: 正解の選択肢が実行結果と整合する",
    (_slug, quiz) => {
      const table = resultTableOf(quiz);
      const correct = quiz.choices.find((c) => c.id === quiz.answer)!;
      expect(
        choiceMatchesResult(correct.text, table),
        `正解 ${quiz.answer} が実行結果と一致しない:\n${correct.text}\n---\n${formatSqlResult(table)}`,
      ).toBe(true);
    },
  );

  it.each(sqlQuizzes.map((q) => [q.slug, q] as const))(
    "%s: 誤答の選択肢は実行結果と一致しない (複数正解を防ぐ)",
    (_slug, quiz) => {
      const table = resultTableOf(quiz);
      for (const choice of quiz.choices) {
        if (choice.id === quiz.answer) continue;
        expect(
          choiceMatchesResult(choice.text, table),
          `誤答 ${choice.id} も実行結果と一致してしまう:\n${choice.text}`,
        ).toBe(false);
      }
    },
  );

  it("解説と誤答の狙いが空でない", () => {
    for (const q of sqlQuizzes) {
      expect(q.explanation.length, q.slug).toBeGreaterThan(0);
      expect(q.trap.length, q.slug).toBeGreaterThan(0);
      expect(q.challenge.length, q.slug).toBeGreaterThan(0);
    }
  });

  it("fill 問題には verifySql がある", () => {
    for (const q of sqlQuizzes) {
      if (q.kind === "fill") {
        expect(q.verifySql, `${q.slug} に verifySql が無い`).toBeTruthy();
      }
    }
  });
});
