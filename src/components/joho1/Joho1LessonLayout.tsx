import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PrevNextCards } from "@/components/layout/PrevNext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { FAQ } from "@/components/layout/FAQ";
import { sections } from "@/content/sections";
import {
  joho1Lessons,
  joho1LessonNeighbors,
  type Joho1LessonMeta,
} from "@/content/joho1/lessons";

const sectionMeta = sections.joho1;

/**
 * `/joho1/lessons/*` の骨組み。
 *
 * FE の `FeLessonLayout` とは**別実装**にしている。見た目は近いが、
 * 書籍 CTA / 練習問題一覧の有無が違い、両方を満たす props を持たせると
 * どちらのセクションからも読みにくくなるため。共有しているのは
 * `PrevNextCards` などの presentation だけ (AGENTS.md の分離パターン)。
 */
export function Joho1LessonLayout({
  lesson,
  faq,
  children,
}: {
  lesson: Joho1LessonMeta;
  faq?: { q: string; a: string }[];
  children: React.ReactNode;
}) {
  const { prev, next } = joho1LessonNeighbors(lesson.slug);

  return (
    <Container size="wide" className="py-8 md:py-12">
      <article className="mx-auto w-full min-w-0 max-w-3xl">
        <Breadcrumb
          className="mb-6"
          items={[
            { href: "/", label: "ホーム" },
            { href: sectionMeta.path, label: "情報I プログラム表記" },
            { href: "/joho1/lessons", label: "構文別レッスン" },
            { label: lesson.shortTitle },
          ]}
        />

        <Eyebrow>大学入学共通テスト「情報I」— プログラム表記</Eyebrow>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          {lesson.title}
        </h1>

        <DefinitionBox className="mt-6">{lesson.definition}</DefinitionBox>

        <div className="prose-jp mt-10 max-w-none">{children}</div>

        {faq && faq.length > 0 && <FAQ items={faq} />}

        <LessonNextActions />

        <PrevNextCards
          ariaLabel="前後のレッスン"
          prev={
            prev
              ? {
                  href: `/joho1/lessons/${prev.slug}`,
                  shortTitle: prev.shortTitle,
                }
              : null
          }
          next={
            next
              ? {
                  href: `/joho1/lessons/${next.slug}`,
                  shortTitle: next.shortTitle,
                }
              : null
          }
        />
      </article>
    </Container>
  );
}

function LessonNextActions() {
  const actions: { href: string; label: string; hint: string }[] = [
    {
      href: "/joho1",
      label: "実行シミュレーターへ",
      hint: "問題のプログラムを貼って動かす",
    },
    {
      href: "/joho1/dncl",
      label: "DNCL との違いへ",
      hint: "情報Iの言語は DNCL ではない",
    },
    {
      href: "/joho1/lessons",
      label: "レッスン一覧へ",
      hint: `他 ${joho1Lessons.length - 1} 本の構文レッスンを見る`,
    },
  ];
  return (
    <section
      aria-labelledby="lesson-next-actions"
      className="mt-12 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
    >
      <h2
        id="lesson-next-actions"
        className="text-sm font-bold text-[var(--foreground)]"
      >
        自由に動かす / 他の構文を読む
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {actions.map((a) => (
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
  );
}
