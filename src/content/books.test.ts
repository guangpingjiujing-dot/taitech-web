import { describe, expect, it } from "vitest";
import { books, booksForTopic } from "@/content/books";
import { feLessons } from "@/content/fe/lessons";

describe("books registry", () => {
  it("すべての Amazon リンクにアソシエイト ID が付いている", () => {
    // AGENTS.md のガードレール: tag を落とすと収益がゼロになる
    for (const b of books) {
      expect(b.amazonUrl, b.id).toContain("?tag=taitech-22");
    }
  });

  it("id が重複していない", () => {
    const ids = books.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("asin を持つ本は amazonUrl と一致している", () => {
    for (const b of books.filter((b) => b.asin)) {
      expect(b.amazonUrl, b.id).toContain(`/dp/${b.asin}?`);
    }
  });
});

describe("booksForTopic", () => {
  it("domain をまたいで書籍を混ぜない", () => {
    expect(booksForTopic("fe-array", { domain: "fe" }).every((b) => b.domain === "fe"))
      .toBe(true);
    expect(booksForTopic("btree").every((b) => b.domain === "rdb")).toBe(true);
  });

  it("マッチした書籍を先頭に返す", () => {
    const [first] = booksForTopic("fe-array", { domain: "fe" });
    expect(first.topics).toContain("fe-array");
  });

  it("limit で件数を絞れる", () => {
    expect(booksForTopic("fe-playground", { domain: "fe", limit: 3 })).toHaveLength(3);
  });

  it("FE の各レッスン / ツールページに紐づく書籍が 1 冊以上ある", () => {
    const slugs = [
      "fe-playground",
      "fe-transpile",
      "fe-lessons",
      ...feLessons.map((l) => `fe-${l.slug}`),
    ];
    for (const slug of slugs) {
      const matching = books.filter(
        (b) => b.domain === "fe" && b.topics.includes(slug),
      );
      expect(matching.length, slug).toBeGreaterThan(0);
    }
  });
});
