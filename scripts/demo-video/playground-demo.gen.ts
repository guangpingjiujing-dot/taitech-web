/**
 * X / YouTube Shorts 用のデモ動画を録画する。
 * 戦略上の位置づけは docs/strategy/growth.md の打ち手 A。
 *
 * 実行:
 *   npm run gen:demo-video
 *
 * 出力:
 *   docs/x-posts/demo-video/playground-step.mp4    ← 投稿用 (ffmpeg があれば自動生成)
 *   docs/x-posts/demo-video/playground-step.webm   ← 録画本体
 *   docs/x-posts/demo-video/frame-*.png            ← 構図確認用の静止画
 *   docs/x-posts/demo-video/README.md              ← 投稿手順
 *
 * 見せたいのは「1 行ずつ実行すると変数の値が動く」の一点だけ。
 * 合計が 0 → 40 → 110 → 200 と増えるのを見せて終わる。
 * 注釈 (キャプション / リング / エンドカード) は ./overlay.ts を参照。
 */
import { test, type Page } from "@playwright/test";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { installOverlay } from "./overlay";

const execFileAsync = promisify(execFile);

const OUT_DIR = path.resolve(__dirname, "../../docs/x-posts/demo-video");

/**
 * デモに使う擬似言語。条件は 3 つ:
 * - 変数が毎ステップ目に見えて変わる (合計 / i)
 * - 10 ステップ前後で終わる (動画を 20 秒以内に収める)
 * - 配列が 1 始まりであることが自然に出る (このサイトの主張の一つ)
 */
const DEMO_CODE = `整数型の配列: 点数 ← {40, 70, 90}
整数型: 合計 ← 0
for (i を 1 から 3 まで 1 ずつ増やす)
  合計 ← 合計 + 点数[i]
endfor
print(合計)
`;

/** 1 ステップあたりの見せ時間。速すぎると値の変化を目で追えない */
const STEP_MS = 850;

test("record playground step-execution demo", async ({ page }) => {
  await fs.mkdir(OUT_DIR, { recursive: true });

  // 録画は page が作られた時点から始まっており、goto と初回描画も入る。
  // 何もしないと「ヘッダー + 書籍サイドバー込みの素のページ」が冒頭 1 秒ほど
  // 映ってしまうので、最初の描画前から隠しておく。
  //
  // display:none ではなく visibility:hidden なのは、レイアウト計算を残すため。
  // リングの位置決めに getBoundingClientRect を使うので、潰すと座標が取れない。
  await page.addInitScript(() => {
    const hide = () => {
      const style = document.createElement("style");
      style.id = "demo-preroll";
      style.textContent = "html { visibility: hidden !important; }";
      (document.head ?? document.documentElement).appendChild(style);
    };
    if (document.head ?? document.documentElement) hide();
    else document.addEventListener("DOMContentLoaded", hide);
  });

  const recordingStart = Date.now();
  await page.goto(`/fe?code=${encodeURIComponent(DEMO_CODE)}`);

  const stepButton = page.getByRole("button", { name: "一行ずつ実行" });

  // preroll で html ごと visibility:hidden にしている間は locator が使えない。
  // 可視待ちが解決しないだけでなく、getByRole は非表示要素のロールを解決しない
  // ので state:"attached" でも一致しない。
  // そこで表示前の待機は DOM 問い合わせだけで行う (textContent は visibility を見ない)。
  // stepButton を使うのは表示を戻したあとのクリックだけ。
  await page.waitForFunction(() => {
    const grid = document.querySelector(".fe-playground-grid");
    return !!grid && (grid.textContent ?? "").includes("print(合計)");
  });

  // 実行シミュレーター以外を画面から消す。
  // ヘッダー / 書籍サイドバー / シリーズナビ / 記事本文が写っていると、
  // 見せたい「変数が動く」から視線が逸れるうえ、スマホの TL では字が小さくなる。
  //
  // セレクタで個別に消すとページ構成を変えるたびに壊れるので、Playground の
  // 祖先を body まで辿って各階層の兄弟をまとめて隠す (要素の孤立)。
  // これなら周辺のマークアップが変わっても効き続ける。
  await page.evaluate(() => {
    const grid = document.querySelector<HTMLElement>(".fe-playground-grid");
    if (!grid) throw new Error(".fe-playground-grid が見つからない");

    for (let el: HTMLElement = grid; el !== document.body; ) {
      const parent = el.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== el && sibling instanceof HTMLElement) {
          sibling.style.display = "none";
        }
      }
      // 兄弟を消しても祖先の幅・余白・段組みの制約は残る。
      // 特にサイドバー用の CSS grid はカラム幅を確保し続けるので、
      // display も潰さないとグリッドが左寄りのまま中央に来ない
      parent.style.display = "block";
      parent.style.width = "100%";
      parent.style.maxWidth = "none";
      parent.style.minHeight = "0";
      parent.style.padding = "0";
      parent.style.margin = "0";
      el = parent;
    }

    // 残ったグリッドをビューポート中央に置く。幅を絞らないとエディタだけが
    // 間延びして、6 行のコードがスカスカに見える
    document.body.style.display = "flex";
    document.body.style.alignItems = "center";
    document.body.style.justifyContent = "center";
    document.body.style.minHeight = "100vh";
    document.body.style.padding = "0";
    grid.style.width = "100%";
    grid.style.maxWidth = "1000px";
    grid.style.margin = "0 auto";

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    // ここまで来て初めて見せる。以降のフレームには余計な UI が一切写らない
    document.getElementById("demo-preroll")?.remove();
  });

  // 冒頭の非表示区間の長さ。MP4 に変換するときにこのぶん切り落とす
  const prerollSec = (Date.now() - recordingStart) / 1000;

  await page.waitForTimeout(600);

  // 注釈レイヤー (キャプション / リング / エンドカード) を差し込む
  await page.evaluate(installOverlay);

  // 冒頭で「何の画面か」を言う。ミュート自動再生では最初の 1〜2 秒で
  // 伝わらないとスクロールされる
  // 「擬似言語」だけだと何の擬似言語か伝わらない。冒頭で必ず試験名まで言う。
  // 表記は 1 日 1 問の投稿画像 (scripts/post-images/) と揃えて「基本情報 科目B」
  await page.evaluate(() =>
    window.__demo.caption("基本情報 科目B の擬似言語を1行ずつ実行する"),
  );
  await page.waitForTimeout(1700);
  await page.screenshot({ path: path.join(OUT_DIR, "frame-01-start.png") });

  await page.waitForTimeout(300);

  // ステップ実行。
  //
  // 何ステップ目で何が起きるかを決め打ちにすると、DEMO_CODE を変えた瞬間に
  // 画面の中身とキャプション・リングがズレる。実際にそれで
  // 「値の更新が終わっているのに『毎ステップ更新される』と出続ける」区間ができた。
  // そこで毎ステップ変数ペインと出力ペインを読み、実際の変化で位相を切り替える:
  //
  //   1. 値が変わっている間  → リング = 変数ペイン + キャプションあり
  //   2. 値が変わらなくなった → リングもキャプションも消す (endfor を抜ける無音の一拍)
  //   3. 出力が出た           → リング = 出力ペイン + キャプション差し替え
  // 判定はステップの待機が終わってからではなく、クリック直後から短間隔で行う。
  // 待機明けにまとめて見ると、画面はもう変わっているのに注釈だけ STEP_MS ぶん
  // (約 0.85 秒) 遅れて切り替わり、はっきりズレて見える。
  const POLL_MS = 60;

  const MAX_STEPS = 20;
  let printed = false;
  let prevVars = await panelText(page, "変数");
  /** 一度でも値が変わったか (= リングとキャプションを出す起点) */
  let varsStarted = false;

  for (let i = 0; i < MAX_STEPS && !printed; i++) {
    await stepButton.click();

    const startedAt = Date.now();
    let changedThisStep = false;

    while (Date.now() - startedAt < STEP_MS) {
      await page.waitForTimeout(POLL_MS);

      // 出力が出た瞬間にキャプションとリングを移す
      if (await hasOutput(page)) {
        await page.evaluate(() => {
          window.__demo.caption("print の結果が出力に出る");
          window.__demo.ring("出力");
        });
        printed = true;
        break;
      }

      if (varsStarted || changedThisStep) continue;

      const vars = await panelText(page, "変数");
      if (vars === prevVars) continue;

      prevVars = vars;
      changedThisStep = true;

      // 最初に値が出たのと同じ瞬間にリングとキャプションを出し、
      // 出力が出るまで出しっぱなしにする。
      //
      // 以前は「値が変わらなかったステップ」で一旦消していたが、値が動かない
      // ステップは endfor だけではないため途中で誤発火し、リングが数秒で
      // 消えてしまった。ステップ単位の増減で判定するのは筋が悪い。
      // 代わりにキャプションを「更新され続けている」と言い切らない表現にして、
      // 最後の endfor / print の区間でも嘘にならないようにしている。
      varsStarted = true;
      await page.evaluate(() => {
        window.__demo.caption("変数の値を1行ずつ追える");
        window.__demo.ring("変数");
      });
    }

    if (i === 3) {
      await page.screenshot({
        path: path.join(OUT_DIR, "frame-02-mid.png"),
      });
    }
  }

  if (printed) {
    await page.waitForTimeout(1900);
    await page.screenshot({ path: path.join(OUT_DIR, "frame-03-end.png") });
  }

  if (!printed) {
    throw new Error(
      `${MAX_STEPS} ステップ実行しても出力が出なかった。DEMO_CODE を確認すること`,
    );
  }

  // エンドカード。投稿本文に URL を貼らない運用なので、
  // URL を伝えられるのはここだけ
  await page.evaluate(() =>
    window.__demo.endCard(
      "基本情報 科目B の擬似言語を1行ずつ実行できる",
      "taitech.dev/fe",
    ),
  );
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(OUT_DIR, "frame-04-endcard.png") });

  // 動画はコンテキストが閉じたタイミングで確定するので、page を閉じてから取り出す
  const video = page.video();
  await page.close();
  const webm = path.join(OUT_DIR, "playground-step.webm");
  await video?.saveAs(webm);
  console.log(`recorded: ${path.relative(process.cwd(), webm)}`);

  await convertToMp4(webm, prerollSec);
});

/** 見出し文字列からパネル (section) のテキストを読む */
async function panelText(page: Page, title: string): Promise<string> {
  return page.evaluate((t) => {
    const heading = Array.from(document.querySelectorAll("h3")).find(
      (h) => h.textContent?.trim() === t,
    );
    return heading?.closest("section")?.textContent ?? "";
  }, title);
}

/**
 * 出力ペインに実行結果が出たかどうか。
 * 未実行のときは Empty の案内文が入っているので、それが消えたかで判定する。
 */
async function hasOutput(page: Page): Promise<boolean> {
  const text = await panelText(page, "出力");
  return text !== "" && !text.includes("まだ出力はありません");
}

/**
 * X は WebM を受け付けない (MP4 / MOV のみ) ので H.264 に変換する。
 * ffmpeg が無い環境では落とさず、手順を案内するだけにする。
 *
 * `skipSec` は冒頭の非表示区間 (真っ白なだけの尺) を切り落とす秒数。
 * X は最初の 1 秒で見られるかが決まるので、無地で始めると単純に損。
 */
async function convertToMp4(webm: string, skipSec: number): Promise<void> {
  const mp4 = webm.replace(/\.webm$/, ".mp4");
  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-ss",
      skipSec.toFixed(2),
      "-i",
      webm,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      mp4,
    ]);
    console.log(`converted: ${path.relative(process.cwd(), mp4)}`);
  } catch {
    console.warn(
      [
        "",
        "ffmpeg が見つからないため MP4 変換をスキップしました。",
        "X は WebM を受け付けないので、投稿前に変換が必要です:",
        "  brew install ffmpeg",
        "  npm run gen:demo-video   (以降は自動で MP4 まで出ます)",
        "",
      ].join("\n"),
    );
  }
}

test.afterAll(async () => {
  await fs.writeFile(
    path.join(OUT_DIR, "README.md"),
    `# デモ動画 (打ち手 A)

\`npm run gen:demo-video\` の生成物。戦略上の位置づけは \`docs/strategy/growth.md\` の打ち手 A。

## ファイル

| ファイル | 用途 |
|---|---|
| \`playground-step.mp4\` | **投稿に使うのはこれ** (1280x720 / H.264 / 無音 / 約 20 秒) |
| \`playground-step.webm\` | 録画本体。MP4 はこれを変換したもの |
| \`frame-01-start.png\` 〜 \`frame-04-endcard.png\` | 構図確認用の静止画 |

## 動画の構成

| 区間 | 画面 | キャプション | リング |
|---|---|---|---|
| 冒頭 約 3 秒 | コードが入った状態 | 基本情報 科目B の擬似言語を1行ずつ実行する | なし |
| 最初に値が出てから出力まで | ステップ実行 | 変数の値を1行ずつ追える | 変数ペイン |
| 出力が出た瞬間から 約 2 秒 | 出力に結果 | print の結果が出力に出る | 出力ペイン |
| 最後 約 2 秒 | エンドカード | taitech.dev/fe | なし |

**区間の切り替えはステップ数の決め打ちではなく、実際の画面の変化で判定している。**
毎ステップ変数ペインと出力ペインのテキストを 60ms 間隔で読み、
「最初に値が変わった時点」「出力が出た時点」で注釈を切り替える。
決め打ちにすると DEMO_CODE を変えた瞬間に画面と注釈がズレる (実際にズレた)。

キャプションを「更新され続けている」と言い切らない表現にしてあるのは、
ループを抜けたあとの区間でも嘘にならないようにするため。
詳細は skill \`taitech-post-video\`。

注釈を入れているのは、X が動画を **ミュートで自動再生する** ため。
無音・無テキストだと最初の 1〜2 秒で何の画面か伝わらずスクロールされる。
文面や配色を変えるときは \`scripts/demo-video/overlay.ts\`。

## MP4 変換について

**X は WebM を受け付けない** (MP4 / MOV のみ)。
ffmpeg が PATH にあれば \`npm run gen:demo-video\` が自動で MP4 まで出す。手動でやる場合:

\`\`\`bash
ffmpeg -i playground-step.webm \\
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart \\
  -an playground-step.mp4
\`\`\`

- \`-pix_fmt yuv420p\`: これを付けないと一部プレイヤーで再生できない
- \`-an\`: 音声トラックなし (無音のデモなので不要)

## 投稿するとき

- **本文に URL を貼らない**。動画付き投稿に外部リンクを足すとリーチが落ちる。
  リンクはリプライか固定に置く (\`docs/x-posts/README.md\` の方針)
- 同じ素材を YouTube Shorts / TikTok にも横展開する (打ち手 A-3)
- 絵文字は使わない
`,
    "utf8",
  );
});
