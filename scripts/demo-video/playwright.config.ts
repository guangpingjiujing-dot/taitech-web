import { defineConfig } from "@playwright/test";

/**
 * デモ動画ジェネレータ専用の Playwright 設定。
 *
 * 本番ビルドを立ち上げてから録画する。dev サーバーだと画面隅に Next の
 * dev インジケータが出て、そのまま動画に写り込むため。
 *
 * 動画サイズは 1280x720 (16:9)。録画時に実行シミュレーター以外の UI を隠して
 * グリッド (高さ約 555px) を中央に置くので、この比率で余白ごと収まる。
 */
export default defineConfig({
  testDir: ".",
  testMatch: "*.gen.ts",
  reporter: [["list"]],
  workers: 1,
  timeout: 180_000,
  // 録画の生データ置き場。docs/ 配下は .gitignore 済みなのでリポジトリを汚さない
  outputDir: "../../docs/x-posts/demo-video/.raw",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    video: {
      mode: "on",
      size: { width: 1280, height: 720 },
    },
    trace: "off",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
