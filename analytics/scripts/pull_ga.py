#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["google-auth", "requests"]
# ///
"""GA4 Data API を直接叩いて ga_*_daily を取得し、snapshot 保存 + SQLite へ UPSERT する。

使い方:
  uv run analytics/scripts/pull_ga.py --start 2026-07-05 --end 2026-08-07
  uv run analytics/scripts/pull_ga.py --days 21          # 今日から遡って 21 日

なぜ MCP ではなくこれを使うか:
  MCP (`mcp__ga__run_report`) はレスポンスがエージェントの文脈を経由するため、
  数百行を snapshot JSON へ手で書き写す工程が入る。これは非決定的で誤りが混入する。
  このスクリプトは取得から UPSERT までを一切人手を介さずに行う。

country ディメンションについて:
  海外トラフィックはほぼ全てボット (滞在 0 秒 / エンゲージ 0)。実質の読者は日本のみ。
  GA4 の「データフィルタ」機能は IP ベースの内部トラフィックしか扱えず国で除外できないが、
  country をディメンションとして保存すれば SQL 側で決定論的に落とせる。
  収集時に捨てないのは、ボットの実態を後から監査できるようにするため。
"""
import argparse
import json
import sqlite3
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "analytics" / "data" / "analytics.sqlite"
CREDS = Path("/Users/kouheisakai/.config/gcloud/taitech-analytics-sa.json")

PROPERTY_ID = "544205654"
ENDPOINT = f"https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport"
SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

REPORTS = {
    "ga_page": {
        "dimensions": ["date", "pagePath", "country"],
        "metrics": ["sessions", "activeUsers", "engagedSessions", "engagementRate",
                    "averageSessionDuration", "screenPageViews", "eventCount"],
    },
    "ga_source": {
        "dimensions": ["date", "sessionSource", "sessionMedium", "sessionCampaignName", "country"],
        "metrics": ["sessions", "engagedSessions", "activeUsers"],
    },
    "ga_event": {
        "dimensions": ["date", "eventName", "pagePath", "country"],
        "metrics": ["eventCount"],
    },
}


def token() -> str:
    creds = service_account.Credentials.from_service_account_file(str(CREDS), scopes=SCOPES)
    creds.refresh(Request())
    return creds.token


def run_report(access_token: str, dimensions: list[str], metrics: list[str],
               start: str, end: str) -> dict:
    """offset ページングで全行を取得して 1 つのレスポンス形にまとめる。"""
    rows: list[dict] = []
    offset = 0
    payload_base = {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "dimensions": [{"name": d} for d in dimensions],
        "metrics": [{"name": m} for m in metrics],
        "limit": 100000,
    }
    headers: dict | None = None
    while True:
        r = requests.post(
            ENDPOINT,
            headers={"Authorization": f"Bearer {access_token}"},
            json={**payload_base, "offset": offset},
            timeout=120,
        )
        r.raise_for_status()
        data = r.json()
        if headers is None:
            headers = {
                "dimension_headers": [{"name": h["name"]} for h in data.get("dimensionHeaders", [])],
                "metric_headers": [{"name": h["name"]} for h in data.get("metricHeaders", [])],
            }
        batch = data.get("rows", [])
        rows.extend(batch)
        total = int(data.get("rowCount", 0))
        offset += len(batch)
        if not batch or offset >= total:
            break

    # load.py と同じ形（snake_case キー）に正規化して返す
    return {
        **(headers or {"dimension_headers": [], "metric_headers": []}),
        "rows": [
            {
                "dimension_values": [{"value": v.get("value", "")} for v in row.get("dimensionValues", [])],
                "metric_values": [{"value": v.get("value", "")} for v in row.get("metricValues", [])],
            }
            for row in rows
        ],
        "row_count": len(rows),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start")
    ap.add_argument("--end")
    ap.add_argument("--days", type=int, default=0)
    args = ap.parse_args()

    today = date.today()
    if args.days:
        start, end = (today - timedelta(days=args.days)).isoformat(), today.isoformat()
    else:
        if not (args.start and args.end):
            print("--start/--end もしくは --days が必要", file=sys.stderr)
            return 2
        start, end = args.start, args.end

    snap_dir = ROOT / "analytics" / "snapshots" / today.isoformat()
    snap_dir.mkdir(parents=True, exist_ok=True)

    access_token = token()
    conn = sqlite3.connect(DB_PATH)
    fetched = datetime.now(timezone.utc).isoformat(timespec="seconds")

    sys.path.insert(0, str(ROOT / "analytics" / "scripts"))
    import load as loader  # load.py の UPSERT 実装を再利用する

    for name, spec in REPORTS.items():
        data = run_report(access_token, spec["dimensions"], spec["metrics"], start, end)
        path = snap_dir / f"{name}_{start}_{end}.json"
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

        fn = loader.LOADERS[name]
        n, dmin, dmax = fn(conn, data)
        conn.execute(
            """INSERT OR REPLACE INTO collections
               (run_id, collected_at, source, date_start, date_end, rows_upserted)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (f"{fetched}-{name}", fetched, name, dmin, dmax, n),
        )
        print(f"{name}: {n} rows [{dmin}..{dmax}] -> {path.name}", file=sys.stderr)

    conn.commit()
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
