import { StreamLanguage } from "@codemirror/language";
import { gutter, GutterMarker, lineNumbers } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";

/**
 * 共通テスト用プログラム表記の CodeMirror 拡張。
 *
 * IPA 擬似言語 (`src/components/fe/pseudoLanguage.ts`) とはキーワードが全く違うので別実装。
 * あわせて **試験の紙面と同じ見た目**にするための 2 つを持つ:
 *
 * - `(01)` 形式のゼロ埋め行番号
 * - ブロックの縦罫線 `│` と終端 `└`
 *
 * どちらも **テキストではなく表示**として描く。テキストに含めると、
 * コピペ・deep link・OG 画像がすべて壊れる (01-implementation-design.md §2-3)。
 */

const KEYWORDS: [RegExp, string][] = [
  [/^増やしながら繰り返す|^減らしながら繰り返す|^の間繰り返す/, "keyword"],
  [/^そうでなければ/, "keyword"],
  [/^ならば|^もし/, "keyword"],
  [/^ずつ|^から|^まで|^を/, "keyword"],
];

const EN_KEYWORDS = new Set(["and", "or", "not"]);

export const joho1Language = StreamLanguage.define({
  name: "joho1",
  startState() {
    return {};
  },
  token(stream) {
    if (stream.eatSpace()) return null;

    if (stream.match(/^"/)) {
      while (!stream.eol()) {
        if (stream.next() === '"') break;
      }
      return "string";
    }

    if (stream.match(/^\d+(\.\d+)?/)) return "number";

    for (const [re, style] of KEYWORDS) {
      if (stream.match(re)) return style;
    }

    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      const word = stream.current();
      if (EN_KEYWORDS.has(word)) return "keyword";
      // 配列は大文字始まり、スカラは小文字 (実物の慣習)
      return /^[A-Z]/.test(word) ? "variableName.special" : "variableName";
    }

    // 日本語の関数名 (表示する / 要素数 / 最大値)
    if (stream.match(/^[぀-ヿ一-鿿]+/)) return "variableName.function";

    if (stream.match(/^(==|!=|<=|>=)/)) return "operator";
    if (stream.match(/^[=+\-*/÷%<>]/)) return "operator";
    if (stream.match(/^[(),[\]:：]/)) return "punctuation";

    stream.next();
    return null;
  },
});

/** 試験の紙面と同じ `(01)` 形式 */
export const joho1LineNumbers = lineNumbers({
  formatNumber: (n) => `(${String(n).padStart(2, "0")})`,
});

const GUIDE_INDENT = 2;

/**
 * 各行のブロック罫線を組み立てる。
 *
 * 深さ d の罫線は、その深さのブロックが続く間は `│`、**そのブロックの最終行だけ `└`**。
 * 実物の紙面 (令和8年度本試験 図3 ほか) と同じ規則。
 */
export function buildBlockGuides(lines: string[]): string[] {
  const depths = lines.map((line) => {
    if (line.trim() === "") return -1; // 空行はブロックに属さない扱い
    const indent = line.length - line.trimStart().length;
    return Math.floor(indent / GUIDE_INDENT);
  });

  const grid: string[][] = depths.map((d) => (d < 0 ? [] : Array(d).fill("│")));

  // 深さ d のブロックの最終行を `└` にする
  const maxDepth = Math.max(0, ...depths);
  for (let d = 1; d <= maxDepth; d++) {
    let lastAtDepth = -1;
    for (let i = 0; i < depths.length; i++) {
      if (depths[i] >= d) {
        lastAtDepth = i;
      } else if (depths[i] >= 0 && lastAtDepth >= 0) {
        grid[lastAtDepth][d - 1] = "└";
        lastAtDepth = -1;
      }
    }
    if (lastAtDepth >= 0) grid[lastAtDepth][d - 1] = "└";
  }

  return grid.map((cells) => cells.join(" "));
}

class GuideMarker extends GutterMarker {
  constructor(private readonly text: string) {
    super();
  }
  eq(other: GuideMarker) {
    return other.text === this.text;
  }
  toDOM() {
    const span = document.createElement("span");
    span.textContent = this.text;
    span.className = "cm-blockGuide";
    return span;
  }
}

function guidesFor(state: EditorState): string[] {
  const lines: string[] = [];
  for (let i = 1; i <= state.doc.lines; i++) lines.push(state.doc.line(i).text);
  return buildBlockGuides(lines);
}

/** ブロック罫線を専用の gutter に描く。本文テキストには一切触らない */
export const blockGuideGutter = gutter({
  class: "cm-blockGuides",
  lineMarker(view, line) {
    const guides = guidesFor(view.state);
    const lineNo = view.state.doc.lineAt(line.from).number;
    const text = guides[lineNo - 1] ?? "";
    return text ? new GuideMarker(text) : null;
  },
  lineMarkerChange: () => true,
});

export const JOHO1_EDITOR_EXTENSIONS = [
  joho1LineNumbers,
  blockGuideGutter,
  joho1Language,
];
