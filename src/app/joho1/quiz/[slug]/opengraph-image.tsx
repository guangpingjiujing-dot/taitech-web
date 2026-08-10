import {
  joho1OgImage,
  JOHO1_OG_SIZE,
  JOHO1_OG_CONTENT_TYPE,
} from "@/lib/og/joho1-image";
import { joho1Quizzes, findJoho1Quiz } from "@/content/joho1/quiz";

export const size = JOHO1_OG_SIZE;
export const contentType = JOHO1_OG_CONTENT_TYPE;
export const alt = "情報I プログラム表記の練習問題";

export function generateStaticParams() {
  return joho1Quizzes.map((q) => ({ slug: q.slug }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = findJoho1Quiz(slug);
  return joho1OgImage({
    eyebrow: `共通テスト 情報I / 練習問題 第 ${quiz?.order ?? ""} 問`,
    title: quiz?.shortTitle ?? "練習問題",
    note: quiz?.challenge,
  });
}
