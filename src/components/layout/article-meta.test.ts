import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findPageDates } from "@/content/page-dates";

/**
 * **可視の更新日と JSON-LD の `dateModified` が一致していること。**
 *
 * これが C の主旨そのもの。以前は `dateModified` がビルド時刻で全ページ同一だったのに
 * ページには更新日が出ていなかった。「構造化データは可視情報と一致している必要がある」
 * という原則から外れていたので、`content/page-dates.ts` を唯一の正にして
 * JSON-LD・sitemap・可視表示の 3 つに同じ値を流した
 * (docs/wip/20260828-seo-aeo-review/00-review.md §4)。
 *
 * 片方だけ直して静かにずれるのが一番ありがちなので、**突き合わせ**を機械化する。
 * 型では守れない (JSON-LD は文字列を組み立てているだけなので)。
 */
const BUILD_DIR = ".next/server/app";

/** 記事系の各レイアウトから 1 枚ずつ。レイアウトを壊せばここで落ちる */
const CASES: { html: string; path: string; layout: string }[] = [
  { html: "rdb-index/btree.html", path: "/rdb-index/btree", layout: "TopicLayout" },
  {
    html: "fe/algorithm/lessons/for.html",
    path: "/fe/algorithm/lessons/for",
    layout: "LessonLayoutView (擬似言語)",
  },
  {
    html: "fe/sql/lessons/select.html",
    path: "/fe/sql/lessons/select",
    layout: "LessonLayoutView (SQL)",
  },
  {
    html: "joho1/lessons/loop.html",
    path: "/joho1/lessons/loop",
    layout: "Joho1LessonLayout",
  },
  {
    html: "fe/algorithm/quiz/leap-year.html",
    path: "/fe/algorithm/quiz/leap-year",
    layout: "練習問題ページ",
  },
];

const hasBuild = existsSync(BUILD_DIR);

describe.skipIf(!hasBuild)("可視の更新日と JSON-LD が一致している", () => {
  for (const { html, path, layout } of CASES) {
    it(`${path} — ${layout}`, () => {
      const source = readFileSync(`${BUILD_DIR}/${html}`, "utf8");
      const expected = findPageDates(path);
      expect(expected, `page-dates に ${path} が無い`).toBeDefined();

      // 可視の <time>。属性名の大小は HTML では区別されないので両方許す
      const visible = source.match(/<time[^>]*date[Tt]ime="(\d{4}-\d{2}-\d{2})"/);
      expect(visible?.[1], "可視の更新日が出ていない").toBe(expected!.updated);

      // JSON-LD 側
      expect(source).toContain(`"dateModified":"${expected!.updated}"`);
      expect(source).toContain(`"datePublished":"${expected!.published}"`);

      // 著者の可視表示 (JSON-LD の author と対になる)
      expect(source).toContain("著者");
    });
  }

  it("ビルド時刻がそのまま日付として残っていない", () => {
    // BUILD_DATE 時代の名残 (ISO の時刻付き) が JSON-LD に混ざっていないこと
    for (const { html } of CASES) {
      const source = readFileSync(`${BUILD_DIR}/${html}`, "utf8");
      expect(source).not.toMatch(/"date(Modified|Published)":"\d{4}-\d{2}-\d{2}T/);
    }
  });
});
