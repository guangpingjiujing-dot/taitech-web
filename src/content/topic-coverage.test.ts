import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { whyNeedRdbTopics } from "./topics";

/*
 * **トピックを足したときに「明示列挙のリスト」へ入れ忘れる事故を止めるためのテスト。**
 *
 * このリポジトリには学習順序を手で並べた配列が複数あり、いずれも
 * `.map(...).filter(Boolean)` や `find(...)!` で解決している。未記載のトピックは
 * 例外にならず**黙って表示から消える**ので、ビルドもテストも通ってしまう。
 *
 * 実際に isolation-levels を追加したとき、
 * (a) `PrevNext.tsx` の WHY_NEED_RDB_ORDER 漏れで PrevNext がページから消え、
 * (b) `app/why-need-rdb/page.tsx` の LEARNING_ORDER 漏れでセクションハブに載らない
 * という 2 つを同時に踏んだ。ハブからの内部リンクが無いのはクロール上も痛い。
 *
 * ソースを文字列として読んで slug の出現を見るだけの雑なテストだが、
 * 「列挙し忘れ」という失敗モードにはこれで十分効く。
 */

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

describe("why-need-rdb のトピックが列挙漏れしていない", () => {
  const slugs = whyNeedRdbTopics.map((t) => t.slug);

  it("全トピックが PrevNext の学習順序に載っている", () => {
    const src = read("src/components/layout/PrevNext.tsx");
    const order = src.slice(
      src.indexOf("const WHY_NEED_RDB_ORDER"),
      src.indexOf("] as const", src.indexOf("const WHY_NEED_RDB_ORDER")),
    );
    const missing = slugs.filter((s) => !order.includes(`"${s}"`));
    expect(missing).toEqual([]);
  });

  it("全トピックがセクションハブのどちらかのリストに載っている", () => {
    const src = read("src/app/why-need-rdb/page.tsx");
    const lists = src.slice(
      src.indexOf("const LEARNING_ORDER"),
      src.indexOf("const faq"),
    );
    const missing = slugs.filter((s) => !lists.includes(`"${s}"`));
    expect(missing).toEqual([]);
  });
});
