import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SqlLessonLayout } from "@/components/sql/LessonLayout";
import { FeLessonJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { sqlLessons, findSqlLesson } from "@/content/fe/sql/lessons";
import SelectBody, { faq as selectFaq } from "@/content/fe/sql/lessons/select";
import WhereBody, { faq as whereFaq } from "@/content/fe/sql/lessons/where";
import JoinBody, { faq as joinFaq } from "@/content/fe/sql/lessons/join";
import AggregateBody, { faq as aggregateFaq } from "@/content/fe/sql/lessons/aggregate";
import GroupByBody, { faq as groupByFaq } from "@/content/fe/sql/lessons/group-by";
import SubqueryBody, { faq as subqueryFaq } from "@/content/fe/sql/lessons/subquery";
import SetOpsBody, { faq as setOpsFaq } from "@/content/fe/sql/lessons/set-ops";
import DmlBody, { faq as dmlFaq } from "@/content/fe/sql/lessons/dml";
import DdlConstraintsBody, {
  faq as ddlFaq,
} from "@/content/fe/sql/lessons/ddl-constraints";
import ViewBody, { faq as viewFaq } from "@/content/fe/sql/lessons/view";
import GrantBody, { faq as grantFaq } from "@/content/fe/sql/lessons/grant";
import CursorBody, { faq as cursorFaq } from "@/content/fe/sql/lessons/cursor";

const bodyMap = {
  select: { Body: SelectBody, faq: selectFaq },
  where: { Body: WhereBody, faq: whereFaq },
  join: { Body: JoinBody, faq: joinFaq },
  aggregate: { Body: AggregateBody, faq: aggregateFaq },
  "group-by": { Body: GroupByBody, faq: groupByFaq },
  subquery: { Body: SubqueryBody, faq: subqueryFaq },
  "set-ops": { Body: SetOpsBody, faq: setOpsFaq },
  dml: { Body: DmlBody, faq: dmlFaq },
  "ddl-constraints": { Body: DdlConstraintsBody, faq: ddlFaq },
  view: { Body: ViewBody, faq: viewFaq },
  grant: { Body: GrantBody, faq: grantFaq },
  cursor: { Body: CursorBody, faq: cursorFaq },
} as const;

export function generateStaticParams() {
  return sqlLessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = findSqlLesson(slug);
  if (!lesson) return {};
  const path = `/fe/sql/lessons/${lesson.slug}`;
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

export default async function SqlLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = findSqlLesson(slug);
  if (!lesson) notFound();
  const { Body, faq } = bodyMap[lesson.slug];
  const sectionMeta = sections.fe;
  const path = `/fe/sql/lessons/${lesson.slug}`;

  return (
    <>
      <FeLessonJsonLd
        path={path}
        name={lesson.title}
        description={lesson.description}
        keywords={lesson.keywords}
        breadcrumb={[
          { name: "ホーム", item: site.url },
          { name: sectionMeta.shortLabel, item: `${site.url}${sectionMeta.path}` },
          { name: "SQL 実行シミュレーター", item: `${site.url}/fe/sql` },
          { name: "SQL レッスン", item: `${site.url}/fe/sql/lessons` },
          { name: lesson.shortTitle, item: `${site.url}${path}` },
        ]}
        faq={faq}
      />
      <SqlLessonLayout lesson={lesson} faq={faq}>
        <Body />
      </SqlLessonLayout>
    </>
  );
}
