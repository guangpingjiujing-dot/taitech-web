-- 直近 14 日 vs その前 14 日 で impressions が伸びた / 沈んだページ
-- GSC ベース。差分絶対値・比率の両方を出す。
-- 閾値はサイト立ち上げ初期のデータ量に合わせて緩めに設定（imp_prior + imp_recent >= 5）。
-- 定常運用に入ったら 100 まで戻して母数ノイズを弾く方針。

WITH recent AS (
  SELECT page, SUM(impressions) AS imp_recent, SUM(clicks) AS clk_recent
  FROM gsc_search_daily
  WHERE date >= date('now', '-14 days')
  GROUP BY page
),
prior AS (
  SELECT page, SUM(impressions) AS imp_prior, SUM(clicks) AS clk_prior
  FROM gsc_search_daily
  WHERE date >= date('now', '-28 days') AND date < date('now', '-14 days')
  GROUP BY page
)
SELECT
  COALESCE(r.page, p.page) AS page,
  COALESCE(p.imp_prior, 0) AS imp_prior,
  COALESCE(r.imp_recent, 0) AS imp_recent,
  COALESCE(r.imp_recent, 0) - COALESCE(p.imp_prior, 0) AS delta_imp,
  ROUND(
    100.0 * (COALESCE(r.imp_recent, 0) - COALESCE(p.imp_prior, 0))
          / NULLIF(COALESCE(p.imp_prior, 0), 0),
    1
  ) AS delta_pct,
  COALESCE(p.clk_prior, 0)  AS clk_prior,
  COALESCE(r.clk_recent, 0) AS clk_recent
FROM recent r
FULL OUTER JOIN prior p ON r.page = p.page
WHERE (COALESCE(p.imp_prior, 0) + COALESCE(r.imp_recent, 0)) >= 5
ORDER BY delta_imp DESC
LIMIT 40;