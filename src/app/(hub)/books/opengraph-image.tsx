import { ImageResponse } from "next/og";
import { bookShelves } from "@/content/book-shelves";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ITパスポート・基本情報・SQL・Python のおすすめ参考書";

/**
 * `/books` の OG 画像。
 *
 * **このファイルが無いと og:image がまるごと落ちる。** ページの `metadata` で
 * `openGraph` を宣言すると、`(hub)/opengraph-image.tsx` から継いでいた画像が
 * 外れる (`/about` は `openGraph` を宣言していないので継承できている)。
 * このページはチャットや SNS で URL を直接送る用途なので、カードが
 * 画像なしになると効き目が大きく落ちる。
 */
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
          taitech.dev · おすすめ参考書
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
          <div style={{ display: "flex" }}>候補は並べない。</div>
          <div style={{ display: "flex" }}>分野ごとに 2 冊だけ。</div>
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
          こんな人向け・中身・使い方・注意まで書いた、個別指導での回答
        </div>
        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            borderTop: "1px solid #d9d9d5",
            display: "flex",
            gap: 16,
            fontSize: 20,
            color: "#6b6b68",
          }}
        >
          {bookShelves.map((s) => (
            <div key={s.key} style={{ display: "flex" }}>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
