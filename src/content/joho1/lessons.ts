import type { ComponentType } from "react";

/**
 * 共通テスト「情報I」プログラム表記の構文別レッスン。
 *
 * 内容は **実物 (試作問題 + 令和7・8年度の本試験/追試験) で確認できた記法だけ**に限る。
 * 仕様書が存在しない言語なので、推測で書くと受験者に嘘を教えることになる。
 * 確認済みのインベントリは docs/wip/20260807-joho1/00-overview.md §7-3。
 */
export type Joho1LessonSlug =
  | "variable"
  | "if"
  | "loop"
  | "loop-while"
  | "array"
  | "function";

export interface Joho1LessonMeta {
  slug: Joho1LessonSlug;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  /** 一覧カード用の 1 行要約 */
  cardSummary: string;
  definition: string;
  keywords: string[];
  sampleCode: string;
  sampleOutput?: string;
  /**
   * サンプルを動かすときの添字の基点。
   * **言語の性質ではなく問題ごとの前提**なので、レッスンごとに明示する
   * (00-overview.md §7-4 (2))。
   */
  indexBase: 0 | 1;
}

export const joho1Lessons: readonly Joho1LessonMeta[] = [
  {
    slug: "variable",
    order: 1,
    title: "変数と代入 — 共通テスト 情報I のプログラム表記",
    shortTitle: "変数と代入",
    description:
      "共通テスト「情報I」のプログラム表記における変数と代入。= で代入し、カンマで区切って 1 行に複数書ける。表示する() の使い方まで、ブラウザで動かしながら確認する。",
    cardSummary: "= による代入、カンマ区切りの複数代入、表示する()",
    definition:
      "共通テストのプログラム表記では、変数に値を入れるのに = を使う。型を宣言する必要はなく、代入した時点でその変数が使えるようになる。カンマで区切ると 1 行に複数の代入を書ける。",
    keywords: [
      "共通テスト",
      "情報I",
      "情報1",
      "プログラム表記",
      "変数",
      "代入",
      "表示する",
    ],
    sampleCode: `kingaku = 46
maisu = 0, nokori = kingaku
表示する("残り", nokori, "円")
`,
    sampleOutput: "残り46円",
    indexBase: 1,
  },
  {
    slug: "if",
    order: 2,
    title: "条件分岐 (もし〜ならば) の書き方と読み方",
    shortTitle: "条件分岐",
    description:
      "共通テスト「情報I」のプログラム表記の条件分岐。もし〜ならば：とそうでなければ：の書き方、= と == の違い、ブロックがどこまで続くのかの読み方を、実際に動かして確認する。",
    cardSummary: "もし〜ならば：／そうでなければ：、代入の = と比較の ==",
    definition:
      "条件分岐は「もし 条件 ならば：」で始まり、条件が成り立つときの処理を字下げして書く。成り立たないときの処理は「そうでなければ：」の下に字下げして書く。値が等しいかを調べる比較は == で、代入の = とは別の記号を使う。",
    keywords: [
      "共通テスト",
      "情報I",
      "情報1",
      "プログラム表記",
      "条件分岐",
      "もし ならば",
      "そうでなければ",
      "==",
    ],
    sampleCode: `tokuten = 72
もし tokuten >= 60 ならば：
  表示する("合格")
そうでなければ：
  表示する("不合格")
`,
    sampleOutput: "合格",
    indexBase: 1,
  },
  {
    slug: "loop",
    order: 3,
    title: "繰り返し (〜から〜まで〜ずつ増やしながら) の読み方",
    shortTitle: "繰り返し (回数)",
    description:
      "共通テスト「情報I」で最もよく出る繰り返し。「i を 1 から 5 まで 1 ずつ増やしながら繰り返す：」の読み方と、減らす方向の書き方を、変数の変化を見ながら理解する。",
    cardSummary: "「〜から〜まで〜ずつ増やしながら繰り返す」。減らす方向も",
    definition:
      "回数が決まっている繰り返しは「変数 を 開始 から 終了 まで 増分 ずつ増やしながら繰り返す：」と書く。終了の値も含めて繰り返す。逆向きに数えるときは「減らしながら繰り返す」を使う。",
    keywords: [
      "共通テスト",
      "情報I",
      "情報1",
      "プログラム表記",
      "繰り返し",
      "増やしながら",
      "減らしながら",
    ],
    sampleCode: `goukei = 0
i を 1 から 5 まで 1 ずつ増やしながら繰り返す：
  goukei = goukei + i
表示する("合計は", goukei)
`,
    sampleOutput: "合計は15",
    indexBase: 1,
  },
  {
    slug: "loop-while",
    order: 4,
    title: "条件がある間の繰り返しと論理演算子 and / or",
    shortTitle: "繰り返し (条件)",
    description:
      "共通テスト「情報I」のプログラム表記における「〜の間繰り返す：」。回数が決まっていない繰り返しの書き方と、and / or を使った条件の組み立て方を動かして確認する。",
    cardSummary: "「〜の間繰り返す：」と、条件をつなぐ and / or",
    definition:
      "繰り返す回数が決まっていないときは「条件 の間繰り返す：」と書き、条件が成り立つ間だけ中の処理をくり返す。条件を組み合わせるときは and（かつ）と or（または）を使う。",
    keywords: [
      "共通テスト",
      "情報I",
      "情報1",
      "プログラム表記",
      "の間繰り返す",
      "and",
      "or",
      "論理演算子",
    ],
    sampleCode: `nokori = 100
kaisuu = 0
(nokori > 0) and (kaisuu < 10) の間繰り返す：
  nokori = nokori - 30
  kaisuu = kaisuu + 1
表示する(kaisuu, "回で残り", nokori)
`,
    sampleOutput: "4回で残り-20",
    indexBase: 1,
  },
  {
    slug: "array",
    order: 5,
    title: "配列と添字 — 0 から始まるか 1 から始まるか",
    shortTitle: "配列と添字",
    description:
      "共通テスト「情報I」のプログラム表記の配列。[ ] で並べて作り、添字で要素を取り出す。添字が 0 から始まるか 1 から始まるかは問題ごとに指定されるので、その読み取り方まで確認する。",
    cardSummary: "[ ] で作る配列と、問題ごとに変わる添字の基点",
    definition:
      "配列は [ ] の中に値をカンマで区切って並べて作り、名前[添字] の形で要素を取り出す。添字が 0 から始まるか 1 から始まるかは言語で決まっておらず、問題文のなかで指定される。",
    keywords: [
      "共通テスト",
      "情報I",
      "情報1",
      "プログラム表記",
      "配列",
      "添字",
      "0から始まる",
      "1から始まる",
    ],
    sampleCode: `Tokuten = [70, 85, 92, 60, 78]
goukei = 0
i を 0 から 4 まで 1 ずつ増やしながら繰り返す：
  goukei = goukei + Tokuten[i]
表示する("合計は", goukei)
`,
    sampleOutput: "合計は385",
    indexBase: 0,
  },
  {
    slug: "function",
    order: 6,
    title: "外部関数の読み方 — 要素数・最大値は問題文で与えられる",
    shortTitle: "外部関数の読み方",
    description:
      "共通テスト「情報I」のプログラム表記に、決まった組み込み関数の一覧は存在しない。要素数() や 最大値() は問題文の【関数の説明】で毎回定義される。その読み取り方と使い方を確認する。",
    cardSummary: "関数は問題文で与えられる。覚えるのではなく読み取る",
    definition:
      "プログラム表記には、どの問題でも使える決まった関数の一覧は無い。要素数() や 最大値() のような関数は、その問題の【関数の説明】として日本語で意味が示され、そこで初めて使えるようになる。",
    keywords: [
      "共通テスト",
      "情報I",
      "情報1",
      "プログラム表記",
      "関数",
      "要素数",
      "最大値",
    ],
    sampleCode: `Touchaku = [0, 3, 4, 10, 11, 12]
kyakusu = 要素数(Touchaku)
表示する("人数は", kyakusu)
表示する("大きいほうは", 最大値(3, 7))
`,
    sampleOutput: "人数は6\n大きいほうは7",
    indexBase: 1,
  },
] as const;

export function findJoho1Lesson(slug: string): Joho1LessonMeta | undefined {
  return joho1Lessons.find((l) => l.slug === slug);
}

export function joho1LessonNeighbors(slug: Joho1LessonSlug): {
  prev: Joho1LessonMeta | null;
  next: Joho1LessonMeta | null;
} {
  const idx = joho1Lessons.findIndex((l) => l.slug === slug);
  return {
    prev: idx > 0 ? joho1Lessons[idx - 1] : null,
    next:
      idx >= 0 && idx < joho1Lessons.length - 1 ? joho1Lessons[idx + 1] : null,
  };
}

export type Joho1LessonBodyComponent = ComponentType;
