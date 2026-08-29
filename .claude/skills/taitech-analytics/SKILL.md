---
name: taitech-analytics
description: GA4 と GSC から taitech.dev の実データを取得し、analytics/data/analytics.sqlite に冪等 upsert する。集めたデータに対して SQL でアドホック分析・定型レビューを実行するデータドリブン意思決定のワークフロー。Amazon アソシエイト / AdSense 準備 / 記事改善判断に使う。
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
- **自己トラフィック除外**: GA4 内部トラフィックフィルタを **2026-07-15 有効化済み**。**2026-07-15 より前のデータは汚染あり**（特に direct/(none) セッション、`/cmd_sco` 等のテスト path）。設定詳細は `docs/site/operations.md` 参照。
  **ただしこのフィルタは IP ベースで自宅回線しか除外しない**。モバイル回線・外出先からの本人の閲覧は素通りする。新機能の公開直後にセッション数が跳ねて回遊が異常に深い日は、まず本人の閲覧を疑い、ユーザーに確認してから読者の行動として解釈すること（2026-08-05 がこれで、`amazon_click` 4 件が本人だった）。
- **海外トラフィックはほぼ全てボット**（2026-08-07 に国別で確認）。直近 30 日で US 53 セッションが**エンゲージ 0 件**、対して Japan 61 セッションはエンゲージ 36%。**素のセッション数の 55% が日本以外**で、含めると流入構成を完全に読み違える（direct/(none) が 96 セッション＝全体の 73% に見えていたが、日本のみだと 5 セッション）。
  **対策は実装済み**: `ga_page_daily` / `ga_source_daily` / `ga_event_daily` に `country` 列がある。
  定型クエリは `country = 'Japan'` で絞ってあるので、**新しく SQL を書くときも必ず同じ条件を入れる**。
  捨てている側の監査は `analytics/queries/bot_audit.sql`。

## 引数

このスキルは 3 モードで呼ばれる。ユーザーの発話から判断する。

1. **pull** — データ取得と DB 書き込み。「データ取ってきて」「アナリティクス更新」などの発話で起動。
2. **query** — 具体的な問い（例「今月伸びてる記事は？」）に SQL で答える。
3. **review** — 定型レビュー（伸び / 沈み / CTR 改善余地）を出す。

引数が曖昧なときは `pull → review` の順で 1 回通す。

---

## Mode: pull（データ取得）

**大枠のフロー**: 各ソースを `analytics/snapshots/<YYYY-MM-DD>/*.json` に保存 → SQLite へ UPSERT。

取得経路は 2 系統ある。**スクリプトがあるものは必ずスクリプトを使う**（人手の転記を挟まないため）。

| ソース | 取得方法 | 人手の転記 |
|---|---|---|
| GA4 (page / source / event) | `analytics/scripts/pull_ga.py` | **なし** |
| GSC URL Inspection | `analytics/scripts/inspect_urls.py` | **なし** |
| GSC Search Analytics | `analytics/scripts/pull_gsc.py` → `load.py` | **なし** |
| GSC サイトマップ | MCP → snapshot → `load.py` | あり |

`load.py` はファイル名の prefix でソースを判定する（`gsc_search_*.json`, `gsc_sitemap_*.json`,
`ga_page_*.json`, `ga_source_*.json`, `ga_event_*.json`）。

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

   ```bash
   uv run analytics/scripts/pull_gsc.py --start <YYYY-MM-DD> --end <YYYY-MM-DD>
   python3 analytics/scripts/load.py analytics/snapshots/$(date +%F)
   ```

   **MCP (`mcp__gsc__get_search_analytics`) は使わない**。GA4 と同じ理由で、
   レスポンスがエージェントの文脈を経由するため数百行を snapshot JSON へ**手で書き写す工程**が
   入る。加えて MCP は `row_limit` が max 500 でページングが無く、`dataState` も指定できない。
   スクリプトは startRow を回して全件取り、**`dataState=final`（確定分のみ）で保存する**。

   **DB に入れるのは確定値だけ。** 未確定の直近数日を見たいときは
   `--data-state all --out <一時ディレクトリ>` で別に取り、**`load.py` には流さない**。
   混ぜると、後から「遅延だったのか実変動だったのか」を DB から切り分けられなくなる
   （2026-08-29 はこの 2 本を突き合わせて、変化が 08-22 起点の実変動だと確定させた）。

   `country` は dimensions に入れない。`gsc_search_daily` の PK は
   `(date, query, page, device, country)` で既存行は `country=''`。ここで country を足すと
   同じ実績が別行として二重に入る。

3. **GA4 を取得**（page / source / event をまとめて）

   ```bash
   uv run analytics/scripts/pull_ga.py --start <YYYY-MM-DD> --end <YYYY-MM-DD>
   # もしくは
   uv run analytics/scripts/pull_ga.py --days 21
   ```

   **MCP (`mcp__ga__run_report`) は使わない**。MCP はレスポンスがエージェントの文脈を
   経由するため、数百行を snapshot JSON へ**手で書き写す工程**が入る。これは非決定的で
   誤りが混入する（2026-08-07 の初回 pull で実際に 253 行を転記している）。
   このスクリプトは Data API を直接叩き、取得 → snapshot 保存 → SQLite UPSERT →
   `collections` 記録までを人手を介さずに行う。ページングも内部で処理する。

   取得するディメンション / メトリクスの定義はスクリプト内の `REPORTS` が一次情報。
   **`country` を必ず含める**（ボット除外の前提。上の「海外トラフィック」節を参照）。

   MCP の `mcp__ga__run_report` を使うのは、定型外のディメンションを 1 回だけ試したいとき
   のみ。その場合も DB には書かず、探索に留めること。

4. **サイトマップ状態を取得**（インデックス把握用の軽い proxy）

   - まず `mcp__gsc__list_sitemaps`（無ければ `mcp__gsc__get_sitemap_details` を既知の sitemap_url に対して呼ぶ）でサイトマップ一覧を取得。taitech.dev は `next-sitemap` / Next.js 標準で `/sitemap.xml` に生成している。
   - 各サイトマップに対し `mcp__gsc__get_sitemap_details` を呼び、以下を `sitemap_status` に UPSERT:
     - `date` = 今日、`sitemap_url`、`type`、`is_pending`、`is_sitemaps_index`
     - `last_submitted`、`last_downloaded`
     - `warnings`、`errors`
     - `submitted_urls` = `contents[].submitted` の合計、`indexed_urls` = `contents[].indexed` の合計（API が返せば）
5. **URL 単位のインデックス状態を取得**（`url_index_status`）

   ```bash
   uv run analytics/scripts/inspect_urls.py     # live sitemap.xml の全 URL
   ```

   MCP ではなくサービスアカウントで URL Inspection API を直接叩く
   （2026-08-29 時点で 144 URL・約 10 分）。
   MCP の `mcp__gsc__inspect_url_enhanced` は 1 URL ずつなので全件収集には使わない
   （個別の深掘りには有用）。

   **これは省略しないこと**。`sitemap_status.indexed_urls` は常に 0、`gsc_search_daily` は
   露出のあったページしか含まないので、**「インデックスされているが検索に呼ばれていない」
   ページはこのテーブルでしか見えない**。この 2 つは打ち手が全く別物（前者は被リンク・
   内部リンク、後者は title / クエリ適合）なので、切り分けずに施策を打つと必ず外す。

   クォータは 2000 query/日・600 query/分。1 日に何度も回さない。

6. **collections に記録**

   各ソースについて `INSERT INTO collections (run_id, collected_at, source, date_start, date_end, rows_upserted)` する。`run_id` は `<ISO時刻>-<source>`。source は `gsc` `ga4_page` `ga4_source` `ga4_event` `gsc_sitemap` `gsc_url_inspect` を使う。

7. **スナップショット保存**

   MCP 経由のソース（GSC）は生レスポンスを `analytics/snapshots/<YYYY-MM-DD>/` に保存してから
   `load.py` に流す。スクリプト経由のソース（GA4 / URL Inspection）は保存まで自動。
   `analytics/` 配下は gitignore 済み。

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
- GSC は 2〜3 日遅れて確定するため、最新 3 日分は必ず再取得する。
  **確定境界は推測せず `dataState=final` に判定させる。** `pull_gsc.py`（final）の返す最大日付が
  確定境界そのもの。2026-08-29 の実測では確定は 08-26 まで（08-27/28 は未確定、08-29 は行なし）で、
  未確定込みだと 08-27 が 35 imp あった。**UI で「直近数日が動いた」ように見えるのはこの層**。
- `mcp__gsc__get_search_analytics` は探索用にのみ使う（`row_limit` max 500・ページング無し・
  `dataState` 指定不可）。DB に入れる取得には使わない。
- `mcp__gsc__get_sitemap_details` の `submitted` / `indexed` は **Google が最後にサイトマップをクロールした時点** の値。ライブ sitemap.xml と乖離することがある（`last_downloaded` で確認）。乖離したら GSC 側の再送信を検討。
- 同 API の `indexed` は **常に 0 が返る**（2026-07-14 / 07-24 / 08-06 の 3 回とも 0）。API 側の欠測であって未インデックスではない。`sitemap_status.indexed_urls` を根拠に「インデックスされていない」と結論しないこと。インデックス状態は `url_index_status`（手順 5）を見る。

### 集計の落とし穴

- **`ga_page_daily.sessions` をページ横断で SUM してはいけない**。GA4 の `sessions` は
  `pagePath` ごとに立つので、1 セッションが 20 ページ回遊すると 20 行それぞれに 1 が入る。
  日次・期間合計のセッション数は必ず **`ga_source_daily`** から取る。
  `ga_page_daily` の `sessions` は「そのページ単体を含んだセッション数」としてのみ読む。
  （2026-08-05 が「55 セッション」に見えたが実数は 8 だった。）

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
5. `analytics/queries/url_index_status.sql` — インデックス台帳。coverage 内訳 / 未インデックス一覧 /
   セクション別インデックス率 / **インデックス済みだが 28 日露出ゼロのページ**
6. `analytics/queries/bot_audit.sql` — 国別の混入監査。1〜4 が `country = 'Japan'` で
   捨てている側を確認する。日本以外でエンゲージ率が継続的に立ってきたら Japan 固定を見直す

**「検索流入が無い」を 1 つの問題として書かない**。必ず (a) インデックスされていない
(b) インデックス済みだが呼ばれない、に割ってから打ち手を出す。(a) は被リンク・内部リンク、
(b) は title / クエリ適合で、打ち手が交差しない。
（2026-08-07 のレビューでは未インデックス 19 件が全て `/fe/quiz/*` に集中していた。
2 URL のサンプルだけ見て「インデックス障害ではない」と一度誤った結論を書いている。）

### 事実確認せずに書きがちな誤り（2026-08-07 に実際に 3 つやった）

- **クロール予算をこのサイトの制約として書かない**。Google は「数千 URL 未満のサイトでは
  クロール予算を気にする必要はない」としており、taitech.dev の 72 URL は遠く及ばない。
  `Discovered - currently not indexed` は予算切れではなく **Google が価値判断を保留している**状態。
  したがって「未インデックスが溜まっているからページ追加を控えろ」は**誤った助言**。
  避けるべきなのは量ではなく種類（保留中と同じテンプレートを積み増すこと）だけ。
- **GA4 上のボット / 自己トラフィックを AdSense 審査のブロッカーとして書かない**。審査は
  サイトの内容・ナビゲーション・ポリシー適合を見るもので、運営者の解析データは審査側から
  見えない。無効トラフィックが問題になるのは承認後の広告表示・クリック。
- **URL Inspection API に「インデックス登録リクエスト」は無い**（読み取り専用）。リクエストは
  GSC UI の手作業で 1 日 10 件程度が上限。一括処理の手段として提案しないこと。
  少数（2〜3 件）を診断として使い、`Crawled - currently not indexed` で返るなら
  スケジューリングではなくページ自体の価値評価の問題、という切り分けに充てる。

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