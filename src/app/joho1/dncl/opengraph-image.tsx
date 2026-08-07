import {
  joho1OgImage,
  JOHO1_OG_SIZE,
  JOHO1_OG_CONTENT_TYPE,
} from "@/lib/og/joho1-image";

export const size = JOHO1_OG_SIZE;
export const contentType = JOHO1_OG_CONTENT_TYPE;
export const alt = "情報Iの擬似言語は DNCL ではない";

export default function OGImage() {
  return joho1OgImage({
    eyebrow: "共通テスト 情報I / 用語",
    title: "情報Iの擬似言語は DNCL ではない",
    note: "情報関係基礎で使う DNCL とは別の言語。記法の違いを整理する",
  });
}
