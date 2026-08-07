-- 流入 source / medium ミックス（直近 30 日、日本のみ）
-- どこから来ているかを把握。google organic / direct / referral の比率を見る。
--
-- country = 'Japan' で絞るのは必須。海外の direct/(none) はほぼ全てボットで、
-- 含めると direct の比率が実態より大幅に高く見える。

SELECT
  session_source,
  session_medium,
  SUM(sessions)         AS sessions,
  SUM(engaged_sessions) AS engaged,
  ROUND(100.0 * SUM(engaged_sessions) / NULLIF(SUM(sessions),0), 1) AS engaged_pct,
  SUM(active_users)     AS users
FROM ga_source_daily
WHERE date >= date('now', '-30 days')
  AND country = 'Japan'
GROUP BY session_source, session_medium
ORDER BY sessions DESC
LIMIT 20;
