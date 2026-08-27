/**
 * X「1 日 1 問」用の投稿画像と本文ドラフトを練習問題データから生成する。
 *
 * 実行:
 *   npm run gen:quiz-posts              # 全 20 問
 *   QUIZ_SLUG=assign-swap npm run gen:quiz-posts   # 1 問だけ再生成
 *
 * 出力 (冪等。既存ファイルは上書き):
 *   docs/x-posts/daily-quiz/{NN}-{slug}/question.png
 *   docs/x-posts/daily-quiz/{NN}-{slug}/answer.png
 *   docs/x-posts/daily-quiz/{NN}-{slug}/post.md
 *
 * Playwright の test runner を借りているのはブラウザを動かす ためで、これはテストではない。
 * 検証は行わないので、失敗＝生成失敗として扱う。
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { feQuizzes, type FeQuizMeta } from "@/content/fe/quiz";
import {
  answerHtml,
  questionHtml,
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
} from "./template";

const OUT_ROOT = path.resolve(
  __dirname,
  "../../docs/x-posts/daily-quiz",
);

const SITE = "https://taitech.dev";

function dirFor(quiz: FeQuizMeta): string {
  return path.join(
    OUT_ROOT,
    `${String(quiz.order).padStart(2, "0")}-${quiz.slug}`,
  );
}

/** 出題側の問いかけ。kind で言い回しを変える */
function askLine(quiz: FeQuizMeta): string {
  return quiz.kind === "fill"
    ? "空欄に入るのはどれでしょう。"
    : "出力はどうなるでしょう。";
}

/**
 * 投稿本文ドラフト。docs/x-posts/README.md の方針に従う: 絵文字なし、ハッシュタグ 0〜2 個。
 *
 * 注意 (2026-08-28): 1 日 1 問の運用そのものが終了しているので、このドラフトは
 * 現行方針に沿っていない (出題側の URL 省略は「リンクはリーチを落とす」という
 * 誤った前提に基づいていた)。生成器は資産として残すが、再開する場合は
 * docs/x-posts/README.md の投稿方針から書き直すこと。
 */
function postMarkdown(quiz: FeQuizMeta): string {
  const no = String(quiz.order).padStart(2, "0");
  const questionText = [
    `基本情報 科目B の擬似言語、1日1問 (No.${no})。`,
    ``,
    `${quiz.challenge}コードです。${askLine(quiz)}`,
    ``,
    `答えは明日。`,
    ``,
    `#基本情報技術者試験 #擬似言語 #アルゴリズム`,
  ].join("\n");

  const answerText = [
    `昨日の1日1問 (No.${no}) の答えは ${quiz.answer} でした。`,
    ``,
    quiz.trap,
    ``,
    `このコードは1行ずつ実行して、変数の値の変化を見ながら確かめられます。`,
    `${SITE}/fe/algorithm/quiz/${quiz.slug}`,
    ``,
    `#基本情報技術者試験 #擬似言語`,
  ].join("\n");

  return `---
slug: daily-quiz-${quiz.slug}
topic: 1日1問 No.${no} ${quiz.shortTitle}
kind: ${quiz.kind}
tier: ${quiz.tier}
lesson: ${quiz.lesson}
images:
  - question.png  # 出題日
  - answer.png    # 翌日
---

<!-- このファイルは scripts/post-images/quiz-images.gen.ts の自動生成物。
     手で直した内容は次回の生成で消える。文面を変えたいときはジェネレータ側を直すこと。
     出典データ: src/content/fe/quiz.ts (slug: ${quiz.slug})

     投稿ステータス (出題日 / 解答日) はここには書かない。
     このファイルは再生成で丸ごと上書きされるので、書いても消える。
     ステータスの置き場は docs/x-posts/README.md の「1 日 1 問の進行状況」表、
     実際の投稿本文は docs/x-posts/posted/ 配下。 -->

## 1 投目 — 出題 (画像: question.png)

> **2026-08-28: 1 日 1 問の運用は終了。このドラフトは投稿しない。**
> 出題側に URL を入れていないのは「外部リンク付き投稿はリーチが落ちる」という前提によるが、
> **その前提は誤り**だった (X の For You 実装にリンク罰則は無い)。
> 現行方針は \`docs/x-posts/README.md\` の投稿方針。

\`\`\`
${questionText}
\`\`\`

## 2 投目 — 解答 (翌日、画像: answer.png)

\`\`\`
${answerText}
\`\`\`

## 補足

- 正解: **${quiz.answer}**
- ひっかけ: ${quiz.trap}
- 関連レッスン: ${SITE}/fe/algorithm/lessons/${quiz.lesson}
- 解説ページ: ${SITE}/fe/algorithm/quiz/${quiz.slug}
`;
}

test("generate daily quiz post images", async ({ page }) => {
  const only = process.env.QUIZ_SLUG;
  const targets = only
    ? feQuizzes.filter((q) => q.slug === only)
    : [...feQuizzes];

  expect(
    targets.length,
    only ? `QUIZ_SLUG=${only} に一致する問題がない` : "問題が 0 件",
  ).toBeGreaterThan(0);

  await page.setViewportSize({ width: IMAGE_WIDTH, height: IMAGE_HEIGHT });

  for (const quiz of targets) {
    const dir = dirFor(quiz);
    await fs.mkdir(dir, { recursive: true });

    for (const [name, html] of [
      ["question.png", questionHtml(quiz)],
      ["answer.png", answerHtml(quiz)],
    ] as const) {
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(dir, name),
        clip: { x: 0, y: 0, width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
      });
    }

    await fs.writeFile(
      path.join(dir, "post.md"),
      postMarkdown(quiz),
      "utf8",
    );

    console.log(`generated: ${path.relative(process.cwd(), dir)}`);
  }
});