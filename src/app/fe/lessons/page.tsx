import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { sections } from "@/content/sections";
import { site } from "@/lib/site";
import { feLessons } from "@/content/fe/lessons";

const PAGE_TITLE =
  "基本情報 擬似言語 構文別レッスン一覧｜taitech.dev";
const PAGE_DESCRIPTION =
  "基本情報技術者試験 (FE) 科目 B の擬似言語を、変数・条件分岐・while・for・配列・関数の 6 つの構文別に、ブラウザで実行して確かめながら学べる無料の解説シリーズ。";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/fe/lessons" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/fe/lessons",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const sectionMeta = sections.fe;

export default function FeLessonsIndexPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "基本情報 擬似言語 構文別レッスン",
    url: `${site.url}/fe/lessons`,
    description: PAGE_DESCRIPTION,
    inLanguage: "ja-JP",
    isPartOf: {
      "@type": "CollectionPage",
      name: sectionMeta.label,
      url: `${site.url}${sectionMeta.path}`,
    },
    hasPart: feLessons.map((l) => ({
      "@type": "LearningResource",
      headline: l.title,
      url: `${site.url}/fe/lessons/${l.slug}`,
      abstract: l.definition,
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: sectionMeta.shortLabel,
        item: `${site.url}${sectionMeta.path}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "構文別レッスン",
        item: `${site.url}/fe/lessons`,
      },
    ],
  };

  return (
    <div className="py-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Container size="wide">
        <Breadcrumb
          className="mb-6"
          items={[
            { href: "/", label: "ホーム" },
            { href: sectionMeta.path, label: "擬似言語 実行シミュレーター" },
            { label: "構文別レッスン" },
          ]}
        />

        <header className="mb-8 max-w-3xl">
          <Eyebrow>基本情報技術者試験 (FE) 科目 B — 擬似言語</Eyebrow>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
            構文別レッスン一覧
          </h1>
          <p
            className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed"
            style={{ textWrap: "pretty" }}
          >
            変数・条件分岐・繰り返し・配列・関数の 6 つの構文を、埋め込みエディタで実際に動かしながら順番に学べます。
            各レッスンは 1 本 5〜10 分で読み切れる分量です。
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2 max-w-3xl">
          {feLessons.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/fe/lessons/${l.slug}`}
                className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40 transition-colors"
              >
                <div className="text-xs text-[var(--muted-foreground)]">
                  レッスン {l.order}
                </div>
                <div className="mt-1 font-semibold">{l.shortTitle}</div>
                <p
                  className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed"
                  style={{ textWrap: "pretty" }}
                >
                  {l.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p
          className="mt-10 max-w-3xl text-sm text-[var(--muted-foreground)]"
          style={{ textWrap: "pretty" }}
        >
          読み終えたら
          <Link
            href="/fe/quiz"
            className="underline underline-offset-4 hover:opacity-80"
          >
            練習問題
          </Link>
          で出力を当てられるか試してみてください。
          エディタで自由にコードを書いて試したい場合は、
          <Link
            href={sectionMeta.path}
            className="underline underline-offset-4 hover:opacity-80"
          >
            実行シミュレーター
          </Link>
          へ。Python / TypeScript に並べて比較したい場合は
          <Link
            href="/fe/transpile"
            className="underline underline-offset-4 hover:opacity-80"
          >
            多言語横並び比較ツール
          </Link>
          へ進んでください。
        </p>
      </Container>
    </div>
  );
}
