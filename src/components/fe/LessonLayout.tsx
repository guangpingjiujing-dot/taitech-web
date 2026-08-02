import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { PrevNextCards } from "@/components/layout/PrevNext";
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
        <nav
          aria-label="パンくず"
          className="mb-6 text-xs text-[var(--muted-foreground)]"
        >
          <Link href="/" className="hover:text-[var(--foreground)]">
            ホーム
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={sectionMeta.path}
            className="hover:text-[var(--foreground)]"
          >
            擬似言語 実行シミュレーター
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/fe/lessons"
            className="hover:text-[var(--foreground)]"
          >
            構文別レッスン
          </Link>
          <span className="mx-2">/</span>
          <span>{lesson.shortTitle}</span>
        </nav>

        <p className="text-xs font-semibold tracking-wider uppercase text-[var(--muted-foreground)]">
          基本情報技術者試験 (FE) 科目 B — 擬似言語
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          {lesson.title}
        </h1>

        <div className="mt-6 border-l-2 border-[var(--foreground)] pl-4 py-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            定義
          </div>
          <p
            data-speakable="definition"
            className="mt-1 text-[var(--foreground)] leading-relaxed"
          >
            {lesson.definition}
          </p>
        </div>

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