import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * **埋め込みエディタのサンプルコードが、JS 実行前の HTML に残っていること。**
 *
 * `CodeEditor` は `ssr: false` の dynamic import なので、`loading` フォールバックが
 * 空だとコードが初期 HTML に一切残らない。Googlebot は JS を実行するので気付けないが、
 * **GPTBot / ClaudeBot / PerplexityBot は実行しない**ため、このサイトの売りである
 * 「動かして学べる教材」が AI から見て本文だけのページになる。
 * 実際 2026-08-28 の診断時点で 28 ページ・34 個のエディタがこの状態だった
 * (docs/wip/20260828-seo-aeo-review/00-review.md §2)。
 *
 * **Playwright では検出できない。** E2E は JS 実行後の DOM を見るので、
 * フォールバックが空でも CodeMirror が描画した後のコードを見つけてしまう。
 * だから prerender された `.html` を直接読む。
 */

/** `npm run build` の出力。無いときはスキップする (`npm run test:unit` 単体実行) */
const BUILD_DIR = ".next/server/app";

/**
 * 各系統から 1 ページずつ。**全ページを列挙しない** —
 * ページが増えるたびにこのリストを直す羽目になるうえ、
 * 壊れるときは `loading` を触った瞬間に系統ごと壊れるので 1 枚で検知できる。
 */
const CASES: { html: string; mustContain: string; why: string }[] = [
  {
    html: "fe/algorithm/lessons/for.html",
    mustContain: "for (i を 1 から n まで 1 ずつ増やす)",
    why: "擬似言語レッスンに埋め込んだ Playground の初期コード",
  },
  {
    html: "fe/algorithm/transpile.html",
    mustContain: "for (i を 1 から n まで 1 ずつ増やす)",
    why: "多言語比較の「変換元」。ここが欠けると変換後だけが HTML に残る",
  },
  {
    html: "fe/sql/lessons/aggregate.html",
    mustContain: "SELECT COUNT(*), COUNT(給与)",
    why: "SQL レッスンに埋め込んだ SqlPlayground の初期 SQL",
  },
  {
    html: "joho1/lessons/loop.html",
    mustContain: "ずつ増やしながら繰り返す：",
    why: "情報I レッスンの Joho1Playground。以前は空の aria-hidden な箱だった",
  },
  {
    html: "joho1/transpile.html",
    mustContain: "Tokuten = [62, 78, 55, 91, 70]",
    why: "情報I の多言語比較の「変換元」",
  },
];

const hasBuild = existsSync(BUILD_DIR);

describe.skipIf(!hasBuild)(
  "埋め込みエディタのコードが prerender HTML に残っている",
  () => {
    for (const { html, mustContain, why } of CASES) {
      it(`${html} — ${why}`, () => {
        const source = readFileSync(`${BUILD_DIR}/${html}`, "utf8");
        expect(source).toContain(mustContain);
      });
    }

    it("「エディタを読み込み中…」が prerender HTML に残っていない", () => {
      // フォールバックがコードではなくプレースホルダに戻っていないかの逆側の検知
      for (const { html } of CASES) {
        const source = readFileSync(`${BUILD_DIR}/${html}`, "utf8");
        expect(source).not.toContain("エディタを読み込み中");
      }
    });
  },
);

describe.skipIf(hasBuild)("ビルド出力が無いのでスキップ", () => {
  it("`npm run build` の後に `npm run test:unit` を走らせると検証される", () => {
    expect(hasBuild).toBe(false);
  });
});
