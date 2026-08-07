import {
  joho1OgImage,
  JOHO1_OG_SIZE,
  JOHO1_OG_CONTENT_TYPE,
} from "@/lib/og/joho1-image";
import { joho1Lessons } from "@/content/joho1/lessons";

export const size = JOHO1_OG_SIZE;
export const contentType = JOHO1_OG_CONTENT_TYPE;
export const alt = "情報I プログラム表記の構文別レッスン";

export default function OGImage() {
  return joho1OgImage({
    eyebrow: "共通テスト 情報I / プログラム表記",
    title: `構文別レッスン ${joho1Lessons.length} 本`,
    note: "実際の出題で使われた記法だけを、動かしながら確認する",
  });
}
