#!/usr/bin/env node
/**
 * IndexNow ping — Bing / Yandex / Naver / Seznam に対して sitemap 上の全 URL を通知する。
 * (Google は IndexNow 非対応。GSC の URL Inspection or sitemap の lastmod を使う。)
 *
 * 発火タイミング: `postbuild` フック。Vercel の production deploy 時のみ実際に送信し、
 * それ以外 (ローカル / preview) では no-op で終了する。
 *
 * 参照ドキュメント: https://www.indexnow.org/documentation
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const KEY = "21abcdd4711642b992fd80436d1daf1f";
const HOST = "taitech.dev";
const SITE_URL = `https://${HOST}`;
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
const SITEMAP_BODY_PATH = resolve(
  process.cwd(),
  ".next/server/app/sitemap.xml.body",
);

/**
 * Vercel production 以外はスキップ。preview / ローカルからは送らない。
 * (preview URL は host mismatch で 422、ローカルは意味なし)
 */
function shouldRun() {
  return process.env.VERCEL_ENV === "production";
}

async function extractUrls() {
  const xml = await readFile(SITEMAP_BODY_PATH, "utf8");
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

async function main() {
  if (!shouldRun()) {
    console.log(
      `[IndexNow] skip (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}, only runs on production)`,
    );
    return;
  }

  let urlList;
  try {
    urlList = await extractUrls();
  } catch (err) {
    console.warn(
      `[IndexNow] failed to read sitemap at ${SITEMAP_BODY_PATH}: ${err.message}. Skipping.`,
    );
    return;
  }

  if (urlList.length === 0) {
    console.warn("[IndexNow] sitemap had zero URLs — skipping POST.");
    return;
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  console.log(`[IndexNow] submitting ${urlList.length} URLs to ${INDEXNOW_ENDPOINT}`);

  let res;
  try {
    res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(`[IndexNow] network error: ${err.message}. Not failing the build.`);
    return;
  }

  if (res.ok) {
    console.log(`[IndexNow] OK (HTTP ${res.status})`);
    return;
  }

  const body = await res.text().catch(() => "");
  console.warn(
    `[IndexNow] non-OK response HTTP ${res.status}. Body: ${body.slice(0, 200)}. Not failing the build.`,
  );
}

// 失敗しても build を落とさない (best-effort)
main().catch((err) => {
  console.warn(`[IndexNow] unexpected error: ${err?.message ?? err}. Not failing the build.`);
});
