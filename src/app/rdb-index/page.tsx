import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { LevelBadge } from "@/components/ui/Badge";
import { SectionHubJsonLd } from "@/components/seo/JsonLd";
import { rdbTopicsBy, type RdbTopic } from "@/content/topics";
import { sections } from "@/content/sections";

const sectionMeta = sections["rdb-index"];

const metaTitle = sectionMeta.metaTitle ?? sectionMeta.label;
const metaDescription = sectionMeta.metaDescription ?? sectionMeta.description;

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: { canonical: sectionMeta.path },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: sectionMeta.path,
  },
};

export default function RdbIndexHome() {
  return (
    <>
      <SectionHubJsonLd section="rdb-index" />
      <Hero />
      <TopicIndex />
      <MentorSection />
      <WhyThisSite />
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
              RDBインデックスの仕組みを、動く図解で理解する。
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed">
              B-tree、ハッシュ、クラスタ化、複合──
              教科書で挫折しがちなインデックスの動きを、実際に触れる図解で直感的に理解できます。
              新人エンジニアからIPAデータベーススペシャリスト対策まで。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rdb-index/basics/why-index"
                className="inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-6 py-3 text-sm font-bold hover:bg-[#262626]"
              >
                最初から学ぶ →
              </Link>
              <Link
                href="/rdb-index/btree"
                className="inline-flex items-center gap-2 border border-[var(--foreground)] px-6 py-3 text-sm font-bold hover:bg-[var(--muted)]"
              >
                B-treeを見てみる
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
      <svg viewBox="0 0 400 300" className="w-full h-full">
        <rect x="0" y="0" width="400" height="300" fill="#f2f2f0" />
        <g transform="translate(60, 30)">
          <rect x="100" y="0" width="80" height="34" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="140" y="22" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="700" fill="#0a0a0a">30</text>

          <line x1="120" y1="34" x2="60" y2="72" stroke="#0a0a0a" strokeWidth="1.5" />
          <line x1="160" y1="34" x2="220" y2="72" stroke="#a3a39f" strokeWidth="1" />

          <rect x="20" y="72" width="80" height="34" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="60" y="94" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="700" fill="#0a0a0a">10 · 20</text>

          <rect x="180" y="72" width="80" height="34" fill="#ffffff" stroke="#a3a39f" strokeWidth="1" />
          <text x="220" y="94" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="400" fill="#6b6b68">40 · 50</text>

          <line x1="40" y1="106" x2="0" y2="144" stroke="#0a0a0a" strokeWidth="1.5" />
          <line x1="80" y1="106" x2="90" y2="144" stroke="#a3a39f" strokeWidth="1" />
          <line x1="200" y1="106" x2="150" y2="144" stroke="#a3a39f" strokeWidth="1" />
          <line x1="240" y1="106" x2="240" y2="144" stroke="#a3a39f" strokeWidth="1" />

          <rect x="-30" y="144" width="60" height="30" fill="#0a0a0a" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="0" y="164" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="700" fill="#ffffff">5·8</text>

          <rect x="60" y="144" width="60" height="30" fill="#ffffff" stroke="#a3a39f" />
          <text x="90" y="164" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="400" fill="#6b6b68">12·17</text>

          <rect x="120" y="144" width="60" height="30" fill="#ffffff" stroke="#a3a39f" />
          <text x="150" y="164" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="400" fill="#6b6b68">22·27</text>

          <rect x="210" y="144" width="60" height="30" fill="#ffffff" stroke="#a3a39f" />
          <text x="240" y="164" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="400" fill="#6b6b68">45</text>
        </g>
        <text x="200" y="245" textAnchor="middle" fontSize="12" fill="#6b6b68" fontFamily="monospace">
          find(8): 30 → 10 → [5, 8]
        </text>
      </svg>
    </div>
  );
}

function TopicIndex() {
  const prereq = rdbTopicsBy("prereq");
  const idx = rdbTopicsBy("index-type");
  const rel = rdbTopicsBy("related");
  return (
    <section id="topics" className="scroll-mt-16 border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-20">
        <h2 className="mb-10 text-2xl md:text-3xl font-bold tracking-tight">
          トピック一覧
        </h2>

        <TopicGroup title="前提知識" items={prereq} />
        <TopicGroup title="インデックスの種類" items={idx} />
        <TopicGroup title="関連トピック" items={rel} />
      </Container>
    </section>
  );
}

function TopicGroup({
  title,
  items,
}: {
  title: string;
  items: RdbTopic[];
}) {
  return (
    <div className="mt-12 first:mt-0">
      <div className="border-b border-[var(--foreground)] pb-2 mb-0 text-xs font-bold uppercase tracking-wider">
        {title}
      </div>
      <ul className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
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

function WhyThisSite() {
  const features = [
    {
      title: "手を動かして理解",
      body: "静的な図ではなく、値を変えたり探索を再生したりできる。数字の裏で何が起きているかが体感できます。",
    },
    {
      title: "抽象化された本質",
      body: "特定のRDBMSに依存せず、B-tree・ハッシュ・クラスタ化などの本質的な仕組みに集中します。",
    },
    {
      title: "レベル別の学習経路",
      body: "実務で必要な基礎から、IPAデータベーススペシャリスト級の発展まで、必要なところだけ学べます。",
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

function MentorSection() {
  return (
    <Container size="wide" className="pt-4 pb-16">
      <MentorCTA />
    </Container>
  );
}
