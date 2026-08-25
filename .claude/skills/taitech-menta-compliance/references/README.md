# references/ — MENTA の一次情報

ここに置くのは **MENTA が自ら公開しているページの本文だけ**。解説記事・まとめブログ・
検索結果のスニペット・LLM の要約は**一切入れない**。

## ファイル

| ファイル | 出所 (一次情報の URL) |
|---|---|
| `menta-kiyaku.txt` | https://menta.work/kiyaku （利用規約） |
| `menta-guideline.txt` | https://intercom.help/mentajp/ja/articles/4447150-mentaガイドライン |
| `menta-manner.txt` | https://intercom.help/mentajp/ja/articles/4153467-mentaご利用におけるマナー |

取得日・sha256・バイト数は `manifest.tsv`。

## `.txt` は何であって、何でないか

- **である**: 上記 URL の HTML からタグと実体参照を機械的に外しただけの本文。
  文言は原文のまま。要約・言い換え・並べ替え・取捨選択をしていない
- **でない**: 原文の完全なバイト列ではない。ナビゲーション・検索ボックス・
  「こちらの回答で解決しましたか？」などのページ外枠も混ざる（意図的に残している。
  取捨選択を始めると「何が落ちたか」が追えなくなるため）

**条文を引用するときは必ずこの `.txt` を読む。** ページを WebFetch したり、
記憶から書いたりしない（理由は `extract.py` の docstring と SKILL.md）。

## 生 HTML を保存していない理由

intercom のページは CDN 画像に**期限付き署名 URL**（`?expires=...&signature=...`）を
埋め込んでおり、取得のたびに HTML のバイト列が変わる。生 HTML の sha256 は毎回変わって
しまい、差分検知に使えない。抽出後のテキストなら安定する（2 回連続取得で
3 ファイルとも sha256 一致を確認済み、2026-08-22）。

## 再取得

```bash
bash .claude/skills/taitech-menta-compliance/references/refetch.sh
git diff -- .claude/skills/taitech-menta-compliance/references
```

`refetch.sh` は HTTP 200 以外なら**その場で異常終了**する（404 のページを空ファイルで
上書きして一次情報を失わないため）。URL が変わった場合は `refetch.sh` の `SOURCES` を
直してから再実行する。

## ソースを追加するとき

`refetch.sh` の `SOURCES` に `slug<TAB>URL` を足すだけ。ただし追加してよいのは
**MENTA 自身が公開しているページ**に限る。
