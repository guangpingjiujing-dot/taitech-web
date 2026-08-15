import { ImageResponse } from "next/og";
import { sqlLessons } from "@/content/fe/sql/lessons";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "基本情報 SQL レッスン一覧";

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
            marginTop: 20,
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#0a0a0a",
          }}
        >
          SQL レッスン {sqlLessons.length} 本
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 22,
            lineHeight: 1.5,
            color: "#6b6b68",
          }}
        >
          読みながらその場で実行できる、シラバス「データ操作」の全範囲
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: 36,
            gap: 10,
            maxWidth: 980,
          }}
        >
          {sqlLessons.map((l) => (
            <div
              key={l.slug}
              style={{
                display: "flex",
                border: "2px solid #0a0a0a",
                background: l.runnable ? "#ffffff" : "#f2f2f0",
                color: l.runnable ? "#0a0a0a" : "#6b6b68",
                padding: "8px 14px",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              {l.shortTitle}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 28,
            borderTop: "1px solid #d9d9d5",
            fontSize: 18,
            color: "#6b6b68",
          }}
        >
          taitech.dev / fe / sql / lessons
        </div>
      </div>
    ),
    { ...size },
  );
}
