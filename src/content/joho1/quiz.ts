import type { Joho1LessonSlug } from "@/content/joho1/lessons";

/**
 * 大学入学共通テスト「情報I」プログラム表記の練習問題。
 *
 * すべて **オリジナル問題**。大学入試センターの過去問・試作問題は転載しない
 * (00-overview.md §5)。
 *
 * FE (`src/content/fe/quiz.ts`) と型を共有していないのは意図的:
 * この言語には **添字の基点** と **問題文で与えられる関数** という、
 * FE に存在しない「問題ごとの前提」があるため (00-overview.md §7-4)。
 * 型をひとつにまとめると、どちらのセクションからも読みにくくなる。
 *
 * 解答キーの正しさは `quiz.test.ts` が実際にインタプリタへ通して検証している。
 * 問題を足すときは expectedOutput を手で書かず、テストを走らせて確定させること。
 */

export type Joho1QuizChoiceId = "ア" | "イ" | "ウ" | "エ";

export interface Joho1QuizChoice {
  id: Joho1QuizChoiceId;
  text: string;
}

export interface Joho1QuizMeta {
  slug: string;
  order: number;
  /** 関連する構文別レッスン */
  lesson: Joho1LessonSlug;
  /** trace = 出力を答える / fill = 空欄に入る記述を選ぶ */
  kind: "trace" | "fill";
  /**
   * basic = レッスンを読めば解ける基礎 / exam = 本番相当。
   * 一覧で 2 層に分けて「どこから難化するか」を見せるために持つ。
   */
  tier: "basic" | "exam";
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  prompt: string;
  /** 一覧カード用の 1 行要約。答えを明かさずに「何をするコードか」だけ書く */
  challenge: string;
  code: string;
  choices: Joho1QuizChoice[];
  answer: Joho1QuizChoiceId;
  explanation: string[];
  /** 誤答を誘う仕掛けの正体。1 行で言い切る */
  trap: string;
  /** fill 問題で空欄を正解で埋めた完成コード (trace では省略) */
  verifyCode?: string;
  /** 実行したときの出力 (改行区切り) */
  expectedOutput: string;
  /**
   * この問題での配列の添字の基点。
   * **共通テストでは問題文で毎回宣言される**もので、同じ年度の本試験と追試験でも
   * 違う (00-overview.md §7-4 (2))。だから問題ごとに持ち、本文にも必ず明記する。
   */
  indexBase: 0 | 1;
  /**
   * 問題文の【関数の説明】で与えられる関数。
   * この言語に固定の組み込み関数セットは存在しないので、明示したものだけが使える。
   */
  functions: string[];
}

/** 添字の基点を本文に出す 1 行。全問で同じ文言にして読み飛ばされないようにする */
export function joho1IndexBaseNote(quiz: Joho1QuizMeta): string {
  return `この問題では、配列の添字は ${quiz.indexBase} から始まるものとする。`;
}

/** 問題文の【関数の説明】相当。与えられた関数がある問題だけ出す */
export const JOHO1_FUNCTION_NOTES: Record<string, string> = {
  要素数: "要素数(配列) — 配列の要素の個数を返す",
  最大値: "最大値(x, y) — x と y のうち大きいほうを返す",
};

export const joho1Quizzes: readonly Joho1QuizMeta[] = [
  {
    slug: "display-no-separator",
    order: 1,
    tier: "basic",
    lesson: "variable",
    kind: "trace",
    title: "表示する() は引数を区切らずにつなげる｜共通テスト 情報I",
    shortTitle: "表示する() のつながり方",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。表示する() に複数の値を渡したとき、値の間に空白が入るのかどうかを実行して確かめる。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "表示する", "練習問題"],
    challenge: "買い物のおつりを計算して 1 行で表示する",
    prompt:
      "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `kingaku = 780
otsuri = 1000 - kingaku
表示する("おつりは", otsuri, "円")
`,
    choices: [
      { id: "ア", text: "おつりは 220 円" },
      { id: "イ", text: "おつりは220円" },
      { id: "ウ", text: "おつりは, 220, 円" },
      { id: "エ", text: "おつりは1000円" },
    ],
    answer: "イ",
    explanation: [
      "表示する() はカンマで区切って渡した値を、そのまま順につなげて 1 行として表示します。カンマは「ここが値の切れ目」を書き手に示すためのもので、表示される文字にはなりません。したがって空白もカンマも入らず、おつりは220円 となります。",
      "otsuri の値は 1000 - 780 で 220 です。1000 がそのまま表示されることはありません。表示する() に渡しているのは kingaku ではなく otsuri なので、引き算の結果が出ます。",
      "本番の問題では、この「つながった 1 行」が選択肢として並びます。空白の有無で選択肢が分かれていたら、区切りは入らないほうを選んでください。",
    ],
    trap: "カンマで区切って渡しても、表示のときに空白やカンマは入らない。",
    expectedOutput: "おつりは220円",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "multiple-assign-div",
    order: 2,
    tier: "basic",
    lesson: "variable",
    kind: "trace",
    title: "複数代入と ÷ による整数の商｜共通テスト 情報I",
    shortTitle: "複数代入と ÷",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。カンマで区切った複数代入と、÷ が返す整数の商をトレースして確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "複数代入", "÷", "商"],
    challenge: "46 円を 10 円玉と 1 円玉に分ける",
    prompt:
      "次のプログラムを実行したとき、表示される内容はどれか。÷ は割り算の商 (小数を切り捨てた整数) を表す。",
    code: `maisu = 0, nokori = 46
maisu = nokori ÷ 10
nokori = nokori - maisu * 10
表示する(maisu, "枚と", nokori, "円")
`,
    choices: [
      { id: "ア", text: "4枚と6円" },
      { id: "イ", text: "4.6枚と0円" },
      { id: "ウ", text: "5枚と-4円" },
      { id: "エ", text: "4枚と46円" },
    ],
    answer: "ア",
    explanation: [
      "1 行目はカンマで区切った複数代入です。maisu に 0、nokori に 46 が入ります。1 行に書いてあっても、左から順に代入されるだけで、特別なことは起きません。",
      "2 行目の 46 ÷ 10 は商なので 4 です。4.6 にはなりませんし、四捨五入して 5 にもなりません。切り捨てる、と覚えてください。",
      "3 行目では nokori = 46 - 4 * 10 を計算します。掛け算が先なので 46 - 40 = 6 です。よって 4枚と6円 が表示されます。",
    ],
    trap: "÷ は小数を返さない。4.6 でも四捨五入した 5 でもなく、切り捨てた 4 になる。",
    expectedOutput: "4枚と6円",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "if-boundary",
    order: 3,
    tier: "basic",
    lesson: "if",
    kind: "trace",
    title: "条件分岐の境界値 — < に等しい値は含まれない｜共通テスト 情報I",
    shortTitle: "条件分岐の境界値",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。もし〜ならば／そうでなければ の分かれ方を、境界ちょうどの値でトレースして確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "条件分岐", "もし ならば", "境界値"],
    challenge: "年齢によってバスの運賃を決める",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `nenrei = 12
もし nenrei < 12 ならば：
  ryoukin = 0
そうでなければ：
  ryoukin = 220
表示する("運賃は", ryoukin, "円")
`,
    choices: [
      { id: "ア", text: "運賃は0円" },
      { id: "イ", text: "運賃は220円" },
      { id: "ウ", text: "運賃は110円" },
      { id: "エ", text: "運賃は12円" },
    ],
    answer: "イ",
    explanation: [
      "< は「より小さい」で、等しい場合は含みません。nenrei は 12 なので 12 < 12 は成り立たず、そうでなければ： の側が実行されて ryoukin は 220 になります。",
      "12 歳も無料にしたいなら条件を nenrei <= 12 に変えます。<= は「以下」で、等しい場合を含みます。日本語の「12 歳未満」と「12 歳以下」の違いがそのまま < と <= の違いです。",
      "共通テストでは、境界ちょうどの値を代入して答えを分けさせる出題がよくあります。条件を読んだら、まず境界の値を自分で当てはめてみてください。",
    ],
    trap: "「12 歳未満」を 12 も含むと読むと 0 円を選んでしまう。< は等しい値を含まない。",
    expectedOutput: "運賃は220円",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "if-equality-operator",
    order: 4,
    tier: "basic",
    lesson: "if",
    kind: "fill",
    title: "比較の == と代入の = の使い分け｜共通テスト 情報I",
    shortTitle: "== と = の使い分け",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。条件のなかで「等しいか」を調べる書き方を選び、代入の = との違いを確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "==", "比較", "代入"],
    challenge: "天気が雨かどうかで持ち物を変える",
    prompt:
      "変数 tenki が \"ame\" のときだけ「かさを持つ」と表示したい。空欄 [ a ] に入れるものとして正しいものはどれか。",
    code: `tenki = "ame"
もし [ a ] ならば：
  表示する("かさを持つ")
そうでなければ：
  表示する("かさは不要")
`,
    choices: [
      { id: "ア", text: 'tenki = "ame"' },
      { id: "イ", text: 'tenki == "ame"' },
      { id: "ウ", text: "tenki == ame" },
      { id: "エ", text: '"ame" = tenki' },
    ],
    answer: "イ",
    explanation: [
      "= は「右の値を左の変数に入れる」代入で、== は「左と右が等しいか」を調べる比較です。条件のなかで使うのは比較なので == を選びます。",
      "ウ の ame は引用符で囲まれていないので、文字列ではなく変数名として読まれます。まだ何も代入されていない変数なので、実行するとエラーになります。文字を扱うときは必ず \" で囲んでください。",
      "ア と エ は代入の形です。日本語で「等しい」と「入れる」を区別するのと同じで、この 2 つは別の操作です。書き間違えても見た目が近いので、条件を書いたら記号が 2 つ並んでいるか確かめる習慣をつけてください。",
    ],
    trap: "見た目が近いので = と == を取り違えやすい。条件のなかは必ず ==。",
    verifyCode: `tenki = "ame"
もし tenki == "ame" ならば：
  表示する("かさを持つ")
そうでなければ：
  表示する("かさは不要")
`,
    expectedOutput: "かさを持つ",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "loop-inclusive-end",
    order: 5,
    tier: "basic",
    lesson: "loop",
    kind: "trace",
    title: "「〜まで」は終わりの値も含む｜共通テスト 情報I",
    shortTitle: "繰り返しの回数",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。「1 から 4 まで 1 ずつ増やしながら繰り返す」が何回実行されるかをトレースで確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "繰り返し", "増やしながら"],
    challenge: "4 日間の歩数を合計する",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `goukei = 0
i を 1 から 4 まで 1 ずつ増やしながら繰り返す：
  goukei = goukei + i * 100
表示する(goukei)
`,
    choices: [
      { id: "ア", text: "600" },
      { id: "イ", text: "1000" },
      { id: "ウ", text: "1500" },
      { id: "エ", text: "400" },
    ],
    answer: "イ",
    explanation: [
      "i は 1、2、3、4 と変わり、4 回実行されます。「4 まで」は 4 を含むので、3 回で終わりではありません。",
      "足される値は 100、200、300、400 で、合計は 1000 です。600 は i が 3 までで止まったと考えた場合の値なので、終わりの値を含めていない誤りです。",
      "回数を数えるときは、最初の値と最後の値を書き出して確かめると確実です。1 から 4 までなら 4 - 1 + 1 で 4 回になります。",
    ],
    trap: "「4 まで」を「4 の手前まで」と読むと 1 回少なくなる。終わりの値も実行される。",
    expectedOutput: "1000",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "loop-decreasing",
    order: 6,
    tier: "basic",
    lesson: "loop",
    kind: "trace",
    title: "減らしながら繰り返す の止まり方｜共通テスト 情報I",
    shortTitle: "減らしながら繰り返す",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。減らしながら繰り返す で増分が 1 でないとき、どの値まで実行されるかを確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "繰り返し", "減らしながら"],
    challenge: "10 から 3 ずつ減らしてカウントダウンする",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `kaisuu = 0
i を 10 から 4 まで 3 ずつ減らしながら繰り返す：
  kaisuu = kaisuu + 1
  表示する(i)
表示する("回数", kaisuu)
`,
    choices: [
      { id: "ア", text: "10\n7\n4\n回数3" },
      { id: "イ", text: "10\n7\n回数2" },
      { id: "ウ", text: "10\n7\n4\n1\n回数4" },
      { id: "エ", text: "10\n9\n8\n7\n6\n5\n4\n回数7" },
    ],
    answer: "ア",
    explanation: [
      "i は 10 から始まり、3 ずつ減って 7、4 となります。次は 1 ですが、これは終わりの値 4 を通り越しているので実行されません。よって 3 回です。",
      "エ は増分の 3 を無視して 1 ずつ減らした場合の値です。「3 ずつ」の部分は必ず読んでください。増分が 1 でない繰り返しは共通テストでよく出ます。",
      "終わりの値 4 はちょうど到達するので実行されます。もし終わりが 5 だったら 10、7 の 2 回で止まります。到達できるかどうかは、増分で割り切れるかで決まります。",
    ],
    trap: "増分が 1 でないとき、終わりの値をちょうど踏むか通り越すかで回数が変わる。",
    expectedOutput: "10\n7\n4\n回数3",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "while-until-short",
    order: 7,
    tier: "basic",
    lesson: "loop-while",
    kind: "trace",
    title: "〜の間繰り返す は条件が崩れた時点で止まる｜共通テスト 情報I",
    shortTitle: "の間繰り返す",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。回数が決まっていない繰り返しが、どの時点で止まるかをトレースして確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "の間繰り返す", "条件"],
    challenge: "所持金が足りる間だけ 300 円の品を買う",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `zandaka = 1000
kaisuu = 0
(zandaka >= 300) の間繰り返す：
  zandaka = zandaka - 300
  kaisuu = kaisuu + 1
表示する(kaisuu, "回買えて残り", zandaka, "円")
`,
    choices: [
      { id: "ア", text: "3回買えて残り100円" },
      { id: "イ", text: "4回買えて残り-200円" },
      { id: "ウ", text: "3回買えて残り400円" },
      { id: "エ", text: "2回買えて残り400円" },
    ],
    answer: "ア",
    explanation: [
      "条件は繰り返しに入る前に毎回調べられます。1000 → 700 → 400 → 100 と減り、100 の時点で 100 >= 300 が成り立たないので止まります。実行できたのは 3 回です。",
      "イ は条件を調べずに 4 回目を実行してしまった場合の値です。残高が足りないのに買ってしまうので、マイナスになります。条件は「中に入る前」に調べる、と覚えてください。",
      "ウ と エ は減らす回数の数え間違いです。表示は繰り返しが終わったあとの 1 回だけなので、最後に残った値が出ます。",
    ],
    trap: "条件は繰り返しに入る前に毎回調べられる。足りなくなった回は実行されない。",
    expectedOutput: "3回買えて残り100円",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "array-zero-based-sum",
    order: 8,
    tier: "basic",
    lesson: "array",
    kind: "trace",
    title: "添字が 0 から始まる配列の合計｜共通テスト 情報I",
    shortTitle: "0 始まりの配列の合計",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。添字が 0 から始まると宣言された配列を、繰り返しで最後まで足し上げる。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "配列", "添字", "0から始まる"],
    challenge: "4 人分の点数を最初から最後まで足す",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `Tensuu = [4, 8, 2, 9]
goukei = 0
i を 0 から 3 まで 1 ずつ増やしながら繰り返す：
  goukei = goukei + Tensuu[i]
表示する(goukei)
`,
    choices: [
      { id: "ア", text: "23" },
      { id: "イ", text: "19" },
      { id: "ウ", text: "14" },
      { id: "エ", text: "8" },
    ],
    answer: "ア",
    explanation: [
      "添字は 0 から始まるので、Tensuu[0] が 4、Tensuu[1] が 8、Tensuu[2] が 2、Tensuu[3] が 9 です。i は 0 から 3 まで動くので、4 つすべてを足して 23 になります。",
      "イ の 19 は 8 + 2 + 9 で、最初の要素を飛ばした場合の値です。0 始まりの配列で i を 1 から回すと、先頭が抜け落ちます。",
      "ウ の 14 は 4 + 8 + 2 で、最後の要素が抜けた場合の値です。要素が 4 つで 0 始まりなら、最後の添字は 4 ではなく 3 です。個数と最後の添字がずれる点に注意してください。",
    ],
    trap: "0 始まりでは、要素が 4 つあっても最後の添字は 3。個数と最後の添字は一致しない。",
    expectedOutput: "23",
    indexBase: 0,
    functions: [],
  },
  {
    slug: "array-base-changes-answer",
    order: 9,
    tier: "basic",
    lesson: "array",
    kind: "trace",
    title: "同じ Tensuu[1] でも添字の基点で値が変わる｜共通テスト 情報I",
    shortTitle: "基点で変わる Tensuu[1]",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。まったく同じ書き方でも、添字が 0 から始まるか 1 から始まるかで取り出される要素が変わることを確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "配列", "添字", "1から始まる"],
    challenge: "配列の先頭の要素を取り出す",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `Tensuu = [4, 8, 2, 9]
saisho = Tensuu[1]
表示する(saisho)
`,
    choices: [
      { id: "ア", text: "4" },
      { id: "イ", text: "8" },
      { id: "ウ", text: "9" },
      { id: "エ", text: "2" },
    ],
    answer: "ア",
    explanation: [
      "この問題では添字が 1 から始まると宣言されているので、Tensuu[1] は先頭の 4 です。",
      "もし同じプログラムを「添字は 0 から始まる」という前提で読むと、Tensuu[1] は 2 番目の 8 になります。コードは 1 文字も変わっていないのに、答えが変わります。",
      "共通テストのプログラム表記では、添字の基点は言語で決まっておらず問題文のなかで宣言されます。実際に、同じ年度の本試験と追試験で 1 始まりと 0 始まりの両方が使われています。問題を読んだらまず基点を確認してください。",
    ],
    trap: "同じ Tensuu[1] でも、0 始まりの問題なら 2 番目の要素を指す。基点は問題文で確認する。",
    expectedOutput: "4",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "function-element-count",
    order: 10,
    tier: "basic",
    lesson: "function",
    kind: "trace",
    title: "要素数() は問題文で与えられる関数｜共通テスト 情報I",
    shortTitle: "要素数() の使い方",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。要素数() のような関数は言語に備わっているのではなく、問題文の【関数の説明】で与えられることを確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "関数", "要素数"],
    challenge: "会員番号の配列から人数を求める",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `Kaiin = [101, 205, 307, 412, 509]
ninzuu = 要素数(Kaiin)
表示する("会員は", ninzuu, "人")
`,
    choices: [
      { id: "ア", text: "会員は5人" },
      { id: "イ", text: "会員は4人" },
      { id: "ウ", text: "会員は509人" },
      { id: "エ", text: "会員は101人" },
    ],
    answer: "ア",
    explanation: [
      "要素数() は配列に並んでいる値の個数を返します。Kaiin には 5 つの値が入っているので 5 です。中身が何であっても、個数だけを数えます。",
      "ウ の 509 は最後の要素、エ の 101 は先頭の要素です。要素数() が返すのは中身ではなく個数なので、どちらも誤りです。",
      "この言語には、どの問題でも使える決まった関数の一覧がありません。要素数() が使えるのは、問題文の【関数の説明】でその意味が示されているからです。本番では、まず関数の説明を読んでから本文を追ってください。",
    ],
    trap: "要素数() が返すのは配列の中身ではなく個数。添字の基点が 0 でも 1 でも個数は変わらない。",
    expectedOutput: "会員は5人",
    indexBase: 1,
    functions: ["要素数"],
  },
  {
    slug: "loop-step-fill",
    order: 11,
    tier: "exam",
    lesson: "loop",
    kind: "fill",
    title: "奇数だけを足すための増分を選ぶ｜共通テスト 情報I",
    shortTitle: "増分を選ぶ",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。1 から 9 までの奇数の合計を求めるために、繰り返しの増分に何を入れるべきかを選ぶ。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "繰り返し", "増分", "空欄補充"],
    challenge: "1 から 9 までの奇数だけを合計する",
    prompt:
      "1 から 9 までの奇数 (1, 3, 5, 7, 9) の合計を求めたい。空欄 [ a ] に入れるものとして正しいものはどれか。",
    code: `goukei = 0
i を 1 から 9 まで [ a ] ずつ増やしながら繰り返す：
  goukei = goukei + i
表示する(goukei)
`,
    choices: [
      { id: "ア", text: "1" },
      { id: "イ", text: "2" },
      { id: "ウ", text: "3" },
      { id: "エ", text: "5" },
    ],
    answer: "イ",
    explanation: [
      "1 から始めて 2 ずつ増やすと、i は 1、3、5、7、9 と奇数だけを通ります。合計は 25 です。",
      "ア の 1 だと 1 から 9 までのすべての整数を足すことになり、45 になります。奇数だけを選ぶには、飛ばす幅を 2 にする必要があります。",
      "増分は「1 回ごとにいくつ進むか」です。何個ぶん飛ばしたいかではなく、値がいくつ増えるかで考えてください。偶数だけを足したいなら、開始を 2 にして増分は同じ 2 のままです。",
    ],
    trap: "「1 つおきに」を増分 1 と読み違えると、偶数まで足してしまう。",
    verifyCode: `goukei = 0
i を 1 から 9 まで 2 ずつ増やしながら繰り返す：
  goukei = goukei + i
表示する(goukei)
`,
    expectedOutput: "25",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "array-indirect-stock",
    order: 12,
    tier: "exam",
    lesson: "array",
    kind: "trace",
    title: "配列を書き換えながら回す — 在庫と注文｜共通テスト 情報I",
    shortTitle: "在庫を減らしながら回す",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。配列の添字にもう 1 つの配列の値を使い、書き換えた結果が後の周回に影響する処理をトレースする。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "配列", "添字", "トレース"],
    challenge: "注文の順に在庫を 1 つずつ減らす",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `Zaiko = [3, 1, 2]
Chuumon = [1, 1, 3, 2, 2]
i を 1 から 5 まで 1 ずつ増やしながら繰り返す：
  ban = Chuumon[i]
  もし Zaiko[ban] > 0 ならば：
    Zaiko[ban] = Zaiko[ban] - 1
  そうでなければ：
    表示する(ban, "番は品切れ")
表示する(Zaiko[1], "個 ", Zaiko[2], "個 ", Zaiko[3], "個")
`,
    choices: [
      { id: "ア", text: "2番は品切れ\n1個 0個 1個" },
      { id: "イ", text: "1個 0個 1個" },
      { id: "ウ", text: "2番は品切れ\n1個 1個 1個" },
      { id: "エ", text: "2番は品切れ\n0個 0個 1個" },
    ],
    answer: "ア",
    explanation: [
      "Zaiko[ban] は内側から読みます。i = 1 では ban = Chuumon[1] = 1 なので Zaiko[1] が 3 から 2 に減ります。i = 2 も ban = 1 で、Zaiko[1] は 1 になります。i = 3 は ban = 3 で Zaiko[3] が 1 に、i = 4 は ban = 2 で Zaiko[2] が 0 になります。",
      "i = 5 でふたたび ban = 2 になりますが、Zaiko[2] は 4 周目で 0 になっているので、条件が成り立たず 2番は品切れ が表示されます。前の周で書き換えた値が、後の周の判定に効いています。",
      "最後の行では Zaiko[1] = 1、Zaiko[2] = 0、Zaiko[3] = 1 が表示されます。配列を書き換えながら回すループでは、いま見ている値が何周目の結果なのかを紙に書いて追ってください。",
    ],
    trap: "Zaiko[Chuumon[i]] は内側から評価する。減らした在庫が後の周回の判定を変える。",
    expectedOutput: "2番は品切れ\n1個 0個 1個",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "array-find-max-fill",
    order: 13,
    tier: "exam",
    lesson: "array",
    kind: "fill",
    title: "配列の最大値を探す条件を選ぶ｜共通テスト 情報I",
    shortTitle: "最大値を探す条件",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。配列のなかで最も大きい値を求めるとき、繰り返しのなかの条件に何を書くべきかを選ぶ。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "配列", "最大値", "空欄補充"],
    challenge: "記録の配列から最も大きい値を求める",
    prompt:
      "配列 Kiroku のなかで最も大きい値を求めて表示したい。空欄 [ a ] に入れるものとして正しいものはどれか。",
    code: `Kiroku = [12, 30, 8, 25, 19]
saidai = Kiroku[1]
i を 2 から 5 まで 1 ずつ増やしながら繰り返す：
  もし [ a ] ならば：
    saidai = Kiroku[i]
表示する(saidai)
`,
    choices: [
      { id: "ア", text: "Kiroku[i] > saidai" },
      { id: "イ", text: "Kiroku[i] < saidai" },
      { id: "ウ", text: "saidai > Kiroku[i]" },
      { id: "エ", text: "Kiroku[i] > Kiroku[1]" },
    ],
    answer: "ア",
    explanation: [
      "この形は「いまのところの最大値」を saidai に持ち歩き、それより大きい値が出てきたら入れ替える、という手順です。したがって条件は「いま見ている要素が saidai より大きいか」、つまり Kiroku[i] > saidai になります。結果は 30 です。",
      "エ は比べる相手が saidai ではなく Kiroku[1] に固定されています。12 より大きい値が出るたびに saidai が上書きされるので、最後に見た 19 が残ってしまいます。最大値ではなく「最後に 12 を超えた値」になります。",
      "イ と ウ は不等号の向きが逆で、小さい値が出るたびに入れ替わります。これは最小値を求める手順です。最大値と最小値は不等号 1 文字しか違わないので、どちらを求めているのかを先に決めてから書いてください。",
    ],
    trap: "比べる相手を Kiroku[1] に固定すると、最後に基準を超えた値が残るだけで最大値にならない。",
    verifyCode: `Kiroku = [12, 30, 8, 25, 19]
saidai = Kiroku[1]
i を 2 から 5 まで 1 ずつ増やしながら繰り返す：
  もし Kiroku[i] > saidai ならば：
    saidai = Kiroku[i]
表示する(saidai)
`,
    expectedOutput: "30",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "while-and-two-conditions",
    order: 14,
    tier: "exam",
    lesson: "loop-while",
    kind: "trace",
    title: "and でつないだ条件はどちらか崩れれば止まる｜共通テスト 情報I",
    shortTitle: "and でつないだ条件",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。2 つの条件を and でつないだ繰り返しが、どちらの条件で止まったのかを読み取る。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "and", "の間繰り返す", "論理演算子"],
    challenge: "所持金と本数の上限、両方を守って買う",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `nokori = 500
kaisuu = 0
(nokori >= 120) and (kaisuu < 3) の間繰り返す：
  nokori = nokori - 120
  kaisuu = kaisuu + 1
表示する(kaisuu, "本 残り", nokori, "円")
`,
    choices: [
      { id: "ア", text: "3本 残り140円" },
      { id: "イ", text: "4本 残り20円" },
      { id: "ウ", text: "3本 残り260円" },
      { id: "エ", text: "2本 残り260円" },
    ],
    answer: "ア",
    explanation: [
      "and は「両方が成り立つとき」だけ真になります。500 → 380 → 260 → 140 と減り、3 回目が終わった時点で kaisuu は 3 です。140 >= 120 はまだ成り立ちますが、kaisuu < 3 が崩れるので繰り返しは止まります。",
      "イ は本数の上限を見落として 4 回買った場合の値です。残高だけを見ていると、まだ買えると考えてしまいます。and でつないだ条件は、片方が崩れた時点で全体が成り立たなくなります。",
      "止まった理由が 2 つのうちどちらだったのかを言えるようにしておくと、選択肢を絞れます。ここでは所持金ではなく本数の上限で止まりました。",
    ],
    trap: "残高はまだ足りているので買えそうに見えるが、回数の上限のほうが先に効く。",
    expectedOutput: "3本 残り140円",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "array-diff-previous",
    order: 15,
    tier: "exam",
    lesson: "array",
    kind: "trace",
    title: "添字に式を書いて前の要素と比べる｜共通テスト 情報I",
    shortTitle: "前の要素との差",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。Kion[i - 1] のように添字に式を書き、1 つ前の要素との差を調べる処理をトレースする。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "配列", "添字", "差"],
    challenge: "前の日より気温が上がった日を見つける",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `Kion = [18, 21, 19, 24, 22]
i を 2 から 5 まで 1 ずつ増やしながら繰り返す：
  sa = Kion[i] - Kion[i - 1]
  もし sa > 0 ならば：
    表示する(i, "日目は", sa, "度上がった")
`,
    choices: [
      { id: "ア", text: "2日目は3度上がった\n4日目は5度上がった" },
      { id: "イ", text: "1日目は3度上がった\n3日目は5度上がった" },
      { id: "ウ", text: "2日目は3度上がった\n3日目は5度上がった" },
      { id: "エ", text: "2日目は3度上がった\n4日目は5度上がった\n5日目は2度上がった" },
    ],
    answer: "ア",
    explanation: [
      "i = 2 では Kion[2] - Kion[1] = 21 - 18 = 3 で、正なので表示されます。i = 3 では 19 - 21 = -2 で表示されません。i = 4 では 24 - 19 = 5 で表示され、i = 5 では 22 - 24 = -2 なので表示されません。",
      "繰り返しが 1 ではなく 2 から始まっているのは、i = 1 のとき Kion[0] を見ることになり、1 始まりの配列では存在しない添字になるからです。前の要素と比べる処理では、必ず 2 番目から始めます。",
      "エ は下がった日も表示してしまった場合です。差がマイナスのときは条件 sa > 0 が成り立たないので、何も表示されません。差の符号まで含めて追ってください。",
    ],
    trap: "前の要素と比べる処理は i = 1 から回せない。Kion[0] は 1 始まりの配列には存在しない。",
    expectedOutput: "2日目は3度上がった\n4日目は5度上がった",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "function-max-with-count",
    order: 16,
    tier: "exam",
    lesson: "function",
    kind: "trace",
    title: "要素数() と最大値() を組み合わせて最高点を求める｜共通テスト 情報I",
    shortTitle: "要素数と最大値の併用",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。問題文で与えられた 2 つの関数を使い、配列の要素数に応じて最後まで回して最大値を求める。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "関数", "要素数", "最大値"],
    challenge: "人数がわからない配列から最高点を探す",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `Tokuten = [62, 78, 55, 91, 70]
ninzuu = 要素数(Tokuten)
saikou = Tokuten[1]
i を 2 から ninzuu まで 1 ずつ増やしながら繰り返す：
  saikou = 最大値(saikou, Tokuten[i])
表示する("最高点は", saikou, "点 (", ninzuu, "人)")
`,
    choices: [
      { id: "ア", text: "最高点は91点 (5人)" },
      { id: "イ", text: "最高点は70点 (5人)" },
      { id: "ウ", text: "最高点は62点 (5人)" },
      { id: "エ", text: "最高点は91点 (4人)" },
    ],
    answer: "ア",
    explanation: [
      "要素数(Tokuten) は 5 です。saikou は先頭の 62 で始まり、繰り返しのたびに 最大値(saikou, Tokuten[i]) で大きいほうに置き換わります。78、78、91、91 と変わり、最後は 91 になります。",
      "イ の 70 は最後の要素です。最大値() を使わずに毎回上書きしてしまうと、最後に見た値が残ります。大きいほうを選んでいることを確認してください。",
      "繰り返しの終わりに 5 ではなく ninzuu と書いてあるのは、要素の個数が変わっても直さずに済むようにするためです。共通テストでも、配列の長さを直接書かずに 要素数() を使う形がよく出ます。",
    ],
    trap: "最大値() を使わず単に代入すると、最後の要素がそのまま残る。",
    expectedOutput: "最高点は91点 (5人)",
    indexBase: 1,
    functions: ["要素数", "最大値"],
  },
  {
    slug: "if-sequential-overwrite",
    order: 17,
    tier: "exam",
    lesson: "if",
    kind: "trace",
    title: "並んだ「もし」は入れ子ではなく順に実行される｜共通テスト 情報I",
    shortTitle: "並んだ もし の上書き",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。字下げされずに並んだ複数の もし〜ならば が、どの順で実行されて結果を上書きするかを確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "条件分岐", "もし ならば", "上書き"],
    challenge: "点数から評価の記号を決める",
    prompt: "次のプログラムを実行したとき、表示される内容はどれか。",
    code: `tensuu = 85
hyouka = "C"
もし tensuu >= 70 ならば：
  hyouka = "B"
もし tensuu >= 80 ならば：
  hyouka = "A"
もし tensuu >= 90 ならば：
  hyouka = "S"
表示する(hyouka)
`,
    choices: [
      { id: "ア", text: "S" },
      { id: "イ", text: "A" },
      { id: "ウ", text: "B" },
      { id: "エ", text: "C" },
    ],
    answer: "イ",
    explanation: [
      "3 つの もし は字下げが同じ高さに並んでいるので、入れ子ではありません。上から順に、条件が成り立つかどうかを 3 回とも調べます。",
      "tensuu は 85 です。1 つ目の 85 >= 70 が成り立つので hyouka は B になり、2 つ目の 85 >= 80 も成り立つので A に上書きされます。3 つ目の 85 >= 90 は成り立たないので、A のまま残ります。",
      "ウ の B は、最初に成り立った条件で決まると考えた場合の答えです。そうでなければ： でつながっていない限り、後の判定は前の結果を上書きします。字下げの高さを見て、入れ子なのか並んでいるだけなのかを必ず確認してください。",
    ],
    trap: "字下げが同じ高さの もし は入れ子ではない。最初に成り立った条件で確定はしない。",
    expectedOutput: "A",
    indexBase: 1,
    functions: [],
  },
  {
    slug: "array-tally-fill",
    order: 18,
    tier: "exam",
    lesson: "array",
    kind: "fill",
    title: "回答を集計する配列の書き方を選ぶ｜共通テスト 情報I",
    shortTitle: "集計用の配列",
    description:
      "共通テスト「情報I」プログラム表記の練習問題。回答の番号をそのまま集計用の配列の添字として使う書き方を選び、度数分布の作り方を確認する。",
    keywords: ["共通テスト", "情報I", "情報1", "プログラム表記", "配列", "集計", "空欄補充"],
    challenge: "3 択のアンケートの票数を数える",
    prompt:
      "配列 Kaitou には 6 人が選んだ番号 (1〜3) が入っている。選択肢ごとの票数を配列 Shukei に数えたい。空欄 [ a ] に入れるものとして正しいものはどれか。",
    code: `Kaitou = [2, 1, 3, 2, 2, 1]
Shukei = [0, 0, 0]
i を 1 から 6 まで 1 ずつ増やしながら繰り返す：
  [ a ]
表示する(Shukei[1], "票 ", Shukei[2], "票 ", Shukei[3], "票")
`,
    choices: [
      { id: "ア", text: "Shukei[Kaitou[i]] = Shukei[Kaitou[i]] + 1" },
      { id: "イ", text: "Shukei[i] = Shukei[i] + 1" },
      { id: "ウ", text: "Shukei[Kaitou[i]] = Kaitou[i]" },
      { id: "エ", text: "Shukei[i] = Kaitou[i]" },
    ],
    answer: "ア",
    explanation: [
      "数えたいのは「何番が選ばれたか」なので、集計用の配列の添字には、いま見ている回答の値である Kaitou[i] を使います。そこに 1 を足していくと票数になります。結果は 2票 3票 1票 です。",
      "イ は回答の中身を見ずに、i 番目を数えています。これでは全員が別々の選択肢に 1 票ずつ入れたことになりますし、Shukei は 3 つしかないので i が 4 になった時点で存在しない添字を指してエラーになります。",
      "ウ と エ は足すのではなく代入しているので、何回選ばれても最後の 1 回で上書きされます。集計は「いまの値に 1 を足して入れ直す」形になる、と覚えてください。",
    ],
    trap: "回答の値を添字に使うのが集計。i をそのまま添字にすると、誰が何を選んだかが消える。",
    verifyCode: `Kaitou = [2, 1, 3, 2, 2, 1]
Shukei = [0, 0, 0]
i を 1 から 6 まで 1 ずつ増やしながら繰り返す：
  Shukei[Kaitou[i]] = Shukei[Kaitou[i]] + 1
表示する(Shukei[1], "票 ", Shukei[2], "票 ", Shukei[3], "票")
`,
    expectedOutput: "2票 3票 1票",
    indexBase: 1,
    functions: [],
  },
] as const;

export function findJoho1Quiz(slug: string): Joho1QuizMeta | undefined {
  return joho1Quizzes.find((q) => q.slug === slug);
}

export function joho1QuizNeighbors(slug: string): {
  prev: Joho1QuizMeta | null;
  next: Joho1QuizMeta | null;
} {
  const idx = joho1Quizzes.findIndex((q) => q.slug === slug);
  return {
    prev: idx > 0 ? joho1Quizzes[idx - 1] : null,
    next:
      idx >= 0 && idx < joho1Quizzes.length - 1 ? joho1Quizzes[idx + 1] : null,
  };
}

export function joho1QuizzesByTier(tier: Joho1QuizMeta["tier"]): Joho1QuizMeta[] {
  return joho1Quizzes.filter((q) => q.tier === tier);
}

export function joho1QuizzesForLesson(
  lesson: Joho1LessonSlug,
): Joho1QuizMeta[] {
  return joho1Quizzes.filter((q) => q.lesson === lesson);
}

/** 解答後に「実行シミュレーターで開く」ためのコード (fill は正解を埋めた形) */
export function joho1QuizRunnableCode(quiz: Joho1QuizMeta): string {
  return quiz.verifyCode ?? quiz.code;
}

/**
 * 実行シミュレーターへの deep link。
 * **`base` を必ず付ける**。付けないとシミュレーター既定の 1 始まりで走り、
 * 0 始まりの問題では解説と違う答えが出る (00-overview.md §7-4 (2))。
 */
export function joho1QuizRunHref(quiz: Joho1QuizMeta): string {
  const code = encodeURIComponent(joho1QuizRunnableCode(quiz));
  const from = encodeURIComponent(`/joho1/quiz/${quiz.slug}`);
  return `/joho1?code=${code}&base=${quiz.indexBase}&from=${from}`;
}
