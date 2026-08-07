import { test, expect, type Page } from "@playwright/test";

const PAGES = [
  "/",
  "/about",
  "/rdb-index",
  "/rdb-index/basics/why-index",
  "/rdb-index/basics/data-structure",
  "/rdb-index/btree",
  "/rdb-index/hash",
  "/rdb-index/clustered",
  "/rdb-index/composite",
  "/rdb-index/unique",
  "/rdb-index/covering",
  "/rdb-index/partial",
  "/rdb-index/explain",
  "/rdb-index/statistics",
  "/rdb-index/cost",
  "/data-modeling",
  "/data-modeling/normalization",
  "/data-modeling/normalization/why",
  "/data-modeling/normalization/functional-dependency",
  "/data-modeling/normalization/keys",
  "/data-modeling/normalization/1nf",
  "/data-modeling/normalization/2nf",
  "/data-modeling/normalization/3nf",
  "/data-modeling/normalization/denormalization",
  "/data-modeling/er-diagram",
  "/data-modeling/er-diagram/entity",
  "/data-modeling/er-diagram/relationship",
  "/data-modeling/er-diagram/cardinality",
  "/data-modeling/er-diagram/optionality",
  "/data-modeling/er-diagram/many-to-many",
  "/data-modeling/er-diagram/weak-entity",
  "/data-modeling/er-diagram/notation",
  "/why-need-rdb",
  "/why-need-rdb/atomicity",
  "/why-need-rdb/concurrency",
  "/why-need-rdb/uniqueness",
  "/why-need-rdb/referential-integrity",
  "/why-need-rdb/durability",
  "/why-need-rdb/recap",
  "/fe",
  "/fe/transpile",
  "/fe/lessons",
  "/fe/lessons/variable",
  "/fe/lessons/if",
  "/fe/lessons/while",
  "/fe/lessons/for",
  "/fe/lessons/array",
  "/fe/lessons/function",
  "/fe/quiz",
  "/fe/quiz/assign-swap",
  "/fe/quiz/operator-precedence",
  "/fe/quiz/elseif-first-match",
  "/fe/quiz/boundary-operator",
  "/fe/quiz/while-loop-count",
  "/fe/quiz/while-exact-repeat",
  "/fe/quiz/for-loop-step",
  "/fe/quiz/array-one-based",
  "/fe/quiz/array-reverse-scan",
  "/fe/quiz/function-return-flow",
  "/fe/quiz/linked-list-traverse",
  "/fe/quiz/insertion-sort-inner",
  "/fe/quiz/stack-push-pop",
  "/fe/quiz/queue-ring-buffer",
  "/fe/quiz/selection-sort-swaps",
  "/fe/quiz/merge-two-sorted",
  "/fe/quiz/while-search-not-found",
  "/fe/quiz/fib-recursion",
  "/fe/quiz/leap-year",
  "/fe/quiz/indirect-index",
  "/privacy",
  "/terms",
  "/contact",
];

// Only errors we actually care about. Ignore known noisy ones.
const IGNORE_MESSAGE_PATTERNS: RegExp[] = [
  /Failed to load resource.*favicon/i,
  /_next\/static.*\.hot-update\.json/i,
  /websocket connection/i,
  // Vercel Analytics / Speed Insights scripts 404 on local production runs
  // because they are only served on the Vercel platform. The console message
  // is a generic "Failed to load resource" without URL — we correlate with
  // network 404s via IGNORE_404_URL_PATTERNS below.
  /Failed to load resource: the server responded with a status of 404/i,
];

// If a 404 network response matches one of these URLs, do NOT treat the
// accompanying "Failed to load resource" console message as an error.
const IGNORE_404_URL_PATTERNS: RegExp[] = [
  /favicon/i,
  /\/_vercel\/(insights|speed-insights)/i,
];

function watchConsole(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unexpected404s: string[] = [];

  page.on("response", (res) => {
    if (res.status() === 404) {
      const url = res.url();
      if (!IGNORE_404_URL_PATTERNS.some((p) => p.test(url))) {
        unexpected404s.push(url);
      }
    }
  });
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (IGNORE_MESSAGE_PATTERNS.some((p) => p.test(text))) return;
    if (type === "error") errors.push(text);
    if (type === "warning") warnings.push(text);
  });
  page.on("pageerror", (err) => {
    errors.push(`PageError: ${err.message}`);
  });
  return { errors, warnings, unexpected404s };
}

for (const path of PAGES) {
  test(`${path} loads without console errors`, async ({ page }) => {
    const { errors, warnings, unexpected404s } = watchConsole(page);
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    // Give React hydration + any effect-time warnings a moment
    await page.waitForTimeout(300);
    expect(
      unexpected404s,
      `Unexpected 404s:\n${unexpected404s.join("\n")}`,
    ).toEqual([]);
    expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
    expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
  });

  test(`${path} has exactly one h1 and a canonical link`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const h1Count = await page.locator("h1").count();
    expect(h1Count, `Expected exactly 1 h1 on ${path}, got ${h1Count}`).toBe(1);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical, `Missing canonical on ${path}`).toBeTruthy();
    expect(
      canonical,
      `Canonical on ${path} must be self-referential, got ${canonical}`,
    ).toContain(path === "/" ? "//" : path);
  });
}

test("B-tree page: changing maxKeys rebuilds tree without errors", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/btree", { waitUntil: "networkidle" });

  const select = page.locator("select").first();
  for (const value of ["5", "7", "2", "3"]) {
    await select.selectOption(value);
    await page.waitForTimeout(200);
  }

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("B-tree page: interactive search + insert produce no console errors", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/btree", { waitUntil: "networkidle" });

  const searchInput = page.locator('input[type="number"]').first();
  await searchInput.fill("");
  await page.waitForTimeout(100);
  await searchInput.fill("25");
  await page.getByRole("button", { name: /自動再生/ }).click();
  await page.waitForTimeout(2500);

  await page.getByRole("button", { name: /挿入モード/ }).click();
  const insertInput = page.locator('input[type="number"]').first();
  await insertInput.fill("100");
  await page.getByRole("button", { name: /^挿入$/ }).click();
  await page.waitForTimeout(500);

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("B-tree page: step-by-step search advances one step at a time", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/btree", { waitUntil: "networkidle" });

  const searchInput = page.locator('input[type="number"]').first();
  await searchInput.fill("");
  await searchInput.fill("22");

  const stepBtn = page.getByRole("button", { name: /1ステップ/ });
  for (let i = 0; i < 5; i++) {
    if (await stepBtn.isDisabled()) break;
    await stepBtn.click();
    await page.waitForTimeout(150);
  }

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("B-tree page: autoplay pause + resume without errors", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/btree", { waitUntil: "networkidle" });

  const searchInput = page.locator('input[type="number"]').first();
  await searchInput.fill("");
  await searchInput.fill("40");

  await page.getByRole("button", { name: /自動再生/ }).click();
  await page.waitForTimeout(700);
  const pauseBtn = page.getByRole("button", { name: /一時停止/ });
  if (await pauseBtn.count()) {
    await pauseBtn.click();
    await page.waitForTimeout(200);
  }
  const playBtn = page.getByRole("button", { name: /自動再生/ });
  if (await playBtn.count()) {
    await playBtn.click();
  }
  await page.waitForTimeout(2500);

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Clustered page: range inputs handle clearing without errors", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/clustered", { waitUntil: "networkidle" });

  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("");
  await page.waitForTimeout(50);
  await inputs.nth(0).fill("30");
  await inputs.nth(1).fill("");
  await page.waitForTimeout(50);
  await inputs.nth(1).fill("70");

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("PageStorage viz interaction", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/basics/data-structure", { waitUntil: "networkidle" });
  const input = page.locator('input[type="text"]').first();
  await input.fill("");
  await input.fill("3:2");
  await page.getByRole("button", { name: /^読む$/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /全ページを順に読む/ }).click();
  await page.getByRole("button", { name: /スキャン再生/ }).click();
  await page.waitForTimeout(2000);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});

test("FullScan viz on why-index runs without errors", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/basics/why-index", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /スキャン開始/ }).click();
  await page.waitForTimeout(2500);

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Hash viz: step-by-step equal search and pipeline stages", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/hash", { waitUntil: "networkidle" });

  const searchInput = page.locator('input[type="text"]').first();
  await searchInput.fill("");
  await searchInput.fill("sato");

  const stepBtn = page.getByRole("button", { name: /^1ステップ$/ });
  for (let i = 0; i < 5; i++) {
    if (await stepBtn.isDisabled()) break;
    await stepBtn.click();
    await page.waitForTimeout(120);
  }

  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});

test("Hash viz: bucket count change + range + insert", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/hash", { waitUntil: "networkidle" });

  // Change bucket count
  const bucketSelect = page.locator("select").first();
  await bucketSelect.selectOption("7");
  await page.waitForTimeout(150);

  // Range search
  await page.getByRole("button", { name: /^範囲検索$/ }).click();
  await page.waitForTimeout(120);
  await page.getByRole("button", { name: /^全走査$/ }).click();
  await page.waitForTimeout(200);

  // Insert with step-by-step
  await page.getByRole("button", { name: /^挿入$/ }).click();
  await page.waitForTimeout(120);
  const insertInput = page.locator('input[type="text"]').first();
  await insertInput.fill("");
  await insertInput.fill("mori");
  await page.getByRole("button", { name: /^自動再生$/ }).click();
  await page.waitForTimeout(3500);

  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});

test("Composite viz mode toggles", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/composite", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /先頭 \+ 2番目/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /2番目だけ/ }).click();
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});

test("Unique viz: duplicate + successful insert both work", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/unique", { waitUntil: "networkidle" });

  // Duplicate: default "a@example.com" already exists
  await page.getByRole("button", { name: /INSERT/ }).click();
  await page.waitForTimeout(800);

  // Successful insert
  const input = page.locator('input[type="text"]').first();
  await input.fill("");
  await input.fill("z@example.com");
  await page.getByRole("button", { name: /INSERT/ }).click();
  await page.waitForTimeout(800);

  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});

test("Covering / Partial mode toggles", async ({ page }) => {
  for (const path of ["/rdb-index/covering", "/rdb-index/partial"]) {
    const { errors, warnings } = watchConsole(page);
    await page.goto(path, { waitUntil: "networkidle" });
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 6); i++) {
      const b = buttons.nth(i);
      if (await b.isEnabled()) await b.click().catch(() => {});
      await page.waitForTimeout(80);
    }
    expect(errors, `${path} errors`).toEqual([]);
    expect(warnings, `${path} warnings`).toEqual([]);
  }
});

test("Statistics viz: status buttons + fresh toggle", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/rdb-index/statistics", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^shipped$/ }).click();
  await page.waitForTimeout(120);
  await page.getByRole("button", { name: /^cancelled$/ }).click();
  await page.waitForTimeout(120);
  await page.getByRole("checkbox").click();
  await page.waitForTimeout(120);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});

test("FE Playground: run default sample produces expected output", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe", { waitUntil: "networkidle" });
  // Wait for the dynamic CodeMirror editor to hydrate.
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  await page.getByRole("button", { name: /^▶ 実行$/ }).click();
  // Default sample sums 1..5 = 15
  await expect(page.locator("pre").filter({ hasText: "15" })).toBeVisible({
    timeout: 5_000,
  });
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Playground: step button advances execution and highlights lines", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  const stepBtn = page.getByRole("button", { name: /^一行ずつ実行$/ });
  for (let i = 0; i < 3; i++) {
    await stepBtn.click();
    await page.waitForTimeout(80);
  }
  // A highlighted execution line should exist after stepping.
  await expect(page.locator(".cm-execLine").first()).toBeVisible();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Playground: Python transpile preview shows converted code", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  await page.getByRole("button", { name: /^Python変換$/ }).click();
  // Default sample transpiled to Python contains `range(1, n + 1, 1)`
  await expect(
    page.locator("pre").filter({ hasText: /range\(1, n \+ 1, 1\)/ }),
  ).toBeVisible({ timeout: 5_000 });
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Transpile page: side-by-side view renders Python and TypeScript", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe/transpile", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  // Both language panes should be present with expected content markers.
  await expect(page.locator("pre").filter({ hasText: /range\(1, n \+ 1, 1\)/ })).toBeVisible();
  await expect(
    page.locator("pre").filter({ hasText: /for \(let i = 1; i <= n; i \+= 1\)/ }),
  ).toBeVisible();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

/**
 * 選択肢は押した時点で即採点される。ただしハイドレーション前のクリックは
 * React の state に届かないので、判定 (role=status) が出るまで押し直す。
 */
async function answerQuiz(page: Page, choiceText: string) {
  const verdict = page.getByRole("status");
  await expect(async () => {
    await page.getByRole("button", { name: choiceText }).click();
    await expect(verdict).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

/** 解答系のテストは JS が要るので、バンドル取得まで待ってから触る */
async function gotoQuiz(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

test("FE Quiz: correct answer reveals the explanation", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await gotoQuiz(page, "/fe/quiz/array-one-based");

  // 解答前は解説が見えていないこと (DOM には存在する = SEO 用)
  const explanation = page.getByRole("heading", { name: "解説" });
  await expect(explanation).toBeHidden();
  await expect(page.getByRole("status")).toHaveCount(0);

  // 正解 (イ) を押すとその場で採点される
  await answerQuiz(page, "イ 40\n60");

  await expect(page.getByRole("status")).toHaveText("正解");
  await expect(explanation).toBeVisible();
  await expect(
    page.getByRole("link", { name: /実行シミュレーターで開く/ }),
  ).toBeVisible();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Quiz: wrong answer shows the correct choice and can be retried", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await gotoQuiz(page, "/fe/quiz/for-loop-step");

  // 誤答 (ア = 6) を押す。正解は ウ = 12
  await answerQuiz(page, "ア 6");
  await expect(page.getByRole("status")).toHaveText("不正解 — 正解は ウ");
  await expect(page.getByRole("heading", { name: "解説" })).toBeVisible();

  await page.getByRole("button", { name: "もう一度考える" }).click();
  await expect(page.getByRole("heading", { name: "解説" })).toBeHidden();
  await expect(page.getByRole("status")).toHaveCount(0);
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Quiz: progress is remembered on the index page", async ({ page }) => {
  await gotoQuiz(page, "/fe/quiz/assign-swap");
  await answerQuiz(page, "イ 8\n8");
  await expect(page.getByRole("status")).toHaveText("正解");

  await gotoQuiz(page, "/fe/quiz");
  await expect(page.getByRole("status")).toContainText("1 問正解");
  await expect(
    page.getByRole("link", { name: /変数の入れ替え/ }).getByText("正解"),
  ).toBeVisible();
});

test("FE Quiz: deep link opens the code in the simulator and can come back", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await gotoQuiz(page, "/fe/quiz/array-one-based");
  await answerQuiz(page, "イ 40\n60");

  const deepLink = page.getByRole("link", { name: /実行シミュレーターで開く/ });
  // 同一内容の query 違いをクロールさせない
  await expect(deepLink).toHaveAttribute("rel", "nofollow");
  await deepLink.click();

  await page.waitForURL(/\/fe\?code=/);
  // 問題のコードがエディタに入っていること
  await expect(page.locator(".cm-content")).toContainText("整数型の配列: 得点");
  // 戻り導線が出ていること
  const back = page.getByRole("link", { name: "← 元のページに戻る" });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/\/fe\/quiz\/array-one-based$/);

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Quiz: 一覧が基礎 / 本番相当の 2 層に分かれている", async ({ page }) => {
  await page.goto("/fe/quiz", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /基礎 — 構文が読めれば解ける/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /本番相当 — 科目 B と同じ土俵/ }),
  ).toBeVisible();
  // 母数が読み取れること
  await expect(page.getByText("第 1 問 / 全 20 問").first()).toBeVisible();
});

// 2026-08-07: quiz 20 問のうち 19 問が Google に未インデックスだった。原因は
// レッスンから各構文の「先頭 1 問」にしかリンクしておらず、20 問中 6 問しか
// 内部リンクを受けていなかったこと。全問に導線が通っている状態を固定する。
test("FE: 練習問題 20 問すべてが構文別レッスンから内部リンクされている", async ({
  page,
}) => {
  await page.goto("/fe/quiz", { waitUntil: "domcontentloaded" });
  const allSlugs = await page
    .locator('a[href^="/fe/quiz/"]')
    .evaluateAll((as) =>
      [...new Set(as.map((a) => a.getAttribute("href")!))].sort(),
    );
  expect(allSlugs.length).toBe(20);

  const linked = new Set<string>();
  for (const lesson of ["variable", "if", "while", "for", "array", "function"]) {
    await page.goto(`/fe/lessons/${lesson}`, { waitUntil: "domcontentloaded" });
    const hrefs = await page
      .locator('a[href^="/fe/quiz/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    // 各レッスンは自分の構文の問題を 1 問以上持つ
    expect(hrefs.length, `${lesson} に練習問題リンクが無い`).toBeGreaterThan(0);
    hrefs.forEach((h) => linked.add(h));
  }

  const missing = allSlugs.filter((s) => !linked.has(s));
  expect(missing, `レッスンから未リンクの問題:\n${missing.join("\n")}`).toEqual(
    [],
  );
});

test("FE: FAQ が JSON-LD だけでなくページ上にも出ている", async ({ page }) => {
  for (const path of ["/fe", "/fe/lessons/array"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const faq = page.locator('[data-speakable="faq"]');
    await expect(faq, `${path} に可視 FAQ が無い`).toHaveCount(1);
    await expect(faq).toBeVisible();
  }
});

test("FE: 1024px 未満のトップからでも FE に到達できる", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // hidden な aside の中ではなく、実際に見えているリンクだけを数える
  const visible = page.locator('a[href^="/fe"]:visible');
  expect(await visible.count()).toBeGreaterThan(0);
});

test("FE pages show FE affiliate books with the required disclosure", async ({
  page,
}) => {
  for (const path of ["/fe", "/fe/transpile", "/fe/lessons/array"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const links = page.locator('a[href*="amazon.co.jp"]');
    const count = await links.count();
    expect(count, `${path} should link to at least one book`).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      // Amazon アソシエイト ID が落ちていないこと (AGENTS.md ガードレール)
      expect(href, path).toContain("tag=taitech-22");
    }
    // 景表法 / Amazon 運営規約で必須の明示
    await expect(
      page.getByText("本セクションはAmazonアソシエイトのリンクを含みます。"),
    ).toBeVisible();
    // RDB 向けの書籍が FE ページに混ざっていないこと
    await expect(page.getByText("達人に学ぶDB設計徹底指南書")).toHaveCount(0);
  }
});

// ---------------------------------------------------------------------------
// /joho1 — 共通テスト「情報I」プログラム表記 実行シミュレーター
// 設計は docs/wip/20260807-joho1/
// ---------------------------------------------------------------------------

test("Joho1: 最後まで実行すると表示結果が出る", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  await page.getByRole("button", { name: /^最後まで実行$/ }).click();
  // 既定のコードは 2〜6 人目の待ち時間を表示する
  await expect(page.getByText("2人目の待ち時間：0分間")).toBeVisible({
    timeout: 5_000,
  });
  await expect(page.getByText("6人目の待ち時間：4分間")).toBeVisible();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1: 1 行ずつ実行で行がハイライトされ変数が出る", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  const stepBtn = page.getByRole("button", { name: /^1 行ずつ実行$/ });
  for (let i = 0; i < 3; i++) {
    await stepBtn.click();
    await page.waitForTimeout(80);
  }
  await expect(page.locator(".cm-execLine").first()).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "kyakusu" })).toBeVisible();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1: 試験と同じ行番号とブロック罫線が出る", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  // 行番号は (01) 形式
  await expect(page.locator(".cm-gutterElement").filter({ hasText: "(01)" })).toBeVisible();
  // 繰り返しの中の行に縦罫線が出る
  await expect(page.locator(".cm-blockGuide").first()).toBeVisible();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1: 添字の基点を切り替えられる", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  const zeroBtn = page.getByRole("button", { name: "0 から" });
  await zeroBtn.click();
  await expect(zeroBtn).toHaveAttribute("aria-pressed", "true");
  // 既定のコードは 1 始まり前提なので、0 始まりでは範囲外エラーになる
  await page.getByRole("button", { name: /^最後まで実行$/ }).click();
  await expect(
    page.locator('[role="alert"]').filter({ hasText: "行目" }),
  ).toBeVisible({ timeout: 5_000 });
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1: レッスン 6 本と用語ページがコンソールエラーなしで開ける", async ({
  page,
}) => {
  const paths = [
    "/joho1/lessons",
    "/joho1/dncl",
    "/joho1/lessons/variable",
    "/joho1/lessons/if",
    "/joho1/lessons/loop",
    "/joho1/lessons/loop-while",
    "/joho1/lessons/array",
    "/joho1/lessons/function",
  ];
  for (const path of paths) {
    const { errors, warnings } = watchConsole(page);
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    expect(errors, `${path} Console errors:\n${errors.join("\n")}`).toEqual([]);
    expect(warnings, `${path} Console warnings:\n${warnings.join("\n")}`).toEqual([]);
  }
});

test("Joho1: レッスンから埋め込みシミュレーターが動く", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1/lessons/loop", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  await page.getByRole("button", { name: /^最後まで実行$/ }).click();
  await expect(page.getByText("合計は15")).toBeVisible({ timeout: 5_000 });
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1: 配列レッスンは 0 始まりが選ばれている", async ({ page }) => {
  // 「情報Iの配列は 1 始まり」と思い込ませないための回帰テスト
  await page.goto("/joho1/lessons/array", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  await expect(page.getByRole("button", { name: "0 から" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Joho1: セクションのナビが情報I の項目を出す (data-modeling に落ちない)", async ({
  page,
}) => {
  await page.goto("/joho1/lessons", { waitUntil: "networkidle" });
  // TopicNav はドロワー内で常時 SSR され、閉状態では hidden。
  // crawler が辿れることが目的なので、可視性ではなく DOM 上の存在を見る
  // (AGENTS.md / roadmap 2026-07-26 の TopicNavDrawer の判断)
  const nav = page.locator('nav[aria-label="トピック一覧"]').first();
  await expect(nav.locator('a[href="/joho1"]')).toHaveCount(1);
  await expect(nav.locator('a[href="/joho1/lessons/array"]')).toHaveCount(1);
  await expect(nav.locator('a[href="/joho1/dncl"]')).toHaveCount(1);
  // else フォールバックに落ちると data-modeling の正規化トピックが並ぶ
  await expect(nav.locator('a[href^="/data-modeling/normalization/"]')).toHaveCount(0);
});

test("トップ: 2 グループ構成で全セクションに到達できる", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });

  // 見出しに数を焼き付けない (セクションが増えるたびに文言追随が要るため)
  await expect(page.getByRole("heading", { name: "データベースを理解する" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "試験の擬似言語を動かす" })).toBeVisible();
  await expect(page.getByText("4本の柱")).toHaveCount(0);

  // 5 セクションすべてへの導線が本文にある
  const main = page.locator("main, body").first();
  for (const href of [
    "/why-need-rdb",
    "/rdb-index",
    "/data-modeling",
    "/fe",
    "/joho1",
  ]) {
    await expect(
      main.locator(`a[href="${href}"]`).first(),
      `${href} への導線が無い`,
    ).toBeVisible();
  }

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1: JSON-LD と OG 画像が出ている", async ({ page }) => {
  for (const path of ["/joho1", "/joho1/dncl", "/joho1/lessons/array"]) {
    const res = await page.goto(path, { waitUntil: "networkidle" });
    expect(res?.status(), path).toBe(200);

    // JSON-LD が壊れていないこと (LearningResource / BreadcrumbList)
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll(
      (nodes) =>
        nodes.flatMap((n) => {
          const parsed = JSON.parse(n.textContent ?? "{}");
          return Array.isArray(parsed) ? parsed.map((p) => p["@type"]) : [parsed["@type"]];
        }),
    );
    expect(types, `${path} の JSON-LD`).toContain("LearningResource");
    expect(types, `${path} の JSON-LD`).toContain("BreadcrumbList");

    // og:image が実在すること (404 を配信しないための回帰テスト)
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");
    expect(ogImage, `${path} に og:image が無い`).toBeTruthy();
    const imgPath = new URL(ogImage as string).pathname;
    const imgRes = await page.request.get(imgPath);
    expect(imgRes.status(), `${imgPath} が 200 でない`).toBe(200);
  }
});
