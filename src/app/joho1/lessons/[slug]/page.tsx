import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Joho1LessonLayout } from "@/components/joho1/Joho1LessonLayout";
import { Joho1PageJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { joho1Lessons, findJoho1Lesson } from "@/content/joho1/lessons";
import VariableBody from "@/content/joho1/lessons/variable";
import IfBody from "@/content/joho1/lessons/if";
import LoopBody from "@/content/joho1/lessons/loop";
import LoopWhileBody from "@/content/joho1/lessons/loop-while";
import ArrayBody from "@/content/joho1/lessons/array";
import FunctionBody from "@/content/joho1/lessons/function";

const bodyMap = {
  variable: VariableBody,
  if: IfBody,
  loop: LoopBody,
  "loop-while": LoopWhileBody,
  array: ArrayBody,
  function: FunctionBody,
} as const;

export function generateStaticParams() {
  return joho1Lessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = findJoho1Lesson(slug);
  if (!lesson) return {};
  const path = `/joho1/lessons/${lesson.slug}`;
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

export default async function Joho1LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = findJoho1Lesson(slug);
  if (!lesson) notFound();
  const Body = bodyMap[lesson.slug];
  const sectionMeta = sections.joho1;
  const path = `/joho1/lessons/${lesson.slug}`;

  return (
    <>
      <Joho1PageJsonLd
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
          { name: "構文別レッスン", item: `${site.url}/joho1/lessons` },
          { name: lesson.shortTitle, item: `${site.url}${path}` },
        ]}
      />
      <Joho1LessonLayout lesson={lesson}>
        <Body />
      </Joho1LessonLayout>
    </>
  );
}
