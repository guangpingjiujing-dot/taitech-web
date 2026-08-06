---
name: taitech-doc-lifecycle
description: taitech.dev の docs/ で、新セクション開発の作業ドキュメント (docs/wip/) を立ち上げ、開発完了後に永続ドキュメント (docs/sections/) へ harvest して wip を削除するライフサイクル運用。設計書・進捗ログ・レビューのうち何を残し何を捨てるかの判定基準、圧縮の実行手順、参照の追随修正までを含む。新セクション着手時と、デプロイ後の効果測定が終わったタイミングで使う。
---

# taitech-doc-lifecycle

`docs/` を腐らせないための運用スキル。**kickoff**（着手時）と **harvest**（圧縮時）の 2 モードがある。

## 前提となる構造

```
docs/wip/<slug>/          使い捨て。開発中の設計書・進捗ログ・レビュー。消える前提
docs/sections/<name>.md   永続。1 セクション 1 ファイル。決定の背景だけを持つ
```

`wip/` は**作業ストリーム単位**であってセクション単位ではない。同じセクションを後で大きく拡張するなら
新しい `wip/` を開く（`wip/20260910-fe-quiz-30/`）。名前に日付を入れるのは
「このフォルダはいつ死ぬのか」を自明にするため。

---

# モード 1: kickoff（新セクション着手時）

1. `docs/wip/<YYYYMMDD>-<slug>/` を作る。**中の構成は自由**。
   設計書を 00-overview / 01-basic-design / 02-detailed-design に割っても、1 枚で書いてもよい。
   ここは `/compact` 対策が本業なので冗長でかまわない
2. `docs/sections/<name>.md` は**この時点では作らない**。harvest で初めて作る
3. `docs/strategy/roadmap.md` の「優先アクション」表に、実装タスクとは別に harvest タスクを積む:

   ```
   | NN | **wip/<slug> の harvest** (`/taitech-doc-lifecycle harvest wip/<slug>`)。
        デプロイ後の効果測定が終わったら実行 | docs の腐敗防止 |
   ```

   **この行を積むのがこのモードの最重要ステップ。** 圧縮の契機は時間ではなく
   「roadmap の表に載っているかどうか」でしか担保されない。ここを飛ばすと永久に来ない

4. 実装中に AGENTS.md 相当の知見（Tailwind の罠・テストの罠・共通化方針など)が出たら、
   wip/ に閉じ込めず **AGENTS.md に直接昇格**させる。セクション固有ではないものは
   `sections/` にも書かない

---

# モード 2: harvest（圧縮時）

## いつ実行するか

**デプロイ直後ではない。** デプロイ後の効果測定が終わり、結果が `strategy/roadmap.md` に
書かれた時点（通常デプロイの 2〜4 週間後、`/taitech-analytics review` のタイミング）。

理由: デプロイ直後はまだ URL Inspection の残り・実機確認・GA4 の疎通確認が生きていて、
wip/ の進捗ログに仕事がある。効果測定が終わった瞬間、そのセクションは
「プロジェクト」から「存在するもの」に変わる。そこが境界。

**前倒しの合図**: wip/ のファイルに「このファイルは stale」「〜を一次情報とする」と
書きたくなったら、それは harvest すべきタイミングを過ぎているという意味。
警告を貼るのではなく harvest して消すこと。

## 判定基準

迷ったら一問だけ: **「これは `src/` を読めば分かるか？」** Yes なら捨てる。

### 残す（`sections/<name>.md` へ）

- **採用しなかった案とその理由、そして判断を覆す条件**
  （例:「imp 1,000 を超えたら top-level 化を再検討」）
- **明示的な非スコープ**（「模擬試験モードはやらない」「過去問は転載しない」）
- **実装が設計から逸脱した箇所とその理由**（「呼び出しスタックペインは情報量ゼロだったので削除」）
- **レビューで見送った指摘と、その反論**（採用した指摘は不要。コードに入っている）
- **コードのコメントに収まらない罠**（「`searchParams` を足すと Static が壊れる」）
- **未着手のまま残った拡張候補**、外部要因で止まっている残タスク（ASIN 未確定、GSC の手作業）
- **規約・法務の判断とその成立条件**（オマージュの商標リスクが低いと判断した 3 条件）

### 捨てる

- ファイル差分マップ / 追加ファイル一覧
- コンポーネントの props 表・API 定義・型定義
- 各ページの本文・定義文・FAQ・キーワード（`src/content/` が一次情報）
- 完了した TODO のログ、済んだデプロイ後チェックリスト
- 対応済みのレビュー指摘
- Phase 計画・工数見積・公開スケジュール（結果は roadmap にある）

## 手順

### 1. 退避（必須）

`docs/` は `.gitignore` 済みで **git 履歴が 1 件もない**。削除は復元不可。

```bash
tar czf <scratchpad>/docs-backup-$(date +%Y%m%d).tar.gz docs
```

### 2. 読む

`wip/<slug>/` を全部読む。加えて、乖離を検出するために実装側も見る:

```bash
ls src/app/<section>/          # 実際に存在するページ
grep -n 'slug: "' src/content/topics.<section>.ts
```

**設計書に書いてあるページ構成が現物と違うのは常態**。現物が正しい。

### 3. `docs/sections/<name>.md` を書く

テンプレート:

```markdown
# <セクション名> (`/<path>/*`)

**状態:** 本番公開済み (YYYY-MM-DD デプロイ)。<ページ構成>
**一次情報:** <実装ファイル>。本ファイルは決定の背景だけを持つ

## 1. 何を作ったか
<URL 表 + 想定読者 + 他セクションとの役割分担。10 行程度>

## 2. 意図的にやらないこと (非スコープ)
<「やってほしい」と言われたときに立ち返る決定>

## 3. コードから読めない決定と、その理由
### 3-1. <決定> — <理由>。覆すなら <条件>

## 4. 残タスク
<外部要因で止まっているもの、判断待ちのもの>
```

書き方の制約:

- **完了ログにしない。** 「完了」の羅列は wip/ の仕事。永続側は現在形で書く
- **絵文字・チェックマークを使わない**（プロジェクト方針）
- **15KB を超えたら書きすぎ。** 捨てる側の判定が甘い可能性を疑う
- セクションが大きすぎるときは分割してよい（前例: `data-modeling.md` と `er-diagram.md`）

### 4. 削除

```bash
rm -rf docs/wip/<slug>
```

### 5. 参照の追随修正

wip/ を指していた参照を潰す。**docs の外も見ること**:

```bash
grep -rn 'docs/wip/<slug>' docs/ AGENTS.md .claude/skills/ scripts/ src/
```

### 6. リンク切れチェック

```bash
python3 - <<'EOF'
import re, pathlib
bad = []
for p in pathlib.Path("docs").rglob("*.md"):
    for m in re.finditer(r'`(docs/[^`\s]+\.md)`|\]\((\./[^)]+\.md)\)', p.read_text()):
        t = m.group(1) or m.group(2)
        target = pathlib.Path(t) if t.startswith("docs/") else (p.parent / t)
        if not target.exists(): bad.append(f"{p}: {t}")
print("\n".join(sorted(set(bad))) or "リンク切れなし")
EOF
```

`{slug}` などのテンプレート表記が引っかかるのは正常。

### 7. 後始末

- `strategy/roadmap.md` の harvest タスクを完了にする
- `docs/README.md` のセクション一覧に新しい行が要るなら足す
- 圧縮率を報告する（例: 156KB → 8.4KB）

---

## 失敗パターン（実際に踏んだもの）

- **stale 警告で済ませる** — 2026-07/08 に er-diagram と fe-playground の設計書へ
  「00-02 は初期設計時のスナップショット」と自分で注記した。腐っていることは分かっていたのに
  消す契機がなく、エージェントは警告を読んだ上で古い内容を読み続けた。**annotate は解決ではない**
- **永続側に完了ログを溜める** — `03-implementation-status.md` は有用だったが、
  完了済み TODO の履歴が積もって 39KB になった。次に読む人が現状を掴むのに時間がかかる
- **同じ内容を docs と AGENTS.md の両方に書く** — Tailwind の罠・`getByRole("alert")` の罠は
  AGENTS.md に昇格済みなので、`sections/` 側には書かない（参照だけ）
- **圧縮タスクを roadmap に積み忘れる** — これが根本原因。積んでいないものは実行されない

## 実績

2026-08-07 に 4 セクション分を一括 harvest: **502KB → 38KB**（docs 全体は 700KB → 288KB）。
削除した主なもの: `01-basic-design.md` / `02-detailed-design.md` 各 4 本、
完了済みデプロイ後チェックリスト、対応済みレビュー 2 本。