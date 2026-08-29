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
  /*
   * ハブ系。**`dateModified` を Article 系の型で主張しているページはここに入れる。**
   *
   * 2026-08-29 の実測で、可視の更新日が無い 25 URL のうち **6 件が Article 系の型
   * (`TechArticle` / `LearningResource`) で `dateModified` を主張していた**。
   * 残り 19 件は `FAQPage` / `CollectionPage` だけか、そもそも `dateModified` を
   * 出していないので対象外 (`docs/log/2026-08-29-eeat-sameas-and-citations.md`)。
   *
   * これらはレイアウトを共有しておらず**ページごとに手で `ArticleMeta` を置いている**ので、
   * TopicLayout 系より静かに外れやすい。代表を 2 枚だけ見張る。
   */
  { html: "query-plan.html", path: "/query-plan", layout: "セクションハブ (TechArticle)" },
  { html: "joho1/dncl.html", path: "/joho1/dncl", layout: "joho1 独自レイアウト (LearningResource)" },
];

/**
 * 規約系。**JSON-LD は持たないが、改定日は可視で出す。**
 * 「いつ版が変わったか」が読者に分からない規約は、それ自体が信頼性の欠落
 * (roadmap #83)。著者行は出さない — 規約の名義は運営者であって記事の著者ではない。
 */
const LEGAL_CASES: { html: string; path: string }[] = [
  { html: "privacy.html", path: "/privacy" },
  { html: "terms.html", path: "/terms" },
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

  for (const { html, path } of LEGAL_CASES) {
    it(`${path} — 改定日が出ていて page-dates と一致する`, () => {
      const source = readFileSync(`${BUILD_DIR}/${html}`, "utf8");
      const expected = findPageDates(path);
      expect(expected, `page-dates に ${path} が無い`).toBeDefined();

      const visible = source.match(/<time[^>]*date[Tt]ime="(\d{4}-\d{2}-\d{2})"/);
      expect(visible?.[1], "改定日が出ていない").toBe(expected!.updated);
      expect(source).toContain("最終改定");
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
