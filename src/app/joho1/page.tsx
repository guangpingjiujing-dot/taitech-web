import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Joho1Playground } from "@/components/joho1/Joho1Playground";
import { Joho1Sidebar } from "@/components/joho1/Joho1Sidebar";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { joho1Lessons } from "@/content/joho1/lessons";
import { joho1Quizzes } from "@/content/joho1/quiz";
import { sections } from "@/content/sections";
import { Joho1PageJsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";

const sectionMeta = sections.joho1;

export const metadata: Metadata = {
  title: sectionMeta.metaTitle,
  description: sectionMeta.metaDescription,
  alternates: { canonical: sectionMeta.path },
  openGraph: {
    title: sectionMeta.metaTitle,
    description: sectionMeta.metaDescription,
    url: sectionMeta.path,
  },
};

export default function Joho1Page() {
  return (
    <>
      <Joho1PageJsonLd
        path={sectionMeta.path}
        name={sectionMeta.label}
        description={sectionMeta.metaDescription ?? sectionMeta.description}
        keywords={[
          "共通テスト",
          "情報I",
          "情報1",
          "プログラム表記",
          "擬似言語",
          "シミュレーター",
          "DNCL",
        ]}
        learningResourceType="Simulation"
        breadcrumb={[
          { name: "ホーム", item: site.url },
          {
            name: sectionMeta.shortLabel,
            item: `${site.url}${sectionMeta.path}`,
          },
        ]}
      />
      <Container size="wide" className="py-10 md:py-14">
      <div className="grid gap-8 xl:gap-10 xl:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0">
      <Eyebrow>大学入学共通テスト「情報I」</Eyebrow>
      <h1 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight">
        プログラム表記 実行シミュレーター
      </h1>
      <p className="mt-4 max-w-2xl text-[var(--muted-foreground)] leading-relaxed">
        共通テスト「情報I」のプログラムを、ブラウザで 1 行ずつ動かせます。
        変数の値がどう変わるかを見ながら読むと、繰り返しと条件分岐の追い方が身につきます。
        <strong>問題冊子からそのまま貼り付けると、行番号と罫線は自動で取り除かれます。</strong>
      </p>

      <div className="mt-8">
        <Joho1Playground enableDeepLink />
      </div>

      <section aria-labelledby="joho1-next" className="mt-12">
        <h2 id="joho1-next" className="text-lg font-bold tracking-tight">
          書き方から確認する
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          この言語にはまとまった仕様書がありません。ここで扱うのは
          試作問題と令和 7・8 年度の本試験・追試験で実際に使われた記法だけです。
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {joho1Lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={`/joho1/lessons/${lesson.slug}`}
                className="group block border border-[var(--border)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
              >
                <div className="font-bold group-hover:underline underline-offset-4">
                  {lesson.shortTitle}
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {lesson.cardSummary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          「情報Iの擬似言語＝DNCL」という説明を見かけたら、
          <Link href="/joho1/dncl" className="underline underline-offset-4">
            DNCL との違い
          </Link>
          を先に読んでください。別の試験で使われる別の言語です。
        </p>
      </section>

      <section aria-labelledby="joho1-more" className="mt-12">
        <h2 id="joho1-more" className="text-lg font-bold tracking-tight">
          読めるようになったら
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <li>
            <Link
              href="/joho1/quiz"
              className="group block border border-[var(--border)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
            >
              <div className="font-bold group-hover:underline underline-offset-4">
                練習問題 {joho1Quizzes.length} 問
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                コードを追って出力を答える 4 択。答え合わせのあと、そのままここで動かせます
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/joho1/transpile"
              className="group block border border-[var(--border)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
            >
              <div className="font-bold group-hover:underline underline-offset-4">
                Python と読み比べる
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                授業で書いた Python と、試験に出るプログラム表記を横に並べて対応を見ます
              </p>
            </Link>
          </li>
        </ul>
      </section>

      <AffiliateBooks
        topicSlug="joho1-playground"
        domain="joho1"
        heading="紙の問題集と組み合わせる（おすすめ書籍）"
      />
      </div>
      <Joho1Sidebar topicSlug="joho1-playground" from="xl" />
      </div>
      </Container>
    </>
  );
}
