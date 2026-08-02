import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { MentorCTA } from "@/components/cta/MentorCTA";
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

        <PrevNextNav prev={prev} next={next} />

        <AffiliateBooks topicSlug={`fe-${lesson.slug}`} />

        <MentorCTA />
      </article>
    </Container>
  );
}

function PrevNextNav({
  prev,
  next,
}: {
  prev: FeLessonMeta | null;
  next: FeLessonMeta | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav
      aria-label="前後のレッスン"
      className="mt-16 grid gap-3 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={`/fe/lessons/${prev.slug}`}
          className="block rounded-lg border border-[var(--border)] p-4 hover:bg-[var(--muted)]/40 transition-colors"
        >
          <div className="text-xs text-[var(--muted-foreground)]">
            ← 前のレッスン
          </div>
          <div className="mt-1 font-semibold">{prev.shortTitle}</div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/fe/lessons/${next.slug}`}
          className="block rounded-lg border border-[var(--border)] p-4 hover:bg-[var(--muted)]/40 transition-colors sm:text-right"
        >
          <div className="text-xs text-[var(--muted-foreground)]">
            次のレッスン →
          </div>
          <div className="mt-1 font-semibold">{next.shortTitle}</div>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}