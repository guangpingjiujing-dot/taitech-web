#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["google-auth", "requests"]
# ///
"""live sitemap.xml の全 URL に URL Inspection API を掛けて url_index_status に UPSERT する。

使い方:
  uv run analytics/scripts/inspect_urls.py            # sitemap 全件
  uv run analytics/scripts/inspect_urls.py --limit 5  # 先頭 5 件だけ (動作確認用)

なぜ必要か:
  sitemap_status.indexed_urls は API 側の欠測で常に 0 を返す。
  gsc_search_daily は「インプレッションが立った」ページしか含まない。
  つまり「インデックスされているが露出ゼロ」のページは他のどのテーブルからも見えない。

クォータ: URL Inspection は 2000 query/日・600 query/分 (プロパティ単位)。
72 URL 程度なら問題ないが、1 日に何度も回さないこと。
"""
import argparse
import re
import sqlite3
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "analytics" / "data" / "analytics.sqlite"
CREDS = Path("/Users/kouheisakai/.config/gcloud/taitech-analytics-sa.json")

SITE_URL = "sc-domain:taitech.dev"
SITEMAP_URL = "https://taitech.dev/sitemap.xml"
INSPECT_ENDPOINT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def sitemap_urls() -> list[str]:
    with urllib.request.urlopen(SITEMAP_URL, timeout=30) as r:
        xml = r.read().decode("utf-8")
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)


def token() -> str:
    creds = service_account.Credentials.from_service_account_file(
        str(CREDS), scopes=SCOPES
    )
    creds.refresh(Request())
    return creds.token


def inspect(session: requests.Session, access_token: str, url: str) -> dict:
    resp = session.post(
        INSPECT_ENDPOINT,
        headers={"Authorization": f"Bearer {access_token}"},
        # languageCode を ja にすると coverageState が日本語で返り SQL で扱いづらい。
        # en-US に固定して安定した識別子 ("Submitted and indexed" 等) を得る。
        json={"inspectionUrl": url, "siteUrl": SITE_URL, "languageCode": "en-US"},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json().get("inspectionResult", {})


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="先頭 N 件だけ処理")
    args = ap.parse_args()

    urls = sitemap_urls()
    if args.limit:
        urls = urls[: args.limit]
    print(f"sitemap: {len(urls)} URLs", file=sys.stderr)

    access_token = token()
    session = requests.Session()
    conn = sqlite3.connect(DB_PATH)
    today = datetime.now(timezone.utc).date().isoformat()
    fetched = datetime.now(timezone.utc).isoformat(timespec="seconds")

    counts: dict[str, int] = {}
    for i, url in enumerate(urls, 1):
        try:
            result = inspect(session, access_token, url)
        except requests.HTTPError as e:
            print(f"  [{i}/{len(urls)}] ERROR {url}: {e}", file=sys.stderr)
            continue

        idx = result.get("indexStatusResult", {})
        rich = result.get("richResultsResult", {})
        coverage = idx.get("coverageState", "")
        counts[coverage] = counts.get(coverage, 0) + 1

        conn.execute(
            """
            INSERT INTO url_index_status
              (date, url, verdict, coverage_state, robots_txt_state, indexing_state,
               page_fetch_state, last_crawled, google_canonical, user_canonical,
               crawled_as, rich_results_verdict, in_sitemap, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (date, url) DO UPDATE SET
              verdict=excluded.verdict, coverage_state=excluded.coverage_state,
              robots_txt_state=excluded.robots_txt_state,
              indexing_state=excluded.indexing_state,
              page_fetch_state=excluded.page_fetch_state,
              last_crawled=excluded.last_crawled,
              google_canonical=excluded.google_canonical,
              user_canonical=excluded.user_canonical,
              crawled_as=excluded.crawled_as,
              rich_results_verdict=excluded.rich_results_verdict,
              in_sitemap=excluded.in_sitemap, fetched_at=excluded.fetched_at
            """,
            (today, url, idx.get("verdict", ""), coverage,
             idx.get("robotsTxtState", ""), idx.get("indexingState", ""),
             idx.get("pageFetchState", ""), idx.get("lastCrawlTime"),
             idx.get("googleCanonical", ""), idx.get("userCanonical", ""),
             idx.get("crawledAs", ""), rich.get("verdict", ""), 1, fetched),
        )
        print(f"  [{i}/{len(urls)}] {coverage or '(no data)'}  {url}", file=sys.stderr)
        time.sleep(0.15)  # 600 query/min の上限に対する安全マージン

    run_id = f"{fetched}-url_inspect"
    conn.execute(
        """INSERT OR REPLACE INTO collections
           (run_id, collected_at, source, date_start, date_end, rows_upserted)
           VALUES (?, ?, 'gsc_url_inspect', ?, ?, ?)""",
        (run_id, fetched, today, today, sum(counts.values())),
    )
    conn.commit()
    conn.close()

    print("\n=== coverage_state 内訳 ===", file=sys.stderr)
    for state, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {n:3d}  {state or '(no data)'}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())