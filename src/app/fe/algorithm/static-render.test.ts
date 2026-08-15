import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `/fe/algorithm` は静的プリレンダされていること。
 *
 * server component で `searchParams` を受けるとページ全体が Dynamic に落ち、
 * 旗艦ページが毎リクエスト関数実行になる。`?code=` の読み取りは
 * `PlaygroundDeepLink` (client + Suspense) 側の責務なので、
 * ここに searchParams が戻ってきていないかを機械的に見張る。
 */
/** コメントは対象外にする (「searchParams で受けない」という注記自体は残したい) */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("/fe/algorithm を Dynamic に戻さない", () => {
  const source = readFileSync("src/app/fe/algorithm/page.tsx", "utf8");

  it("page.tsx が searchParams を受け取っていない", () => {
    expect(stripComments(source)).not.toMatch(/searchParams/);
  });

  it("クエリの読み取りは PlaygroundDeepLink に閉じている", () => {
    expect(source).toContain("PlaygroundDeepLink");
    // Playground 本体は SSR する (prerender HTML に markup を残すため)
    expect(source).toContain("<Playground>");
  });

  it("PlaygroundDeepLink の from= は自サイトの FE 配下しか受け付けない", () => {
    const deepLink = readFileSync(
      "src/components/fe/PlaygroundDeepLink.tsx",
      "utf8",
    );
    expect(deepLink).toContain(
      "^\\/fe\\/(algorithm\\/)?(lessons|quiz)\\/[a-z0-9-]+$",
    );
  });
});
