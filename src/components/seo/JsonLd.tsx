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

// ビルド時 (SSG) に確定するタイムスタンプ。デプロイ = このページを一度に生成し直したという事実の反映。
// LLM/AI エンジンが「新鮮度」を weight する用途 (Perplexity / Bing Chat / Copilot 等) を狙う。
const BUILD_DATE = new Date().toISOString();

const AUTHOR_PERSON = {
  "@type": "Person" as const,
  name: site.author.name,
  url: `${site.url}/about`,
};

const PUBLISHER_ORG = {
  "@type": "Organization" as const,
  name: site.name,
  url: site.url,
};

/**
 * FAQPage JSON-LD を「AEO / LLMO 対応」フル拡張版で組み立てる。
 * Google の SERP FAQ 表示は 2023-08 以降 一般 site で無効化されているが、
 * LLM / 音声アシスタント / Bing / DuckDuckGo は依然 FAQPage を読む。
 */
function buildFaqPage({
  items,
  aboutName,
  pageUrl,
}: {
  items: { q: string; a: string }[];
  aboutName: string;
  pageUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ja-JP",
    dateModified: BUILD_DATE,
    about: { "@type": "Thing", name: aboutName },
    mainEntityOfPage: pageUrl,
    author: AUTHOR_PERSON,
    publisher: PUBLISHER_ORG,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["[data-speakable='faq']"],
    },
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
        inLanguage: "ja-JP",
        author: AUTHOR_PERSON,
      },
    })),
  };
}

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
    data.push(
      buildFaqPage({
        items: faq,
        aboutName: site.author.name,
        pageUrl: url,
      }),
    );
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
      itemListElement: (Object.keys(sections) as SectionKey[]).map((key, i) => ({
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

export function SectionHubJsonLd({
  section,
  faq,
  flagshipDefinition,
}: {
  section: SectionKey;
  /** 旗艦セクションで FAQPage を出す場合に指定 */
  faq?: { q: string; a: string }[];
  /** 旗艦セクションで TechArticle (定義文) を追加する場合に指定 */
  flagshipDefinition?: string;
}) {
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
  if (flagshipDefinition) {
    data.push({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: sectionMeta.label,
      url: `${site.url}${sectionMeta.path}`,
      abstract: flagshipDefinition,
      description: sectionMeta.description,
      inLanguage: "ja-JP",
      image: `${site.url}${sectionMeta.path}/opengraph-image`,
      author,
      publisher: PUBLISHER_ORG,
      mainEntityOfPage: `${site.url}${sectionMeta.path}`,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-speakable='definition']"],
      },
    });
  }
  if (faq && faq.length > 0) {
    data.push(
      buildFaqPage({
        items: faq,
        aboutName: sectionMeta.label,
        pageUrl: `${site.url}${sectionMeta.path}`,
      }),
    );
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
    data.push(
      buildFaqPage({
        items: faq,
        aboutName: categoryMeta.label,
        pageUrl: `${site.url}${categoryMeta.path}`,
      }),
    );
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

/**
 * SoftwareApplication + WebPage + BreadcrumbList (+ optional FAQ) for
 * interactive Playground-style pages under /fe.
 */
export function FePlaygroundJsonLd({
  path,
  name,
  description,
  breadcrumb,
  faq,
}: {
  path: string;
  name: string;
  description: string;
  breadcrumb: { name: string; item: string }[];
  faq?: { q: string; a: string }[];
}) {
  const url = `${site.url}${path}`;
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any (Web browser)",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
      },
      author: AUTHOR_PERSON,
      publisher: PUBLISHER_ORG,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      author: AUTHOR_PERSON,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.item,
      })),
    },
  ];
  if (faq && faq.length > 0) {
    data.push(
      buildFaqPage({ items: faq, aboutName: name, pageUrl: url }),
    );
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

/**
 * LearningResource + WebPage + BreadcrumbList (+ optional FAQ) for
 * lesson pages under /fe/lessons/[slug].
 */
export function FeLessonJsonLd({
  path,
  name,
  description,
  keywords,
  breadcrumb,
  faq,
}: {
  path: string;
  name: string;
  description: string;
  keywords: string[];
  breadcrumb: { name: string; item: string }[];
  faq?: { q: string; a: string }[];
}) {
  const url = `${site.url}${path}`;
  const ogImageUrl = `${url}/opengraph-image`;
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      learningResourceType: "Lesson",
      educationalLevel: "初学者〜基本情報技術者試験受験者",
      educationalUse: "自習・試験対策",
      teaches: name,
      image: ogImageUrl,
      keywords: keywords.join(", "),
      author: AUTHOR_PERSON,
      publisher: PUBLISHER_ORG,
      isPartOf: {
        "@type": "CollectionPage",
        name: sections.fe.label,
        url: `${site.url}${sections.fe.path}`,
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-speakable='definition']"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      author: AUTHOR_PERSON,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.item,
      })),
    },
  ];
  if (faq && faq.length > 0) {
    data.push(
      buildFaqPage({ items: faq, aboutName: name, pageUrl: url }),
    );
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

/**
 * `/joho1/*` の JSON-LD。
 *
 * `FeLessonJsonLd` と分けているのは、`educationalLevel` の文言と
 * 所属セクションが違うため。共通化するなら props が増えて
 * どちらのセクションから読んでも意味が取りにくくなる。
 */
export function Joho1PageJsonLd({
  path,
  name,
  description,
  keywords,
  breadcrumb,
  learningResourceType = "Lesson",
}: {
  path: string;
  name: string;
  description: string;
  keywords: string[];
  breadcrumb: { name: string; item: string }[];
  learningResourceType?: string;
}) {
  const url = `${site.url}${path}`;
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      learningResourceType,
      educationalLevel: "高校生・大学入学共通テスト「情報I」受験者",
      educationalUse: "自習・試験対策",
      teaches: name,
      image: `${url}/opengraph-image`,
      keywords: keywords.join(", "),
      author: AUTHOR_PERSON,
      publisher: PUBLISHER_ORG,
      isPartOf: {
        "@type": "CollectionPage",
        name: sections.joho1.label,
        url: `${site.url}${sections.joho1.path}`,
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-speakable='definition']"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      author: AUTHOR_PERSON,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.item,
      })),
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

/**
 * 練習問題 1 問分の JSON-LD。schema.org の Quiz (Education Q&A) は
 * 「1 つの Question に acceptedAnswer + suggestedAnswer 群」という形を取る。
 * 解説は正解 Answer の comment に載せる。
 */
/**
 * 4 択練習問題 1 問分の Quiz / Question 構造化データ。
 * `/fe/quiz` と `/joho1/quiz` の両方から使うので、所属セクションと想定読者は引数で取る。
 */
export function QuizJsonLd({
  section = "fe",
  educationalLevel = "初学者〜基本情報技術者試験受験者",
  path,
  name,
  description,
  keywords,
  breadcrumb,
  question,
  choices,
  answer,
  explanation,
  educationalAlignment,
}: {
  section?: SectionKey;
  educationalLevel?: string;
  path: string;
  name: string;
  description: string;
  keywords: string[];
  breadcrumb: { name: string; item: string }[];
  question: string;
  choices: { id: string; text: string }[];
  answer: string;
  explanation: string;
  /** 関連する構文別レッスンの表示名 */
  educationalAlignment: string;
}) {
  const sectionMeta = sections[section];
  const url = `${site.url}${path}`;
  const accepted = choices.find((c) => c.id === answer);
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      educationalLevel,
      educationalUse: "自習・試験対策",
      learningResourceType: "Quiz",
      about: { "@type": "Thing", name: educationalAlignment },
      keywords: keywords.join(", "),
      author: AUTHOR_PERSON,
      publisher: PUBLISHER_ORG,
      dateModified: BUILD_DATE,
      isPartOf: {
        "@type": "CollectionPage",
        name: sectionMeta.label,
        url: `${site.url}${sectionMeta.path}`,
      },
      hasPart: [
        {
          "@type": "Question",
          eduQuestionType: "Multiple choice",
          name: question,
          text: question,
          answerCount: 1,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${answer} ${accepted?.text ?? ""}`.trim(),
            inLanguage: "ja-JP",
            comment: { "@type": "Comment", text: explanation },
            author: AUTHOR_PERSON,
          },
          suggestedAnswer: choices
            .filter((c) => c.id !== answer)
            .map((c) => ({
              "@type": "Answer",
              text: `${c.id} ${c.text}`,
              inLanguage: "ja-JP",
            })),
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url,
      inLanguage: "ja-JP",
      isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      author: AUTHOR_PERSON,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.item,
      })),
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
    data.push(
      buildFaqPage({
        items: faq,
        aboutName: topic.title,
        pageUrl: `${site.url}${topic.path}`,
      }),
    );
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
