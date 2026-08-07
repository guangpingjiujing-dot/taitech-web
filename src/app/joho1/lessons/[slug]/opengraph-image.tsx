import {
  joho1OgImage,
  JOHO1_OG_SIZE,
  JOHO1_OG_CONTENT_TYPE,
} from "@/lib/og/joho1-image";
import { joho1Lessons, findJoho1Lesson } from "@/content/joho1/lessons";

export const size = JOHO1_OG_SIZE;
export const contentType = JOHO1_OG_CONTENT_TYPE;
export const alt = "情報I プログラム表記のレッスン";

export function generateStaticParams() {
  return joho1Lessons.map((l) => ({ slug: l.slug }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = findJoho1Lesson(slug);
  return joho1OgImage({
    eyebrow: "共通テスト 情報I / プログラム表記",
    title: lesson?.shortTitle ?? "構文別レッスン",
    note: lesson?.cardSummary,
  });
}
