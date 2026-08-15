import { ImageResponse } from "next/og";
import { sections } from "@/content/sections";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = sections.fe.ogImageAlt;

export default function OGImage() {
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
            textTransform: "uppercase",
          }}
        >
          FE · 基本情報技術者試験
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 24,
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#0a0a0a",
          }}
        >
          <div style={{ display: "flex" }}>読むのではなく、</div>
          <div style={{ display: "flex" }}>動かして対策する。</div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 24,
            lineHeight: 1.5,
            color: "#6b6b68",
          }}
        >
          擬似言語をブラウザで 1 行ずつ実行できる 無料の学習ツール集
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            gap: 16,
          }}
        >
          {["一行ずつ実行", "変数を可視化", "練習問題つき"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                border: "2px solid #0a0a0a",
                background: "#ffffff",
                padding: "10px 20px",
                fontSize: 20,
                fontWeight: 700,
                color: "#0a0a0a",
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 40,
            borderTop: "1px solid #d9d9d5",
            fontSize: 18,
            color: "#6b6b68",
          }}
        >
          taitech.dev / fe
        </div>
      </div>
    ),
    { ...size },
  );
}
