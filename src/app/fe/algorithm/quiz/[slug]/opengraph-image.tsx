import { ImageResponse } from "next/og";
import { feQuizzes, findFeQuiz } from "@/content/fe/quiz";
import { ogSafePseudoCode } from "@/lib/og/pseudo-code";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "基本情報 擬似言語 練習問題";

export function generateStaticParams() {
  return feQuizzes.map((q) => ({ slug: q.slug }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = findFeQuiz(slug);
  const title = quiz?.shortTitle ?? "練習問題";
  const codePreview = ogSafePseudoCode(quiz?.code ?? "")
    .split("\n")
    .slice(0, 7)
    .filter((l) => l.length > 0);

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
        {/* Left: question label + title */}
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
            FE · 科目 B · Quiz {quiz?.order ?? ""}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 24,
              fontSize: 56,
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
            {quiz?.kind === "fill"
              ? "空欄に入る記述はどれか"
              : "このコードの出力はどれか"}
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
            taitech.dev / fe / quiz / {slug}
          </div>
        </div>
        {/* Right: the question code */}
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
              {slug}.pcode
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
              {codePreview.map((line, i) => (
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
