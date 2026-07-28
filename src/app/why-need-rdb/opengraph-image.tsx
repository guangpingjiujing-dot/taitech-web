import { ImageResponse } from "next/og";
import { sections } from "@/content/sections";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = sections["why-need-rdb"].ogImageAlt;

/**
 * 旗艦ページ専用 OG 画像。Satori (next/og) で div ベースの
 * 「壊れた Excel」ミニ表現 + タイトル + サブライン を組み合わせて描画する。
 * SVG や複雑な path を使わないので Satori の安定領域内。
 */
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
        {/* Left column: 壊れた Excel のミニ表現 */}
        <div
          style={{
            width: "44%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "56px 0 56px 56px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              border: "2px solid #0a0a0a",
              background: "#ffffff",
              padding: 0,
              boxShadow: "0 8px 24px rgba(10,10,10,0.08)",
            }}
          >
            {/* Sheet tab header */}
            <div
              style={{
                display: "flex",
                background: "#f2f2f0",
                padding: "10px 16px",
                fontSize: 16,
                fontFamily: "monospace",
                borderBottom: "1px solid #d9d9d5",
                color: "#0a0a0a",
                fontWeight: 700,
              }}
            >
              注文.xlsx
            </div>
            {/* Header row */}
            <div
              style={{
                display: "flex",
                background: "#f2f2f0",
                padding: "8px 16px",
                fontSize: 14,
                fontFamily: "monospace",
                borderBottom: "1px solid #d9d9d5",
                color: "#6b6b68",
                fontWeight: 700,
              }}
            >
              <div style={{ width: 90, display: "flex" }}>注文ID</div>
              <div style={{ width: 100, display: "flex" }}>顧客名</div>
              <div style={{ width: 90, display: "flex" }}>金額</div>
              <div style={{ display: "flex" }}>状態</div>
            </div>
            {/* Data rows with anomalies */}
            <ExcelRow orderId="ORD-001" name="山田太郎" amount="¥9,800" stock="済" />
            <ExcelRow
              orderId="ORD-001"
              name="佐藤花子"
              amount="¥10,800"
              stock="?"
              highlight
            />
            <ExcelRow
              orderId="ORD-003"
              name="山田太郎"
              amount="¥9,800"
              stock="?"
              highlight
            />
            <ExcelRow
              orderId="ORD-004"
              name="山田太郎"
              amount="¥9,800"
              stock="?"
              highlight
            />
            <ExcelRow
              orderId="ORD-002"
              name="#N/A"
              amount="¥7,600"
              stock="?"
              highlight
            />
          </div>
        </div>
        {/* Right column: title */}
        <div
          style={{
            width: "56%",
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
            SERIES 01 · WHY
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
            <div style={{ display: "flex" }}>もしもこの世界に</div>
            <div style={{ display: "flex" }}>RDBがなかったら</div>
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
            あなたには、この Excel の何が壊れているか、
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
            わかりますか？
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
            taitech.dev
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function ExcelRow({
  orderId,
  name,
  amount,
  stock,
  highlight,
}: {
  orderId: string;
  name: string;
  amount: string;
  stock: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 16px",
        fontSize: 14,
        fontFamily: "monospace",
        borderBottom: "1px solid #d9d9d5",
        background: highlight ? "#f5e6e6" : "#ffffff",
        color: "#0a0a0a",
      }}
    >
      <div style={{ width: 90, display: "flex" }}>{orderId}</div>
      <div style={{ width: 100, display: "flex" }}>{name}</div>
      <div style={{ width: 90, display: "flex" }}>{amount}</div>
      <div
        style={{
          display: "flex",
          fontWeight: stock === "?" ? 700 : 400,
          color: stock === "?" ? "#a05252" : "#0a0a0a",
        }}
      >
        {stock}
      </div>
    </div>
  );
}
