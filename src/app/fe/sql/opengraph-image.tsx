import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "基本情報技術者試験 SQL 実行シミュレーター";

/** 評価順を見せるのがこのツールの売りなので、OG も「段階」を主役にする */
const STAGES = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT"];

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
          padding: "64px 72px",
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
          FE · 科目 A · データベース
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 20,
            fontSize: 54,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#0a0a0a",
          }}
        >
          <div style={{ display: "flex" }}>SQL は書いた順に</div>
          <div style={{ display: "flex" }}>実行されない。</div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 22,
            lineHeight: 1.5,
            color: "#6b6b68",
          }}
        >
          評価順に中間の表を 1 つずつ見られる 実行シミュレーター
        </div>

        {/* 評価順のチップ列 */}
        <div
          style={{
            display: "flex",
            marginTop: 36,
            alignItems: "center",
            gap: 10,
          }}
        >
          {STAGES.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  border: "2px solid #0a0a0a",
                  background: i === STAGES.length - 1 ? "#0a0a0a" : "#ffffff",
                  color: i === STAGES.length - 1 ? "#ffffff" : "#0a0a0a",
                  padding: "10px 16px",
                  fontSize: 19,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
              {i < STAGES.length - 1 && (
                <div style={{ display: "flex", fontSize: 20, color: "#6b6b68" }}>
                  →
                </div>
              )}
            </div>
          ))}
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
          taitech.dev / fe / sql
        </div>
      </div>
    ),
    { ...size },
  );
}
