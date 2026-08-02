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
          background: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: code snippet */}
        <div
          style={{
            width: "48%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "56px 32px 56px 56px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              border: "2px solid #0a0a0a",
              background: "#ffffff",
              boxShadow: "0 8px 24px rgba(10,10,10,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                background: "#f2f2f0",
                padding: "10px 16px",
                fontSize: 14,
                fontFamily: "monospace",
                borderBottom: "1px solid #d9d9d5",
                color: "#0a0a0a",
                fontWeight: 700,
              }}
            >
              擬似言語.pcode
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "monospace",
                fontSize: 18,
                lineHeight: 1.55,
                color: "#0a0a0a",
                padding: "18px 18px",
              }}
            >
              <div style={{ display: "flex" }}>整数型: n ← 5</div>
              <div style={{ display: "flex" }}>整数型: 合計 ← 0</div>
              <div style={{ display: "flex" }}>for (i を 1 から n まで</div>
              <div style={{ display: "flex", paddingLeft: 24 }}>
                1 ずつ増やす)
              </div>
              <div
                style={{
                  display: "flex",
                  paddingLeft: 24,
                  background: "rgba(255, 220, 0, 0.25)",
                  padding: "0 24px",
                }}
              >
                合計 ← 合計 + i
              </div>
              <div style={{ display: "flex" }}>endfor</div>
              <div style={{ display: "flex", color: "#6b6b68" }}>
                print(合計)
              </div>
            </div>
          </div>
        </div>
        {/* Right: title */}
        <div
          style={{
            width: "52%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "72px 72px 56px 40px",
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
            FE · 科目 B
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 24,
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#0a0a0a",
            }}
          >
            <div style={{ display: "flex" }}>擬似言語を</div>
            <div style={{ display: "flex" }}>ブラウザで実行</div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 22,
              lineHeight: 1.5,
              color: "#6b6b68",
            }}
          >
            一行ずつ実行して
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: 22,
              lineHeight: 1.5,
              color: "#6b6b68",
            }}
          >
            変数の変化を目で追える 実行シミュレーター
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              paddingTop: 32,
              borderTop: "1px solid #d9d9d5",
              fontSize: 18,
              color: "#6b6b68",
            }}
          >
            taitech.dev / fe
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
