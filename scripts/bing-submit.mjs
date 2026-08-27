#!/usr/bin/env node
/**
 * Bing Webmaster API で「更新された URL」を送信する。
 *
 * ## なぜ IndexNow をやめたか
 *
 * IndexNow (`api.indexnow.org`) は **1 件も通らなかった**。キーを 3 種類
 * (自前生成 / BWT 表示値 / BWT で Generate) 試して全部 `403
 * UserForbiddedToAccessSite`。最初のキーは 1 ヶ月ホストし続けても 403 だったので
 * 伝播待ちでもない。キーファイルは 200 で中身も正しく、bingbot の UA でも到達でき、
 * robots も Firewall も問題なし。**このサイトの Bing 所有権が「Imported from GSC」
 * だけで、Bing 固有の所有権レコードが無いこと**が原因と見ている
 * (docs/wip/20260828-seo-aeo-review/03-post-deploy.md §1)。
 *
 * 一方 Webmaster API はアカウント認証なので **GSC 由来の所有権でも通る**
 * (実測: `SubmitUrlBatch` が HTTP 200、クォータが減ることも確認済み)。
 *
 * `public/BingSiteAuth.xml` と IndexNow のキーファイルは残してある。Bing が
 * BingSiteAuth.xml をクロールしてネイティブ検証が有効になれば IndexNow も
 * 通るようになるかもしれない。そうなったら Yandex / Naver / Seznam にも
 * 届くので戻す価値がある。**それまではこちらが正。**
 *
 * ## なぜ「全 URL」ではなく「更新された URL」なのか
 *
 * **Webmaster API にはクォータがある (日 100 / 月 500)。** IndexNow 時代のように
 * 毎デプロイで全 144 URL を投げると **月 3 回のデプロイで枯れる**。しかも
 * 変わっていないページを送り直す意味が無い。
 *
 * 対象は **「このデプロイで lastmod が変わった URL」**。判定は
 * **本番の sitemap（= postbuild の時点ではまだ 1 つ前のデプロイを配信している）と、
 * いまビルドした sitemap の差分**で取る。ステートを持たずに「今回変わったもの」だけが出る。
 *
 * lastmod は `content/page-dates.ts` の `updated` がそのまま出ているので、
 * 「コンテンツを実質的に変えたときだけ上げる」という運用ルールと自動的に噛み合う。
 * **通常のデプロイでは 0 件になるのが正常。**
 *
 * **単純な「直近 N 日」フィルタでは駄目**だった。同じ URL を N 日間、毎デプロイ
 * 送り直してクォータを溶かす (実装直後に `check:deploy` が
 * `quota limits this run to 0/23 URLs` を出して発覚した)。
 * 本番 sitemap が取れないときだけ、保険としてその方式にフォールバックする。
 *
 * ## 使い方
 *
 *   node scripts/bing-submit.mjs           # postbuild。今回のデプロイで lastmod が変わった URL
 *   node scripts/bing-submit.mjs --all     # 手動。全 URL (初回バックフィル用)
 *   node scripts/bing-submit.mjs --dry-run # 送信せず対象だけ出す
 *
 * `BING_WEBMASTER_API_KEY` は Vercel の Production 環境変数。
 * **認証情報なので公開ファイルに出さないこと。** 値は docs/site/operations.md。
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SITE_URL = "https://taitech.dev";
const API_BASE = "https://ssl.bing.com/webmaster/api.svc/json";
const SITEMAP_BODY_PATH = resolve(
  process.cwd(),
  ".next/server/app/sitemap.xml.body",
);

/** 本番 sitemap が取れなかったときのフォールバック窓。通常は使われない */
const FALLBACK_RECENT_DAYS = 7;

const args = new Set(process.argv.slice(2));
const SUBMIT_ALL = args.has("--all");
const DRY_RUN = args.has("--dry-run");

/** Vercel production 以外はスキップ。手動実行 (--all / --dry-run) は通す */
function shouldRun() {
  if (SUBMIT_ALL || DRY_RUN) return true;
  return process.env.VERCEL_ENV === "production";
}

/** sitemap から <loc> と <lastmod> の組を取り出す */
async function extractEntries() {
  const xml = await readFile(SITEMAP_BODY_PATH, "utf8");
  const entries = [];
  const re = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(m[1])?.[1]?.trim();
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(m[1])?.[1]?.trim();
    if (loc) entries.push({ loc, lastmod });
  }
  return entries;
}

function isRecent(lastmod) {
  if (!lastmod) return false;
  const t = Date.parse(lastmod);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= FALLBACK_RECENT_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * いま配信されている sitemap を取る。**postbuild の時点では、これは 1 つ前の
 * デプロイの内容**（新しいデプロイはまだ promote されていない）。
 * これと今回のビルド結果を比べれば「今回変わった URL」がステート無しで出る。
 */
async function fetchLiveLastmods() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) throw new Error(`live sitemap HTTP ${res.status}`);
  const xml = await res.text();
  const map = new Map();
  const re = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(m[1])?.[1]?.trim();
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(m[1])?.[1]?.trim();
    if (loc) map.set(loc, lastmod ?? "");
  }
  if (map.size === 0) throw new Error("live sitemap had no <url> entries");
  return map;
}

/** 今回のデプロイで新しくなった / 増えた URL */
async function pickChanged(entries) {
  let live;
  try {
    live = await fetchLiveLastmods();
  } catch (err) {
    console.warn(
      `[bing] 本番 sitemap を取得できなかった (${err.message}). ` +
        `直近 ${FALLBACK_RECENT_DAYS} 日フィルタにフォールバックする`,
    );
    return entries.filter((e) => isRecent(e.lastmod));
  }
  return entries.filter((e) => live.get(e.loc) !== (e.lastmod ?? ""));
}

async function getQuota(key) {
  const url = `${API_BASE}/GetUrlSubmissionQuota?apikey=${key}&siteUrl=${encodeURIComponent(SITE_URL)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GetUrlSubmissionQuota HTTP ${res.status}`);
  const json = await res.json();
  return { daily: json?.d?.DailyQuota ?? 0, monthly: json?.d?.MonthlyQuota ?? 0 };
}

async function submit(key, urlList) {
  const res = await fetch(`${API_BASE}/SubmitUrlBatch?apikey=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ siteUrl: SITE_URL, urlList }),
  });
  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body: body.slice(0, 200) };
}

async function main() {
  if (!shouldRun()) {
    console.log(
      `[bing] skip (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}, only runs on production)`,
    );
    return;
  }

  const key = process.env.BING_WEBMASTER_API_KEY;
  if (!key) {
    console.warn(
      "[bing] BING_WEBMASTER_API_KEY is not set. Skipping. Not failing the build.",
    );
    return;
  }

  let entries;
  try {
    entries = await extractEntries();
  } catch (err) {
    console.warn(`[bing] failed to read sitemap: ${err.message}. Skipping.`);
    return;
  }

  const targets = SUBMIT_ALL ? entries : await pickChanged(entries);
  if (targets.length === 0) {
    console.log(
      "[bing] no URLs changed in this deploy — nothing to submit. " +
        "(page-dates.ts の updated を上げたページだけが対象。0 件は正常)",
    );
    return;
  }

  let quota;
  try {
    quota = await getQuota(key);
  } catch (err) {
    console.warn(`[bing] ${err.message}. Not failing the build.`);
    return;
  }

  /*
   * 日次・月次のどちらか小さい方まで。**超過分は次回に自動では回らない。**
   * 差分判定は「本番 sitemap vs 今回のビルド」なので、このデプロイが promote された
   * 時点で本番側の lastmod も新しくなり、次のデプロイでは差分に出てこない。
   * 100 件を超える変更を一度に出したときは、翌日に手で流す:
   *   BING_WEBMASTER_API_KEY=... node scripts/bing-submit.mjs --all
   */
  const cap = Math.min(quota.daily, quota.monthly);
  const urlList = targets.slice(0, cap).map((e) => e.loc);
  if (urlList.length < targets.length) {
    console.warn(
      `[bing] quota limits this run to ${urlList.length}/${targets.length} URLs ` +
        `(daily=${quota.daily}, monthly=${quota.monthly}). 残りは次回。`,
    );
  }
  if (urlList.length === 0) {
    console.warn(`[bing] quota exhausted (daily=${quota.daily}, monthly=${quota.monthly}).`);
    return;
  }

  if (DRY_RUN) {
    console.log(`[bing] dry-run: would submit ${urlList.length} URLs:`);
    for (const u of urlList) console.log(`  ${u}`);
    return;
  }

  console.log(
    `[bing] submitting ${urlList.length} URLs (daily=${quota.daily}, monthly=${quota.monthly})`,
  );

  let result;
  try {
    result = await submit(key, urlList);
  } catch (err) {
    console.warn(`[bing] network error: ${err.message}. Not failing the build.`);
    return;
  }

  if (result.ok) {
    console.log(`[bing] OK (HTTP ${result.status}) — submitted ${urlList.length} URLs`);
    return;
  }
  // ここが出たら握りつぶさずに調べること。IndexNow は 8 日以上これで気付かれなかった
  console.warn(
    `[bing] FAILED HTTP ${result.status}. Body: ${result.body}. Not failing the build.`,
  );
}

// 失敗しても build を落とさない (送信は best-effort で、これで本番デプロイが止まるほうが損)
main().catch((err) => {
  console.warn(`[bing] unexpected error: ${err?.message ?? err}. Not failing the build.`);
});
