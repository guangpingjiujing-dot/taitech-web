import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeLessonLayout } from "@/components/fe/LessonLayout";
import { FeLessonJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { feLessons, findFeLesson } from "@/content/fe/lessons";
import VariableBody, { faq as variableFaq } from "@/content/fe/lessons/variable";
import IfBody, { faq as ifFaq } from "@/content/fe/lessons/if";
import WhileBody, { faq as whileFaq } from "@/content/fe/lessons/while";
import ForBody, { faq as forFaq } from "@/content/fe/lessons/for";
import ArrayBody, { faq as arrayFaq } from "@/content/fe/lessons/array";
import FunctionBody, { faq as functionFaq } from "@/content/fe/lessons/function";

const bodyMap = {
  variable: { Body: VariableBody, faq: variableFaq },
  if: { Body: IfBody, faq: ifFaq },
  while: { Body: WhileBody, faq: whileFaq },
  for: { Body: ForBody, faq: forFaq },
  array: { Body: ArrayBody, faq: arrayFaq },
  function: { Body: FunctionBody, faq: functionFaq },
} as const;

export function generateStaticParams() {
  return feLessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = findFeLesson(slug);
  if (!lesson) return {};
  const path = `/fe/lessons/${lesson.slug}`;
  return {
    title: lesson.title,
    description: lesson.description,
    keywords: lesson.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: lesson.title,
      description: lesson.description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title: lesson.title,
      description: lesson.description,
    },
  };
}

export default async function FeLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = findFeLesson(slug);
  if (!lesson) notFound();
  const entry = bodyMap[lesson.slug];
  const { Body, faq } = entry;
  const sectionMeta = sections.fe;
  const path = `/fe/lessons/${lesson.slug}`;

  return (
    <>
      <FeLessonJsonLd
        path={path}
        name={lesson.title}
        description={lesson.description}
        keywords={lesson.keywords}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          {
            name: sectionMeta.shortLabel,
            item: `${site.url}${sectionMeta.path}`,
          },
          { name: "構文別レッスン", item: `${site.url}/fe/lessons` },
          { name: lesson.shortTitle, item: `${site.url}${path}` },
        ]}
        faq={faq}
      />
      <FeLessonLayout lesson={lesson} faq={faq}>
        <Body />
      </FeLessonLayout>
    </>
  );
}
