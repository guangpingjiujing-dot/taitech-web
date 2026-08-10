import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Joho1Sidebar } from "@/components/joho1/Joho1Sidebar";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { joho1Lessons } from "@/content/joho1/lessons";
import { joho1Quizzes, joho1QuizzesForLesson } from "@/content/joho1/quiz";
import { sections } from "@/content/sections";
import { Joho1PageJsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";

const sectionMeta = sections.joho1;

export const metadata: Metadata = {
  // 本数は joho1Lessons から導出する。ここをハードコードすると、
  // レッスンを増やしたときに h1 だけ直って title / description が取り残される
  title: `情報I プログラム表記の構文別レッスン ${joho1Lessons.length} 本`,
  description: `共通テスト「情報I」のプログラム表記を、変数と代入・条件分岐・繰り返し・配列・外部関数の ${joho1Lessons.length} 本に分けて学ぶ。それぞれのページでコードをブラウザ上で 1 行ずつ実行しながら確認できる。`,
  alternates: { canonical: "/joho1/lessons" },
};

export default function Joho1LessonsPage() {
  return (
    <>
      <Joho1PageJsonLd
        path="/joho1/lessons"
        name="情報I プログラム表記の構文別レッスン"
        description={metadata.description as string}
        keywords={["共通テスト", "情報I", "情報1", "プログラム表記", "擬似言語", "レッスン"]}
        learningResourceType="Course"
        breadcrumb={[
          { name: "ホーム", item: site.url },
          {
            name: sectionMeta.shortLabel,
            item: `${site.url}${sectionMeta.path}`,
          },
          { name: "構文別レッスン", item: `${site.url}/joho1/lessons` },
        ]}
      />
      <Container size="wide" className="py-8 md:py-12">
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0 max-w-3xl">
        <Breadcrumb
          className="mb-6"
          items={[
            { href: "/", label: "ホーム" },
            { href: sectionMeta.path, label: "情報I プログラム表記" },
            { label: "構文別レッスン" },
          ]}
        />

        <Eyebrow>大学入学共通テスト「情報I」— プログラム表記</Eyebrow>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          構文別レッスン {joho1Lessons.length} 本
        </h1>
        <p className="mt-4 text-[var(--muted-foreground)] leading-relaxed">
          共通テストのプログラム表記には仕様書がなく、記法は過去の出題からしか分かりません。
          このレッスンでは
          <strong>試作問題と令和 7・8 年度の本試験・追試験で実際に使われた書き方だけ</strong>
          を扱います。どのページでもコードをその場で 1 行ずつ動かせます。
        </p>

        <ol className="mt-8 grid gap-3">
          {joho1Lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={`/joho1/lessons/${lesson.slug}`}
                className="group block border border-[var(--border)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-[var(--muted-foreground)]">
                    {String(lesson.order).padStart(2, "0")}
                  </span>
                  <span className="font-bold group-hover:underline underline-offset-4">
                    {lesson.shortTitle}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {lesson.cardSummary}
                </p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  練習問題 {joho1QuizzesForLesson(lesson.slug).length} 問
                </p>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          ひととおり読んだら{" "}
          <Link href="/joho1/quiz" className="underline underline-offset-4">
            練習問題 {joho1Quizzes.length} 問
          </Link>{" "}
          で確かめてください。用語がまぎらわしいと感じたら{" "}
          <Link href="/joho1/dncl" className="underline underline-offset-4">
            DNCL とプログラム表記の違い
          </Link>{" "}
          も読んでみてください。
        </p>

        <AffiliateBooks
          topicSlug="joho1-lessons"
          domain="joho1"
          heading="紙の参考書と組み合わせる（おすすめ書籍）"
        />
      </div>
      <Joho1Sidebar topicSlug="joho1-lessons" />
      </div>
      </Container>
    </>
  );
}
