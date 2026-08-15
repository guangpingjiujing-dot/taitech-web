import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { FAQ } from "@/components/layout/FAQ";
import type { BookDomain } from "@/content/books";

/**
 * レッスンページの骨組み (presentation)。
 *
 * `components/quiz/QuizCard` と同じ形の分離。**セクション固有の型を受け取らない**ので、
 * `FeLessonMeta` のようなドメインモデルはここに入れない。パスの解決・前後の
 * レッスン・関連する練習問題はデータ層 (`components/{section}/LessonLayout.tsx`) が持つ。
 *
 * 分離の経緯: 擬似言語のレッスンだけがあった間は `components/fe/LessonLayout.tsx` に
 * 直書きで足りていたが、SQL レッスンという 2 つ目の呼び出し側ができたため抽出した
 * (docs/wip/20260815-fe-sql/01-implementation-design.md §1-5)。
 */
export interface LessonNextAction {
  href: string;
  label: string;
  hint: string;
}

export function LessonLayoutView({
  breadcrumb,
  eyebrow,
  title,
  definition,
  children,
  faq,
  /** その構文に紐づく練習問題のセクション。無ければ null */
  quizSection = null,
  nextActions,
  nextActionsHeading,
  prev,
  next,
  booksTopicSlug,
  booksDomain,
  booksHeading,
  mentorVariant,
  sidebar,
}: {
  breadcrumb: { href?: string; label: string }[];
  eyebrow: string;
  title: string;
  definition: string;
  children: React.ReactNode;
  /** JSON-LD の FAQPage と同じ内容。可視でも必ず出す (Google のガイドライン要件) */
  faq?: { q: string; a: string }[];
  quizSection?: React.ReactNode;
  nextActions: LessonNextAction[];
  nextActionsHeading: string;
  prev: { href: string; shortTitle: string } | null;
  next: { href: string; shortTitle: string } | null;
  booksTopicSlug: string;
  booksDomain: BookDomain;
  booksHeading: string;
  // MentorCTA は props 全体が optional なので NonNullable で剥がす
  mentorVariant: NonNullable<React.ComponentProps<typeof MentorCTA>>["variant"];
  sidebar: React.ReactNode;
}) {
  return (
    <Container size="wide" className="py-8 md:py-12">
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="mx-auto w-full min-w-0 max-w-3xl lg:mx-0">
          <Breadcrumb className="mb-6" items={breadcrumb} />

          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {title}
          </h1>

          <DefinitionBox className="mt-6">{definition}</DefinitionBox>

          <div className="prose-jp mt-10 max-w-none">{children}</div>

          {faq && faq.length > 0 && <FAQ items={faq} />}

          {quizSection}

          <section
            aria-labelledby="lesson-next-actions"
            className="mt-12 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <h2
              id="lesson-next-actions"
              className="text-sm font-bold text-[var(--foreground)]"
            >
              {nextActionsHeading}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {nextActions.map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="group block rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
                  >
                    <div className="text-sm font-semibold group-hover:underline underline-offset-4">
                      {a.label} →
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--muted-foreground)] leading-tight">
                      {a.hint}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <PrevNextCards
            ariaLabel="前後のレッスン"
            prev={prev}
            next={next}
          />

          <AffiliateBooks
            topicSlug={booksTopicSlug}
            domain={booksDomain}
            limit={3}
            heading={booksHeading}
          />

          <MentorCTA variant={mentorVariant} />
        </article>

        {sidebar}
      </div>
    </Container>
  );
}
