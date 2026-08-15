import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "基本情報 擬似言語 構文別レッスン一覧";

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
          FE · 科目 B · 擬似言語
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 24,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#0a0a0a",
          }}
        >
          <div style={{ display: "flex" }}>構文別レッスン一覧</div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 24,
            lineHeight: 1.5,
            color: "#6b6b68",
          }}
        >
          変数 · 条件分岐 · while · for · 配列 · 関数
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontSize: 22,
            lineHeight: 1.5,
            color: "#6b6b68",
          }}
        >
          6 本のレッスンでブラウザで実行しながら学ぶ
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
          taitech.dev / fe / lessons
        </div>
      </div>
    ),
    { ...size },
  );
}
