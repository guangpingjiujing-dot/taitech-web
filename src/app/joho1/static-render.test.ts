import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `/joho1` は静的プリレンダされていること。
 *
 * server component で `searchParams` を受けるとページ全体が Dynamic に落ち、
 * セクションの旗艦ページが毎リクエスト関数実行になる。`?code=` / `?base=` の
 * 読み取りは `Joho1PlaygroundDeepLink` (client + Suspense) 側の責務なので、
 * ここに searchParams が戻ってきていないかを機械的に見張る (`/fe` と同じ理由)。
 */
/** コメントは対象外にする (「searchParams で受けない」という注記自体は残したい) */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("/joho1 を Dynamic に戻さない", () => {
  const source = readFileSync("src/app/joho1/page.tsx", "utf8");

  it("page.tsx が searchParams を受け取っていない", () => {
    expect(stripComments(source)).not.toMatch(/searchParams/);
  });

  it("deep link は Playground の中に閉じている", () => {
    const playground = readFileSync(
      "src/components/joho1/Joho1Playground.tsx",
      "utf8",
    );
    expect(playground).toContain("Joho1PlaygroundDeepLink");
    expect(playground).toContain("Suspense");
  });

  it("from= は自サイトの joho1 配下しか受け付けない", () => {
    const deepLink = readFileSync(
      "src/components/joho1/Joho1PlaygroundDeepLink.tsx",
      "utf8",
    );
    expect(deepLink).toContain("^\\/joho1\\/(lessons|quiz)\\/[a-z0-9-]+$");
  });

  /**
   * レッスンや練習問題に埋め込んだ Playground が URL で書き換わると、
   * そのページが説明している題材と中身がずれる。deep link を有効にするのは
   * セクショントップだけ。
   */
  it("deep link はセクショントップでだけ有効にしている", () => {
    expect(source).toContain("enableDeepLink");
    const lessonPlayground = readFileSync(
      "src/components/joho1/LessonPlayground.tsx",
      "utf8",
    );
    expect(lessonPlayground).not.toContain("enableDeepLink");
  });
});
