import {
  joho1OgImage,
  JOHO1_OG_SIZE,
  JOHO1_OG_CONTENT_TYPE,
} from "@/lib/og/joho1-image";

export const size = JOHO1_OG_SIZE;
export const contentType = JOHO1_OG_CONTENT_TYPE;
export const alt = "共通テスト 情報I プログラム表記 実行シミュレーター";

export default function OGImage() {
  return joho1OgImage({
    eyebrow: "共通テスト 情報I",
    title: "プログラム表記 実行シミュレーター",
    note: "問題のプログラムを貼り付けて、1 行ずつ実行できる",
  });
}
