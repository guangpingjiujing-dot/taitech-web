import { describe, expect, it } from "vitest";
import { parse } from "./parser";
import { runJoho1ToEnd } from "./index";
import { PseudoParseError } from "@/lib/pseudo/errors";

/**
 * このファイルの主役は「実物のプログラムが通るか」。
 *
 * 共通テスト用プログラム表記には仕様書が無く「例示」しかない
 * (00-overview.md §7-2) ので、**完成の線引きを実物で行う**と決めている
 * (01-implementation-design.md §5)。
 *
 * 引用しているプログラムは **パーサの検証のために使うだけ**で、
 * 公開ページには載せない (00-overview.md §5 の非スコープ)。
 */

function run(src: string, indexBase: 0 | 1) {
  return runJoho1ToEnd(parse(src), { indexBase });
}

describe("joho1 parser: 実物 — 試作問題 図1 (添字 0 始まり)", () => {
  // 目標の金額ちょうどになる最小の硬貨枚数。空欄は正答で埋めてある
  const src = `Kouka = [1,5,10,50,100]
kingaku = 46
maisu = 0, nokori = kingaku
i を 4 から 0 まで 1 ずつ減らしながら繰り返す：
  maisu = maisu + nokori ÷ Kouka[i]
  nokori = nokori ％ Kouka[i]
表示する(maisu)`;

  it("パースできる", () => {
    const program = parse(src);
    expect(program.body.map((s) => s.kind)).toEqual([
      "Assignment", // Kouka
      "Assignment", // kingaku
      "Assignment", // maisu    ← 複数代入は 2 文に展開する
      "Assignment", // nokori
      "ForStmt",
      "ExprStmt", // 表示する(maisu)
    ]);
  });

  it("46 円は 6 枚と計算される", () => {
    const state = run(src, 0);
    expect(state.error).toBeNull();
    expect(state.output).toEqual(["6"]);
  });

  it("減らす方向を向いている", () => {
    const forStmt = parse(src).body.find((s) => s.kind === "ForStmt");
    expect(forStmt).toMatchObject({ direction: "dec", iterVar: "i" });
  });
});

describe("joho1 parser: 実物 — 令和8年度本試験 図2 (添字 1 始まり)", () => {
  // 2 人目以降の来訪者の待ち時間。要素数 / 最大値 の 2 つの外部関数を使う
  const src = `taiken = 3
Touchaku = [0, 3, 4, 10, 11, 12]
kyakusu = 要素数(Touchaku)
Kaishi = [0, 0, 0, 0, 0, 0]
Shuryou = [0, 0, 0, 0, 0, 0]
Shuryou[1] = taiken
i を 2 から kyakusu まで 1 ずつ増やしながら繰り返す：
  Kaishi[i] = 最大値(Touchaku[i], Shuryou[i - 1])
  Shuryou[i] = Kaishi[i] + taiken
  表示する(i, "人目の待ち時間：",
          Kaishi[i] - Touchaku[i], "分間")`;

  it("外部関数と多引数の表示が動く", () => {
    const state = run(src, 1);
    expect(state.error).toBeNull();
    expect(state.output).toEqual([
      "2人目の待ち時間：0分間",
      "3人目の待ち時間：2分間",
      "4人目の待ち時間：0分間",
      "5人目の待ち時間：2分間",
      "6人目の待ち時間：4分間",
    ]);
  });

  it("表示する は区切り文字なしで連結する", () => {
    // 実行結果の図が「体験時間1分間：最長待ち時間0分間」なので区切りは入らない
    const state = run(`表示する("合計", 15, "円")`, 1);
    expect(state.output).toEqual(["合計15円"]);
  });
});

describe("joho1 parser: 実物 — 令和8年度本試験 問4 (条件繰返し)", () => {
  const src = `taiken = 1
saichou = 0
(taiken <= 15) and (saichou < 10) の間繰り返す：
  saichou = saichou + taiken
  taiken = taiken + 1
表示する(taiken, ",", saichou)`;

  it("and を含む条件繰返しがパースできる", () => {
    const program = parse(src);
    const whileStmt = program.body.find((s) => s.kind === "WhileStmt");
    expect(whileStmt).toBeDefined();
    expect(whileStmt).toMatchObject({ cond: { kind: "BinaryOp", op: "and" } });
  });

  it("条件が偽になるまで回る", () => {
    // 1+2+3+4 = 10 で saichou < 10 が偽になり、taiken は 5
    const state = run(src, 1);
    expect(state.output).toEqual(["5,10"]);
  });
});

describe("joho1 parser: 実物 — 令和7年度追試験 図4 (そうでなければ)", () => {
  // ごみの種類ごとの総重量。配列は問題の図から起こした
  const src = `Iremono = [1, 2, 1]
Keiryou = [1350, 800, 500]
Shurui = [1, 2, 1]
kanen = 0, funen = 0
i を 1 から 3 まで 1 ずつ増やしながら繰り返す：
  もし Iremono[i] == 1 ならば：
    gomi = Keiryou[i] - 350
  そうでなければ：
    gomi = Keiryou[i]
  もし Shurui[i] == 1 ならば：
    kanen = kanen + gomi
  そうでなければ：
    funen = funen + gomi
表示する("可燃ごみの総重量は", kanen, "g")
表示する("不燃ごみの総重量は", funen, "g")`;

  it("そうでなければ を持つ if がパースできる", () => {
    const program = parse(src);
    const forStmt = program.body.find((s) => s.kind === "ForStmt");
    expect(forStmt?.kind === "ForStmt" && forStmt.body).toHaveLength(2);
    const first = forStmt?.kind === "ForStmt" ? forStmt.body[0] : null;
    expect(first?.kind).toBe("IfStmt");
    expect(first?.kind === "IfStmt" && first.elseBody).toHaveLength(1);
  });

  it("分岐の両側が実行される", () => {
    const state = run(src, 1);
    // i=1: 容器 1 → 1350-350=1000, 種類 1 → 可燃
    // i=2: 容器 2 → 800,           種類 2 → 不燃
    // i=3: 容器 1 → 500-350=150,   種類 1 → 可燃
    expect(state.output).toEqual([
      "可燃ごみの総重量は1150g",
      "不燃ごみの総重量は800g",
    ]);
  });
});

describe("joho1 parser: 実物 — 令和8年度追試験 図5 (入れ子と 0 始まり)", () => {
  const src = `Bunya = [2, 0, 2, 2, 1, 2, 0]
saidai = 5
Saiyou = [0, 0, 0, 0, 0, 0, 0]
Mondaisu = [0, 0, 0, 0, 0, 0]
i を 0 から 要素数(Bunya) - 1 まで 1 ずつ増やしながら繰り返す：
  b = Bunya[i]
  もし Mondaisu[b] < saidai ならば：
    Saiyou[i] = 1
    Mondaisu[b] = Mondaisu[b] + 1
表示する(Mondaisu[2])`;

  it("入れ子のブロックと 0 始まりの添字が動く", () => {
    const state = run(src, 0);
    expect(state.error).toBeNull();
    // 分野 2 は 4 問あり、上限 5 に達しないので全部採用される
    expect(state.output).toEqual(["4"]);
  });
});

describe("joho1 parser: 演算子", () => {
  it("÷ は整数の商、％ は剰余", () => {
    const state = run(`表示する(46 ÷ 10, ",", 46 ％ 10)`, 1);
    expect(state.output).toEqual(["4,6"]);
  });

  it("優先順位は 乗除 > 加減 > 比較 > and > or", () => {
    const state = run(`表示する(1 + 2 * 3 == 7 and 1 < 2)`, 1);
    expect(state.output).toEqual(["true"]);
  });

  it("== と = を取り違えない", () => {
    const program = parse(`もし a == 1 ならば：
  b = 2`);
    const ifStmt = program.body[0];
    expect(ifStmt.kind === "IfStmt" && ifStmt.branches[0].cond).toMatchObject({
      kind: "BinaryOp",
      op: "=",
    });
  });
});

describe("joho1 parser: エラー", () => {
  it("ならば の後のコロンが無い", () => {
    expect(() =>
      parse(`もし a == 1 ならば
  b = 2`),
    ).toThrow(PseudoParseError);
  });

  it("字下げされていないブロック", () => {
    expect(() =>
      parse(`もし a == 1 ならば：
b = 2`),
    ).toThrow(/字下げ/);
  });

  it("代入の左辺が式", () => {
    expect(() => parse("a + 1 = 2")).toThrow(/左辺には変数名/);
  });

  it("エラーは位置情報を持つ", () => {
    try {
      parse(`a = 1
もし a == 1 ならば
  b = 2`);
      expect.unreachable();
    } catch (e) {
      expect((e as PseudoParseError).pos.line).toBe(2);
    }
  });
});
