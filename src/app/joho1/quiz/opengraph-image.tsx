import {
  joho1OgImage,
  JOHO1_OG_SIZE,
  JOHO1_OG_CONTENT_TYPE,
} from "@/lib/og/joho1-image";
import { joho1Quizzes } from "@/content/joho1/quiz";

export const size = JOHO1_OG_SIZE;
export const contentType = JOHO1_OG_CONTENT_TYPE;
export const alt = "情報I プログラム表記の練習問題";

export default function OGImage() {
  return joho1OgImage({
    eyebrow: "共通テスト 情報I / プログラム表記",
    title: `練習問題 ${joho1Quizzes.length} 問`,
    note: "出力を答える 4 択。解説と実行シミュレーターで答え合わせまで",
  });
}
