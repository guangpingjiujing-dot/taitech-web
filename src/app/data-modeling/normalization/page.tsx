import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LevelBadge } from "@/components/ui/Badge";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { site } from "@/lib/site";
import { sections, dataModelingCategories } from "@/content/sections";
import { dataModelingTopicsIn } from "@/content/topics";

const category = dataModelingCategories.normalization;
const sectionMeta = sections["data-modeling"];

export const metadata: Metadata = {
  title: category.label,
  description: category.description,
  alternates: { canonical: category.path },
  openGraph: {
    title: `${category.label} | ${sectionMeta.label}`,
    description: category.description,
    url: category.path,
  },
};

const LEARNING_ORDER = [
  "why",
  "functional-dependency",
  "keys",
  "1nf",
  "2nf",
  "3nf",
  "denormalization",
] as const;

export default function NormalizationHub() {
  const topics = dataModelingTopicsIn("normalization");
  const ordered = LEARNING_ORDER.map(
    (slug) => topics.find((t) => t.slug === slug)!,
  );

  return (
    <>
      <NormalizationJsonLd />

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-12 md:py-16">
          <Breadcrumb
            items={[
              { href: "/", label: "ホーム" },
              { href: sectionMeta.path, label: sectionMeta.shortLabel },
              { label: category.label },
            ]}
          />
          <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {category.label}
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed">
            {category.description}
          </p>
        </Container>
      </section>

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-12 md:py-16">
          <h2 className="mb-8 text-xl md:text-2xl font-bold tracking-tight">
            推奨する学習順序
          </h2>
          <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {ordered.map((t, i) => (
              <li key={t.slug}>
                <Link
                  href={t.path}
                  className="group flex items-start justify-between gap-4 py-5 px-2 -mx-2 hover:bg-[var(--muted)]/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-[10px] font-bold text-[var(--muted-foreground)] font-mono">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg font-bold group-hover:underline underline-offset-4">
                        {t.shortTitle}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {t.title}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
                      {t.summary}
                    </p>
                  </div>
                  <LevelBadge level={t.level} />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container size="wide" className="pt-4 pb-16">
        <MentorCTA />
      </Container>
    </>
  );
}

function NormalizationJsonLd() {
  const topics = dataModelingTopicsIn("normalization");
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.label,
      url: `${site.url}${category.path}`,
      description: category.description,
      inLanguage: "ja-JP",
      isPartOf: {
        "@type": "CollectionPage",
        name: sectionMeta.label,
        url: `${site.url}${sectionMeta.path}`,
      },
      hasPart: topics.map((t) => ({
        "@type": "TechArticle",
        headline: t.title,
        url: `${site.url}${t.path}`,
        abstract: t.definition,
      })),
    },
    {
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
          name: category.label,
          item: `${site.url}${category.path}`,
        },
      ],
    },
  ];
  return (
    <>
      {data.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
