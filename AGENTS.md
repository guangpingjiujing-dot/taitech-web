<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deployment

- **Host**: Vercel。GitHub `main` への push で本番デプロイが自動発火する。
- **Production URL**: https://taitech.dev
- **Domain**: `taitech.dev`（Registrar/DNS 事業者の詳細は `docs/site/operations.md`）。`www.taitech.dev` は 308 で apex にリダイレクト（`next.config.ts` の `redirects()` で実装）。
- **HTTPS**: Vercel が Let's Encrypt 相当の証明書を自動発行・更新。
- **Preview**: main 以外のブランチを push すると Vercel が Preview デプロイを自動発行する。

## Environment variables

`.env.example` に一覧。本番の値は Vercel Project Settings → Environment Variables で管理。

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `sitemap.xml` / `robots.txt` / OGP / canonical の base URL。本番は `https://taitech.dev`。 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 測定 ID。空なら GA タグは挿入されない。 |
| `BING_WEBMASTER_API_KEY` | Bing Webmaster Tools の API キー。`postbuild` の `scripts/bing-submit.mjs` が URL 送信に使う。**認証情報なので公開ファイルに出さない**（IndexNow のキーとは性質が違う）。未設定ならスキップするだけでビルドは通る。 |

## デプロイ後の確認（push したら必ずやる）

**ビルドが緑 = 成功、ではない。** このリポジトリの後処理（`postbuild` など）は
**失敗しても exit 0 で通す**設計にしてある。送信系や通知系のために本番デプロイが
止まるほうが損だからで、これ自体は正しい。**その代償として、失敗はビルドログの中にしか出ない。**

```bash
npm run check:deploy              # 直近の本番デプロイ
npm run check:deploy -- <url>     # 特定のデプロイ
```

これが出すのは 2 つ。**両方を見る。**

1. **後処理のログ** — `[name] ...` の行を全部。「0 件でした」と「そもそも動いていない」は
   別物なので、件数が 0 でも行が出ているかを確認する
2. **失敗の形に一致した行** — `Not failing the build` / `HTTP 4xx・5xx` / `FAILED` /
   `unexpected error` / 接続エラー。1 件でもあれば exit 1

**ログが綺麗でも終わりではない。** 「ビルドが通った」と「意図した出力になっている」は別問題。
**変更したページやファイルを本番に `curl` して中身を確かめる**ところまでがデプロイ後の確認。

### なぜこれを明文化したか（2026-08-28 に発覚した事故）

IndexNow への URL 送信が、**2026-07-26 の実装以来ほぼ 1 ヶ月、1 件も送れていなかった**。
毎回 `403` を返していたが `Not failing the build` で握りつぶされ、**ビルドは緑のまま**。
誰も気付かないまま `docs/strategy/roadmap.md` には「IndexNow は効いている」と書かれ、
**それを前提にした判断（Bing のインデックス増加の帰属）まで積み上がっていた**。

**IndexNow 固有の問題ではない。** 同じ形の後処理を足せば同じことが起きる。
実際 `check:deploy` は導入直後の初回実行で、**その日に入れたばかりの
`bing-submit.mjs` がクォータを無駄遣いする不具合を検出した**。

### 新しく「失敗しても続行する」処理を足すときの規約

この検知が効き続けるために、**両方守る**。

- **ログの先頭に `[name]` を付ける**（`[bing]` のように）。`check:deploy` はこれを拾って
  「動いたのか / 動いていないのか」を見せる
- **握りつぶすときは必ず `Not failing the build` という語をログに含める**。
  `check:deploy` の検出語彙になっている。独自の言い回しにすると検知から漏れる

## DNS / routing notes

- apex (`taitech.dev`) と `www.taitech.dev` の両方を Vercel に登録済み。
- DNS プロバイダのプロキシ機能を使う場合は **DNS-only mode**（グレー雲）で運用する。プロキシ経由にすると Vercel の SSL 発行が失敗する。
- www → apex の恒久リダイレクト（308）はアプリ層（`next.config.ts` の host マッチ）で行う。DNS 側でリダイレクトさせない。

## Deploy operations (Claude Code 用チートシート)

```bash
# ログイン中のアカウント確認
vercel whoami

# 対象プロジェクト（このディレクトリで実行する前提）
vercel project ls | grep rdb-index

# 手動プロダクションデプロイ（普通は git push で十分）
vercel --prod --yes

# デプロイ後の確認（push したら必ず。上の「デプロイ後の確認」を参照）
npm run check:deploy

# 生ログを直接見る
vercel inspect --logs <deployment-url>   # ★ ログは stderr に出る

# 環境変数の追加
printf "value" | vercel env add NAME production

# ドメイン状態
vercel domains inspect taitech.dev
```

# Development

## Git ワークフロー: **main 直コミット**（ブランチも PR も作らない）

このプロジェクトは個人開発。レビュワーが存在しないので、**作業ブランチを切らず `main` に直接
コミットして直接 push する**。これは Claude Code のデフォルト挙動（「default branch にいたら
まずブランチを切る」）を**明示的に上書きする指示**。

- **やらないこと**: `git checkout -b`、`gh pr create`、PR 経由のマージ。
  ユーザーから明示的に「ブランチを切って」と言われた場合だけ例外
- **やること**: `main` で commit → `git push` → Vercel が本番デプロイを自動発火
- 検証は PR のチェックではなく**ローカルで push 前に**行う（`npx tsc --noEmit` /
  `npm run test:unit` / `npm run test:e2e` / `npm run build`）
- **push した後も終わりではない**。`npm run check:deploy` でビルドログを見て、
  握りつぶされた失敗が無いかを確認する（上の「デプロイ後の確認」節）
- commit / push はユーザーが依頼したときだけ。勝手に push しない（push = 即本番デプロイ）

**なぜこれを明文化したか（2026-08-07 の事故）**: title 短縮 (#29/#30) を PR #1 に積んだまま
マージを忘れ、**丸 1 日本番が旧 title を配信し続けた**。しかも `docs/strategy/roadmap.md` には
「2026-08-07 デプロイ済み」と書かれていたため、**docs と本番が食い違った状態**になった。
効果測定の基準日がずれると SEO 施策の評価期間がまるごと無駄になる。
ブランチは個人開発では「デプロイし忘れる置き場」にしかならない。

## Package manager

`npm` を使う。`bun` はローカルに入っていない環境がある。

## Common commands

```bash
# 型チェック（package.json に script が無いので直接叩く）
npx tsc --noEmit

# 開発サーバー
npm run dev

# 本番ビルド
npm run build

# E2E テスト（Playwright、全ページのコンソールエラー/警告検知 + インタラクティブ viz テスト）
npm run test:e2e

# E2E UI モード
npm run test:e2e:ui
```

コンポーネント追加・レイアウト変更後は E2E テスト実行推奨。全ページで console error / warning が出ないことを保証している。

## UI コンポーネントの共通化方針

**新しいセクション追加時に UI パーツをコピペしない**。既存の見た目が 2 箇所以上で必要なら、必ずコンポーネント化して共有する。今後の運用保守コストを直接下げる最重要ルール。

### 実装前の確認手順

1. 「これから書こうとしている UI」に対して、以下を **1 分以内で grep** する。
   ```bash
   # 例: パンくずを書こうとしているとき
   grep -rn 'aria-label="パンくず"' src/
   # 例: 「前のレッスン / 次のレッスン」のようなカードを書こうとしているとき
   grep -rn "PrevNext\|前へ\|次へ" src/components/
   # 例: 定義ボックス
   grep -rn "border-l-2 border-\[var(--foreground)\]" src/components/
   ```
2. 既存のコンポーネントで賄えるか判断:
   - **賄える** → そのまま呼ぶ
   - **見た目は同じだが引数の型が違う** → presentation とデータ層を分ける (下記のパターン)
   - **見た目そのものが違う要件** → 新規コンポーネントを作り、`src/components/{領域}/` へ置く

### presentation / データ層分離パターン (推奨)

既存コンポーネントが特定のドメインモデル (`Topic` 等) に密結合していて別ドメインから呼べない場合、**中身の見た目は 1 箇所** に保ちつつ、データ層は各セクションが持てるようにする。

前例: `src/components/layout/PrevNext.tsx`
- `PrevNextCards({prev, next})` — `{href, shortTitle}` だけ受け取る presentation
- `PrevNext({section, currentSlug})` — Topic 系の学習順序を解決して `PrevNextCards` に渡すラッパー
- `FeLessonLayout` は自前で neighbors を計算して直接 `PrevNextCards` を呼ぶ

**Topic union に他ドメインの型を混ぜないこと**。混ぜると `findTopic` / `topicsInSection` / `sitemap` など 5〜10 箇所に波及する。

### ディレクトリ規約

- `src/components/ui/` — **ドメイン非依存の primitives** (Button, Card, Container, Badge)。ここに置くものは Topic / section / 特定 CMS を知らない
- `src/components/layout/` — **ページ骨組み** (TopicLayout, PrevNext, FAQ, Header, Footer)。sections / topics を知ってよい
- `src/components/cta/` — **モネタイズ導線** (AffiliateBooks, MentorCTA, BookSidebar, AmazonLink)
- `src/components/seo/` — **JSON-LD ジェネレータ** (JsonLd.tsx 内に `TopicJsonLd`, `FePlaygroundJsonLd` 等を集約)
- `src/components/{section}/` — **セクション固有** (fe/, viz/rdb-fundamentals/ 等)。他セクションから import されない前提のもの

### 「コピペしていい例外」

- インライン `style` を数行だけ書いて済むピクセル調整 (縦の余白 2px 詰めなど)
- 同じ見た目でも「試行錯誤中で最終形が固まっていない」場合 (2 コミット以内に共通化する)

これらも 3 回目に登場したら必ず抽出する。

### インライン style と Tailwind の混在について

このプロジェクトは Tailwind を基本にしているが、Playground など動的 UI では inline `style={{}}` が混在している。**新規コンポーネントは Tailwind を優先**。既存の inline style は触ったついでに Tailwind へ寄せる (無理して全部書き換えなくてよい)。

## Tailwind v4 / prose-jp のはまりどころ

過去にこれらで数時間ハマったので明文化。触るたびに再発しないよう **事前に読んでから作業**。

### 1. `!important` は **suffix** (v4 の非互換変更)

Tailwind v4 は `!` を **class 名の末尾** に付ける。v3 の prefix (`!text-white`) は v4 では効かない。

```html
<!-- ❌ v3 syntax。v4 では単なる class 名として扱われて important にならない -->
<a class="!text-white !no-underline">…</a>

<!-- ⭕ v4 syntax。suffix にする -->
<a class="text-white! no-underline!">…</a>
```

用途: 主に **specificity の高いグローバル CSS を上書きしたいとき** (次項参照)。

### 2. `.prose-jp a` (globals.css) の specificity trap

`src/app/globals.css` の `.prose-jp a` は specificity `(0,1,1)`。Tailwind の utility class `text-[...]` は `(0,1,0)` なので、**prose-jp コンテナ内の anchor に utility で色 / 下線を当てても勝てない**。

lesson 本文 (LessonLayout の `<div className="prose-jp mt-10 max-w-none">`) の中で Button の primary variant を使うと、`.prose-jp a { text: var(--foreground); underline; }` が勝って黒背景に黒文字 + 下線という不可視状態になる。

**回避策 3 択:**
- **`!` suffix で優先度を上げる** (推奨、局所修正): `className="text-[var(--primary-foreground)]! no-underline! hover:no-underline!"` — 前例: `src/components/fe/Playground.tsx` の deep link ボタン
- **`not-prose` でラップする**: 埋め込みエディタや自作パネルなど「prose のスタイルを一切受けたくない」ブロック全体に。埋め込み Playground はこの形 (`<div className="not-prose my-6"><Playground /></div>`)
- **`.prose-jp a` を `:where(...)` で lower-specificity 化する**: 波及範囲が広いのでプロジェクト方針変更として別セッションで議論する

### 3. Tailwind Preflight が `<button>` の cursor を `default` にリセットする

素の `<button>` にホバーしても指カーソルにならない。対策済:
- `src/components/ui/Button.tsx` の `buttonVariants` base に `cursor-pointer` を追加済 → **`Button` を経由する限り自動で指カーソル**
- raw `<button>` (Playground の snippet chip 等) を書くときは inline style / class で明示 (`cursor: "pointer"` or `cursor-pointer`)

### 4. TopicNav の section 分岐は **明示列挙が必要**

`src/components/layout/TopicNav.tsx` の分岐は `rdb-index / why-need-rdb / fe / (else = data-modeling)` の順で判定している。**新セクションを `sections.ts` に追加したときは必ず TopicNav に分岐追加する**。else fallback で data-modeling categories を表示してしまうバグ (「基本情報技術者試験 擬似言語 実行シミュレーター」見出しの下に正規化 / ER 図 topic がぶら下がる) を実際に踏んだ (2026-08-02)。

### 5. `word-break: keep-all` で CJK が狭いカラムからはみ出す

`src/app/globals.css` は body / prose に `word-break: keep-all` + `overflow-wrap: break-word` を効かせている
(日本語を語中で切らないため)。この組み合わせには落とし穴がある:

- `keep-all` により **CJK の連続は改行候補にならない** → その要素の min-content 幅 = 文字列の全長
- `overflow-wrap: break-word` は**溢れたときに折るだけで min-content 幅を縮めない** → flex / grid item は
  `min-width: auto` で min-content まで広がり、**カラムを突き破る**

サイドバー (15rem) など狭い箱に長い日本語 (書名・トピック名) を入れるときは、`break-words` では足りない。

```html
<!-- ❌ 15rem のカードからはみ出す -->
<div class="break-words">基本情報技術者【科目B】ゼロからわかるアルゴリズムと擬似言語</div>

<!-- ⭕ min-content を縮める overflow-wrap: anywhere を使う -->
<div class="min-w-0 [overflow-wrap:anywhere]">…</div>
```

前例: `src/components/cta/BookSidebar.tsx` (FE の長い書名で発覚)。
本文カラムのような広い箱では `min-w-0 flex-1 break-words` で足りる (`AffiliateBooks.tsx`)。

## E2E テストの落とし穴: `getByRole("alert")` は必ず 2 件マッチする

Next.js App Router は `<next-route-announcer>` というカスタム要素 (Shadow DOM) を挿入し、
その中に `role="alert" aria-live="assertive"` の 1px 要素を置いている。
クライアントサイド遷移でページタイトルをスクリーンリーダーに読ませるための正規の仕組みで、**バグではない**。

- Playwright の `getByRole()` は **Shadow DOM を貫通する**ので、`getByRole("alert")` は
  「自前のエラー表示 + アナウンサー」の 2 件にマッチし、strict mode 違反で落ちる
- `document.querySelectorAll('[role="alert"]')` は Shadow DOM を見ないので 1 件しか返さない。
  **この非対称が原因調査を混乱させる**ので先に知っておくこと

```ts
page.getByRole("alert").filter({ hasText: "行目" })          // 推奨: 中身で絞る
page.locator('[role="alert"]:not(#__next-route-announcer__)') // 代替
```

## Monorepo 情報 (docs/)

`docs/` は `.gitignore` 済み。ローカル専用の運用メモを置く場所。GitHub には公開しない。

**索引は `docs/README.md`**。読み順とファイルの役割はそこが一次情報なので、まずそれを開く。構成:

| パス | 中身 |
|---|---|
| `docs/strategy/` | `roadmap.md` (現状ステータス・優先タスクの一次情報源) / `growth.md` (認知獲得) / `seo.md` / `ideas.md` |
| `docs/site/` | `design.md` (セクション横断のアーキテクチャ・カラーパレット・SEO 実装パターン) / `operations.md` (アカウント・DNS・GA4 の非公開ディテール) |
| `docs/sections/` | セクション別の設計判断。1 セクション 1 ファイル (`rdb-index` / `data-modeling` / `er-diagram` / `why-need-rdb` / `fe-playground`) |
| `docs/wip/` | **使い捨て**。開発中の設計書・進捗ログ・レビュー。完了後に harvest して削除する |
| `docs/x-posts/` | X 投稿のドラフト・投稿済みアーカイブ・画像・デザインガイド |
| `analytics/reports/*.md` | GA4/GSC の月次データレビュー (docs 外) |

**docs にコードから読めることを書かない**。ページ一覧・型・コンポーネント API・定義文・キーワードは
`src/content/` と実装が一次情報で、docs に写すと必ず腐る。docs が持つのは
「決定の背景」「外部の状態」「残タスク」の 3 つだけ。

### 作業ドキュメントの置き場とライフサイクル

新セクション開発などで生まれる設計書・進捗ログは腐る。**`docs/` 直下や `docs/sections/` に
直接置かない**。以下の 3 点だけ守れば、詳細は skill が持つ。

1. 使い捨ては `docs/wip/<YYYYMMDD>-<slug>/` に置く。永続化するのは `docs/sections/<name>.md` だけ
2. `wip/` を作ったら、**同時に `docs/strategy/roadmap.md` の優先アクション表へ harvest タスクを積む**
   (`/taitech-doc-lifecycle harvest wip/<slug>`)。圧縮の契機はこの表でしか担保されない
3. **「このファイルは stale」と注記して延命しない**。そう書きたくなったら harvest のタイミングを
   過ぎているという意味。annotate ではなく harvest して消す

手順と判定基準は skill **`/taitech-doc-lifecycle`**（kickoff / harvest の 2 モード）。

### 公開済みの URL を動かすとき

**308 リダイレクトを置いただけでは、新 URL はインデックスに戻らない。**
`/fe` 再編 (2026-08-15) で、移設前はインデックスされていた 29 URL が、
**移設後 6 日経っても新 URL では 30 件中 2 件しか入っていなかった** (6.7%)。
一方で、**インデックス登録リクエストを出したセクションは 93〜100% 入っている**
(実測は `analytics/reports/review-2026-08-21.md` §2)。

以下の 2 点だけ守れば、詳細は skill が持つ。

1. **移設直後に、新 URL の インデックス登録リクエストを GSC UI から出す**。
   これは API に無いので手作業になる（Indexing API は `JobPosting` / `BroadcastEvent` 専用）。
   日次上限は 10〜20 件。順序はハブ → PV 実績の高い順
2. **308 を置くときに削除トリガーと最終期限を決め、`roadmap.md` の優先アクション表に積む**。
   「いつか消す」は永久負債になる（前例: roadmap #47）

手順は skill **`/taitech-url-migration`**（plan / aftercare の 2 モード）。

Qiita / Zenn 記事の SSoT はこのリポジトリではない (下の各節を参照)。

# Zenn 記事のドラフト依頼

Zenn (@taitech) 記事の SSoT は **`../zenn/`** (github.com/guangpingjiujing-dot/zenn、private)。
このリポジトリで Zenn 記事の依頼を受けたら、**書く場所は `../zenn/articles/<slug>.md`**。
詳細ルールは `../zenn/AGENTS.md` を参照。特に:

- **Qiita と同一本文を出さない**。どちらも canonical を張れないので素の重複になり、
  誘導先の taitech.dev も含めて 3 つで共食いする。同じ題材なら切り口を変えて書き下ろす
  (Qiita = 読者の課題・解説、Zenn = 実装の詳細)
- **本文に絵文字を使わない**。frontmatter の `emoji` だけは Zenn の必須項目なので入れる
- `published: true` で push した瞬間に公開される。下書きは必ず `false`
- ファイル名がそのまま URL slug になるので、公開前に確定させる (12〜50 文字)

# Qiita 記事のドラフト依頼

Qiita (@taitech_dev) 記事のSSoTは **`../qiita/`** (github.com/guangpingjiujing-dot/qiita)。
このリポジトリで Qiita 記事の作成・修正依頼を受けたら、**書く場所は `../qiita/public/*.md`**（このリポジトリの `docs/` 配下には書かない）。

書き方の詳細ルールは `../qiita/AGENTS.md` を参照。特に以下は事故が起きやすいので必ず守る:

- **本文にbare URL を貼らない**。必ず `[説明的なテキスト](URL)` の Markdown リンクにする
- **リンクテキストにURLを入れない**（`[https://...](https://...)` も禁止。「そこで何が読めるか」を書く）
- frontmatter の `id` / `updated_at` は絶対に手で書き換えない（Qiita側が管理する識別子）
- 新規下書きは `ignorePublish: true` にしておく（`publish --all` の対象外になる）
- 本文の一番上に `# タイトル` は書かない（frontmatter の `title:` が使われる）
- Qiita Web での直編集は禁止（すべてローカル → git push で反映）

# Amazon Associates ガードレール

コードを読んでも分からない規約制約。違反するとアカウント停止 or 収益ゼロになる。

- **書籍 URL の `?tag=taitech-22` を削除しない**。Store ID は `taitech-22`。詳細は `docs/site/operations.md`
- **`AffiliateBooks.tsx` の「本セクションはAmazonアソシエイトのリンクを含みます。」を削除しない**。Amazon 運営規約と景表法（ステマ規制）で必須
- **Amazon 商品画像の hotlink 禁止**。PA-API 経由でのみ許可され、PA-API は 3件発送成立まで解放されない。書影を扱う場合は必ず PA-API 有効化後

# Monetization 優先順位

このプロジェクトの本命は **サイト直接収益（Amazon アソシエイト / AdSense / ASP）** の合算。menta 送客は本命から外れた（menta 事業自体はこのプロジェクトなしで順調に回っているため、ここで最適化する必要がない）。

- 直近の最重要 KPI は **Amazon アフィリの発送 3 件成立**（期限 2027-01 頃）。CTA・文中リンク・書籍紹介記事はこの目標に紐づけて設計する
- 中期は **AdSense 通過準備**（ads.txt / Cookie 同意 / 記事数拡充 / `/about` E-E-A-T 強化）
- **menta CTA（サイドバー常時表示 / MentorCTA / BookSidebar）は現状維持**。補助的な収益・権威付けとして残す。ただし新規 CTA 設計時に「menta を潰さない」制約は外れたので、Amazon / 広告枠と対等に扱ってよい
