#!/usr/bin/env python3
"""
MCP スナップショット (JSON) を SQLite に冪等ロードする。

使い方:
  python3 analytics/scripts/load.py <snapshot_dir>

<snapshot_dir> 内で以下のファイル名を認識:
  - gsc_search_*.json      (mcp__gsc__get_search_analytics のレスポンス)
  - gsc_sitemap_*.json     (mcp__gsc__get_sitemap_details のレスポンス)
  - ga_page_*.json         (dimensions=[date,pagePath] の run_report レスポンス)
  - ga_source_*.json       (dimensions=[date,sessionSource,sessionMedium,sessionCampaignName])
  - ga_event_*.json        (dimensions=[date,eventName,pagePath])

各 UPSERT の行数を stdout に出す。collections テーブルにも 1 レコード追加。

前提: analytics/data/analytics.sqlite が analytics/schema.sql で初期化済み。
"""
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # repo root
DB_PATH = ROOT / "analytics" / "data" / "analytics.sqlite"


def yyyymmdd_to_iso(s: str) -> str:
    """20260714 -> 2026-07-14"""
    return f"{s[0:4]}-{s[4:6]}-{s[6:8]}"


def load_json(path: Path) -> dict:
    raw = json.loads(path.read_text(encoding="utf-8"))
    # GSC MCP は {"result": "<JSON string>"} で包む。剥がす。
    if isinstance(raw, dict) and set(raw.keys()) == {"result"} and isinstance(raw["result"], str):
        raw = json.loads(raw["result"])
    return raw


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_gsc_search(conn: sqlite3.Connection, data: dict) -> tuple[int, str, str]:
    rows = data.get("rows", [])
    fetched = now_iso()
    n = 0
    date_min = None
    date_max = None
    for r in rows:
        date = r["date"]
        query = r.get("query", "")
        page = r.get("page", "")
        device = r.get("device", "")
        country = r.get("country", "")
        clicks = int(r.get("clicks", 0))
        imp = int(r.get("impressions", 0))
        ctr = float(r.get("ctr", 0))
        pos = float(r.get("position", 0))
        conn.execute(
            """
            INSERT INTO gsc_search_daily
              (date, query, page, device, country, clicks, impressions, ctr, position, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (date, query, page, device, country) DO UPDATE SET
              clicks=excluded.clicks, impressions=excluded.impressions,
              ctr=excluded.ctr, position=excluded.position, fetched_at=excluded.fetched_at
            """,
            (date, query, page, device, country, clicks, imp, ctr, pos, fetched),
        )
        n += 1
        date_min = date if date_min is None or date < date_min else date_min
        date_max = date if date_max is None or date > date_max else date_max
    return n, date_min or "", date_max or ""


def load_gsc_sitemap(conn: sqlite3.Connection, data: dict) -> tuple[int, str, str]:
    """1 サイトマップ = 1 レコード。data はサイトマップ 1 件の details。"""
    fetched = now_iso()
    today = datetime.now(timezone.utc).date().isoformat()
    sitemap_url = data.get("sitemap_url", "")
    type_ = data.get("type", "")
    is_pending = 0 if data.get("status") == "processed" else 1
    is_index = 1 if data.get("is_index") else 0
    last_submitted = data.get("last_submitted")
    last_downloaded = data.get("last_downloaded")
    warnings = int(data.get("warnings", 0) or 0)
    errors = int(data.get("errors", 0) or 0)
    submitted_total = 0
    indexed_total = 0
    for c in data.get("content_breakdown", []) or []:
        submitted_total += int(c.get("submitted", 0) or 0)
        indexed_total += int(c.get("indexed", 0) or 0)
    conn.execute(
        """
        INSERT INTO sitemap_status
          (date, sitemap_url, type, is_pending, is_sitemaps_index,
           last_submitted, last_downloaded, warnings, errors,
           submitted_urls, indexed_urls, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (date, sitemap_url) DO UPDATE SET
          type=excluded.type, is_pending=excluded.is_pending,
          is_sitemaps_index=excluded.is_sitemaps_index,
          last_submitted=excluded.last_submitted,
          last_downloaded=excluded.last_downloaded,
          warnings=excluded.warnings, errors=excluded.errors,
          submitted_urls=excluded.submitted_urls,
          indexed_urls=excluded.indexed_urls,
          fetched_at=excluded.fetched_at
        """,
        (today, sitemap_url, type_, is_pending, is_index,
         last_submitted, last_downloaded, warnings, errors,
         submitted_total, indexed_total, fetched),
    )
    return 1, today, today


def _ga_rows(data: dict) -> list[dict]:
    """GA4 レスポンスをフラットな dict のリストに正規化。"""
    dim_headers = [h["name"] for h in data.get("dimension_headers", [])]
    met_headers = [h["name"] for h in data.get("metric_headers", [])]
    out = []
    for row in data.get("rows", []):
        rec = {}
        for i, h in enumerate(dim_headers):
            rec[h] = row["dimension_values"][i]["value"]
        for i, h in enumerate(met_headers):
            rec[h] = row["metric_values"][i]["value"]
        out.append(rec)
    return out


def load_ga_page(conn: sqlite3.Connection, data: dict) -> tuple[int, str, str]:
    fetched = now_iso()
    n = 0
    date_min = date_max = None
    for r in _ga_rows(data):
        date = yyyymmdd_to_iso(r["date"])
        page = r.get("pagePath", "")
        country = r.get("country", "")
        conn.execute(
            """
            INSERT INTO ga_page_daily
              (date, page_path, country, sessions, active_users, engaged_sessions,
               engagement_rate, avg_engagement_time, screen_page_views, event_count, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (date, page_path, country) DO UPDATE SET
              sessions=excluded.sessions, active_users=excluded.active_users,
              engaged_sessions=excluded.engaged_sessions,
              engagement_rate=excluded.engagement_rate,
              avg_engagement_time=excluded.avg_engagement_time,
              screen_page_views=excluded.screen_page_views,
              event_count=excluded.event_count, fetched_at=excluded.fetched_at
            """,
            (date, page, country,
             int(float(r.get("sessions", 0) or 0)),
             int(float(r.get("activeUsers", 0) or 0)),
             int(float(r.get("engagedSessions", 0) or 0)),
             float(r.get("engagementRate", 0) or 0),
             float(r.get("averageSessionDuration", 0) or 0),
             int(float(r.get("screenPageViews", 0) or 0)),
             int(float(r.get("eventCount", 0) or 0)),
             fetched),
        )
        n += 1
        date_min = date if date_min is None or date < date_min else date_min
        date_max = date if date_max is None or date > date_max else date_max
    return n, date_min or "", date_max or ""


def load_ga_source(conn: sqlite3.Connection, data: dict) -> tuple[int, str, str]:
    fetched = now_iso()
    n = 0
    date_min = date_max = None
    for r in _ga_rows(data):
        date = yyyymmdd_to_iso(r["date"])
        conn.execute(
            """
            INSERT INTO ga_source_daily
              (date, session_source, session_medium, session_campaign, country,
               sessions, engaged_sessions, active_users, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (date, session_source, session_medium, session_campaign, country) DO UPDATE SET
              sessions=excluded.sessions, engaged_sessions=excluded.engaged_sessions,
              active_users=excluded.active_users, fetched_at=excluded.fetched_at
            """,
            (date, r.get("sessionSource", ""), r.get("sessionMedium", ""),
             r.get("sessionCampaignName", r.get("sessionCampaign", "")),
             r.get("country", ""),
             int(float(r.get("sessions", 0) or 0)),
             int(float(r.get("engagedSessions", 0) or 0)),
             int(float(r.get("activeUsers", 0) or 0)),
             fetched),
        )
        n += 1
        date_min = date if date_min is None or date < date_min else date_min
        date_max = date if date_max is None or date > date_max else date_max
    return n, date_min or "", date_max or ""


def load_ga_event(conn: sqlite3.Connection, data: dict) -> tuple[int, str, str]:
    fetched = now_iso()
    n = 0
    date_min = date_max = None
    for r in _ga_rows(data):
        date = yyyymmdd_to_iso(r["date"])
        conn.execute(
            """
            INSERT INTO ga_event_daily
              (date, event_name, page_path, country, event_count, event_value_sum, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (date, event_name, page_path, country) DO UPDATE SET
              event_count=excluded.event_count,
              event_value_sum=excluded.event_value_sum,
              fetched_at=excluded.fetched_at
            """,
            (date, r.get("eventName", ""), r.get("pagePath", ""), r.get("country", ""),
             int(float(r.get("eventCount", 0) or 0)),
             float(r.get("eventValue", 0) or 0),
             fetched),
        )
        n += 1
        date_min = date if date_min is None or date < date_min else date_min
        date_max = date if date_max is None or date > date_max else date_max
    return n, date_min or "", date_max or ""


LOADERS = {
    "gsc_search": load_gsc_search,
    "gsc_sitemap": load_gsc_sitemap,
    "ga_page":    load_ga_page,
    "ga_source":  load_ga_source,
    "ga_event":   load_ga_event,
}


def main(snapshot_dir: str) -> int:
    dir_path = Path(snapshot_dir).resolve()
    if not dir_path.is_dir():
        print(f"not a directory: {dir_path}", file=sys.stderr)
        return 2

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    total_by_source: dict[str, int] = {}
    ranges: dict[str, tuple[str, str]] = {}

    for path in sorted(dir_path.glob("*.json")):
        stem = path.stem
        loader = None
        source_key = ""
        for key, fn in LOADERS.items():
            if stem.startswith(key):
                loader, source_key = fn, key
                break
        if loader is None:
            print(f"skip (unknown source): {path.name}", file=sys.stderr)
            continue

        data = load_json(path)
        n, dstart, dend = loader(conn, data)
        total_by_source[source_key] = total_by_source.get(source_key, 0) + n
        if source_key in ranges:
            s0, e0 = ranges[source_key]
            ranges[source_key] = (min(s0, dstart), max(e0, dend))
        else:
            ranges[source_key] = (dstart, dend)
        print(f"loaded {path.name}: {n} rows [{dstart}..{dend}] -> {source_key}")

    # collections
    ts = now_iso()
    for source, n in total_by_source.items():
        s0, e0 = ranges[source]
        conn.execute(
            "INSERT INTO collections (run_id, collected_at, source, date_start, date_end, rows_upserted) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (f"{ts}-{source}", ts, source, s0, e0, n),
        )

    conn.commit()
    conn.close()

    print("\n=== summary ===")
    for source, n in total_by_source.items():
        s0, e0 = ranges[source]
        print(f"{source:12}  {n:5} rows   {s0} .. {e0}")

    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))