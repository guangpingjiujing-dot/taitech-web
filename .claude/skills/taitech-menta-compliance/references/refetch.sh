#!/usr/bin/env bash
# MENTA の一次情報 (規約・ガイドライン・マナー) を再取得して references/*.txt を更新する。
#
# 実行:
#   bash .claude/skills/taitech-menta-compliance/references/refetch.sh
#
# 出力:
#   - <slug>.txt      決定的に抽出した本文テキスト (これが参照する一次情報)
#   - manifest.tsv    URL / ファイル / 取得日 / sha256 / バイト数
#
# 差分の見方は SKILL.md「更新検知」の節を読むこと。
# 生 HTML は保存しない (CDN の署名付き URL が毎回変わり、ハッシュが安定しないため)。

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UA="Mozilla/5.0"
MANIFEST="$DIR/manifest.tsv"

# slug<TAB>URL。追加するときは「MENTA が一次情報として公開しているページ」だけにする。
SOURCES=$(
  cat <<'EOF'
menta-kiyaku	https://menta.work/kiyaku
menta-guideline	https://intercom.help/mentajp/ja/articles/4447150-mentaガイドライン
menta-manner	https://intercom.help/mentajp/ja/articles/4153467-mentaご利用におけるマナー
EOF
)

printf 'slug\turl\tfetched_at\tsha256\tbytes\n' >"$MANIFEST"

while IFS=$'\t' read -r slug url; do
  [ -z "$slug" ] && continue
  echo "fetching $slug ..." >&2

  # --get --data-urlencode は使わない。URL に日本語が含まれるので curl のエンコードに任せる。
  code=$(curl -sSL "$url" -H "User-Agent: $UA" -o "$DIR/.$slug.html" -w '%{http_code}')
  if [ "$code" != "200" ]; then
    echo "ERROR: $url returned HTTP $code" >&2
    rm -f "$DIR/.$slug.html"
    exit 1
  fi

  python3 "$DIR/extract.py" <"$DIR/.$slug.html" >"$DIR/$slug.txt"
  rm -f "$DIR/.$slug.html"

  sha=$(shasum -a 256 "$DIR/$slug.txt" | cut -d' ' -f1)
  bytes=$(wc -c <"$DIR/$slug.txt" | tr -d ' ')
  printf '%s\t%s\t%s\t%s\t%s\n' "$slug" "$url" "$(date +%F)" "$sha" "$bytes" >>"$MANIFEST"
done <<<"$SOURCES"

echo >&2
echo "done. 差分確認:  git diff -- $DIR" >&2