import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { sections } from "@/content/sections";
import {
  feLessonNeighbors,
  type FeLessonMeta,
} from "@/content/fe/lessons";

const sectionMeta = sections.fe;

export function FeLessonLayout({
  lesson,
  children,
}: {
  lesson: FeLessonMeta;
  children: React.ReactNode;
}) {
  const { prev, next } = feLessonNeighbors(lesson.slug);

  return (
    <Container size="wide" className="py-8 md:py-12">
      <article className="mx-auto max-w-3xl">
        <Breadcrumb
          className="mb-6"
          items={[
            { href: "/", label: "ホーム" },
            { href: sectionMeta.path, label: "擬似言語 実行シミュレーター" },
            { href: "/fe/lessons", label: "構文別レッスン" },
            { label: lesson.shortTitle },
          ]}
        />

        <Eyebrow>基本情報技術者試験 (FE) 科目 B — 擬似言語</Eyebrow>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          {lesson.title}
        </h1>

        <DefinitionBox className="mt-6">{lesson.definition}</DefinitionBox>

        <div className="prose-jp mt-10 max-w-none">{children}</div>

        <PrevNextCards
          ariaLabel="前後のレッスン"
          prev={
            prev
              ? { href: `/fe/lessons/${prev.slug}`, shortTitle: prev.shortTitle }
              : null
          }
          next={
            next
              ? { href: `/fe/lessons/${next.slug}`, shortTitle: next.shortTitle }
              : null
          }
        />

        <AffiliateBooks topicSlug={`fe-${lesson.slug}`} />

        <MentorCTA />
      </article>
    </Container>
  );
}