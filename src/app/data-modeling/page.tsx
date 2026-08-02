import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LevelBadge } from "@/components/ui/Badge";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { SectionHubJsonLd } from "@/components/seo/JsonLd";
import { sections, dataModelingCategories } from "@/content/sections";
import { dataModelingTopicsIn, type DataModelingTopic } from "@/content/topics";

const sectionMeta = sections["data-modeling"];

export const metadata: Metadata = {
  title: sectionMeta.label,
  description: sectionMeta.description,
  alternates: { canonical: sectionMeta.path },
  openGraph: {
    title: sectionMeta.label,
    description: sectionMeta.description,
    url: sectionMeta.path,
  },
};

export default function DataModelingHome() {
  return (
    <>
      <SectionHubJsonLd section="data-modeling" />
      <Hero />
      <TopicIndex />
      <MentorSection />
      <WhyThisSection />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              ER 図と正規化を、身近な例と厳密な定義で。
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed">
              「変な ER 図」の間違い探しから ER 図の基本を体感し、そのまま正規化の 3 ステップへ。
              「所属 0 人の部署を認めるか」など身近な問いで概念を掴み、
              受注データを段階的に整えていく Before/After で正規化の手続きを実感できます。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/data-modeling/er-diagram"
                className="inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-6 py-3 text-sm font-bold hover:bg-[#262626]"
              >
                変な ER 図を見る →
              </Link>
              <Link
                href="/data-modeling/normalization/why"
                className="inline-flex items-center gap-2 border border-[var(--foreground)] px-6 py-3 text-sm font-bold hover:bg-[var(--muted)]"
              >
                正規化から学ぶ
              </Link>
            </div>
          </div>
          <HeroVisual />
        </div>
      </Container>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative aspect-[4/3] w-full max-w-md justify-self-end">
      <svg viewBox="0 0 400 300" className="w-full h-full" role="img" aria-label="関数従属の概念図">
        <rect x="0" y="0" width="400" height="300" fill="#f2f2f0" />

        <g fontFamily="monospace">
          <rect x="60" y="130" width="80" height="40" fill="#0a0a0a" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="100" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fafafa">社員ID</text>

          <rect x="180" y="130" width="80" height="40" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="220" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0a0a0a">部署ID</text>

          <rect x="300" y="130" width="80" height="40" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="340" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0a0a0a">部署名</text>

          <line x1="140" y1="150" x2="175" y2="150" stroke="#0a0a0a" strokeWidth="1.5" />
          <path d="M170 145 L178 150 L170 155" stroke="#0a0a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          <line x1="260" y1="150" x2="295" y2="150" stroke="#0a0a0a" strokeWidth="1.5" />
          <path d="M290 145 L298 150 L290 155" stroke="#0a0a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          <path d="M100 130 Q220 60 340 130" stroke="#6b6b68" strokeWidth="1.2" fill="none" strokeDasharray="4 3" />
          <path d="M335 128 L342 132 L338 135" stroke="#6b6b68" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="220" y="80" textAnchor="middle" fontSize="11" fill="#6b6b68">推移関数従属</text>

          <text x="200" y="220" textAnchor="middle" fontSize="11" fill="#6b6b68">
            社員ID → 部署ID → 部署名
          </text>
          <text x="200" y="240" textAnchor="middle" fontSize="10" fill="#a3a39f">
            3NF はこの経由 (推移) を排除する
          </text>
        </g>
      </svg>
    </div>
  );
}

function TopicIndex() {
  const categories = Object.values(dataModelingCategories);

  return (
    <section id="topics" className="scroll-mt-16 border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-20">
        <h2 className="mb-10 text-2xl md:text-3xl font-bold tracking-tight">
          カテゴリとトピック
        </h2>

        {categories.map((c) => {
          const items = dataModelingTopicsIn(c.key);
          const flagship =
            c.key === "er-diagram"
              ? {
                  path: c.path,
                  label: "変なER図",
                  sub: "9 つの違和感、全て指摘できますか？",
                }
              : undefined;
          return (
            <CategoryGroup
              key={c.key}
              label={c.label}
              hubPath={c.path}
              items={items}
              flagship={flagship}
            />
          );
        })}
      </Container>
    </section>
  );
}

function CategoryGroup({
  label,
  hubPath,
  items,
  flagship,
}: {
  label: string;
  hubPath: string;
  items: DataModelingTopic[];
  flagship?: { path: string; label: string; sub: string };
}) {
  return (
    <div className="mt-12 first:mt-0">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--foreground)] pb-2 mb-0">
        <span className="text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        <Link
          href={hubPath}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline underline-offset-4"
        >
          カテゴリトップ →
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-[var(--border)] border-b border-[var(--border)]">
        {flagship && (
          <li>
            <Link
              href={flagship.path}
              className="group flex items-start justify-between gap-4 py-5 px-2 -mx-2 bg-[var(--foreground)]/[0.03] hover:bg-[var(--foreground)]/[0.06] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold group-hover:underline underline-offset-4">
                  {flagship.label}
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {flagship.sub}
                </p>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">→</span>
            </Link>
          </li>
        )}
        {items.map((t) => (
          <li key={t.slug}>
            <Link
              href={t.path}
              className="group flex items-start justify-between gap-4 py-5 px-2 -mx-2 hover:bg-[var(--muted)]/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <div className="text-lg font-bold group-hover:underline underline-offset-4">
                    {t.shortTitle}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {t.title}
                  </div>
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
    </div>
  );
}

function MentorSection() {
  return (
    <Container size="wide" className="pt-4 pb-16">
      <MentorCTA />
    </Container>
  );
}

function WhyThisSection() {
  const features = [
    {
      title: "同じデータを段階的に",
      body: "1NF から 3NF まで、同じ受注データを 1 つずつ整えていきます。各ステップで「何が変わったか」がひと目で見えます。",
    },
    {
      title: "抽象と実データを両方",
      body: "関数従属の分析 (グループ箱) と実データ (色分けテーブル) を並べて示すので、理屈と手触りの両方から理解できます。",
    },
    {
      title: "練習問題つき",
      body: "各ページの最後に別データでの練習問題があります。答え合わせは折りたたみで隠しているので、自分で考えてから確認できます。",
    },
  ];
  return (
    <section className="border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          このセクションの特徴
        </h2>
        <div className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-3 md:divide-x md:divide-[var(--border)]">
          {features.map((f, i) => (
            <div key={i} className="md:px-8 first:md:pl-0 last:md:pr-0">
              <Eyebrow size="compact" as="div">特徴 {String(i + 1).padStart(2, "0")}</Eyebrow>
              <div className="mt-2 text-lg font-bold">{f.title}</div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
