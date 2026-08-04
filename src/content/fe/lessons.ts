import type { ComponentType } from "react";

export type FeLessonSlug =
  | "variable"
  | "if"
  | "while"
  | "for"
  | "array"
  | "function";

export interface FeLessonMeta {
  slug: FeLessonSlug;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  /** 一覧カード用の 1 行要約。description (meta 用) の使い回しだと同じ書き出しが 6 枚並ぶ */
  cardSummary: string;
  definition: string;
  keywords: string[];
  sampleCode: string;
  sampleOutput?: string;
}

export const feLessons: readonly FeLessonMeta[] = [
  {
    slug: "variable",
    order: 1,
    title: "変数と型 — 基本情報 擬似言語の書き方",
    shortTitle: "変数と型",
    description:
      "基本情報 (FE) 科目 B の擬似言語における変数宣言と型の書き方。整数型・実数型・文字列型・論理型と代入 (←) の使い方をブラウザで実行しながら学ぶ。",
    cardSummary: "整数型・実数型・文字列型・論理型の宣言と、← による代入",
    definition:
      "擬似言語の変数は「型: 名前 ← 初期値」の形で宣言する。← は代入を表し、右辺の値を左辺の変数に入れる。宣言と初期化はまとめて一行に書ける。",
    keywords: [
      "基本情報",
      "擬似言語",
      "変数",
      "型",
      "整数型",
      "実数型",
      "文字列型",
      "論理型",
      "代入",
      "FE 科目B",
    ],
    sampleCode: `整数型: 個数 ← 3
整数型: 単価 ← 200
整数型: 合計 ← 個数 * 単価
print(合計)
`,
    sampleOutput: "600",
  },
  {
    slug: "if",
    order: 2,
    title: "条件分岐 (if / elseif / else) の書き方",
    shortTitle: "条件分岐 (if)",
    description:
      "基本情報 (FE) 科目 B で出題される if / elseif / else / endif の書き方。条件式のカッコ、複数条件の組み立て方をブラウザで動かしながら理解する。",
    cardSummary: "条件式のカッコ、elseif の評価順、endif の必要性",
    definition:
      "擬似言語の条件分岐は if (条件) から始まり、endif で閉じる。else if (中間分岐) は elseif、else (それ以外) は else を挟む。条件式は必ず () で囲む。",
    keywords: [
      "基本情報",
      "擬似言語",
      "if",
      "elseif",
      "else",
      "endif",
      "条件分岐",
      "FE 科目B",
    ],
    sampleCode: `整数型: 点数 ← 72
if (点数 ≧ 80)
  print("優")
elseif (点数 ≧ 60)
  print("良")
else
  print("不可")
endif
`,
    sampleOutput: "良",
  },
  {
    slug: "while",
    order: 3,
    title: "繰り返し (while) の書き方と無限ループの避け方",
    shortTitle: "繰り返し (while)",
    description:
      "基本情報 (FE) 科目 B で頻出の while ループ。条件が真の間くり返す構文と、ループ変数を必ず更新して無限ループを避ける書き方を、実行して確かめながら学ぶ。",
    cardSummary: "条件が真の間くり返す。無限ループを避けるための更新",
    definition:
      "while (条件) から endwhile までを、条件が真である間くり返す。ループ本体で条件に絡む変数を更新しないと、条件は永遠に真のままとなり無限ループになる。",
    keywords: [
      "基本情報",
      "擬似言語",
      "while",
      "endwhile",
      "繰り返し",
      "ループ",
      "無限ループ",
      "FE 科目B",
    ],
    sampleCode: `整数型: n ← 5
整数型: 合計 ← 0
整数型: i ← 1
while (i ≦ n)
  合計 ← 合計 + i
  i ← i + 1
endwhile
print(合計)
`,
    sampleOutput: "15",
  },
  {
    slug: "for",
    order: 4,
    title: "繰り返し (for) — 「〜から〜まで〜ずつ増やす」の読み方",
    shortTitle: "繰り返し (for)",
    description:
      "基本情報 (FE) 科目 B の擬似言語独自の「for (i を 1 から n まで 1 ずつ増やす)」構文。始まりと終わりを含むかどうか、減らす方向、境界条件をブラウザで動かして確認する。",
    cardSummary: "「〜から〜まで〜ずつ増やす」。終了値を含む閉区間",
    definition:
      "for (変数 を 開始 から 終了 まで 増分 ずつ 増やす / 減らす) から endfor までを、変数が終了値になるまでくり返す。開始値も終了値も含む閉区間で、Python の range とは境界の扱いが違う。",
    keywords: [
      "基本情報",
      "擬似言語",
      "for",
      "endfor",
      "繰り返し",
      "ループ",
      "境界条件",
      "FE 科目B",
    ],
    sampleCode: `整数型: n ← 5
整数型: 合計 ← 0
for (i を 1 から n まで 1 ずつ増やす)
  合計 ← 合計 + i
endfor
print(合計)
`,
    sampleOutput: "15",
  },
  {
    slug: "array",
    order: 5,
    title: "配列 — 添字が 1 から始まる仕様と操作",
    shortTitle: "配列 (1 始まり)",
    description:
      "基本情報 (FE) 科目 B の擬似言語における配列の宣言・要素アクセス・繰り返しでの走査。添字が 1 から始まる仕様に注意し、Python / TypeScript との違いをブラウザで確認する。",
    cardSummary: "添字が 1 始まりの理由と、for との組み合わせ方",
    definition:
      "擬似言語の配列は「型の配列: 名前 ← {要素1, 要素2, ...}」で宣言する。添字は 1 から始まり、arr[1] が先頭要素、arr[要素数] が末尾要素になる。0 番目の要素は存在しない。",
    keywords: [
      "基本情報",
      "擬似言語",
      "配列",
      "1 始まり",
      "添字",
      "要素",
      "FE 科目B",
    ],
    sampleCode: `整数型の配列: 点数 ← {70, 85, 92, 60, 78}
整数型: 合計 ← 0
for (i を 1 から 5 まで 1 ずつ増やす)
  合計 ← 合計 + 点数[i]
endfor
print(合計)
`,
    sampleOutput: "385",
  },
  {
    slug: "function",
    order: 6,
    title: "関数と手続き — ○ から始まる定義の読み方",
    shortTitle: "関数と手続き",
    description:
      "基本情報 (FE) 科目 B の擬似言語における関数 / 手続き定義。○ から始まる書き方、引数の宣言、return による戻り値の返し方を、ブラウザで実行しながら理解する。",
    cardSummary: "○ で始まる定義、引数の宣言、return の戻り方",
    definition:
      "擬似言語の関数定義は ○ から始まる。戻り値を持つ関数は「○戻り値型: 名前(引数の型: 引数名, ...)」、戻り値のない手続きは「○名前(引数の型: 引数名, ...)」と書く。return で呼び出し元に値を返す。",
    keywords: [
      "基本情報",
      "擬似言語",
      "関数",
      "手続き",
      "return",
      "引数",
      "FE 科目B",
    ],
    sampleCode: `○整数型: 最大値(整数型: a, 整数型: b)
  if (a > b)
    return a
  endif
  return b

print(最大値(3, 7))
print(最大値(10, 4))
`,
    sampleOutput: "7\n10",
  },
] as const;

export function findFeLesson(slug: string): FeLessonMeta | undefined {
  return feLessons.find((l) => l.slug === slug);
}

export function feLessonNeighbors(slug: FeLessonSlug): {
  prev: FeLessonMeta | null;
  next: FeLessonMeta | null;
} {
  const idx = feLessons.findIndex((l) => l.slug === slug);
  return {
    prev: idx > 0 ? feLessons[idx - 1] : null,
    next: idx >= 0 && idx < feLessons.length - 1 ? feLessons[idx + 1] : null,
  };
}

export type FeLessonBodyComponent = ComponentType;