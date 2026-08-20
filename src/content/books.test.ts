import { describe, expect, it } from "vitest";
import { books, booksForTopic } from "@/content/books";
import { bookShelves, booksInShelf } from "@/content/book-shelves";
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

  it("トピックページを持たない領域の書籍がトピック側に漏れない", () => {
    // itpassport / python は `/books` 専用の領域 (books.ts の BookDomain コメント)。
    // 既存ページの domain 指定は rdb / fe / joho1 の 3 つだけなので、
    // どの domain で引いても混ざらないことを保証する
    for (const domain of ["rdb", "fe", "joho1"] as const) {
      const leaked = booksForTopic("recap", { domain }).filter(
        (b) => b.domain !== domain,
      );
      expect(leaked, domain).toEqual([]);
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

describe("book shelves (/books)", () => {
  it("棚の書籍 ID がすべて実在する", () => {
    // booksInShelf は未解決 ID で throw する。棚が黙って痩せる事故を止める
    for (const shelf of bookShelves) {
      expect(() => booksInShelf(shelf), shelf.key).not.toThrow();
    }
  });

  it("同じ棚に同じ本を 2 回並べていない", () => {
    for (const shelf of bookShelves) {
      expect(new Set(shelf.order).size, shelf.key).toBe(shelf.order.length);
    }
  });

  it("棚は 2 冊に絞られている", () => {
    // 候補を並べると「結局どれを買えばいいか」が読者に残る (book-shelves.ts の方針)。
    // 増やしたくなったら方針ごと見直すこと
    for (const shelf of bookShelves) {
      expect(shelf.order.length, shelf.key).toBe(2);
    }
  });

  it("役割ラベルが冊数と一致している", () => {
    for (const shelf of bookShelves) {
      expect(shelf.roles.length, shelf.key).toBe(shelf.order.length);
    }
  });

  it("棚に載る本はすべて detail を持つ", () => {
    // 冊数を絞る代わりに 1 冊あたりの情報量で勝負する設計。
    // detail 無しの本を棚に置くと、カードだけスカスカになって狙いが崩れる
    for (const shelf of bookShelves) {
      for (const { book } of booksInShelf(shelf)) {
        expect(book.detail, `${shelf.key}/${book.id}`).toBeDefined();
        // 弱点を書かない紹介は信用されない。caution は空にしない
        expect(book.detail?.caution.length, `${shelf.key}/${book.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("itpassport / python の全書籍がどこかの棚に載っている", () => {
    // この 2 領域はトピックページを持たないので、棚から漏れると
    // サイト上のどこからも到達できない本になる
    const shelved = new Set(bookShelves.flatMap((s) => s.order));
    const orphans = books
      .filter((b) => b.domain === "itpassport" || b.domain === "python")
      .filter((b) => !shelved.has(b.id))
      .map((b) => b.id);
    expect(orphans).toEqual([]);
  });
});
