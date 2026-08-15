import { ImageResponse } from "next/og";
import { sqlLessons, findSqlLesson } from "@/content/fe/sql/lessons";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "基本情報 SQL レッスン";

export function generateStaticParams() {
  return sqlLessons.map((l) => ({ slug: l.slug }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = findSqlLesson(slug);
  const title = lesson?.shortTitle ?? "SQL レッスン";

  // 解説のみのレッスンは SQL が無いので、その旨を出す
  const codeLines = (lesson?.sampleSql ?? "")
    .split("\n")
    .filter((l) => l.trim().length > 0 && !l.trim().startsWith("--"))
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
        {/* Left: title */}
        <div
          style={{
            width: "52%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "72px 40px 56px 72px",
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
            FE · 科目 A · Lesson {lesson?.order ?? ""}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 24,
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#0a0a0a",
            }}
          >
            <div style={{ display: "flex" }}>{title}</div>
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
            基本情報 SQL レッスン
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
            taitech.dev / fe / sql / lessons / {slug}
          </div>
        </div>

        {/* Right: SQL preview */}
        <div
          style={{
            width: "48%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "56px 72px 56px 32px",
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
                fontSize: 18,
                lineHeight: 1.55,
                color: "#0a0a0a",
                padding: "18px 18px",
              }}
            >
              {codeLines.length > 0 ? (
                codeLines.map((line, i) => (
                  <div key={i} style={{ display: "flex" }}>
                    {line}
                  </div>
                ))
              ) : (
                <div style={{ display: "flex", color: "#6b6b68" }}>
                  -- このレッスンは解説のみ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
