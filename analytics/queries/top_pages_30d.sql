-- 直近 30 日で PV / セッションが多いページ Top 20（日本のみ）
-- GA4: ga_page_daily を集計
--
-- country = 'Japan' で絞るのは必須。海外トラフィックはほぼ全てボットで
-- (滞在 0 秒 / エンゲージ 0)、含めると PV が約 2 倍に膨らむ。
-- ボット側を見たいときは bot_audit.sql を使う。
--
-- 注意: sessions はページ横断で SUM してはいけない（1 セッションがページごとに立つ）。
--       期間合計のセッション数は source_mix.sql / ga_source_daily から取る。

SELECT
  page_path,
  SUM(screen_page_views) AS pv,
  SUM(sessions)          AS sessions,
  SUM(active_users)      AS users,
  ROUND(AVG(engagement_rate), 3) AS avg_engagement_rate,
  ROUND(AVG(avg_engagement_time), 1) AS avg_time_sec
FROM ga_page_daily
WHERE date >= date('now', '-30 days')
  AND country = 'Japan'
GROUP BY page_path
ORDER BY pv DESC
LIMIT 20;
