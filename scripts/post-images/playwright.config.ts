import { defineConfig } from "@playwright/test";

/**
 * 投稿画像ジェネレータ専用の Playwright 設定。
 *
 * ルートの playwright.config.ts (E2E) とは分けている。理由:
 * - E2E 側は webServer で `npm run build && npm run start` を立ち上げるが、
 *   画像生成にサーバーは不要 (page.setContent で完結する)
 * - `npm run test:e2e` の結果に生成処理を混ぜたくない
 *
 * deviceScaleFactor: 2 で 2400x1350 の PNG を出す。X 側で縮小されるぶん字が潰れにくい。
 */
export default defineConfig({
  testDir: ".",
  testMatch: "*.gen.ts",
  reporter: [["list"]],
  workers: 1,
  use: {
    deviceScaleFactor: 2,
    trace: "off",
    video: "off",
  },
});
