import { describe, expect, it } from "vitest";
import { normalizePastedCode } from "./paste";
import { parse } from "./parser";
import { runJoho1ToEnd } from "./index";
import { buildBlockGuides } from "@/components/joho1/joho1Language";

describe("normalizePastedCode", () => {
  // 令和8年度本試験 図2 を紙面のとおりに貼った場合
  const pasted = `(01)  taiken = 3
(02)  Touchaku = [0, 3, 4, 10, 11, 12]
(03)  kyakusu = 要素数(Touchaku)
(04)  Kaishi = [0, 0, 0, 0, 0, 0]
(05)  Shuryou = [0, 0, 0, 0, 0, 0]
(06)  Shuryou[1] = taiken
(07)  i を 2 から kyakusu まで 1 ずつ増やしながら繰り返す：
(08) │  Kaishi[i] = 最大値(Touchaku[i], Shuryou[i - 1])
(09) └  Shuryou[i] = Kaishi[i] + taiken`;

  it("行番号と罫線を落として字下げにする", () => {
    const { code, changed } = normalizePastedCode(pasted);
    expect(changed).toBe(true);
    expect(code.split("\n")[0]).toBe("taiken = 3");
    expect(code.split("\n")[7]).toBe(
      "  Kaishi[i] = 最大値(Touchaku[i], Shuryou[i - 1])",
    );
  });

  it("整形した結果がそのまま実行できる", () => {
    const { code } = normalizePastedCode(pasted);
    const state = runJoho1ToEnd(parse(code), { indexBase: 1 });
    expect(state.error).toBeNull();
    const shuryou = state.callStack[0].variables.get("Shuryou");
    expect(shuryou?.type === "array" && shuryou.elements[5]).toEqual({
      type: "int",
      value: 19,
    });
  });

  it("入れ子の罫線を深さに変換する", () => {
    const { code } = normalizePastedCode(`(05) │ もし a == 1 ならば：
(06) │ │  b = 1
(07) └ └  c = 2`);
    expect(code.split("\n")).toEqual([
      "  もし a == 1 ならば：",
      "    b = 1",
      "    c = 2",
    ]);
  });

  it("普通に書いたコードは変えない", () => {
    const src = `a = 1\nもし a == 1 ならば：\n  b = 2`;
    const { code, changed } = normalizePastedCode(src);
    expect(changed).toBe(false);
    expect(code).toBe(src);
  });

  it("全角カッコの行番号も落とす", () => {
    expect(normalizePastedCode("（01） a = 1").code).toBe("a = 1");
  });
});

describe("buildBlockGuides", () => {
  it("ブロックの最終行だけ └ になる", () => {
    const guides = buildBlockGuides([
      "i を 1 から 3 まで 1 ずつ増やしながら繰り返す：",
      "  a = 1",
      "  b = 2",
      "c = 3",
    ]);
    expect(guides).toEqual(["", "│", "└", ""]);
  });

  it("入れ子は深さの分だけ並ぶ", () => {
    const guides = buildBlockGuides([
      "i を 1 から 3 まで 1 ずつ増やしながら繰り返す：",
      "  もし a == 1 ならば：",
      "    b = 1",
      "  c = 2",
    ]);
    // 内側 (深さ 2) はここで終わるので └、外側 (深さ 1) はまだ続くので │
    expect(guides).toEqual(["", "│", "│ └", "└"]);
  });

  it("同時に閉じるブロックは └ が並ぶ (実物: 令和7年度追試験 図4)", () => {
    const guides = buildBlockGuides([
      "i を 1 から 3 まで 1 ずつ増やしながら繰り返す：",
      "  もし a == 1 ならば：",
      "    b = 1",
    ]);
    expect(guides).toEqual(["", "│", "└ └"]);
  });

  it("空行は罫線を持たない", () => {
    expect(buildBlockGuides(["a = 1", "", "b = 2"])).toEqual(["", "", ""]);
  });
});
