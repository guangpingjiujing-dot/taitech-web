import { ImageResponse } from "next/og";
import { sqlQuizzes } from "@/content/fe/sql/quiz";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "基本情報 SQL 練習問題";

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
          SQL 練習問題 {sqlQuizzes.length} 問
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 24,
            lineHeight: 1.5,
            color: "#6b6b68",
          }}
        >
          この SQL の実行結果は？ 解答したら、その場で動かして確かめられる
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            border: "2px solid #0a0a0a",
            background: "#ffffff",
            flexDirection: "column",
            padding: "20px 24px",
            fontFamily: "monospace",
            fontSize: 22,
            color: "#0a0a0a",
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: "flex" }}>SELECT 分類, COUNT(*)</div>
          <div style={{ display: "flex" }}>FROM 商品</div>
          <div style={{ display: "flex" }}>GROUP BY 分類</div>
          <div style={{ display: "flex" }}>HAVING COUNT(*) &gt;= 2</div>
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
          taitech.dev / fe / sql / quiz
        </div>
      </div>
    ),
    { ...size },
  );
}
