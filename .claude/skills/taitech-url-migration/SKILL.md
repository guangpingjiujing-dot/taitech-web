---
name: taitech-url-migration
description: taitech.dev で公開済みの URL を動かす (セクションの再編・パスの変更・ページの統廃合) ときの手順。動かすべきかの判断基準、308 リダイレクトの置き方と削除の契機管理、外部媒体 (Qiita / Zenn / X) のリンク張り替え、そして移設直後に必ず要る GSC のインデックス登録リクエストまでを含む。URL を変える前と、デプロイ直後の 2 回使う。
---

# taitech-url-migration

公開済みの URL を動かすときの運用スキル。**plan**（動かす前）と **aftercare**（デプロイ直後）の
2 モードがある。

**このスキルが存在する理由**: 2026-08-15 の `/fe` 再編で、**移設前はインデックスされていた
29 URL が、移設後 6 日経っても新 URL では 30 件中 2 件しか入っていなかった** (6.7%)。
308 は正しく置いていた。**「308 を置いたから大丈夫」が誤り**だったという実測が出発点
(`analytics/reports/review-2026-08-21.md` §2)。

---

## Mode: plan（動かす前）

### 1. そもそも動かすか — 早いほど安い

URL 変更のコストは**公開からの経過時間に比例する**。判断はこの 1 点でよい。

| 状態 | コスト | 判断 |
|---|---|---|
| 公開 2 週間以内・インプレッションほぼゼロ | **実質ゼロ** | 直す価値がある。今やる |
| 順位が付き始めている | 中 | 得られる情報設計の改善と天秤 |
| 被リンク・外部からの直リンクがある | 高 | 原則やらない |

前例: `/fe` 再編は公開 12 日目・GSC のインプレッション 0 の状態で実施した (roadmap #45)。
**この判断自体は正しかった**。誤っていたのは移設後の手当て (§aftercare)。

### 2. 影響範囲を先に数える

```bash
# ビルド成果物を grep すると「実際にどのページの HTML が変わるか」が正確に出る
npm run build
cd .next/server/app && grep -rl "<動かす URL の一部>" --include="*.html" . | sed 's|^\./||; s|\.html$||' | sort
```

内部リンクは `TopicNavDrawer` が全ページに出しているので、**大半のページがヒットするのが正常**。
重要なのは「本文が変わるページ」と「ナビだけ変わるページ」を分けること。

### 3. 明示列挙されたリストを洗う

このリポジトリには学習順序を手で並べた配列が複数あり、いずれも `.filter(Boolean)` や
`find(...)!` で解決している。**未記載のものは例外にならず黙って表示から消える**。

```bash
grep -rn "as const" src/components/layout/PrevNext.tsx src/app/*/page.tsx src/components/layout/TopicNav.tsx
```

`src/content/topic-coverage.test.ts` が why-need-rdb については固定しているが、
**他セクションは未カバー**。移設対象のセクションに同種のリストがないか必ず見る。

### 4. リダイレクトを置く

`next.config.ts` の `redirects()` に 308 で置く。**冒頭のコメントが運用ルールの一次情報**。

- **削除トリガーを同時に決める**。「いつか消す」は永久負債になる
- トリガーの形: 「旧 URL の `coverage_state` が "Submitted and indexed" から外れたら削除」
  + **最終期限** (トリガー未達でも無条件に削除する日)
- **決めたトリガーを `docs/strategy/roadmap.md` の優先アクション表に積む**。
  契機はこの表でしか担保されない (roadmap #47 が前例)

---

## Mode: aftercare（デプロイ直後）— ここが本題

**308 を置いてデプロイしただけでは、新 URL はインデックスに戻らない。**

### 1. 自動で済むもの（作業不要）

| 経路 | 状態 |
|---|---|
| IndexNow (Bing / Yandex / Naver / Seznam) | `postbuild` の `scripts/index-now.mjs` が production デプロイ時に自動送信 |
| sitemap 再送信 (Google) | GSC MCP の `submit_sitemap` で送る。API があるので手作業は不要 |

### 2. 新 URL のインデックス登録リクエスト（**必須・手作業**）

**GSC の「インデックス登録をリクエスト」は API に存在しない**。Google の Indexing API は
`JobPosting` と `BroadcastEvent` にしか使えない。**GSC の UI から 1 URL ずつ押すしかない**。
日次上限があり、一般には 10〜20 件と言われる。**正確な値は未確認**。
**枠はプロパティ単位で、その日に出した全リクエストの合計で消費される**
（別セクションの URL を先に出していると、その分だけ少なくなる）。
**10 件前後を目安に出し、弾かれたらそこで止める**運用でよい。

**このサイトではこれがインデックス率をほぼ説明している** (2026-08-21 の実測):

| セクション | リクエストを出したか | インデックス率 |
|---|---|---|
| why-need-rdb | 出した | **100%** |
| fe/sql | 出した | 93.1% |
| joho1 | 一部だけ | 27.6% |
| fe/algorithm | **出していない** | **6.7%** |

決定的な例が `/why-need-rdb/isolation-levels` で、**リクエストから 12 分でクロールされ、
そのままインデックスされた**（公開当日）。

その後 `/fe/algorithm` の 28 件を 08-21〜08-23 にリクエストした結果、
**6.7% → 90.0%（27/30）まで戻った**（`analytics/reports/review-2026-08-21.md` §8）。
移設で消えた資産は、この手作業だけでほぼ全部回収できる。

#### ⚠️ 状態を確認するのは「リクエストの 3 日後」

**リクエスト当日の URL Inspection の値には意味が無い。**
`Crawled - currently not indexed` / `Discovered` / `URL is unknown to Google` はいずれも
**GSC の表示が実態に追いついていないだけ**のことがある。

2026-08-22 にこれを守らず、リクエスト直後の 11 件を見て
**「インデックス 0 件。似た quiz は採用されない」と結論**した。
**3 日後に取り直したら 11 件すべて `Submitted and indexed`** で、結論は完全な誤りだった。
この誤読で joho1 21 件のリクエストを 3 日間止めている。

- **判定は最短でも 3 日後**に取る。効果測定の基準日は「リクエスト日 + 3 日」
- `Crawled - currently not indexed` を見て**すぐにページ本文の改善に走らない**。
  3 日後も残っていて初めてページ側の問題として扱う
- **例外は「リクエストしたのにクロールが来ていない」ケース**（`Discovered` のまま数日）。
  これは採用の失敗ではなく取りに来ていないだけなので、**再リクエストの価値がある**

**クロール予算の問題ではない**。Google は「数千 URL 未満のサイトでは気にする必要はない」と
している。`Discovered - currently not indexed` は予算切れではなく**価値判断の保留**で、
明示シグナルを送ると通る、という状態。

順序は次のとおり。

1. **ハブ**（`/fe/algorithm`、`/fe/algorithm/lessons` など）。ハブが入らないと配下へのクロールも通らない
2. **PV 実績の高い順に配下**。順位付けは GA4 から出す

```bash
sqlite3 -noheader analytics/data/analytics.sqlite \
  "SELECT page_path, SUM(screen_page_views) pv FROM ga_page_daily
   WHERE country='Japan' AND page_path LIKE '<新パス>%'
   GROUP BY 1 ORDER BY pv DESC;"
```

3. 出したら**次回レビューまで放置**する。同じ URL を再送しても効果は上がらない
4. **1 日目はハブを必ず全部出し切る**。枠は途中で尽きうるので、入口を優先しておけば
   配下が翌日以降に回ってもクロールはハブ経由で通る

### 3. 外部媒体のリンク張り替え

308 が効くので**壊れはしない**が、リダイレクトを挟むぶん損をする。

| 媒体 | 対応 |
|---|---|
| Qiita (`../qiita/public/*.md`) | 張り替える。**`qiita publish --all` は 1 記事でも「Qiita 側が新しい」と判定されると全体が中断する**。`../qiita/AGENTS.md` の commit → pull → checkout の順を守る |
| Zenn (`../zenn/articles/*.md`) | 張り替える |
| X の過去投稿 | **編集できないので放置で確定**。308 が効いていることだけ確認する |

### 4. 検証

```bash
# 新 URL が 200、旧 URL が 308 で新 URL に着地することを実測する
for u in <新 URL...>; do echo "$(curl -s -o /dev/null -w '%{http_code}' https://taitech.dev$u) $u"; done
for u in <旧 URL...>; do curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://taitech.dev$u; done
```

E2E にも旧 URL の 308 を 1 本入れておく（前例: `tests/smoke.spec.ts` の
「FE: 旧 URL が 308 で新 URL に着地する」）。

### 5. 効果測定を roadmap に積む

**基準日は push した日**（実装完了日ではない）。2〜4 週間後に
`uv run analytics/scripts/inspect_urls.py` を回し、`url_index_status` でセクション別の
インデックス率を見る。**「インデックスされていない」と「インデックス済みだが呼ばれない」は
打ち手が全く別**なので、必ず割ってから次の手を決める。

---

## チェックリスト（コピー用）

```
plan
- [ ] 公開からの経過時間で「動かすか」を判断した
- [ ] ビルド成果物を grep して影響ページを数えた
- [ ] 明示列挙のリスト (PrevNext / セクションハブ / TopicNav) を洗った
- [ ] 308 を next.config.ts に置き、削除トリガーと最終期限を決めた
- [ ] 削除トリガーを roadmap の優先アクション表に積んだ

aftercare
- [ ] 新 URL 200 / 旧 URL 308 を実測した
- [ ] GSC に sitemap を再送信した (MCP)
- [ ] **新 URL のインデックス登録リクエストを GSC UI から出した（ハブ → PV 順）**
- [ ] **インデックス状態の確認を「リクエスト日 + 3 日」で予約した（当日の値は読まない）**
- [ ] Qiita / Zenn のリンクを張り替えた
- [ ] 効果測定タスクを roadmap に積んだ（基準日 = push した日）
```
