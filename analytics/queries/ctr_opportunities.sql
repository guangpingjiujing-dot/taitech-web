-- CTR 改善余地: インプレッションはそこそこあるが順位・CTR が悪いクエリ
-- 直近 28 日で impressions >= 5、position が 4〜20（順位を上げれば大きく伸びる圏）
-- CTR は position 相応の期待値と比較（ざっくり 1 位 25%, 3 位 10%, 5 位 5%, 10 位 2% 想定）
-- 閾値はサイト立ち上げ初期のデータ量に合わせて緩めに設定（imp >= 5）。
-- 定常運用に入ったら 50 まで戻して母数ノイズを弾く方針。

SELECT
  query,
  page,
  SUM(impressions)                          AS impressions,
  SUM(clicks)                               AS clicks,
  ROUND(1.0 * SUM(clicks) / NULLIF(SUM(impressions),0), 4) AS ctr,
  ROUND(AVG(position), 2)                   AS avg_position
FROM gsc_search_daily
WHERE date >= date('now', '-28 days')
GROUP BY query, page
HAVING SUM(impressions) >= 5
   AND AVG(position) BETWEEN 4 AND 20
   AND (1.0 * SUM(clicks) / NULLIF(SUM(impressions),0)) < 0.05
ORDER BY impressions DESC
LIMIT 30;