<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deployment

- **Host**: Vercel。GitHub `main` への push で本番デプロイが自動発火する。
- **Production URL**: https://taitech.dev
- **Domain**: `taitech.dev`（Registrar/DNS 事業者の詳細は `docs/OPERATIONS.md`）。`www.taitech.dev` は 308 で apex にリダイレクト（`next.config.ts` の `redirects()` で実装）。
- **HTTPS**: Vercel が Let's Encrypt 相当の証明書を自動発行・更新。
- **Preview**: main 以外のブランチを push すると Vercel が Preview デプロイを自動発行する。

## Environment variables

`.env.example` に一覧。本番の値は Vercel Project Settings → Environment Variables で管理。

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `sitemap.xml` / `robots.txt` / OGP / canonical の base URL。本番は `https://taitech.dev`。 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 測定 ID。空なら GA タグは挿入されない。 |

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

# 環境変数の追加
printf "value" | vercel env add NAME production

# ドメイン状態
vercel domains inspect taitech.dev
```

# Development

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

## Monorepo 情報 (docs/)

`docs/` は `.gitignore` 済み。ローカル専用の運用メモを置く場所。GitHub には公開しない。

新規セッションでの推奨読み順:
1. `docs/MONETIZATION_ROADMAP.md`: 現状ステータス・優先タスク・完了履歴（一次情報源）
2. `docs/SEO_AUDIT.md`: SEO 現状と実装ステータス（§0 に最新の実装状況）
3. `docs/DESIGN.md`: サイト設計・アーキテクチャ・SEO/LLMO 戦略
4. `docs/OPERATIONS.md`: アカウント・DNS・支払い・GA4 IP フィルタ等の非公開ディテール
5. `docs/MONETIZATION_IDEAS.md`: 収益化アイデア集（ロードマップの補足）
6. `docs/x-posts/`, `docs/data-modeling/`: X 投稿ドラフト・データモデリング作業メモ
   （Qiita記事のSSoTは `../qiita` (github.com/guangpingjiujing-dot/qiita) に移管済み。詳細は下の「Qiita 記事のドラフト依頼」節を参照。docs/qiita は空placeholder）
7. `docs/er-diagram/`: 変なER図 (ER 図カテゴリ) の設計と実装ログ。
   本セクションを触るときは `03-implementation-status.md` を一次情報に。
   00-02 は初期設計時のスナップショットで stale (top に警告あり)
8. `analytics/reports/*.md`: GA4/GSC の月次データレビュー

# Qiita 記事のドラフト依頼

Qiita (@taitech_dev) 記事のSSoTは **`../qiita/`** (github.com/guangpingjiujing-dot/qiita)。
このリポジトリで Qiita 記事の作成・修正依頼を受けたら、**書く場所は `../qiita/public/*.md`**（このリポジトリの `docs/qiita/` は空 placeholder で書いてはいけない）。

書き方の詳細ルールは `../qiita/AGENTS.md` を参照。特に以下は事故が起きやすいので必ず守る:

- **本文にbare URL を貼らない**。必ず `[説明的なテキスト](URL)` の Markdown リンクにする
- **リンクテキストにURLを入れない**（`[https://...](https://...)` も禁止。「そこで何が読めるか」を書く）
- frontmatter の `id` / `updated_at` は絶対に手で書き換えない（Qiita側が管理する識別子）
- 新規下書きは `ignorePublish: true` にしておく（`publish --all` の対象外になる）
- 本文の一番上に `# タイトル` は書かない（frontmatter の `title:` が使われる）
- Qiita Web での直編集は禁止（すべてローカル → git push で反映）

# Amazon Associates ガードレール

コードを読んでも分からない規約制約。違反するとアカウント停止 or 収益ゼロになる。

- **書籍 URL の `?tag=taitech-22` を削除しない**。Store ID は `taitech-22`。詳細は `docs/OPERATIONS.md`
- **`AffiliateBooks.tsx` の「本セクションはAmazonアソシエイトのリンクを含みます。」を削除しない**。Amazon 運営規約と景表法（ステマ規制）で必須
- **Amazon 商品画像の hotlink 禁止**。PA-API 経由でのみ許可され、PA-API は 3件発送成立まで解放されない。書影を扱う場合は必ず PA-API 有効化後

# Monetization 優先順位

このプロジェクトの本命は **サイト直接収益（Amazon アソシエイト / AdSense / ASP）** の合算。menta 送客は本命から外れた（menta 事業自体はこのプロジェクトなしで順調に回っているため、ここで最適化する必要がない）。

- 直近の最重要 KPI は **Amazon アフィリの発送 3 件成立**（期限 2027-01 頃）。CTA・文中リンク・書籍紹介記事はこの目標に紐づけて設計する
- 中期は **AdSense 通過準備**（ads.txt / Cookie 同意 / 記事数拡充 / `/about` E-E-A-T 強化）
- **menta CTA（サイドバー常時表示 / MentorCTA / BookSidebar）は現状維持**。補助的な収益・権威付けとして残す。ただし新規 CTA 設計時に「menta を潰さない」制約は外れたので、Amazon / 広告枠と対等に扱ってよい
