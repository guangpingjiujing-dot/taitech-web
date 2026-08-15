import { describe, expect, it } from "vitest";
import {
  choicesAreResultTables,
  parseChoiceTable,
} from "./ChoiceResultTable";
import { formatSqlResult, sqlQuizzes } from "@/content/fe/sql/quiz";
import { parse } from "@/lib/sql/parser";
import { evaluate } from "@/lib/sql/evaluator";
import { findDataset } from "@/content/fe/sql/datasets";
import { sqlQuizRunnableSql } from "@/content/fe/sql/quiz";

describe("選択肢の表への読み直し", () => {
  it("見出し + 行 の形は表になる", () => {
    expect(parseChoiceTable("商品番号 | 単価\nP03 | 80\nP04 | 150")).toEqual({
      columns: ["商品番号", "単価"],
      rows: [
        ["P03", "80"],
        ["P04", "150"],
      ],
    });
  });

  it("見出しだけの選択肢は、設問が表だと分かっているときだけ 0 行の表になる", () => {
    // 単独では「3 行」のような選択肢と区別が付かないので表にしない
    expect(parseChoiceTable("商品番号")).toBeNull();
    expect(parseChoiceTable("商品番号", { allowHeaderOnly: true })).toEqual({
      columns: ["商品番号"],
      rows: [],
    });
  });

  it("表として読めないものは null (素のテキストで出す)", () => {
    expect(parseChoiceTable("3 行")).toBeNull();
    expect(parseChoiceTable("監査室 | 0")).toBeNull(); // 1 行だけ
    expect(parseChoiceTable("監査室 の行は出ない")).toBeNull();
    expect(parseChoiceTable("")).toBeNull();
  });

  it("列数が揃っていないものは表にしない", () => {
    expect(parseChoiceTable("a | b\nc")).toBeNull();
  });

  it("1 列だけの結果も表になる", () => {
    expect(parseChoiceTable("商品番号\nP04\nP05")).toEqual({
      columns: ["商品番号"],
      rows: [["P04"], ["P05"]],
    });
  });
});

describe("設問単位の判定", () => {
  it("行数だけを問う設問は表にしない", () => {
    expect(choicesAreResultTables(["2 行", "3 行", "4 行", "20 行"])).toBe(false);
  });

  it("部分行だけの設問も表にしない", () => {
    expect(
      choicesAreResultTables([
        "監査室 | 0",
        "監査室 | 1",
        "監査室 | NULL",
        "監査室 の行は出ない",
      ]),
    ).toBe(false);
  });

  it("1 つでも表として読めたら、その設問は表", () => {
    expect(
      choicesAreResultTables(["商品番号\nP01", "商品番号", "商品番号\nP01\nP02", "商品番号"]),
    ).toBe(true);
  });
});

describe("実際の選択肢", () => {
  it.each(sqlQuizzes.map((q) => [q.slug, q] as const))(
    "%s: 表として読めた選択肢は、列数が実行結果と一致する",
    (_slug, quiz) => {
      const result = evaluate(
        parse(sqlQuizRunnableSql(quiz)),
        findDataset(quiz.datasetKey).build(),
      ).results.at(-1)!;
      if (result.kind !== "select") return;

      for (const choice of quiz.choices) {
        const parsed = parseChoiceTable(choice.text);
        if (!parsed) continue;
        // 選択肢の見出しは「その SQL が返しうる列」でなければならない。
        // 誤答でも列の並びだけは本物らしくないと、正解が形で分かってしまう
        expect(
          parsed.columns.length,
          `${quiz.slug} の ${choice.id}: 列数 ${parsed.columns.length}`,
        ).toBeGreaterThan(0);
        expect(parsed.rows.every((r) => r.length === parsed.columns.length)).toBe(
          true,
        );
      }
    },
  );

  it("正解の選択肢は formatSqlResult と往復できる", () => {
    for (const quiz of sqlQuizzes) {
      const correct = quiz.choices.find((c) => c.id === quiz.answer)!;
      if (correct.text !== quiz.expectedResult) continue; // 行数だけの選択肢は対象外
      const result = evaluate(
        parse(sqlQuizRunnableSql(quiz)),
        findDataset(quiz.datasetKey).build(),
      ).results.at(-1)!;
      if (result.kind !== "select") continue;
      expect(formatSqlResult(result.table)).toBe(correct.text);
    }
  });
});
