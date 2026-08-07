-- URL 単位のインデックス状態（最新スナップショット）
-- 収集: uv run analytics/scripts/inspect_urls.py
--
-- sitemap_status.indexed_urls は API 欠測で常に 0 のため使わない。
-- 「インデックスされているが検索露出ゼロ」のページはここでしか見えない。

-- (1) coverage_state の内訳
SELECT
  coverage_state,
  COUNT(*) AS urls,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM url_index_status
                            WHERE date = (SELECT MAX(date) FROM url_index_status)), 1) AS pct
FROM url_index_status
WHERE date = (SELECT MAX(date) FROM url_index_status)
GROUP BY coverage_state
ORDER BY urls DESC;

-- (2) 未インデックスの URL 一覧（対処対象）
SELECT
  replace(url, 'https://taitech.dev', '') AS path,
  coverage_state,
  verdict,
  last_crawled,
  CASE WHEN google_canonical <> user_canonical THEN 'canonical 不一致' ELSE '' END AS note
FROM url_index_status
WHERE date = (SELECT MAX(date) FROM url_index_status)
  AND coverage_state <> 'Submitted and indexed'
ORDER BY coverage_state, path;

-- (3) セクション別のインデックス率
SELECT
  CASE
    WHEN url = 'https://taitech.dev/' THEN '(top)'
    WHEN url LIKE 'https://taitech.dev/fe%'            THEN '/fe'
    WHEN url LIKE 'https://taitech.dev/rdb-index%'     THEN '/rdb-index'
    WHEN url LIKE 'https://taitech.dev/data-modeling%' THEN '/data-modeling'
    WHEN url LIKE 'https://taitech.dev/why-need-rdb%'  THEN '/why-need-rdb'
    ELSE 'other'
  END AS section,
  COUNT(*) AS urls,
  SUM(CASE WHEN coverage_state = 'Submitted and indexed' THEN 1 ELSE 0 END) AS indexed,
  ROUND(100.0 * SUM(CASE WHEN coverage_state = 'Submitted and indexed' THEN 1 ELSE 0 END)
        / COUNT(*), 1) AS indexed_pct,
  MAX(last_crawled) AS newest_crawl
FROM url_index_status
WHERE date = (SELECT MAX(date) FROM url_index_status)
GROUP BY section
ORDER BY urls DESC;

-- (4) インデックス済みだが直近 28 日の検索露出がゼロのページ
--     = 「載っているのに呼ばれていない」= 順位・クエリ適合の問題
SELECT
  replace(u.url, 'https://taitech.dev', '') AS path,
  u.last_crawled,
  COALESCE(g.imp, 0) AS impressions_28d
FROM url_index_status u
LEFT JOIN (
  SELECT page, SUM(impressions) AS imp
  FROM gsc_search_daily
  WHERE date >= date('now', '-28 days')
  GROUP BY page
) g ON g.page = u.url
WHERE u.date = (SELECT MAX(date) FROM url_index_status)
  AND u.coverage_state = 'Submitted and indexed'
  AND COALESCE(g.imp, 0) = 0
ORDER BY path;
