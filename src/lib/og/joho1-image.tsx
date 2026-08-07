import { ImageResponse } from "next/og";

export const JOHO1_OG_SIZE = { width: 1200, height: 630 };
export const JOHO1_OG_CONTENT_TYPE = "image/png";

/**
 * `/joho1/*` の OG 画像の共通ジェネレータ。
 *
 * FE 側 (`src/app/fe/**\/opengraph-image.tsx`) はページごとに全文を書いているが、
 * joho1 は 9 ページあるので共通化する。**next/og は動的フォント取得に失敗すると
 * 字形が欠ける**ため、記号は使わず素の文字だけで組む
 * (FE で `≧ ≦` が落ちた前例: docs/sections/fe-playground.md §3-10)。
 */
export function joho1OgImage({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fafafa",
          fontFamily: "sans-serif",
          padding: "72px",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#6b6b68",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 60,
            fontWeight: 800,
            color: "#0a0a0a",
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        {note && (
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 26,
              color: "#3d3d3a",
              lineHeight: 1.5,
            }}
          >
            {note}
          </div>
        )}
        <div
          style={{
            display: "flex",
            marginTop: 44,
            paddingTop: 24,
            borderTop: "2px solid #0a0a0a",
            fontSize: 22,
            color: "#3d3d3a",
            fontWeight: 700,
          }}
        >
          taitech.dev
        </div>
      </div>
    ),
    JOHO1_OG_SIZE,
  );
}
