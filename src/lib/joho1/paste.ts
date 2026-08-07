/**
 * 試験の紙面からコピペしたプログラムを、そのまま実行できる形に直す。
 *
 * 実物のプログラムは行頭に `(01)` の行番号が付き、ブロックが `│` と `└` の罫線で
 * 表されている (00-overview.md §7-3)。**受験者が最初にやる操作が「問題のコピペ」**
 * なので、これを弾くとシミュレーターが使われない (01-implementation-design.md §2-3)。
 *
 * 罫線は捨てるのではなく **深さに応じた字下げに変換する**。罫線の本数がそのまま
 * ブロックの深さなので、情報が失われない。
 */

const LINE_NUMBER = /^\s*[(（]\s*\d+\s*[)）]\s?/;
/** 罫線に使われる字。`|` は半角で貼られたときの保険 */
const GUIDE_CHARS = "│|｜└⎿⌊∟";
const INDENT_PER_LEVEL = "  ";

export interface PasteNormalizeResult {
  code: string;
  /** 行番号か罫線を実際に取り除いたか。UI で「整形しました」と伝えるのに使う */
  changed: boolean;
}

export function normalizePastedCode(input: string): PasteNormalizeResult {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  let changed = false;

  const out = lines.map((original) => {
    let line = original;

    const withoutNumber = line.replace(LINE_NUMBER, "");
    const hadNumber = withoutNumber !== line;
    if (hadNumber) {
      changed = true;
      line = withoutNumber;
    }

    // 行頭の罫線を数えて字下げに置き換える
    let depth = 0;
    let i = 0;
    while (i < line.length) {
      const c = line[i];
      if (c === " " || c === "\t" || c === "　") {
        i++;
        continue;
      }
      if (GUIDE_CHARS.includes(c)) {
        depth++;
        i++;
        continue;
      }
      break;
    }

    if (depth > 0) {
      changed = true;
      return INDENT_PER_LEVEL.repeat(depth) + line.slice(i).trimEnd();
    }
    // 行番号があった行の残りの空白は**紙面の桁揃え**であって字下げではない。
    // 残すと 1 行目から INDENT 扱いになって構文エラーになる
    if (hadNumber) return line.slice(i).trimEnd();
    return line.trimEnd();
  });

  // 末尾の空行を落とす
  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();

  return { code: out.join("\n"), changed };
}
