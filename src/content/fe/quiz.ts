import type { FeLessonSlug } from "@/content/fe/lessons";

/**
 * 基本情報技術者試験 (FE) 科目 B の擬似言語 練習問題。
 *
 * すべて **オリジナル問題** (IPA 公式過去問は転載しない)。
 * 設計方針は docs/fe-playground/04-quiz-design.md を参照。
 *
 * 解答キーの正しさは `quiz.test.ts` が実際にインタプリタへ通して検証している。
 * 問題を足すときは expectedOutput を手で書かず、テストを走らせて確定させること。
 */

export type FeQuizChoiceId = "ア" | "イ" | "ウ" | "エ";

export interface FeQuizChoice {
  id: FeQuizChoiceId;
  text: string;
}

export interface FeQuizMeta {
  slug: string;
  order: number;
  /** 関連する構文別レッスン */
  lesson: FeLessonSlug;
  /** trace = 出力を答える / fill = 空欄に入る記述を選ぶ */
  kind: "trace" | "fill";
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  prompt: string;
  /** 一覧カード用の 1 行要約。答えを明かさずに「何をするコードか」だけ書く */
  challenge: string;
  code: string;
  choices: FeQuizChoice[];
  answer: FeQuizChoiceId;
  explanation: string[];
  /** 誤答を誘う仕掛けの正体。1 行で言い切る */
  trap: string;
  /** fill 問題で空欄を正解で埋めた完成コード (trace では省略) */
  verifyCode?: string;
  /** 実行したときの出力 (改行区切り) */
  expectedOutput: string;
}

export const feQuizzes: readonly FeQuizMeta[] = [
  {
    slug: "assign-swap",
    order: 1,
    lesson: "variable",
    kind: "trace",
    title: "変数の入れ替えで値が消える — 基本情報 擬似言語 練習問題",
    shortTitle: "変数の入れ替え",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。2 つの変数を入れ替えようとして値が壊れるコードをトレースし、代入 (←) の実行順序を確認する。",
    keywords: ["基本情報", "擬似言語", "練習問題", "変数", "代入", "トレース"],
    challenge: "2 つの変数の値を入れ替えようとしている",
    prompt:
      "次の擬似言語プログラムを実行したとき、出力される内容はどれか。",
    code: `整数型: x ← 3
整数型: y ← 8
x ← y
y ← x
print(x)
print(y)
`,
    choices: [
      { id: "ア", text: "3\n8" },
      { id: "イ", text: "8\n8" },
      { id: "ウ", text: "8\n3" },
      { id: "エ", text: "3\n3" },
    ],
    answer: "イ",
    explanation: [
      "代入は右辺を評価してから左辺に入れる、という 1 方向の操作です。上から順に追うと、まず x ← y で x が 8 になります。この時点で x が元に持っていた 3 は、どこにも残っていません。",
      "次の y ← x では、右辺の x はすでに 8 に書き変わっているので、y にも 8 が入ります。結果として両方 8 になり、入れ替えは失敗します。",
      "正しく入れ替えるには退避用の変数が要ります。整数型: 一時 ← x と控えてから x ← y、y ← 一時 の順に書けば、3 と 8 が入れ替わります。",
    ],
    trap: "x ← y と y ← x が同時に起きると思うと 3 と 8 が入れ替わったように見えるが、実際は 1 行ずつ順に実行される。",
    expectedOutput: "8\n8",
  },
  {
    slug: "operator-precedence",
    order: 2,
    lesson: "variable",
    kind: "trace",
    title: "演算子の優先順位と mod — 基本情報 擬似言語 練習問題",
    shortTitle: "演算子の優先順位",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。掛け算と足し算が混ざった式の計算順序と、mod (剰余) の結果をトレースで確認する。",
    keywords: ["基本情報", "擬似言語", "練習問題", "演算子", "優先順位", "mod"],
    challenge: "掛け算と足し算が混ざった式と、その余りを求める",
    prompt:
      "次の擬似言語プログラムを実行したとき、出力される内容はどれか。",
    code: `整数型: a ← 2 + 3 * 4
整数型: b ← a mod 5
print(a)
print(b)
`,
    choices: [
      { id: "ア", text: "20\n0" },
      { id: "イ", text: "14\n4" },
      { id: "ウ", text: "20\n4" },
      { id: "エ", text: "14\n2" },
    ],
    answer: "イ",
    explanation: [
      "擬似言語の演算子の優先順位は算数と同じで、* と / と mod が + と - より先に計算されます。したがって 2 + 3 * 4 は 3 * 4 = 12 を先に求めてから 2 を足し、14 になります。左から順に読んで (2 + 3) * 4 = 20 とするのが典型的な誤りです。",
      "mod は割り算の余りを返す演算子です。14 mod 5 は 14 を 5 で割った商が 2、余りが 4 なので 4 になります。",
      "優先順位を変えたいときは括弧を付けます。(2 + 3) * 4 と書けば 20 になり、意図が読み手にも明確に伝わります。試験の問題文でも、括弧の有無は必ず確認してください。",
    ],
    trap: "式を左から右へ読んでしまうと 2 + 3 を先に計算してしまう。掛け算が先。",
    expectedOutput: "14\n4",
  },
  {
    slug: "elseif-first-match",
    order: 3,
    lesson: "if",
    kind: "trace",
    title: "elseif はどの分岐が実行される? — 基本情報 擬似言語 練習問題",
    shortTitle: "elseif の評価順",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。複数の条件が同時に成立する if / elseif で、実際に実行される分岐がどれかをトレースで確認する。",
    keywords: ["基本情報", "擬似言語", "練習問題", "if", "elseif", "条件分岐"],
    challenge: "2 つの条件がどちらも成立する if / elseif",
    prompt:
      "次の擬似言語プログラムを実行したとき、出力される内容はどれか。",
    code: `整数型: 点数 ← 85
if (点数 ≧ 60)
  print("合格")
elseif (点数 ≧ 80)
  print("優秀")
else
  print("不合格")
endif
`,
    choices: [
      { id: "ア", text: "優秀" },
      { id: "イ", text: "合格" },
      { id: "ウ", text: "合格\n優秀" },
      { id: "エ", text: "不合格" },
    ],
    answer: "イ",
    explanation: [
      "if / elseif は上から順に条件を評価し、最初に成立した分岐だけを実行して endif の直後へ抜けます。点数 が 85 のとき、最初の 点数 ≧ 60 がすでに真なので、そこで打ち切られます。",
      "85 は 80 以上でもあるため「優秀」も成立しそうに見えますが、2 つ目の条件はそもそも評価されません。複数の条件が重なるときは、判定の順序そのものが仕様になります。",
      "「優秀」を出したいなら、条件を厳しい順に並べ替えます。点数 ≧ 80 を先に書き、点数 ≧ 60 を elseif に回すのが正しい設計です。",
    ],
    trap: "条件が 2 つとも成立するとき、後ろの分岐も実行されると思い込みやすい。実行されるのは最初の 1 つだけ。",
    expectedOutput: "合格",
  },
  {
    slug: "boundary-operator",
    order: 4,
    lesson: "if",
    kind: "fill",
    title: "「18 歳以上」を正しく書ける? 境界の比較演算子 — 基本情報 擬似言語 練習問題",
    shortTitle: "境界値と比較演算子",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。「以上」を表す比較演算子を選び、> と ≧ の境界 1 個分の違いを確認する空欄補充問題。",
    keywords: ["基本情報", "擬似言語", "練習問題", "比較演算子", "境界値", "if"],
    challenge: "「18 歳以上」を判定する条件式",
    prompt:
      "年齢が 18 歳以上のときに「成人」、そうでないときに「未成年」と出力したい。空欄 a に入れる記述として適切なものはどれか。",
    code: `整数型: 年齢 ← 18
if (年齢 [ a ] 18)
  print("成人")
else
  print("未成年")
endif
`,
    choices: [
      { id: "ア", text: ">" },
      { id: "イ", text: "≧" },
      { id: "ウ", text: "≠" },
      { id: "エ", text: "<" },
    ],
    answer: "イ",
    explanation: [
      "「18 歳以上」は 18 を含みます。18 を含む「以上」は ≧、18 を含まない「より大きい」は > です。ちょうど 18 歳のとき、> では条件が偽になって「未成年」と出てしまいます。",
      "この 1 個分のズレは実務でも試験でも最も多いバグの一つです。条件を書いたら、境界そのものの値 (ここでは 18) を必ず一度代入して確かめる習慣を付けてください。",
      "≠ は「等しくない」、< は「より小さい」で、どちらも「以上」の意味にはなりません。なお ≧ は半角で >= と書いても同じように動きます。",
    ],
    trap: "「18 歳以上」を > で書くと、ちょうど 18 歳の人だけが漏れる。",
    verifyCode: `整数型: 年齢 ← 18
if (年齢 ≧ 18)
  print("成人")
else
  print("未成年")
endif
`,
    expectedOutput: "成人",
  },
  {
    slug: "while-loop-count",
    order: 5,
    lesson: "while",
    kind: "trace",
    title: "while を抜けた後のカウンタの値 — 基本情報 擬似言語 練習問題",
    shortTitle: "while 終了時の変数",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。while ループを抜けた直後にカウンタ変数がいくつになっているかを、条件判定のタイミングから導く。",
    keywords: ["基本情報", "擬似言語", "練習問題", "while", "ループ", "カウンタ"],
    challenge: "while で 1〜4 を足し、抜けた後のカウンタも見る",
    prompt:
      "次の擬似言語プログラムを実行したとき、出力される内容はどれか。",
    code: `整数型: i ← 1
整数型: 合計 ← 0
while (i ≦ 4)
  合計 ← 合計 + i
  i ← i + 1
endwhile
print(合計)
print(i)
`,
    choices: [
      { id: "ア", text: "10\n4" },
      { id: "イ", text: "10\n5" },
      { id: "ウ", text: "6\n4" },
      { id: "エ", text: "15\n5" },
    ],
    answer: "イ",
    explanation: [
      "合計 には i が 1、2、3、4 のときの値が足されるので 1 + 2 + 3 + 4 = 10 になります。ここまでは素直です。",
      "問題は i の最終値です。while は「条件を判定してから中身を実行する」を繰り返します。i が 4 のときの回で中身を実行し終えると i は 5 になり、次の判定 5 ≦ 4 が偽になって初めてループを抜けます。つまり抜けた時点の i は、条件を満たさなくなった値である 5 です。",
      "ループの最終値を 4 と答えてしまうのは、「最後に処理した値」と「ループを抜けた時点の値」を混同しているためです。while を追うときは、条件判定の行にも 1 ステップ使われることを意識してください。",
    ],
    trap: "ループ内で最後に使われた i は 4 だが、抜けた時点の i は条件を満たさなくなった 5。",
    expectedOutput: "10\n5",
  },
  {
    slug: "while-exact-repeat",
    order: 6,
    lesson: "while",
    kind: "fill",
    title: "ちょうど 3 回繰り返す while の条件 — 基本情報 擬似言語 練習問題",
    shortTitle: "回数指定の while",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。0 から数えるカウンタで「ちょうど n 回」繰り返すための while 条件を選ぶ空欄補充問題。",
    keywords: ["基本情報", "擬似言語", "練習問題", "while", "繰り返し回数", "条件"],
    challenge: "0 から数えるカウンタでちょうど 3 回繰り返す",
    prompt:
      "「*」をちょうど 3 回出力したい。空欄 a に入れる条件として適切なものはどれか。",
    code: `整数型: 回数 ← 0
while ( [ a ] )
  print("*")
  回数 ← 回数 + 1
endwhile
`,
    choices: [
      { id: "ア", text: "回数 < 3" },
      { id: "イ", text: "回数 ≦ 3" },
      { id: "ウ", text: "回数 = 3" },
      { id: "エ", text: "回数 > 3" },
    ],
    answer: "ア",
    explanation: [
      "カウンタを 0 から始めた場合、繰り返す回数は「< 繰り返したい回数」で表します。回数 が 0、1、2 のときに中身が実行され、3 になった時点で条件が偽になるので、ちょうど 3 回です。",
      "回数 ≦ 3 にすると 0、1、2、3 の 4 回実行されます。これが典型的な off-by-one (1 回多い / 少ない) のバグです。1 始まりのカウンタなら 回数 ≦ 3 が正しくなるので、「初期値がいくつか」とセットで覚えてください。",
      "回数 = 3 は最初の判定で 0 = 3 が偽になるため 1 回も実行されず、回数 > 3 も同じく 1 回も実行されません。条件が最初から偽なら while の中身はまったく動かない、というのも重要な性質です。",
    ],
    trap: "0 始まりなら < n、1 始まりなら ≦ n。初期値を見ずに条件だけ選ぶと 1 回ずれる。",
    verifyCode: `整数型: 回数 ← 0
while ( 回数 < 3 )
  print("*")
  回数 ← 回数 + 1
endwhile
`,
    expectedOutput: "*\n*\n*",
  },
  {
    slug: "for-loop-step",
    order: 7,
    lesson: "for",
    kind: "trace",
    title: "for の「〜まで」は終了値を含む? — 基本情報 擬似言語 練習問題",
    shortTitle: "for の範囲と増分",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。for の「〜から〜まで〜ずつ増やす」が終了値を含むかどうかと、増分の効き方をトレースで確認する。",
    keywords: ["基本情報", "擬似言語", "練習問題", "for", "繰り返し", "増分"],
    challenge: "2 から 6 まで 2 ずつ増やしながら足す",
    prompt:
      "次の擬似言語プログラムを実行したとき、出力される内容はどれか。",
    code: `整数型: 合計 ← 0
for (i を 2 から 6 まで 2 ずつ増やす)
  合計 ← 合計 + i
endfor
print(合計)
`,
    choices: [
      { id: "ア", text: "6" },
      { id: "イ", text: "20" },
      { id: "ウ", text: "12" },
      { id: "エ", text: "8" },
    ],
    answer: "ウ",
    explanation: [
      "擬似言語の for の「〜まで」は終了値を含みます。2 ずつ増やすので i は 2、4、6 の 3 回で、合計は 2 + 4 + 6 = 12 です。",
      "6 を含まないと考えると 2 + 4 = 6 になります。Python の range(2, 6) は 6 を含まないため、Python に慣れているほど間違えやすい箇所です。多言語横並び比較ツールで変換結果を見ると、擬似言語の 6 まで が Python では range(2, 6 + 1, 2) になることが確認できます。",
      "また「2 ずつ増やす」を読み飛ばして 2 から 6 のすべての整数を足すと 2 + 3 + 4 + 5 + 6 = 20 になります。増分は 1 とは限りません。",
    ],
    trap: "「〜まで」は終了値を含む。含まないと考えると 1 回分足りなくなる。",
    expectedOutput: "12",
  },
  {
    slug: "array-one-based",
    order: 8,
    lesson: "array",
    kind: "trace",
    title: "配列の添字は 1 始まり — 基本情報 擬似言語 練習問題",
    shortTitle: "配列の添字",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。配列の添字が 1 始まりであることを、要素を取り出すコードのトレースで確認する。",
    keywords: ["基本情報", "擬似言語", "練習問題", "配列", "添字", "1 始まり"],
    challenge: "4 要素の配列から 1 番目と 3 番目を取り出す",
    prompt:
      "次の擬似言語プログラムを実行したとき、出力される内容はどれか。",
    code: `整数型の配列: 得点 ← {40, 50, 60, 70}
print(得点[1])
print(得点[3])
`,
    choices: [
      { id: "ア", text: "50\n70" },
      { id: "イ", text: "40\n60" },
      { id: "ウ", text: "40\n70" },
      { id: "エ", text: "50\n60" },
    ],
    answer: "イ",
    explanation: [
      "基本情報の擬似言語では、配列の添字は 1 から始まります。得点[1] は 1 番目の要素で 40、得点[3] は 3 番目の要素で 60 です。",
      "C や Java、Python、JavaScript はいずれも 0 始まりなので、プログラミング経験があるほど 得点[1] を 50 と読み違えます。試験の擬似言語だけは 1 始まりだと切り替えてください。",
      "実行シミュレーターの変換機能を使うと、擬似言語の 得点[i] が Python では 得点[i - 1] になり、なぜ -1 が要るのかをコメント付きで確認できます。0 始まりの言語へ書き換えるときは、この -1 を忘れると 1 つ手前の要素を読んでしまいます。",
    ],
    trap: "0 始まりの言語の癖で読むと、すべての要素が 1 つずつずれる。",
    expectedOutput: "40\n60",
  },
  {
    slug: "array-reverse-scan",
    order: 9,
    lesson: "array",
    kind: "fill",
    title: "配列を逆順に走査する for の書き方 — 基本情報 擬似言語 練習問題",
    shortTitle: "配列の逆順走査",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。配列を末尾から先頭へたどる for の初期値・終了値・増分を選ぶ空欄補充問題。",
    keywords: ["基本情報", "擬似言語", "練習問題", "配列", "for", "逆順"],
    challenge: "配列を末尾から先頭へたどる",
    prompt:
      "配列 文字 の要素を末尾から先頭に向かって 1 つずつ出力したい。空欄 a に入れる記述として適切なものはどれか。",
    code: `文字列型の配列: 文字 ← {"あ", "い", "う"}
for ( [ a ] )
  print(文字[i])
endfor
`,
    choices: [
      { id: "ア", text: "i を 3 から 1 まで 1 ずつ減らす" },
      { id: "イ", text: "i を 0 から 2 まで 1 ずつ減らす" },
      { id: "ウ", text: "i を 2 から 0 まで 1 ずつ減らす" },
      { id: "エ", text: "i を 1 から 3 まで 1 ずつ増やす" },
    ],
    answer: "ア",
    explanation: [
      "逆順にたどるときは、開始が末尾の添字、終了が先頭の添字、そして「減らす」になります。要素数 3 の配列は添字 1 から 3 なので、3 から 1 まで 1 ずつ減らす が正解です。i は 3、2、1 と変化し、う、い、あ の順に出力されます。",
      "0 を含む選択肢は、0 始まりの言語の感覚を持ち込んだ誤りです。擬似言語の添字は 1 始まりなので、0 を指定すると存在しない要素にアクセスして実行時エラーになります。",
      "「1 ずつ増やす」で 1 から 3 までたどると、あ、い、う の正順になってしまいます。増やす / 減らす の指定は、開始値と終了値の大小関係とセットで確認してください。",
    ],
    trap: "0 始まりの言語のつもりで 0 を書くと、存在しない要素を指して実行時エラーになる。",
    verifyCode: `文字列型の配列: 文字 ← {"あ", "い", "う"}
for ( i を 3 から 1 まで 1 ずつ減らす )
  print(文字[i])
endfor
`,
    expectedOutput: "う\nい\nあ",
  },
  {
    slug: "function-return-flow",
    order: 10,
    lesson: "function",
    kind: "trace",
    title: "return に到達すると関数はどうなる? — 基本情報 擬似言語 練習問題",
    shortTitle: "return と処理の中断",
    description:
      "基本情報技術者試験 (FE) 科目 B の擬似言語の練習問題。return に到達した時点で関数を抜けることを、複数の return を持つ関数のトレースで確認する。",
    keywords: ["基本情報", "擬似言語", "練習問題", "関数", "return", "戻り値"],
    challenge: "return が 3 つある関数を 3 回呼ぶ",
    prompt:
      "次の擬似言語プログラムを実行したとき、出力される内容はどれか。",
    code: `○整数型: 符号(整数型: n)
  if (n > 0)
    return 1
  endif
  if (n < 0)
    return -1
  endif
  return 0

print(符号(5))
print(符号(-3))
print(符号(0))
`,
    choices: [
      { id: "ア", text: "1\n-1\n0" },
      { id: "イ", text: "1\n1\n1" },
      { id: "ウ", text: "0\n0\n0" },
      { id: "エ", text: "-1\n1\n0" },
    ],
    answer: "ア",
    explanation: [
      "return は「値を返して、その場で関数を抜ける」命令です。符号(5) では最初の if が真になり return 1 に到達した時点で関数が終わるので、その後の if や return 0 は実行されません。",
      "符号(-3) では最初の if が偽なので次の if へ進み、n < 0 が真になって -1 を返します。符号(0) はどちらの if も偽なので、最後まで進んで return 0 に到達します。したがって出力は上から 1、-1、0 です。",
      "この「早期に return して抜ける」書き方は、else を積み重ねるより読みやすくなるためよく使われます。試験でトレースするときは、return を見つけたらそこで関数の実行を打ち切り、呼び出し元の続きへ戻ることを意識してください。",
    ],
    trap: "return の後ろにコードが続いていても、到達した時点で関数は終わる。最後の return 0 が常に返ると考えると全部 0 になる。",
    expectedOutput: "1\n-1\n0",
  },
] as const;

export function findFeQuiz(slug: string): FeQuizMeta | undefined {
  return feQuizzes.find((q) => q.slug === slug);
}

export function feQuizNeighbors(slug: string): {
  prev: FeQuizMeta | null;
  next: FeQuizMeta | null;
} {
  const idx = feQuizzes.findIndex((q) => q.slug === slug);
  return {
    prev: idx > 0 ? feQuizzes[idx - 1] : null,
    next: idx >= 0 && idx < feQuizzes.length - 1 ? feQuizzes[idx + 1] : null,
  };
}

export function feQuizzesForLesson(lesson: FeLessonSlug): FeQuizMeta[] {
  return feQuizzes.filter((q) => q.lesson === lesson);
}

/** 解答後に「実行シミュレーターで開く」ためのコード (fill は正解を埋めた形) */
export function feQuizRunnableCode(quiz: FeQuizMeta): string {
  return quiz.verifyCode ?? quiz.code;
}
