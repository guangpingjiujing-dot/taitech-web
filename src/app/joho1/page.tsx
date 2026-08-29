import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArticleMeta } from "@/components/layout/ArticleMeta";
import { Joho1Playground } from "@/components/joho1/Joho1Playground";
import { Joho1Sidebar } from "@/components/joho1/Joho1Sidebar";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FAQ } from "@/components/layout/FAQ";
import { joho1Lessons } from "@/content/joho1/lessons";
import { joho1Quizzes } from "@/content/joho1/quiz";
import { sections } from "@/content/sections";
import { Joho1PageJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";

const sectionMeta = sections.joho1;

/*
 * 読者は高校生で、**このサイトで最も「わかりやすさ」を求めて検索してくる層**。
 * 制度や仕様の質問より先に「プログラミングやったことないけど解けるのか」という
 * 不安に答える。AEO / LLMO でも、この形の質問に正面から答えた FAQPage が引用される。
 */
const FAQ_ITEMS = [
  {
    q: "プログラミングをやったことがなくても、情報I のプログラム問題は解けるようになりますか？",
    a: "なります。共通テストのプログラム問題で問われるのは、コードを書く力ではなく「書かれたプログラムを正しく追う力」です。必要なのは変数・条件分岐・繰り返し・配列の 4 つだけで、覚える文法もこの範囲に限られます。ここのシミュレーターは、その 4 つが実際にどう動くかを 1 行ずつ目で見て確かめるためのものです。",
  },
  {
    q: "「プログラム表記」とは何ですか。Python や JavaScript とは違うのですか？",
    a: "違います。共通テスト「情報I」のために定義された、試験専用の書き方です。実在の言語ではないので、Python や JavaScript を勉強しても記法はそのまま当てはまりません。逆に言えば覚える量はとても少なく、試作問題と本試験で使われた記法を押さえれば足ります。",
  },
  {
    q: "何から手を付けるとわかりやすいですか？",
    a: "まず手元の問題冊子のプログラムをそのまま貼り付けて、1 行ずつ実行してみてください。行番号や罫線は自動で取り除かれます。値の動きが追えなかった箇所が分かったら、その構文のレッスン（変数・表示・条件分岐・繰り返し・配列・関数）を読むのが最短です。最初から順に読む必要はありません。",
  },
  {
    q: "配列の添字は 0 始まりですか、1 始まりですか？",
    a: "問題によって違います。共通テストでは配列の添字の始まりが問題文で明示されるので、そこに従ってください。このシミュレーターは 0 始まりと 1 始まりを切り替えられるようにしてあります。ここを取り違えると答えが 1 つずれるので、実際に両方で動かして違いを見ておくと確実です。",
  },
  {
    q: "情報I のプログラム表記は DNCL と同じものですか？",
    a: "別物です。DNCL は大学入試センター「情報関係基礎」で使われてきた表記で、情報I のものとは代入の記号やブロックの閉じ方が違います。詳しくは用語ページにまとめています。参考書を選ぶときに混同しやすいので注意してください。",
  },
];

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
      <FaqJsonLd
        items={FAQ_ITEMS}
        aboutName="共通テスト「情報I」のプログラム表記"
        path={sectionMeta.path}
      />
      <Container size="wide" className="py-10 md:py-14">
      <div className="grid gap-8 xl:gap-10 xl:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0">
      <Eyebrow>大学入学共通テスト「情報I」</Eyebrow>
      <h1 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight">
        プログラム表記 実行シミュレーター
      </h1>

      <ArticleMeta path="/joho1" className="mt-3" />
      <p className="mt-4 max-w-2xl text-[var(--muted-foreground)] leading-relaxed">
        共通テスト「情報I」のプログラムを、ブラウザで 1 行ずつ動かせます。
        変数の値がどう変わるかを見ながら読むと、繰り返しと条件分岐の追い方が身につきます。
        プログラミング未経験でも、動きを目で追えばわかりやすく読み解けます。
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

      <div className="max-w-2xl">
        <FAQ items={FAQ_ITEMS} />
      </div>

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
