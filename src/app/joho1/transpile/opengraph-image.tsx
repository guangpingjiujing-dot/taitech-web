import {
  joho1OgImage,
  JOHO1_OG_SIZE,
  JOHO1_OG_CONTENT_TYPE,
} from "@/lib/og/joho1-image";

export const size = JOHO1_OG_SIZE;
export const contentType = JOHO1_OG_CONTENT_TYPE;
export const alt = "情報I プログラム表記と Python の読み比べ";

export default function OGImage() {
  return joho1OgImage({
    eyebrow: "共通テスト 情報I / プログラム表記",
    title: "プログラム表記と Python を並べて読む",
    note: "授業で書いた Python と、試験に出る書き方の対応を見る",
  });
}
