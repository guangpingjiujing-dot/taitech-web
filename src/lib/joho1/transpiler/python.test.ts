import { describe, expect, it } from "vitest";
import { parse } from "@/lib/joho1/parser";
import { transpileJoho1ToPython } from "./python";

function py(code: string, indexBase: 0 | 1 = 1): string {
  return transpileJoho1ToPython(parse(code), { indexBase });
}

describe("transpileJoho1ToPython", () => {
  it("代入は型注釈を付けずにそのまま出す", () => {
    // FE の transpiler と違い `x: int = 3` にしない。原文に型の情報が無いため
    expect(py("kingaku = 46\n")).toBe("kingaku = 46\n");
  });

  it("複数代入は 1 行ずつに分ける", () => {
    expect(py("maisu = 0, nokori = 46\n")).toBe("maisu = 0\nnokori = 46\n");
  });

  it("表示する は sep=\"\" 付きの print になる", () => {
    // 表示する は引数を区切らずに連結する。素の print は空白を挟んでしまう
    expect(py('表示する("残り", nokori, "円")\n')).toBe(
      'print("残り", nokori, "円", sep="")\n',
    );
  });

  it("引数が 1 つの表示する に sep は付けない", () => {
    expect(py("表示する(goukei)\n")).toBe("print(goukei)\n");
  });

  it("要素数 / 最大値 は Python の相当物に写す", () => {
    expect(py("n = 要素数(A)\n")).toBe("n = len(A)\n");
    expect(py("m = 最大値(x, y)\n")).toBe("m = max(x, y)\n");
  });

  it("1 始まりの問題では添字を -1 する", () => {
    expect(py("x = A[i]\n", 1)).toBe("x = A[i - 1]\n");
    expect(py("A[1] = 5\n", 1)).toBe("A[1 - 1] = 5  # 添字が1から始まるので-1\n");
  });

  it("0 始まりの問題では添字をそのまま出す", () => {
    // 基点は言語ではなく問題ごとの前提なので、-1 を固定で出してはいけない
    expect(py("x = A[i]\n", 0)).toBe("x = A[i]\n");
    expect(py("A[0] = 5\n", 0)).toBe("A[0] = 5\n");
  });

  it("「〜まで」は終わりの値を含むので range に +1 する", () => {
    expect(py("i を 1 から 5 まで 1 ずつ増やしながら繰り返す：\n  g = g + i\n")).toBe(
      "for i in range(1, 5 + 1, 1):\n    g = g + i\n",
    );
  });

  it("減らしながら繰り返す は負の step になる", () => {
    expect(py("i を 10 から 4 まで 3 ずつ減らしながら繰り返す：\n  g = g + i\n")).toBe(
      "for i in range(10, 4 - 1, -3):\n    g = g + i\n",
    );
  });

  it("もし / そうでなければ は if / else になる", () => {
    expect(
      py('もし a == 1 ならば：\n  表示する("y")\nそうでなければ：\n  表示する("n")\n'),
    ).toBe('if a == 1:\n    print("y")\nelse:\n    print("n")\n');
  });

  it("の間繰り返す は while になる", () => {
    expect(py("(n > 0) の間繰り返す：\n  n = n - 1\n")).toBe(
      "while n > 0:\n    n = n - 1\n",
    );
  });

  it("÷ は整数の商 // になる", () => {
    expect(py("x = 46 ÷ 10\n")).toBe("x = 46 // 10\n");
  });

  it("and / or はそのまま Python の and / or", () => {
    expect(py("もし (a > 0) and (b > 0) ならば：\n  c = 1\n")).toBe(
      "if a > 0 and b > 0:\n    c = 1\n",
    );
  });

  it("配列リテラルはそのままリストになる", () => {
    expect(py("A = [1, 2, 3]\n")).toBe("A = [1, 2, 3]\n");
  });
});
