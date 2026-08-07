-- ボット混入の監査（直近 30 日）
--
-- 他の定型クエリは country = 'Japan' で絞っている。ここはその「捨てている側」を
-- 意図的に見るためのクエリ。日本以外が本当にボットのままか、
-- 実読者（海外在住の日本語話者など）が混ざり始めていないかを定期的に確認する。
--
-- 判定の目安: エンゲージ率 0% かつ平均滞在ほぼ 0 秒ならボット。
-- 日本以外でエンゲージ率が継続的に立ってきたら、Japan 固定の前提を見直す。

-- (1) 国別のセッションとエンゲージ
SELECT
  country,
  SUM(sessions)         AS sessions,
  SUM(engaged_sessions) AS engaged,
  ROUND(100.0 * SUM(engaged_sessions) / NULLIF(SUM(sessions),0), 1) AS engaged_pct
FROM ga_source_daily
WHERE date >= date('now', '-30 days')
GROUP BY country
ORDER BY sessions DESC;

-- (2) 日本を除外したことで落ちている量（＝素の数字の水増し分）
SELECT
  SUM(sessions)                                                    AS sessions_all,
  SUM(CASE WHEN country =  'Japan' THEN sessions ELSE 0 END)       AS sessions_jp,
  SUM(CASE WHEN country <> 'Japan' THEN sessions ELSE 0 END)       AS sessions_excluded,
  ROUND(100.0 * SUM(CASE WHEN country <> 'Japan' THEN sessions ELSE 0 END)
        / NULLIF(SUM(sessions),0), 1)                              AS excluded_pct
FROM ga_source_daily
WHERE date >= date('now', '-30 days');

-- (3) 日本以外で滞在時間が立っているページ（本物の読者が混ざっている兆候）
SELECT
  country,
  page_path,
  SUM(sessions) AS sessions,
  ROUND(AVG(avg_engagement_time), 1) AS avg_time_sec
FROM ga_page_daily
WHERE date >= date('now', '-30 days')
  AND country <> 'Japan'
GROUP BY country, page_path
HAVING avg_time_sec > 10
ORDER BY avg_time_sec DESC;
