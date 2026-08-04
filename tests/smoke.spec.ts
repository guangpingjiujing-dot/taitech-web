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
 * 選択肢のクリックはハイドレーション前だと React の state に届かず、
 * 「答え合わせ」が disabled のままになる (負荷が高いと再現する)。
 * ボタンが enabled になるまでクリックを再試行してから押す。
 */
async function answerQuiz(page: Page, choiceText: string) {
  const submit = page.getByRole("button", { name: "答え合わせ" });
  await expect(async () => {
    await page.getByText(choiceText, { exact: true }).first().click();
    await expect(submit).toBeEnabled({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await submit.click();
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
  await expect(page.getByRole("button", { name: "答え合わせ" })).toBeDisabled();

  // 正解 (イ) を選んで答え合わせ
  await answerQuiz(page, "40\n60");

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

  // 誤答 (ア = 6) を選ぶ。正解は ウ = 12
  await answerQuiz(page, "6");
  await expect(page.getByRole("status")).toHaveText("不正解 — 正解は ウ");
  await expect(page.getByRole("heading", { name: "解説" })).toBeVisible();

  await page.getByRole("button", { name: "もう一度考える" }).click();
  await expect(page.getByRole("heading", { name: "解説" })).toBeHidden();
  await expect(page.getByRole("button", { name: "答え合わせ" })).toBeDisabled();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Quiz: progress is remembered on the index page", async ({ page }) => {
  await gotoQuiz(page, "/fe/quiz/assign-swap");
  await answerQuiz(page, "8\n8");
  await expect(page.getByRole("status")).toHaveText("正解");

  await gotoQuiz(page, "/fe/quiz");
  await expect(page.getByRole("status")).toContainText("1 問正解");
  await expect(
    page.getByRole("link", { name: /変数の入れ替え/ }).getByText("正解"),
  ).toBeVisible();
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
