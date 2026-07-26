import { site } from "@/lib/site";
import {
  findTopic,
  topicsInSection,
  dataModelingTopicsIn,
} from "@/content/topics";
import {
  sections,
  dataModelingCategories,
  type SectionKey,
  type DataModelingCategoryKey,
} from "@/content/sections";

export function AuthorJsonLd({
  faq,
  knowsAbout,
}: {
  faq?: { q: string; a: string }[];
  knowsAbout?: string[];
}) {
  const url = `${site.url}/about`;
  const person = {
    "@type": "Person",
    name: site.author.name,
    alternateName: site.author.handle,
    jobTitle: site.author.role,
    description: site.author.bio,
    knowsAbout: knowsAbout ?? [
      "SQL",
      "リレーショナルデータベース",
      "データベース設計",
      "パフォーマンスチューニング",
      "AWS",
      "GCP",
      "Azure",
      "dbt",
      "データパイプライン",
      "データ分析基盤",
      "LLM",
      "AIエージェント",
      "RAG",
      "IPAデータベーススペシャリスト",
      "AWS認定",
    ],
    sameAs: [site.author.mentorUrl],
  };
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      inLanguage: "ja-JP",
      url,
      mainEntity: person,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: site.url },
        { "@type": "ListItem", position: 2, name: "著者について", item: url },
      ],
    },
  ];
  if (faq && faq.length > 0) {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
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

export function SiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: "ja-JP",
    author: {
      "@type": "Person",
      name: site.author.name,
      description: site.author.bio,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function HubHomeJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: site.name,
    url: `${site.url}/`,
    description: site.description,
    inLanguage: "ja-JP",
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (["rdb-index", "data-modeling"] as const).map((key, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CollectionPage",
          name: sections[key].label,
          url: `${site.url}${sections[key].path}`,
          description: sections[key].description,
        },
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SectionHubJsonLd({ section }: { section: SectionKey }) {
  const sectionMeta = sections[section];
  const items = topicsInSection(section);
  const author = {
    "@type": "Person",
    name: site.author.name,
    url: `${site.url}/about`,
  };
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: sectionMeta.label,
      url: `${site.url}${sectionMeta.path}`,
      description: sectionMeta.description,
      inLanguage: "ja-JP",
      isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      hasPart: items.map((t) => ({
        "@type": "TechArticle",
        headline: t.title,
        url: `${site.url}${t.path}`,
        abstract: t.definition,
        image: `${site.url}${t.path}/opengraph-image`,
        author,
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

export function CategoryHubJsonLd({
  category,
  faq,
}: {
  category: DataModelingCategoryKey;
  faq?: { q: string; a: string }[];
}) {
  const sectionMeta = sections["data-modeling"];
  const categoryMeta = dataModelingCategories[category];
  const items = dataModelingTopicsIn(category);
  const author = {
    "@type": "Person",
    name: site.author.name,
    url: `${site.url}/about`,
  };
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: categoryMeta.label,
      url: `${site.url}${categoryMeta.path}`,
      description: categoryMeta.description,
      inLanguage: "ja-JP",
      isPartOf: {
        "@type": "CollectionPage",
        name: sectionMeta.label,
        url: `${site.url}${sectionMeta.path}`,
      },
      hasPart: items.map((t) => ({
        "@type": "TechArticle",
        headline: t.title,
        url: `${site.url}${t.path}`,
        abstract: t.definition,
        image: `${site.url}${t.path}/opengraph-image`,
        author,
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
          name: categoryMeta.label,
          item: `${site.url}${categoryMeta.path}`,
        },
      ],
    },
  ];
  if (faq && faq.length > 0) {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
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

function buildBreadcrumb(topic: NonNullable<ReturnType<typeof findTopic>>) {
  const items: { name: string; item: string }[] = [
    { name: "ホーム", item: site.url },
  ];
  const sectionMeta = sections[topic.section];
  items.push({
    name: sectionMeta.shortLabel,
    item: `${site.url}${sectionMeta.path}`,
  });
  if (topic.section === "data-modeling") {
    const category = dataModelingCategories[topic.category];
    items.push({
      name: category.label,
      item: `${site.url}${category.path}`,
    });
  }
  items.push({
    name: topic.shortTitle,
    item: `${site.url}${topic.path}`,
  });
  return items.map((entry, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: entry.name,
    item: entry.item,
  }));
}

export function TopicJsonLd({
  section,
  slug,
  faq,
}: {
  section: SectionKey;
  slug: string;
  faq?: { q: string; a: string }[];
}) {
  const topic = findTopic(section, slug);
  if (!topic) return null;
  const ogImageUrl = `${site.url}${topic.path}/opengraph-image`;
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: topic.title,
      description: topic.summary,
      inLanguage: "ja-JP",
      image: ogImageUrl,
      author: {
        "@type": "Person",
        name: site.author.name,
        url: `${site.url}/about`,
      },
      publisher: { "@type": "Organization", name: site.name },
      mainEntityOfPage: `${site.url}${topic.path}`,
      keywords: topic.keywords.join(", "),
      abstract: topic.definition,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-speakable='definition']"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: buildBreadcrumb(topic),
    },
  ];
  if (faq && faq.length > 0) {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    });
  }
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
