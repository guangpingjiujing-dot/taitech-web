/**
 * X「1 日 1 問」投稿画像の HTML テンプレート。
 *
 * next/og (satori) ではなく Chromium のスクリーンショットで描く。理由:
 * - 実フォント (Hiragino / Noto) が使えるので ≧ ≦ ≠ の字形落ちを回避できる
 *   (satori 経路の回避策は src/lib/og/pseudo-code.ts を参照)
 * - satori の flexbox 限定 CSS ではなく grid / pre が素直に書ける
 * - docs/x-posts/README.md が既に「Chrome headless で PNG 化」を標準手順にしている
 *
 * 配色はサイトの OG 画像 (src/app/fe/algorithm/quiz/[slug]/opengraph-image.tsx) に合わせたモノクロ。
 * 絵文字は使わない (docs/x-posts/README.md の投稿方針)。
 */
import type { FeQuizMeta } from "@/content/fe/quiz";

export const IMAGE_WIDTH = 1200;
export const IMAGE_HEIGHT = 675;

const COLORS = {
  bg: "#fafafa",
  fg: "#0a0a0a",
  muted: "#6b6b68",
  border: "#d9d9d5",
  card: "#ffffff",
  wash: "#f2f2f0",
};

const FONT_SANS = `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;
const FONT_MONO = `"SF Mono", "Menlo", "Consolas", monospace`;

/** 全角を 2 幅として数える。等幅フォントの折り返し判定に使う */
function displayWidth(line: string): number {
  return [...line].reduce(
    (n, ch) => n + (ch.charCodeAt(0) > 0x2e80 ? 2 : 1),
    0,
  );
}

function codeLines(code: string): string[] {
  return code.replace(/\s+$/, "").split("\n");
}

/**
 * コードカードに収まる font-size を求める。
 * 横: 等幅の 1 文字 ≒ 0.6em なので (幅 / 0.6 / 最大表示幅)
 * 縦: line-height 1.6 なので (高さ / 1.6 / 行数)
 */
function fitCodeFontSize(
  lines: string[],
  boxWidth: number,
  boxHeight: number,
): number {
  const maxW = Math.max(1, ...lines.map(displayWidth));
  const byWidth = boxWidth / 0.6 / maxW;
  const byHeight = boxHeight / 1.6 / Math.max(1, lines.length);
  return Math.max(12, Math.min(26, Math.floor(Math.min(byWidth, byHeight))));
}

/** 文字数に応じて本文サイズを落とす */
function fitTextFontSize(text: string, max: number, min: number): number {
  const len = [...text].length;
  if (len <= 60) return max;
  if (len <= 100) return Math.round((max + min) / 2);
  if (len <= 150) return min + 2;
  return min;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function shell(body: string): string {
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${IMAGE_WIDTH}px; height: ${IMAGE_HEIGHT}px;
    background: ${COLORS.bg}; color: ${COLORS.fg};
    font-family: ${FONT_SANS};
    -webkit-font-smoothing: antialiased;
  }
  /* フォント指定は必ずクラス経由で当てる。
     フォント名に " が含まれるので style="..." に直接書くと属性がそこで閉じ、
     以降の宣言 (font-size / padding / white-space) がまるごと無効になる。 */
  .mono { font-family: ${FONT_MONO}; }
  .frame { width: 100%; height: 100%; display: flex; flex-direction: column; }
  .bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 56px; border-bottom: 1px solid ${COLORS.border};
  }
  .bar .left { font-size: 19px; font-weight: 700; letter-spacing: 2px; }
  .bar .right { font-size: 17px; color: ${COLORS.muted}; letter-spacing: 1px; }
  .foot {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 56px; border-top: 1px solid ${COLORS.border};
    font-size: 18px; color: ${COLORS.muted};
  }
  .badge {
    border: 1.5px solid ${COLORS.fg}; border-radius: 999px;
    padding: 3px 14px; font-size: 15px; font-weight: 700; letter-spacing: 1px;
  }
</style></head><body>${body}</body></html>`;
}

/** 出題画像。リンクを載せない (本文にも URL を入れない運用のため) */
export function questionHtml(quiz: FeQuizMeta): string {
  const lines = codeLines(quiz.code);
  // コードカードの内寸: 幅 = 44%*1200 - 左右 padding(68) - 枠(4) - pre padding(32)
  const codeSize = fitCodeFontSize(lines, 424, 400);
  const promptSize = fitTextFontSize(quiz.prompt, 27, 21);

  const choices = quiz.choices
    .map(
      (c) => `
      <div style="display:flex;gap:12px;align-items:flex-start;
                  border:1.5px solid ${COLORS.border};background:${COLORS.card};
                  padding:12px 14px;min-height:78px;">
        <div style="font-weight:800;font-size:20px;flex:0 0 auto;">${c.id}</div>
        <div class="mono" style="font-size:19px;line-height:1.45;
                    white-space:pre-line;word-break:break-all;">${esc(c.text)}</div>
      </div>`,
    )
    .join("");

  return shell(`
  <div class="frame">
    <div class="bar">
      <div class="left">基本情報 科目B 擬似言語 / 1日1問</div>
      <div class="right">No.${String(quiz.order).padStart(2, "0")}　${
        quiz.tier === "exam" ? "科目B 相当" : "基礎"
      }</div>
    </div>

    <div style="flex:1;display:flex;min-height:0;">
      <!-- コードを左に置く。視線の入口 (左上) に問題の主題を出すため。
           科目 B の実際の出題順 (プログラム → 設問 → 選択肢) とも揃う。 -->
      <div style="width:44%;padding:30px 12px 24px 56px;display:flex;
                  align-items:center;min-height:0;">
        <div style="width:100%;border:2px solid ${COLORS.fg};background:${COLORS.card};
                    box-shadow:0 8px 24px rgba(10,10,10,0.08);">
          <div class="mono" style="background:${COLORS.wash};
                      border-bottom:1px solid ${COLORS.border};
                      padding:9px 14px;font-size:14px;
                      font-weight:700;">${esc(quiz.slug)}.pcode</div>
          <pre class="mono" style="font-size:${codeSize}px;line-height:1.6;
                      padding:18px 16px;white-space:pre;overflow:hidden;">${esc(
                        lines.join("\n"),
                      )}</pre>
        </div>
      </div>

      <div style="width:56%;padding:30px 56px 24px 24px;display:flex;
                  flex-direction:column;justify-content:center;min-height:0;">
        <div style="font-size:${promptSize}px;line-height:1.6;font-weight:600;">
          ${esc(quiz.prompt)}
        </div>
        <div style="margin-top:30px;display:grid;
                    grid-template-columns:1fr 1fr;gap:12px;">
          ${choices}
        </div>
      </div>
    </div>

    <div class="foot">
      <div>答えは明日。</div>
      <div class="badge">taitech.dev</div>
    </div>
  </div>`);
}

/** 解答画像。翌日の投稿で使う */
export function answerHtml(quiz: FeQuizMeta): string {
  const correct = quiz.choices.find((c) => c.id === quiz.answer);
  const detail = quiz.explanation[0] ?? "";
  const detailSize = fitTextFontSize(detail, 25, 19);

  return shell(`
  <div class="frame">
    <div class="bar">
      <div class="left">基本情報 科目B 擬似言語 / 1日1問</div>
      <div class="right">No.${String(quiz.order).padStart(2, "0")}　解答</div>
    </div>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;
                min-height:0;padding:34px 56px 26px;">
      <div style="display:flex;align-items:center;gap:22px;">
        <div style="font-size:19px;font-weight:700;letter-spacing:3px;
                    color:${COLORS.muted};">正解</div>
        <div style="width:78px;height:78px;flex:0 0 auto;background:${COLORS.fg};
                    color:${COLORS.bg};display:flex;align-items:center;
                    justify-content:center;font-size:42px;font-weight:800;">${
                      quiz.answer
                    }</div>
        <div class="mono" style="font-size:26px;line-height:1.35;
                    white-space:pre-line;">${esc(correct?.text ?? "")}</div>
      </div>

      <div style="margin-top:28px;border-left:3px solid ${COLORS.fg};
                  padding:4px 0 4px 20px;">
        <div style="font-size:15px;font-weight:700;letter-spacing:2px;
                    color:${COLORS.muted};">ひっかけ</div>
        <div style="margin-top:8px;font-size:26px;line-height:1.5;font-weight:700;">
          ${esc(quiz.trap)}
        </div>
      </div>

      <div style="margin-top:24px;font-size:${detailSize}px;line-height:1.75;
                  color:#2b2b28;overflow:hidden;">
        ${esc(detail)}
      </div>
    </div>

    <div class="foot">
      <div>1行ずつ実行して確かめられます</div>
      <div class="badge">taitech.dev/fe</div>
    </div>
  </div>`);
}