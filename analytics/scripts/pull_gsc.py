#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["google-auth", "requests"]
# ///
"""GSC Search Analytics を直接叩いて snapshot JSON に落とす。

使い方:
  uv run analytics/scripts/pull_gsc.py --start 2026-08-16 --end 2026-08-29
  uv run analytics/scripts/pull_gsc.py --days 14

なぜ必要か:
  MCP (mcp__gsc__get_search_analytics) はレスポンスがエージェントの文脈を経由するので、
  数百行を snapshot JSON へ手で書き写す工程が入る。pull_ga.py が GA4 側でこれを潰したのと
  同じ理由で、GSC 側もスクリプト化する。

  さらに MCP は row_limit が max 500 でページングが無い。ここでは startRow を回して
  25000 行/回で全件取る。

country について:
  dimensions に country を入れない。gsc_search_daily の PK は
  (date, query, page, device, country) で、既存行は country='' で入っている。
  ここで country を足すと同じ実績が別行として二重に入る。変えるならテーブルごと
  作り直すこと。

出力: analytics/snapshots/<YYYY-MM-DD>/gsc_search_<start>_<end>.json
      そのあと load.py に流す (UPSERT と collections 記録はローダ側)。
"""
import argparse
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[2]
CREDS = Path("/Users/kouheisakai/.config/gcloud/taitech-analytics-sa.json")

SITE_URL = "sc-domain:taitech.dev"
DIMENSIONS = ["date", "query", "page", "device"]
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
ENDPOINT = (
    "https://searchconsole.googleapis.com/webmasters/v3/sites/"
    "sc-domain%3Ataitech.dev/searchAnalytics/query"
)
PAGE_SIZE = 25000


def token() -> str:
    creds = service_account.Credentials.from_service_account_file(
        str(CREDS), scopes=SCOPES
    )
    creds.refresh(Request())
    return creds.token


def fetch(access_token: str, start: str, end: str, data_state: str) -> list[dict]:
    session = requests.Session()
    rows: list[dict] = []
    start_row = 0
    while True:
        resp = session.post(
            ENDPOINT,
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "startDate": start,
                "endDate": end,
                "dimensions": DIMENSIONS,
                "rowLimit": PAGE_SIZE,
                "startRow": start_row,
                "dataState": data_state,
            },
            timeout=90,
        )
        resp.raise_for_status()
        batch = resp.json().get("rows", [])
        if not batch:
            break
        rows.extend(batch)
        print(f"  startRow={start_row} -> {len(batch)} rows", file=sys.stderr)
        if len(batch) < PAGE_SIZE:
            break
        start_row += PAGE_SIZE
    return rows


def to_snapshot(raw: list[dict], start: str, end: str) -> dict:
    out = []
    for r in raw:
        keys = r.get("keys", [])
        if len(keys) != len(DIMENSIONS):
            continue
        d = dict(zip(DIMENSIONS, keys))
        out.append(
            {
                "date": d["date"],
                "query": d["query"],
                "page": d["page"],
                "device": d["device"],
                "country": "",
                "clicks": r.get("clicks", 0),
                "impressions": r.get("impressions", 0),
                "ctr": r.get("ctr", 0),
                "position": r.get("position", 0),
            }
        )
    return {
        "site_url": SITE_URL,
        "date_range": {"start": start, "end": end},
        "dimensions": DIMENSIONS,
        "row_count": len(out),
        "rows": out,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start")
    ap.add_argument("--end")
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument(
        "--data-state",
        choices=["final", "all"],
        default="final",
        help="final=確定分のみ (DB に入れるのはこちら) / all=未確定の直近数日も含む",
    )
    ap.add_argument("--out", help="snapshot の出力先を明示する (比較用の一時取得など)")
    args = ap.parse_args()

    today = date.today()
    end = args.end or today.isoformat()
    start = args.start or (today - timedelta(days=args.days)).isoformat()

    print(f"GSC search analytics {start}..{end} (dataState={args.data_state})",
          file=sys.stderr)
    rows = fetch(token(), start, end, args.data_state)
    snapshot = to_snapshot(rows, start, end)

    stamp = datetime.now(timezone.utc).date().isoformat()
    out_dir = Path(args.out) if args.out else ROOT / "analytics" / "snapshots" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"gsc_search_{start}_{end}.json"
    out_path.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"gsc_search: {snapshot['row_count']} rows -> {out_path.name}", file=sys.stderr)
    if args.data_state == "all":
        print(
            "警告: dataState=all は未確定の直近数日を含む。load.py で DB に入れないこと "
            "(確定値で上書きされる前の数字が残り、後から遅延と実変動を切り分けられなくなる)。",
            file=sys.stderr,
        )
    else:
        print(f"次: python3 analytics/scripts/load.py {out_dir}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
