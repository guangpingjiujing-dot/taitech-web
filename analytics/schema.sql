-- taitech.dev analytics データストア
-- SQLite。最小粒度で保存し、集計は都度クエリで導出する。
-- 冪等: (date + 全ディメンション) を PRIMARY KEY にし、UPSERT で再取得を許容。

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- GSC: Search Console
-- ============================================================
-- 最小粒度: query × page × device × country × 日
-- ここから query 別 / page 別 / device 別 / 国別いずれの集計も導ける。
CREATE TABLE IF NOT EXISTS gsc_search_daily (
  date        TEXT NOT NULL,
  query       TEXT NOT NULL,
  page        TEXT NOT NULL,
  device      TEXT NOT NULL DEFAULT '',
  country     TEXT NOT NULL DEFAULT '',
  clicks      INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  ctr         REAL    NOT NULL,
  position    REAL    NOT NULL,
  fetched_at  TEXT    NOT NULL,
  PRIMARY KEY (date, query, page, device, country)
);
CREATE INDEX IF NOT EXISTS idx_gsc_page ON gsc_search_daily(page, date);
CREATE INDEX IF NOT EXISTS idx_gsc_query ON gsc_search_daily(query, date);

-- ============================================================
-- GA4: Google Analytics 4
-- ============================================================
CREATE TABLE IF NOT EXISTS ga_page_daily (
  date               TEXT NOT NULL,
  page_path          TEXT NOT NULL,
  -- 海外トラフィックはほぼ全てボット。収集時には捨てず SQL で country='Japan' に絞る。
  country            TEXT NOT NULL DEFAULT '',
  sessions           INTEGER NOT NULL DEFAULT 0,
  active_users       INTEGER NOT NULL DEFAULT 0,
  engaged_sessions   INTEGER NOT NULL DEFAULT 0,
  engagement_rate    REAL    NOT NULL DEFAULT 0,
  avg_engagement_time REAL   NOT NULL DEFAULT 0,
  screen_page_views  INTEGER NOT NULL DEFAULT 0,
  event_count        INTEGER NOT NULL DEFAULT 0,
  fetched_at         TEXT NOT NULL,
  PRIMARY KEY (date, page_path, country)
);
CREATE INDEX IF NOT EXISTS idx_ga_page ON ga_page_daily(page_path, date);
CREATE INDEX IF NOT EXISTS idx_ga_page_country ON ga_page_daily(country, date);

CREATE TABLE IF NOT EXISTS ga_source_daily (
  date              TEXT NOT NULL,
  country           TEXT NOT NULL DEFAULT '',
  session_source    TEXT NOT NULL DEFAULT '',
  session_medium    TEXT NOT NULL DEFAULT '',
  session_campaign  TEXT NOT NULL DEFAULT '',
  sessions          INTEGER NOT NULL DEFAULT 0,
  engaged_sessions  INTEGER NOT NULL DEFAULT 0,
  active_users      INTEGER NOT NULL DEFAULT 0,
  fetched_at        TEXT NOT NULL,
  PRIMARY KEY (date, session_source, session_medium, session_campaign, country)
);

-- outbound click や cta_click 等のカスタムイベント計測用
-- ページ単位まで落とすと Amazon リンク経由の CTR も出せる
CREATE TABLE IF NOT EXISTS ga_event_daily (
  date            TEXT NOT NULL,
  event_name      TEXT NOT NULL,
  page_path       TEXT NOT NULL DEFAULT '',
  country         TEXT NOT NULL DEFAULT '',
  event_count     INTEGER NOT NULL DEFAULT 0,
  event_value_sum REAL    NOT NULL DEFAULT 0,
  fetched_at      TEXT NOT NULL,
  PRIMARY KEY (date, event_name, page_path, country)
);
CREATE INDEX IF NOT EXISTS idx_ga_event_name ON ga_event_daily(event_name, date);

-- ============================================================
-- GSC: サイトマップ状態（インデックス把握の proxy）
-- ============================================================
-- GSC UI の Coverage レポートは API 未公開なので、サイトマップ単位の
-- submitted / warnings / errors / last_downloaded を蓄積する。
CREATE TABLE IF NOT EXISTS sitemap_status (
  date            TEXT NOT NULL,          -- 収集日 (YYYY-MM-DD)
  sitemap_url     TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT '', -- sitemap | sitemapsIndex | rssFeed 等
  is_pending      INTEGER NOT NULL DEFAULT 0,
  is_sitemaps_index INTEGER NOT NULL DEFAULT 0,
  last_submitted  TEXT,
  last_downloaded TEXT,
  warnings        INTEGER NOT NULL DEFAULT 0,
  errors          INTEGER NOT NULL DEFAULT 0,
  submitted_urls  INTEGER NOT NULL DEFAULT 0, -- contents[].submitted 合算
  indexed_urls    INTEGER NOT NULL DEFAULT 0, -- contents[].indexed 合算（API から取れれば）
  fetched_at      TEXT NOT NULL,
  PRIMARY KEY (date, sitemap_url)
);

-- ============================================================
-- GSC: URL 単位のインデックス状態（URL Inspection API）
-- ============================================================
-- sitemap_status.indexed_urls は API 側の欠測で常に 0 を返すため、
-- 「どのページがインデックスされているか」はここでしか分からない。
-- analytics/scripts/inspect_urls.py が live sitemap.xml の全 URL に対して収集する。
CREATE TABLE IF NOT EXISTS url_index_status (
  date                 TEXT NOT NULL,   -- 収集日 (YYYY-MM-DD)
  url                  TEXT NOT NULL,
  verdict              TEXT NOT NULL DEFAULT '', -- PASS | PARTIAL | FAIL | NEUTRAL
  coverage_state       TEXT NOT NULL DEFAULT '', -- Submitted and indexed / Crawled - currently not indexed 等
  robots_txt_state     TEXT NOT NULL DEFAULT '',
  indexing_state       TEXT NOT NULL DEFAULT '',
  page_fetch_state     TEXT NOT NULL DEFAULT '',
  last_crawled         TEXT,                     -- 未クロールなら NULL
  google_canonical     TEXT NOT NULL DEFAULT '',
  user_canonical       TEXT NOT NULL DEFAULT '',
  crawled_as           TEXT NOT NULL DEFAULT '',
  rich_results_verdict TEXT NOT NULL DEFAULT '',
  in_sitemap           INTEGER NOT NULL DEFAULT 0,
  fetched_at           TEXT NOT NULL,
  PRIMARY KEY (date, url)
);
CREATE INDEX IF NOT EXISTS idx_url_index_url ON url_index_status(url, date);
CREATE INDEX IF NOT EXISTS idx_url_index_coverage ON url_index_status(coverage_state, date);

-- ============================================================
-- 収集メタデータ
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  run_id        TEXT PRIMARY KEY,           -- ISO timestamp + source
  collected_at  TEXT NOT NULL,
  source        TEXT NOT NULL,              -- 'gsc' | 'ga4_page' | 'ga4_source' | 'ga4_event'
  date_start    TEXT NOT NULL,
  date_end      TEXT NOT NULL,
  rows_upserted INTEGER NOT NULL DEFAULT 0,
  notes         TEXT
);
CREATE INDEX IF NOT EXISTS idx_collections_source ON collections(source, collected_at);