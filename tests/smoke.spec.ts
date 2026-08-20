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
  "/why-need-rdb/isolation-levels",
  "/why-need-rdb/uniqueness",
  "/why-need-rdb/referential-integrity",
  "/why-need-rdb/durability",
  "/why-need-rdb/recap",
  "/fe",
  "/fe/algorithm",
  "/fe/sql",
  "/fe/sql/lessons",
  "/fe/sql/lessons/select",
  "/fe/sql/lessons/group-by",
  "/fe/sql/lessons/grant",
  "/fe/sql/quiz",
  "/fe/sql/quiz/avg-with-null",
  "/fe/sql/quiz/outer-join-count-column",
  "/fe/algorithm/transpile",
  "/fe/algorithm/lessons",
  "/fe/algorithm/lessons/variable",
  "/fe/algorithm/lessons/if",
  "/fe/algorithm/lessons/while",
  "/fe/algorithm/lessons/for",
  "/fe/algorithm/lessons/array",
  "/fe/algorithm/lessons/function",
  "/fe/algorithm/quiz",
  "/fe/algorithm/quiz/assign-swap",
  "/fe/algorithm/quiz/operator-precedence",
  "/fe/algorithm/quiz/elseif-first-match",
  "/fe/algorithm/quiz/boundary-operator",
  "/fe/algorithm/quiz/while-loop-count",
  "/fe/algorithm/quiz/while-exact-repeat",
  "/fe/algorithm/quiz/for-loop-step",
  "/fe/algorithm/quiz/array-one-based",
  "/fe/algorithm/quiz/array-reverse-scan",
  "/fe/algorithm/quiz/function-return-flow",
  "/fe/algorithm/quiz/linked-list-traverse",
  "/fe/algorithm/quiz/insertion-sort-inner",
  "/fe/algorithm/quiz/stack-push-pop",
  "/fe/algorithm/quiz/queue-ring-buffer",
  "/fe/algorithm/quiz/selection-sort-swaps",
  "/fe/algorithm/quiz/merge-two-sorted",
  "/fe/algorithm/quiz/while-search-not-found",
  "/fe/algorithm/quiz/fib-recursion",
  "/fe/algorithm/quiz/leap-year",
  "/fe/algorithm/quiz/indirect-index",
  "/books",
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

/*
 * このページの主張そのもの (「同じ操作列のまま分離レベルだけ変えると T1 の見え方が変わる」)
 * を検証する。判定は文言ではなく、異常が起きた / 起きない のどちらのブロックが出るかで見る。
 */
test("Isolation viz: 同じ操作列で分離レベルを変えると結果が変わる", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/why-need-rdb/isolation-levels", {
    waitUntil: "networkidle",
  });

  const stepBtn = page.getByRole("button", { name: "次のステップ" });
  const advanceToEnd = async () => {
    for (let i = 0; i < 8; i++) {
      if (await stepBtn.isDisabled()) break;
      await stepBtn.click();
      await page.waitForTimeout(60);
    }
  };

  // 既定は ダーティリード × READ UNCOMMITTED → 異常が起きる
  await advanceToEnd();
  await expect(page.getByText("ダーティリード (dirty read) が起きた")).toBeVisible();

  // 分離レベルだけ上げると、同じ操作列でも異常が消える
  await page.getByRole("button", { name: "READ COMMITTED" }).click();
  await advanceToEnd();
  await expect(
    page.getByText("ダーティリード (dirty read) は起きない"),
  ).toBeVisible();

  // ファントムリードは REPEATABLE READ でも (SQL 標準では) 起きる
  await page.getByRole("button", { name: "ファントムリード" }).click();
  await page.getByRole("button", { name: "REPEATABLE READ" }).click();
  await advanceToEnd();
  await expect(
    page.getByText("ファントムリード (phantom read) が起きた"),
  ).toBeVisible();

  await page.getByRole("button", { name: "SERIALIZABLE" }).click();
  await advanceToEnd();
  await expect(
    page.getByText("ファントムリード (phantom read) は起きない"),
  ).toBeVisible();

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
  await page.goto("/fe/algorithm", { waitUntil: "networkidle" });
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
  await page.goto("/fe/algorithm", { waitUntil: "networkidle" });
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
  await page.goto("/fe/algorithm", { waitUntil: "networkidle" });
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
  await page.goto("/fe/algorithm/transpile", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  // Both language panes should be present with expected content markers.
  await expect(page.locator("pre").filter({ hasText: /range\(1, n \+ 1, 1\)/ })).toBeVisible();
  await expect(
    page.locator("pre").filter({ hasText: /for \(let i = 1; i <= n; i \+= 1\)/ }),
  ).toBeVisible();
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

/* ---------------- SQL 実行シミュレーター (/fe/sql) ---------------- */

/** エディタの中身を丸ごと置き換える */
async function typeSql(page: Page, sql: string) {
  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  // CodeMirror の自動インデントに邪魔されないよう delay を入れずに流し込む
  await editor.pressSequentially(sql, { delay: 0 });
}

/**
 * 引っ越しの 308 を守る回帰テスト。
 *
 * `next.config.ts` の 6 ルールは削除トリガーが来るまで (最長 2027-02-15) 残す前提。
 * その間に誰かが `/fe/algorithm` 配下をいじってリダイレクトを壊しても、
 * このテストが無いと気づけない。公開済みの X 投稿が旧 URL を直リンクしている。
 */
test("FE: 旧 URL が 308 で新 URL に着地する", async ({ request }) => {
  const cases: [string, string][] = [
    ["/fe/lessons", "/fe/algorithm/lessons"],
    ["/fe/lessons/variable", "/fe/algorithm/lessons/variable"],
    ["/fe/quiz", "/fe/algorithm/quiz"],
    ["/fe/quiz/assign-swap", "/fe/algorithm/quiz/assign-swap"],
    ["/fe/transpile", "/fe/algorithm/transpile"],
  ];

  for (const [oldPath, newPath] of cases) {
    const res = await request.get(oldPath, { maxRedirects: 0 });
    expect(res.status(), `${oldPath} の status`).toBe(308);
    expect(res.headers()["location"], `${oldPath} の Location`).toContain(newPath);
  }

  // `/fe` 自体はハブなのでリダイレクトしない
  const hub = await request.get("/fe", { maxRedirects: 0 });
  expect(hub.status()).toBe(200);

  // ただし Playground の deep link だけはツール側へ流す
  const deepLink = await request.get("/fe?code=abc", { maxRedirects: 0 });
  expect(deepLink.status()).toBe(308);
  expect(deepLink.headers()["location"]).toContain("/fe/algorithm");
});

test("FE SQL: 実行すると結果の表が出る", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe/sql", { waitUntil: "networkidle" });
  await typeSql(page, "SELECT 商品番号 FROM 商品 WHERE 分類 = 'B'");
  await page.getByRole("button", { name: /^▶ 実行$/ }).click();

  const result = page.getByRole("region", { name: "実行結果" });
  await expect(result.getByRole("cell", { name: "P03" })).toBeVisible();
  await expect(result.getByRole("cell", { name: "P04" })).toBeVisible();
  await expect(result).toContainText("2 行");

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE SQL: 一つ進めるで評価順に進み、SELECT が最後に来る", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe/sql", { waitUntil: "networkidle" });
  await typeSql(
    page,
    "SELECT 分類, COUNT(*) FROM 商品 WHERE 単価 >= 100 GROUP BY 分類",
  );
  const forward = page.getByRole("button", { name: /^一つ進める →$/ });
  await forward.click();

  const stages = page.getByRole("list", { name: "評価の段階" }).locator("li");
  await expect(stages).toHaveCount(4);
  await expect(stages.nth(0)).toHaveText("FROM");
  await expect(stages.nth(1)).toHaveText("WHERE");
  await expect(stages.nth(2)).toHaveText("GROUP BY");
  // SELECT は最後
  await expect(stages.nth(3)).toHaveText("SELECT");

  // 最初は FROM の段階
  await expect(page.getByText(/FROM: 商品 を読み込み/)).toBeVisible();
  // 送りはツールバーに集約されている (ステッパー内には置かない)
  await forward.click();
  await expect(page.getByText("WHERE: 5 行 → 4 行")).toBeVisible();

  await forward.click();
  await expect(page.getByText(/GROUP BY: 4 行 → 3 グループ/)).toBeVisible();

  // チップから直接飛べる
  await stages.nth(3).click();
  await expect(page.getByText(/SELECT: 2 列を取り出し/)).toBeVisible();

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE SQL: GROUP BY に無い列は標準 SQL どおりエラーになる", async ({ page }) => {
  await page.goto("/fe/sql", { waitUntil: "networkidle" });
  await typeSql(page, "SELECT 商品名, COUNT(*) FROM 商品 GROUP BY 分類");
  await page.getByRole("button", { name: /^▶ 実行$/ }).click();

  // getByRole("alert") は next-route-announcer にも当たるので中身で絞る
  const alert = page.getByRole("alert").filter({ hasText: "GROUP BY" });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("集約関数で包");
});

test("FE SQL: GRANT は「間違い」ではなく解説への誘導になる", async ({ page }) => {
  await page.goto("/fe/sql", { waitUntil: "networkidle" });
  await typeSql(page, "GRANT SELECT ON 商品 TO PUBLIC");
  await page.getByRole("button", { name: /^▶ 実行$/ }).click();

  const alert = page.getByRole("alert").filter({ hasText: "GRANT" });
  await expect(alert).toContainText("試験範囲");
  await expect(
    alert.getByRole("link", { name: /この構文の解説を読む/ }),
  ).toBeVisible();
});

test("FE SQL: UPDATE は実行前後の差分で表示され、リセットで戻る", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe/sql", { waitUntil: "networkidle" });
  await typeSql(page, "UPDATE 商品 SET 単価 = 単価 * 2 WHERE 分類 = 'B'");
  await page.getByRole("button", { name: /^▶ 実行$/ }).click();

  await expect(page.getByText("UPDATE: 2 行が対象")).toBeVisible();
  // 変更前 → 変更後 が併記される (80 → 160)
  const diff = page.locator("table").filter({ hasText: "更新" }).first();
  await expect(diff).toContainText("160");
  await expect(diff).toContainText("80");

  await page.getByRole("button", { name: /リセット/ }).click();
  await expect(page.getByText("UPDATE: 2 行が対象")).toHaveCount(0);

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE SQL: 使う表を切り替えると SQL も既定値に入れ替わる", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/fe/sql", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });

  await page.getByRole("button", { name: "従業員・部門" }).click();
  await expect(page.locator(".cm-content")).toContainText("従業員");

  await page.getByRole("button", { name: /^▶ 実行$/ }).click();
  await expect(
    page.getByRole("region", { name: "実行結果" }),
  ).toContainText("D01");

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE SQL Quiz: 問題で使う表の中身が出ている", async ({ page }) => {
  await page.goto("/fe/sql/quiz/select-projection", {
    waitUntil: "domcontentloaded",
  });

  // 表の中身が見えないと解答できない。「使用する表: 商品・在庫」だけでは足りない
  const source = page.getByRole("region", { name: "問題で使う表" });
  await expect(source).toBeVisible();
  await expect(source.getByText("商品", { exact: true })).toBeVisible();
  await expect(source.getByRole("cell", { name: "ボールペン" })).toBeVisible();
  await expect(source.getByRole("cell", { name: "ホチキス" })).toBeVisible();

  // その SQL が参照していない表は出さない (この問題は 商品 表だけを使う)
  await expect(source.getByText("在庫", { exact: true })).toHaveCount(0);

  // 2 表を結合する問題では両方出る
  await page.goto("/fe/sql/quiz/join-matching-rows", {
    waitUntil: "domcontentloaded",
  });
  const joined = page.getByRole("region", { name: "問題で使う表" });
  await expect(joined.getByText("商品", { exact: true })).toBeVisible();
  await expect(joined.getByText("在庫", { exact: true })).toBeVisible();
});

test("FE SQL Quiz: 結果表の選択肢が表として描かれる", async ({ page }) => {
  await page.goto("/fe/sql/quiz/select-projection", {
    waitUntil: "domcontentloaded",
  });

  // 選択肢 4 つがそれぞれ表になっている (`|` を並べた素のテキストではない)
  const choiceTables = page.locator("li button table");
  await expect(choiceTables).toHaveCount(4);

  // 見出しと値がセルとして分かれている
  const first = choiceTables.first();
  await expect(first.getByRole("columnheader", { name: "商品番号" })).toBeVisible();
  await expect(first.getByRole("columnheader", { name: "単価" })).toBeVisible();
  await expect(first.getByRole("cell", { name: "P03" })).toBeVisible();

  // 行数だけを問う設問は表にしない
  await page.goto("/fe/sql/quiz/join-matching-rows", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("li button table")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^イ 3 行$/ })).toBeVisible();
});

test("FE SQL Quiz: 解答すると採点され、シミュレーターへ渡って戻れる", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await gotoQuiz(page, "/fe/sql/quiz/avg-with-null");

  // 正解は イ (COUNT は 2、AVG は NULL を分母から除くので 300000)
  await answerQuiz(page, /^イ/);
  await expect(page.getByRole("status")).toHaveText("正解");
  await expect(page.getByText(/NULL の行を集計対象から外します/)).toBeVisible();

  await page.getByRole("link", { name: /実行シミュレーターで開く/ }).click();
  await page.waitForURL(/\/fe\/sql\?sql=/);
  await page.waitForSelector(".cm-content", { timeout: 10_000 });

  // deep link は SQL と一緒に表も切り替える (従業員表を使う問題)
  await expect(page.locator(".cm-content")).toContainText("従業員");

  const back = page.getByRole("link", { name: /元のページに戻る/ });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/\/fe\/sql\/quiz\/avg-with-null$/);

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE SQL: レッスンから練習問題へ、練習問題からレッスンへ辿れる", async ({
  page,
}) => {
  await page.goto("/fe/sql/lessons/aggregate", { waitUntil: "domcontentloaded" });
  const toQuiz = page.locator('a[href^="/fe/sql/quiz/"]').first();
  await expect(toQuiz).toBeVisible();
  const quizHref = await toQuiz.getAttribute("href");
  await toQuiz.click();
  // 遷移を待たずに次を探すと、前のページの DOM を見て落ちることがある
  await page.waitForURL(new RegExp(`${quizHref}$`));

  /*
   * `:visible` で絞る。解答前の QuizCard 内にも「レッスンを読む」リンクがあるが、
   * あれは解説ごと hidden にしてある (クローラには読ませ、人間には解答後に見せる)。
   * 素の `.first()` だとその hidden なリンクを掴んでしまう。
   */
  const toLesson = page.locator('a[href^="/fe/sql/lessons/"]:visible').first();
  await expect(toLesson).toBeVisible();
});

test("FE SQL: 練習問題がすべてレッスンから内部リンクされている", async ({
  page,
}) => {
  const lessons = ["select", "where", "join", "aggregate", "group-by", "subquery", "set-ops", "dml"];
  const linked = new Set<string>();
  for (const lesson of lessons) {
    await page.goto(`/fe/sql/lessons/${lesson}`, {
      waitUntil: "domcontentloaded",
    });
    for (const href of await page
      .locator('a[href^="/fe/sql/quiz/"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""))) {
      linked.add(href);
    }
  }
  // 14 問すべてがどこかのレッスンから張られていること
  expect(linked.size).toBe(14);
});

/**
 * 選択肢は押した時点で即採点される。ただしハイドレーション前のクリックは
 * React の state に届かないので、判定 (role=status) が出るまで押し直す。
 */
async function answerQuiz(page: Page, choiceText: string | RegExp) {
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
  await gotoQuiz(page, "/fe/algorithm/quiz/array-one-based");

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
  await gotoQuiz(page, "/fe/algorithm/quiz/for-loop-step");

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
  await gotoQuiz(page, "/fe/algorithm/quiz/assign-swap");
  await answerQuiz(page, "イ 8\n8");
  await expect(page.getByRole("status")).toHaveText("正解");

  await gotoQuiz(page, "/fe/algorithm/quiz");
  await expect(page.getByRole("status")).toContainText("1 問正解");
  await expect(
    page.getByRole("link", { name: /変数の入れ替え/ }).getByText("正解"),
  ).toBeVisible();
});

test("FE Quiz: deep link opens the code in the simulator and can come back", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await gotoQuiz(page, "/fe/algorithm/quiz/array-one-based");
  await answerQuiz(page, "イ 40\n60");

  const deepLink = page.getByRole("link", { name: /実行シミュレーターで開く/ });
  // 同一内容の query 違いをクロールさせない
  await expect(deepLink).toHaveAttribute("rel", "nofollow");
  await deepLink.click();

  await page.waitForURL(/\/fe\/algorithm\?code=/);
  // 問題のコードがエディタに入っていること
  await expect(page.locator(".cm-content")).toContainText("整数型の配列: 得点");
  // 戻り導線が出ていること
  const back = page.getByRole("link", { name: "← 元のページに戻る" });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/\/fe\/algorithm\/quiz\/array-one-based$/);

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("FE Quiz: 一覧が基礎 / 本番相当の 2 層に分かれている", async ({ page }) => {
  await page.goto("/fe/algorithm/quiz", { waitUntil: "domcontentloaded" });
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
  await page.goto("/fe/algorithm/quiz", { waitUntil: "domcontentloaded" });
  const allSlugs = await page
    .locator('a[href^="/fe/algorithm/quiz/"]')
    .evaluateAll((as) =>
      [...new Set(as.map((a) => a.getAttribute("href")!))].sort(),
    );
  expect(allSlugs.length).toBe(20);

  const linked = new Set<string>();
  for (const lesson of ["variable", "if", "while", "for", "array", "function"]) {
    await page.goto(`/fe/algorithm/lessons/${lesson}`, { waitUntil: "domcontentloaded" });
    const hrefs = await page
      .locator('a[href^="/fe/algorithm/quiz/"]')
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
  for (const path of ["/fe", "/fe/algorithm", "/fe/algorithm/lessons/array"]) {
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
  for (const path of ["/fe", "/fe/algorithm", "/fe/algorithm/transpile", "/fe/algorithm/lessons/array"]) {
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

test("/books の共有カードがページ固有の内容になっている", async ({ page }) => {
  // チャットや SNS で URL を直接渡す前提のページ。カードが崩れると効き目が大きい
  await page.goto("/books", { waitUntil: "domcontentloaded" });

  const meta = async (sel: string) =>
    await page.locator(sel).first().getAttribute("content");

  // og:image が実在すること。ページで openGraph を宣言すると (hub) から
  // 継いでいた画像が外れるので、専用の opengraph-image.tsx が要る
  const ogImage = await meta('meta[property="og:image"]');
  expect(ogImage, "/books に og:image が無い").toBeTruthy();
  const imgRes = await page.request.get(new URL(ogImage as string).pathname);
  expect(imgRes.status()).toBe(200);

  // root layout のサイト共通値のままになっていないこと
  expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  for (const sel of [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ]) {
    expect(await meta(sel), sel).toContain("おすすめ参考書");
  }
  for (const sel of [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
  ]) {
    expect(await meta(sel), sel).toContain("参考書");
  }
});

test("/books への導線がヘッダーとトップページから辿れる", async ({ page }) => {
  const header = page.locator("header");

  // md 以上ではヘッダーに出る。全ページ共通の恒常導線なのでセクションページで見る
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/joho1", { waitUntil: "domcontentloaded" });
  await expect(header.getByRole("link", { name: "おすすめ参考書" })).toBeVisible();

  // 768px でも、セクション名が読める幅を保ったまま 3 つ並ぶこと。
  // ここが潰れるなら Header の breakpoint (md) を上げる
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(header.getByRole("link", { name: "おすすめ参考書" })).toBeVisible();
  const label = header.getByRole("link", { name: sectionShortLabelJoho1 });
  const box = await label.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(60);

  // sm 未満では隠す (無料相談ボタンだけ残る)
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(header.getByRole("link", { name: "おすすめ参考書" })).toBeHidden();

  // トップページからも分野別に直接入れる
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Python", exact: true }).click();
  // playwright.config.ts は reuseExistingServer なので、`npm run dev` を上げたまま
  // 流すと dev のオンデマンドコンパイルを踏む。既定の 5s では並列実行時に落ちる
  await expect(page).toHaveURL(/\/books#python$/, { timeout: 15_000 });
});

const sectionShortLabelJoho1 = "情報I プログラム表記";

test("/books: 4 分野すべてが並び、アンカーで直接開ける", async ({ page }) => {
  await page.goto("/books", { waitUntil: "domcontentloaded" });

  for (const [anchor, heading] of [
    ["itpassport", "ITパスポート試験"],
    ["fe", "基本情報技術者試験"],
    ["sql", "SQL・データベース"],
    ["python", "Python"],
  ] as const) {
    // 見出しがあること (棚を足したら列挙に追加する)
    await expect(
      page.getByRole("heading", { level: 2, name: heading, exact: true }),
    ).toBeVisible();
    // チャット等で `/books#python` を直接送れるように、id が生きていること
    await expect(page.locator(`#${anchor}`)).toHaveCount(1);
  }

  // 1 分野 2 冊。冊数を絞る代わりに 1 冊あたりを厚くする設計 (book-shelves.ts)
  await expect(page.locator("section[id] article")).toHaveCount(8);

  // 各冊が 4 項目の詳細を持つ (8 冊 × 4)
  for (const label of ["こんな人向け", "中身", "使い方", "注意"]) {
    await expect(page.getByRole("term").filter({ hasText: label })).toHaveCount(8);
  }

  const links = page.locator('a[href*="amazon.co.jp"]');
  const count = await links.count();
  expect(count).toBe(16); // 8 冊 × (書名 + ボタン)
  for (let i = 0; i < count; i++) {
    // Amazon アソシエイト ID が落ちていないこと (AGENTS.md ガードレール)
    expect(await links.nth(i).getAttribute("href")).toContain("tag=taitech-22");
  }

  // 景表法 / Amazon 運営規約で必須の明示。ページ全体が対象なので冒頭に 1 度
  await expect(
    page.getByText("本ページはAmazonアソシエイトのリンクを含みます。"),
  ).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "試験問題を動かして解く" })).toBeVisible();
  await expect(page.getByText("4本の柱")).toHaveCount(0);

  /*
   * FE カードは入口を 2 つ持つ。科目 B と科目 A は読者の目的が別なので、
   * 「このシリーズを見る」1 本でハブに送らない。
   */
  await expect(page.getByRole("link", { name: "科目B 擬似言語 →" })).toBeVisible();
  await expect(page.getByRole("link", { name: "科目A SQL →" })).toBeVisible();

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

test("Joho1: 問題冊子から貼り付けると行番号と罫線が外れて実行できる", async ({
  page,
}) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });

  // 紙面のとおり (行番号 + 罫線) にクリップボード経由で貼る
  const pasted = [
    "(01)  goukei = 0",
    "(02)  i を 1 から 5 まで 1 ずつ増やしながら繰り返す：",
    "(03) └  goukei = goukei + i",
    "(04)  表示する(goukei)",
  ].join("\n");

  await page.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.evaluate((text) => {
    const el = document.querySelector(".cm-content") as HTMLElement;
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    el.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  }, pasted);

  // 整形したことがユーザーに伝わる
  await expect(page.getByText("行番号とブロックの罫線を取り除きました")).toBeVisible();

  await page.getByRole("button", { name: /^最後まで実行$/ }).click();
  await expect(
    page.locator('section[aria-label="表示"]').getByText("15"),
  ).toBeVisible({ timeout: 5_000 });
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("モバイルで body が横スクロールしない", async ({ page }) => {
  // 表や引用カードは CJK の keep-all で min-content が文字列全長になり、
  // min-w-0 / overflow-x が無いと body ごと横に溢れる (AGENTS.md)
  await page.setViewportSize({ width: 390, height: 844 });
  // セクションごとに代表を 1〜2 ページずつ。ここを joho1 だけにしていたため、
  // FAQ (flex item) と AffiliateBooks (暗黙グリッド) の溢れが本番で見逃されていた
  for (const path of [
    "/",
    "/fe",
    "/fe/algorithm/lessons/array",
    "/fe/algorithm/quiz",
    "/joho1",
    "/joho1/dncl",
    "/joho1/lessons/array",
    "/joho1/quiz",
    "/joho1/quiz/array-tally-fill",
    "/joho1/transpile",
    "/rdb-index",
    "/why-need-rdb",
    // 表 2 枚 + T1/T2 レーン + 4×3 マトリクスで、溢れる要素が 1 ページに 3 種類ある
    "/why-need-rdb/isolation-levels",
    "/data-modeling/er-diagram",
    // 長い書名のカードが 20 枚並ぶ。溢れるならここが最初に出る
    "/books",
  ]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      overflow.scrollWidth,
      `${path} が横スクロールする (${overflow.scrollWidth} > ${overflow.clientWidth})`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);
  }
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

// ---------------------------------------------------------------------------
// /joho1/quiz — 練習問題 (Phase 2)
// ---------------------------------------------------------------------------

test("Joho1 quiz: 一覧と各問がコンソールエラーなしで開ける", async ({ page }) => {
  const paths = [
    "/joho1/quiz",
    "/joho1/quiz/display-no-separator",
    "/joho1/quiz/array-zero-based-sum",
    "/joho1/quiz/array-tally-fill",
    "/joho1/transpile",
  ];
  for (const path of paths) {
    const { errors, warnings } = watchConsole(page);
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    expect(errors, `${path} Console errors:\n${errors.join("\n")}`).toEqual([]);
    expect(warnings, `${path} Console warnings:\n${warnings.join("\n")}`).toEqual([]);
  }
});

test("Joho1 quiz: 解答すると採点され解説が開く", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1/quiz/if-boundary", { waitUntil: "networkidle" });

  // 解説は解答前は hidden だが DOM には存在する (クローラ向け)
  const explanation = page.getByRole("heading", { name: "解説" });
  await expect(explanation).toBeHidden();

  await page.getByRole("button", { name: /運賃は220円/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "正解" })).toBeVisible();
  await expect(explanation).toBeVisible();

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1 quiz: 0 始まりの問題は添字の基点つきでシミュレーターへ渡る", async ({
  page,
}) => {
  // base= を落とすと既定の 1 始まりで走り、解説と違う答えが出る
  await page.goto("/joho1/quiz/array-zero-based-sum", { waitUntil: "networkidle" });
  // 選択肢ボタンの名前は「記号 + 本文」
  await page.getByRole("button", { name: "ア 23" }).click();

  const runLink = page.getByRole("link", {
    name: /実行シミュレーターで開く/,
  });
  await expect(runLink).toHaveAttribute("href", /base=0/);
  await runLink.click();

  await page.waitForSelector(".cm-content", { timeout: 10_000 });
  await expect(page.getByRole("button", { name: "0 から" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /^最後まで実行$/ }).click();
  await expect(
    page.locator('section[aria-label="表示"]').getByText("23"),
  ).toBeVisible({ timeout: 5_000 });
});

test("Joho1 quiz: 問題文に添字の基点が書かれている", async ({ page }) => {
  // 共通テストでは毎回宣言される前提。省くと問題として成立しない
  // 解説にも同じ言い回しが出るので、コード直前の注記だけを見る
  await page.goto("/joho1/quiz/array-zero-based-sum", { waitUntil: "networkidle" });
  await expect(
    page.getByText("この問題では、配列の添字は 0 から始まるものとする。"),
  ).toBeVisible();

  await page.goto("/joho1/quiz/array-base-changes-answer", { waitUntil: "networkidle" });
  await expect(
    page.getByText("この問題では、配列の添字は 1 から始まるものとする。"),
  ).toBeVisible();
});

test("Joho1 transpile: プログラム表記を書くと Python が出る", async ({ page }) => {
  const { errors, warnings } = watchConsole(page);
  await page.goto("/joho1/transpile", { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content", { timeout: 10_000 });

  const python = page.locator('section[aria-label="Python"]');
  // 表示する は print(..., sep="") になる (素の print は空白を挟んでしまう)
  await expect(python).toContainText('sep=""');
  // 既定は 1 始まりなので添字が -1 される
  await expect(python).toContainText("i - 1");

  // 0 始まりに切り替えると -1 が消える
  await page.getByRole("button", { name: "0 から" }).click();
  await expect(python).not.toContainText("i - 1");

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
  expect(warnings, `Console warnings:\n${warnings.join("\n")}`).toEqual([]);
});

test("Joho1: レッスンから練習問題へ、練習問題からレッスンへ辿れる", async ({
  page,
}) => {
  // FE で踏んだ「レッスンから代表 1 問しかリンクせず 20 問中 19 問が未インデックス」
  // の再発防止。その構文の問題は全部並べる
  await page.goto("/joho1/lessons/array", { waitUntil: "networkidle" });
  const quizLinks = page.locator('a[href^="/joho1/quiz/"]');
  expect(await quizLinks.count()).toBeGreaterThanOrEqual(4);

  // TopicNav (ドロワー内で常時 SSR、閉状態では hidden) にも同じ href があるので
  // 本文に絞る。ここで見たいのは「読者が辿れるか」
  await page.goto("/joho1/quiz/array-zero-based-sum", { waitUntil: "networkidle" });
  await expect(
    page.locator('article a[href="/joho1/lessons/array"]').first(),
  ).toBeVisible();
});

test("Joho1: 書籍 CTA が出ていて Amazon アソシエイト ID が付いている", async ({
  page,
}) => {
  // tag を落とすと収益がゼロになる (AGENTS.md のガードレール)
  for (const path of ["/joho1", "/joho1/quiz", "/joho1/lessons/array"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const amazonLinks = page.locator('a[href*="amazon.co.jp"]');
    expect(await amazonLinks.count(), `${path} に書籍 CTA が無い`).toBeGreaterThan(0);
    for (const href of await amazonLinks.evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).href),
    )) {
      expect(href, `${path} の ${href}`).toContain("tag=taitech-22");
    }
    // 景表法 / Amazon 運営規約で必須の表示
    await expect(
      page.getByText("本セクションはAmazonアソシエイトのリンクを含みます。").first(),
    ).toBeVisible();
  }
});
