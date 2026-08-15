import { describe, expect, it } from "vitest";
import { books, booksForTopic } from "@/content/books";
import { feLessons } from "@/content/fe/lessons";
import { joho1Lessons } from "@/content/joho1/lessons";

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
      "fe-sql",
      ...feLessons.map((l) => `fe-${l.slug}`),
    ];
    for (const slug of slugs) {
      const matching = books.filter(
        (b) => b.domain === "fe" && b.topics.includes(slug),
      );
      expect(matching.length, slug).toBeGreaterThan(0);
    }
  });

  it("情報I の各レッスン / ツールページに紐づく書籍が 1 冊以上ある", () => {
    const slugs = [
      "joho1-playground",
      "joho1-dncl",
      "joho1-lessons",
      "joho1-quiz",
      "joho1-transpile",
      ...joho1Lessons.map((l) => `joho1-${l.slug}`),
    ];
    for (const slug of slugs) {
      const matching = books.filter(
        (b) => b.domain === "joho1" && b.topics.includes(slug),
      );
      expect(matching.length, slug).toBeGreaterThan(0);
    }
  });

  it("情報I のページに FE / RDB の書籍を混ぜない", () => {
    // 共通テスト受験者に基本情報の参考書を出すと、関連性が下がってクリックが落ちる。
    // 他教科 (数学など) の対策書を載せない方針も同じ理由 (books.ts のコメント参照)
    expect(
      booksForTopic("joho1-playground", { domain: "joho1" }).every(
        (b) => b.domain === "joho1",
      ),
    ).toBe(true);
  });
});
