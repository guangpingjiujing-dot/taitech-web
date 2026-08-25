#!/usr/bin/env python3
"""HTML から本文テキストを決定的に取り出す。

**このスクリプトの存在理由**: MENTA の規約・ガイドラインを LLM の要約経由で読むと
条文が捏造される。実際に 2026-08-22 のセッションで WebFetch が
「ガイドライン 14項: アフィリエイトに相当する営利行為」という**実在しない条文**を
出力し、それを根拠に判断を組み立ててしまった (原文の 14項 にアフィリエイトの
記述は無い)。

したがって references/*.txt は **LLM を通さず**、このスクリプトだけで生成する。
やることはタグ剥がしと実体参照のデコードのみで、要約・言い換え・並べ替えはしない。

使い方:
    python3 extract.py < input.html > output.txt
"""

import html
import re
import sys


def extract(source: str) -> str:
    # 1. 本文でない要素を丸ごと落とす
    for tag in ("script", "style", "noscript", "template", "svg"):
        source = re.sub(rf"<{tag}\b.*?</{tag}>", "", source, flags=re.S | re.I)

    # 2. 改行を持つ要素を改行に変換する (段落・箇条書きの境界を保つ)
    source = re.sub(r"<br\s*/?>", "\n", source, flags=re.I)
    source = re.sub(
        r"</(p|div|h[1-6]|li|tr|section|article|blockquote|td|th)\s*>",
        "\n",
        source,
        flags=re.I,
    )

    # 3. 残りのタグを剥がして実体参照を戻す
    text = html.unescape(re.sub(r"<[^>]+>", "", source))

    # 4. 行単位で trim し、空行を潰す (末尾空白は取得ごとに揺れるため)
    lines = [line.strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line) + "\n"


if __name__ == "__main__":
    sys.stdout.write(extract(sys.stdin.read()))