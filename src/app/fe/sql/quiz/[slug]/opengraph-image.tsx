import { ImageResponse } from "next/og";
import { sqlQuizzes, findSqlQuiz } from "@/content/fe/sql/quiz";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "基本情報 SQL 練習問題";

export function generateStaticParams() {
  return sqlQuizzes.map((q) => ({ slug: q.slug }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = findSqlQuiz(slug);
  const title = quiz?.shortTitle ?? "SQL 練習問題";
  // 答えが写り込まないよう、出題の SQL だけを載せる
  const sqlLines = (quiz?.sql ?? "")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .slice(0, 6);

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
        <div
          style={{
            width: "50%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "72px 36px 56px 72px",
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
            FE · 科目 A · 第 {quiz?.order ?? ""} 問
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 50,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#0a0a0a",
            }}
          >
            {title}
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
            この SQL の実行結果は？
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
            taitech.dev / fe / sql / quiz / {slug}
          </div>
        </div>

        <div
          style={{
            width: "50%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "56px 72px 56px 36px",
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
              {slug}.sql
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "monospace",
                fontSize: 17,
                lineHeight: 1.55,
                color: "#0a0a0a",
                padding: "18px",
              }}
            >
              {sqlLines.map((line, i) => (
                <div key={i} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
