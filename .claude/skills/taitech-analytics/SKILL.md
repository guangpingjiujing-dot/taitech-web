---
name: taitech-analytics
description: GA4 と GSC の MCP から taitech.dev の実データを取得し、analytics/data/analytics.sqlite に冪等 upsert する。集めたデータに対して SQL でアドホック分析・定型レビューを実行するデータドリブン意思決定のワークフロー。Amazon アソシエイト / AdSense 準備 / 記事改善判断に使う。
---

# taitech-analytics

taitech.dev のデータドリブン意思決定を再現可能にするスキル。
GA4 と GSC の生データを SQLite に蓄積し、SQL でクエリする。

## 前提

- **GA4 property_id**: `544205654` (taitech.dev)
- **GSC site_url**: `sc-domain:taitech.dev`
- **DB path**: `analytics/data/analytics.sqlite` (プロジェクトルート基準)
- **スキーマ**: `analytics/schema.sql`
- **MCP**: `mcp__ga__*` と `mcp__gsc__*` が利用可能な前提。`.mcp.json` に定義済み。
- **自己トラフィック除外**: GA4 内部トラフィックフィルタを **2026-07-15 有効化済み**。以降のデータは運営者本人の閲覧が除外されている。**2026-07-15 より前のデータは汚染あり**（特に direct/(none) セッション、`/cmd_sco` 等のテスト path）。設定詳細は `docs/site/operations.md` 参照。

## 引数

このスキルは 3 モードで呼ばれる。ユーザーの発話から判断する。

1. **pull** — データ取得と DB 書き込み。「データ取ってきて」「アナリティクス更新」などの発話で起動。
2. **query** — 具体的な問い（例「今月伸びてる記事は？」）に SQL で答える。
3. **review** — 定型レビュー（伸び / 沈み / CTR 改善余地）を出す。

引数が曖昧なときは `pull → review` の順で 1 回通す。

---

## Mode: pull（データ取得）

**大枠のフロー**: MCP 生レスポンスを `analytics/snapshots/<YYYY-MM-DD>/*.json` に保存 → `python3 analytics/scripts/load.py analytics/snapshots/<YYYY-MM-DD>` で SQLite に UPSERT。ローダはファイル名の prefix でソースを判定する（`gsc_search_*.json`, `gsc_sitemap_*.json`, `ga_page_*.json`, `ga_source_*.json`, `ga_event_*.json`）。

### 手順

1. **既存収集を確認**（差分取得の起点を決める）

   ```bash
   sqlite3 analytics/data/analytics.sqlite \
     "SELECT source, MAX(date_end) FROM collections GROUP BY source;"
   ```

   - 既存があれば `date_end - 3日` から今日まで（GSC の確定遅延を考慮）
   - 空なら過去 90 日
   - ユーザーが期間を指定していればそれを優先
   - スナップショットの保存先ディレクトリ: `analytics/snapshots/$(date +%F)/`

2. **GSC を取得**（query × page × device × 日）

   `mcp__gsc__get_search_analytics` を呼ぶ。
   - `site_url`: `sc-domain:taitech.dev`
   - `dimensions`: `"date,query,page,device"`
   - `days`: 決定した日数
   - `row_limit`: 500（不足なら日別に分けて再呼び出し）

   返却された各行を `gsc_search_daily` に UPSERT。country は現行 MCP から取得できないので空文字で保存する。

3. **GA4 page daily を取得**

   `mcp__ga__run_report` を呼ぶ。
   - `property_id`: `544205654`
   - `date_ranges`: `[{"start_date": "<start>", "end_date": "<end>"}]`
   - `dimensions`: `["date", "pagePath"]` — **文字列配列**（オブジェクトではない）
   - `metrics`: `["sessions", "activeUsers", "engagedSessions", "engagementRate", "averageSessionDuration", "screenPageViews", "eventCount"]`
   - `limit`: 10000

   `date` は `YYYYMMDD` で返るので `YYYY-MM-DD` に変換して `ga_page_daily` に UPSERT。

4. **GA4 source daily を取得**

   同上、dimensions を `["date", "sessionSource", "sessionMedium", "sessionCampaign"]` に、metrics を `["sessions", "engagedSessions", "activeUsers"]` にして `ga_source_daily` に UPSERT。

5. **GA4 event daily を取得**

   dimensions `["date", "eventName", "pagePath"]`、metrics `["eventCount"]` で `ga_event_daily` に UPSERT。
   - Amazon リンククリック等のカスタムイベントが未設定の場合は `page_view` `session_start` `first_visit` 等の標準イベントのみ入る。それでも構わない。

6. **サイトマップ状態を取得**（インデックス把握用の軽い proxy）

   - まず `mcp__gsc__list_sitemaps`（無ければ `mcp__gsc__get_sitemap_details` を既知の sitemap_url に対して呼ぶ）でサイトマップ一覧を取得。taitech.dev は `next-sitemap` / Next.js 標準で `/sitemap.xml` に生成している。
   - 各サイトマップに対し `mcp__gsc__get_sitemap_details` を呼び、以下を `sitemap_status` に UPSERT:
     - `date` = 今日、`sitemap_url`、`type`、`is_pending`、`is_sitemaps_index`
     - `last_submitted`、`last_downloaded`
     - `warnings`、`errors`
     - `submitted_urls` = `contents[].submitted` の合計、`indexed_urls` = `contents[].indexed` の合計（API が返せば）
   - URL 単位の URL Inspection は今回スコープ外（クォータが重い）。必要になったら手動でクエリを叩く。

7. **collections に記録**

   各ソースについて `INSERT INTO collections (run_id, collected_at, source, date_start, date_end, rows_upserted)` する。`run_id` は `<ISO時刻>-<source>`。source は `gsc` `ga4_page` `ga4_source` `ga4_event` `gsc_sitemap` を使う。

8. **スナップショット保存**（オプション、デバッグ用）

   生 MCP レスポンスを `analytics/snapshots/<source>-<ISO日時>.json` に保存。gitignore 済み。

### ローダ実行

```bash
# スナップショットディレクトリ内の *.json をすべて処理
python3 analytics/scripts/load.py analytics/snapshots/2026-07-15
```

ローダは各テーブルに対して `INSERT ... ON CONFLICT ... DO UPDATE` を行うので、同じスナップショットを複数回流しても同じ結果になる（冪等）。`collections` テーブルに実行ログも 1 行追加される。

DDL は `analytics/schema.sql`（`CREATE TABLE IF NOT EXISTS` のみ）。スキーマ変更時は該当テーブルを DROP → schema.sql 実行 → 最新スナップショットから再ロード。

### MCP 呼び出しの落とし穴

- `mcp__ga__run_report` の `dimensions` / `metrics` は **文字列の配列**。`{"name": "..."}` のオブジェクト形式は `Input validation error` になる。
- `sessionCampaign` は無効な dimension。**`sessionCampaignName`** を使う（`sessionCampaignId` も存在する）。
- `order_bys` は snake_case protobuf 形式が求められる。挙動が不安定なので **付けない**。SQL 側でソートする。
- `mcp__gsc__get_search_analytics` の `row_limit` は max 500。500 件で足りない期間は日別に分けて複数回呼ぶ。
- GSC は 2〜3 日遅れて確定するため、最新 3 日分は必ず再取得する。
- `mcp__gsc__get_sitemap_details` の `submitted` / `indexed` は **Google が最後にサイトマップをクロールした時点** の値。ライブ sitemap.xml と乖離することがある（`last_downloaded` で確認）。乖離したら GSC 側の再送信を検討。

---

## Mode: query（アドホック分析）

`analytics/queries/*.sql` に定型クエリを置いてある。まずここを見て、あればそれを実行する。無ければ SQL を書き下ろす。

実行:

```bash
sqlite3 -header -column analytics/data/analytics.sqlite < analytics/queries/<name>.sql
```

もしくは inline:

```bash
sqlite3 -header -column analytics/data/analytics.sqlite "SELECT ..."
```

書き下ろしたクエリで再利用性が高そうなものは `analytics/queries/` に保存する。

---

## Mode: review（定型レビュー）

**必ずレポート冒頭に「データ品質メモ」を書く**: 2026-07-15 より前のデータは自己トラフィック汚染ありと明記する。分析対象が 2026-07-15 以降のみなら「清浄データ」、跨いでいるなら「前半汚染 / 後半清浄」と分けて解釈する。

以下を順に実行し、結果を Markdown で `analytics/reports/review-<YYYY-MM-DD>.md` に書き出す。

1. `analytics/queries/top_pages_30d.sql` — 直近 30 日の PV / セッション上位 20 ページ
2. `analytics/queries/ctr_opportunities.sql` — impressions 多いが CTR 低い / 順位悪いクエリ（改善余地）
3. `analytics/queries/growth_pages.sql` — 直近 14 日 vs その前 14 日で impressions が伸びた / 沈んだページ
4. `analytics/queries/source_mix.sql` — 流入 source/medium の直近 30 日構成

各結果に対し、以下の観点で**短く**コメント:

- **Amazon 発送 3 件達成**（最優先 KPI、期限 2027-01 頃）: 書籍紹介記事の露出・流入・CTR
- **AdSense 通過準備**: 記事数増・低品質ページ有無
- **menta CTA**: 補助的（本命ではない）。触れるのは違和感がある場合のみ

過剰な分析はしない。「事実 → 打ち手候補 1〜2 個」で 1 セクション。

---

## KPI 対応表

| KPI | 見るテーブル / クエリ |
|---|---|
| Amazon 発送 3 件 (2027-01 目標) | `ga_event_daily` の outbound_click（要イベント設定） + `ga_page_daily` の書籍記事セッション |
| AdSense 通過 | 全体 PV / セッション（`ga_page_daily`）、記事数（`app/**/page.tsx` を数える） |
| SEO 順位改善 | `gsc_search_daily` の position・CTR |
| 記事別価値評価 | `ga_page_daily` × `gsc_search_daily` の join |

## 参照

- MCP 設定: `.mcp.json`
- モネタイゼーション優先順位: `docs/strategy/roadmap.md`
- プロジェクト概要: `AGENTS.md`