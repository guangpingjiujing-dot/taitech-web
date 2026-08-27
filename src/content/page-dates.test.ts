import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { pageDates, findPageDates } from "@/content/page-dates";

/**
 * `page-dates.ts` が sitemap と一致していること。
 *
 * **ページを新設したら日付の登録も要る。** 忘れると JSON-LD の `dateModified` と
 * sitemap の `lastModified` と可視の更新日が丸ごと欠けたページが出る。
 * それが黙って起きないようにするのがこのテストの役目
 * (docs/wip/20260828-seo-aeo-review/00-review.md §4)。
 */
describe("page-dates が sitemap を網羅している", () => {
  const paths = sitemap().map((e) => new URL(e.url).pathname);

  it("sitemap の全 URL に日付が登録されている", () => {
    const missing = paths.filter((p) => !findPageDates(p));
    expect(missing).toEqual([]);
  });

  it("登録されているが sitemap に無い path は残っていない", () => {
    const known = new Set(paths);
    const stale = Object.keys(pageDates).filter((p) => !known.has(p));
    expect(stale).toEqual([]);
  });

  it("sitemap の lastModified が page-dates の updated と一致している", () => {
    for (const entry of sitemap()) {
      const path = new URL(entry.url).pathname;
      expect(entry.lastModified).toBe(findPageDates(path)?.updated);
    }
  });
});

describe("日付の形式と前後関係", () => {
  it("すべて YYYY-MM-DD である", () => {
    const bad = Object.entries(pageDates).filter(
      ([, d]) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(d.published) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(d.updated),
    );
    expect(bad).toEqual([]);
  });

  it("published <= updated である", () => {
    const bad = Object.entries(pageDates)
      .filter(([, d]) => d.published > d.updated)
      .map(([p]) => p);
    expect(bad).toEqual([]);
  });

  it("未来の日付が入っていない", () => {
    // 「今日更新」を装うのをやめたのがこの仕組みの主旨なので、未来日は明確な誤り
    const today = new Date().toISOString().slice(0, 10);
    const bad = Object.entries(pageDates)
      .filter(([, d]) => d.updated > today)
      .map(([p]) => p);
    expect(bad).toEqual([]);
  });
});
