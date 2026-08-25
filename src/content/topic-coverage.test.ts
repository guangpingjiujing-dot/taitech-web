import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { whyNeedRdbTopics, queryPlanTopics, topics } from "./topics";
import { sections } from "./sections";

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

/*
 * **セクションを足したときの「黙って壊れる列挙」を止める。**
 *
 * `SectionKey` に足しただけでは tsc も E2E も落ちないのに機能が欠ける箇所が 4 つある。
 *   - `Footer.tsx` の `columns` — フッターに導線が 1 本も生えない
 *   - `PrevNext.tsx` の `getOrderedTopics()` — 未知の section は最後の分岐に落ち、
 *     `idx === -1` になって**そのセクション全ページで前後ナビが消える**
 *   - `SeriesNav.tsx` の `SERIES` — サイト全ページのサイドバーに新セクションが出ない
 *   - `RelatedTopics.tsx` の分岐 — 未知の section は `return false` に落ち、
 *     **そのセクション全ページで「関連トピック」ブロックが消える**
 *     （`/query-plan` 追加時に実際に漏れた。05-implementation-review.md B-2）
 *
 * `Header.tsx`（`Record<HeaderSection, …>`）と `HubTopicNav.tsx`（`Object.values`）は
 * 型か自動列挙で守られているので、ここでは見ない。
 */
describe("セクションが列挙漏れしていない", () => {
  const keys = Object.keys(sections);

  it("全セクションが Footer の columns に載っている", () => {
    const src = read("src/components/layout/Footer.tsx");
    const cols = src.slice(src.indexOf("const columns = ["), src.indexOf("];", src.indexOf("const columns = [")));
    const missing = keys.filter((k) => !cols.includes(`"${k}"`));
    expect(missing).toEqual([]);
  });

  it("全セクションが SeriesNav に載っている", () => {
    // data-modeling だけはカテゴリ単位（normalization / er-diagram）で並べているので除外する
    const src = read("src/components/layout/SeriesNav.tsx");
    const missing = keys
      .filter((k) => k !== "data-modeling")
      .filter((k) => !src.includes(`key: "${k}"`));
    expect(missing).toEqual([]);
  });

  it("全セクションが PrevNext の順序解決に分岐を持っている", () => {
    const src = read("src/components/layout/PrevNext.tsx");
    const start = src.indexOf("function getOrderedTopics");
    const fn = src.slice(start, src.indexOf("export function PrevNextCards", start));
    // data-modeling は category で分岐しているので section 名では現れない
    const missing = keys
      .filter((k) => k !== "data-modeling" && k !== "fe" && k !== "joho1")
      .filter((k) => !fn.includes(`"${k}"`));
    expect(missing).toEqual([]);
  });

  /*
   * **全トピックに OG 画像ルートが要る。**
   *
   * `TopicJsonLd` と `SectionHubJsonLd` の `hasPart` は
   * `<topic.path>/opengraph-image` を**決め打ちで出力する**ので、ルートが無いと
   * 構造化データが 404 を指す（`/query-plan` の 10 本 + ハブの 10 件で実際に起きた。
   * 05-implementation-review.md B-1）。tsc も build も E2E も落ちない。
   */
  it("全トピックに opengraph-image.tsx がある", () => {
    const missing = topics
      .map((t) => ({ t, file: `src/app${t.path}/opengraph-image.tsx` }))
      .filter(({ file }) => !existsSync(path.join(ROOT, file)))
      .map(({ t }) => t.path);
    expect(missing).toEqual([]);
  });

  /*
   * **束ねるキーを持つセクションは、RelatedTopics に分岐が要る。**
   * 分岐が無いと `return false` に落ちてブロックごと消える（B-2）。
   * ここは「キーがあるのに使っていない」だけを落とす。
   * （§L-7 で `why-need-rdb` にも `group` を入れたので、現在は 4 セクションすべてが対象）
   */
  it("束ねるキーを持つセクションが RelatedTopics に分岐を持っている", () => {
    const src = read("src/components/layout/RelatedTopics.tsx");
    const grouped = keys.filter((k) =>
      topics.some(
        (t) =>
          t.section === k &&
          ("group" in t || "category" in t || "stage" in t),
      ),
    );
    expect(grouped.length).toBeGreaterThanOrEqual(4); // 空振り検出
    const missing = grouped.filter((k) => !src.includes(`current.section === "${k}"`));
    expect(missing).toEqual([]);
  });
});

describe("query-plan のトピックが列挙漏れしていない", () => {
  const slugs = queryPlanTopics.map((t) => t.slug);

  it("stageOrder が 1 から連番で重複していない", () => {
    const orders = queryPlanTopics.map((t) => t.stageOrder).sort((a, b) => a - b);
    expect(orders).toEqual(queryPlanTopics.map((_, i) => i + 1));
  });

  /*
   * ハブと TopicNav は `stage` で束ねて描画している。**束ねる側は手書きの配列**なので、
   * 未知の `stage` を持つトピックを足すと**どのグループにも入らず黙って消える**。
   * （トピックそのものはレジストリから描画しているので、列挙漏れは起きない）
   */
  it("全トピックの stage が、ハブと TopicNav の段の列挙に含まれている", () => {
    const stages = [...new Set(queryPlanTopics.map((t) => t.stage))];
    for (const file of [
      "src/app/query-plan/page.tsx",
      "src/components/layout/TopicNav.tsx",
    ]) {
      const src = read(file);
      const missing = stages.filter((st) => !src.includes(`key: "${st}"`));
      expect(missing, file).toEqual([]);
    }
  });

  it("全トピックにページのディレクトリがある", () => {
    const missing = slugs.filter((s) => {
      try {
        readFileSync(path.join(ROOT, `src/app/query-plan/${s}/page.tsx`), "utf8");
        return false;
      } catch {
        return true;
      }
    });
    expect(missing).toEqual([]);
  });
});
