import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { HubHomeJsonLd } from "@/components/seo/JsonLd";
import { HubTopicNav } from "@/components/layout/HubTopicNav";
import { site } from "@/lib/site";
import { sections } from "@/content/sections";

export const metadata: Metadata = {
  title: { absolute: site.fullName },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.fullName,
    description: site.description,
    url: "/",
  },
};

export default function Home() {
  return (
    <>
      <HubHomeJsonLd />
      {/* lg+: 左サイドバーに両セクションのトピック一覧を常時表示。mobile は非表示 (Header 内のドロワーで代替想定) */}
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block border-r border-[var(--border)]">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
            <HubTopicNav />
          </div>
        </aside>
        <div className="min-w-0">
          <Hero />
          <ThreePillars />
          <MentorSection />
          <WhyThisSite />
        </div>
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              たいてっく
            </div>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              RDBの原理と設計を、動く図解と厳密な定義で。
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed">
              教科書で挫折しがちな概念を、実際に触れる図解と辞書的な厳密な定義で解説します。
              新人エンジニアの独学から、IPAデータベーススペシャリスト対策まで、必要な深さで読める3本柱の学習サイト。
              <Link
                href="/why-need-rdb"
                className="underline underline-offset-4 hover:text-[var(--foreground)]"
              >
                「もしもこの世界にRDBがなかったら」
              </Link>
              では Excel をバックエンドにしたシートの 7 つのおかしな箇所から RDB の根本価値を、
              <Link
                href="/data-modeling/er-diagram"
                className="underline underline-offset-4 hover:text-[var(--foreground)]"
              >
                「変なER図」
              </Link>
              では EC サイトのデータを使って間違った ER 図を直しながら読み解く力を身につけられます。
            </p>
          </div>
          <HeroVisual />
        </div>

        {/* CTA row: Hero 2 カラム grid の外に出して full width を使う (4 ボタンが narrow な text col で改行するのを回避) */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={sections["why-need-rdb"].path}
            className="inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-5 py-3 text-sm font-bold hover:bg-[#262626]"
          >
            もしRDBがなかったら →
          </Link>
          <Link
            href={sections["rdb-index"].path}
            className="inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-5 py-3 text-sm font-bold hover:bg-[#262626]"
          >
            RDBインデックスから見る →
          </Link>
          <Link
            href={sections["data-modeling"].path}
            className="inline-flex items-center gap-2 border border-[var(--foreground)] px-5 py-3 text-sm font-bold hover:bg-[var(--muted)]"
          >
            データモデリングから見る →
          </Link>
          <Link
            href="/data-modeling/er-diagram"
            className="inline-flex items-center gap-2 bg-[#c53030] text-white px-5 py-3 text-sm font-bold hover:bg-[#a52a2a]"
          >
            「変なER図」に挑戦 →
          </Link>
        </div>
      </Container>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative aspect-[4/3] w-full max-w-md justify-self-end">
      <svg viewBox="0 0 480 300" className="w-full h-full" role="img" aria-label="3本柱">
        <rect x="0" y="0" width="480" height="300" fill="#f2f2f0" />
        <g transform="translate(40, 40)" fontFamily="monospace">
          {/* WHY column */}
          <rect x="0" y="0" width="120" height="180" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="60" y="30" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="3" fill="#6b6b68">WHY</text>
          <line x1="14" y1="52" x2="106" y2="52" stroke="#d9d9d5" strokeWidth="1" />
          <text x="14" y="76" fontSize="11" fontWeight="700" fill="#0a0a0a">Atomicity</text>
          <text x="14" y="98" fontSize="11" fontWeight="700" fill="#0a0a0a">Concurrency</text>
          <text x="14" y="120" fontSize="11" fontWeight="700" fill="#0a0a0a">Uniqueness</text>
          <text x="14" y="142" fontSize="11" fontWeight="700" fill="#0a0a0a">FK / RI</text>
          <text x="14" y="164" fontSize="11" fontWeight="700" fill="#0a0a0a">Durability</text>

          {/* INDEX column */}
          <rect x="140" y="0" width="120" height="180" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="200" y="30" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="3" fill="#6b6b68">INDEX</text>
          <line x1="154" y1="52" x2="246" y2="52" stroke="#d9d9d5" strokeWidth="1" />
          <text x="154" y="76" fontSize="12" fontWeight="700" fill="#0a0a0a">B-tree</text>
          <text x="154" y="98" fontSize="12" fontWeight="700" fill="#0a0a0a">Hash</text>
          <text x="154" y="120" fontSize="12" fontWeight="700" fill="#0a0a0a">Clustered</text>
          <text x="154" y="142" fontSize="12" fontWeight="700" fill="#0a0a0a">Composite</text>
          <text x="154" y="164" fontSize="12" fontWeight="700" fill="#0a0a0a">Covering</text>

          {/* MODELING column */}
          <rect x="280" y="0" width="120" height="180" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="340" y="30" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="3" fill="#6b6b68">MODELING</text>
          <line x1="294" y1="52" x2="386" y2="52" stroke="#d9d9d5" strokeWidth="1" />
          <text x="294" y="76" fontSize="12" fontWeight="700" fill="#0a0a0a">FD</text>
          <text x="294" y="98" fontSize="12" fontWeight="700" fill="#0a0a0a">Keys</text>
          <text x="294" y="120" fontSize="12" fontWeight="700" fill="#0a0a0a">1NF</text>
          <text x="294" y="142" fontSize="12" fontWeight="700" fill="#0a0a0a">2NF</text>
          <text x="294" y="164" fontSize="12" fontWeight="700" fill="#0a0a0a">3NF</text>
        </g>
        <text x="240" y="250" textAnchor="middle" fontSize="11" fill="#6b6b68" fontFamily="monospace" letterSpacing="2">
          TAITECH · 3 SERIES
        </text>
      </svg>
    </div>
  );
}

function ThreePillars() {
  const pillars = [
    {
      key: "why-need-rdb" as const,
      seriesNumber: "SERIES 01",
      href: sections["why-need-rdb"].path,
      title: sections["why-need-rdb"].label,
      lead: "Excel をバックエンドに繋いだら何が起きるか。受注シートに仕込まれた 7 つのおかしな箇所から、RDB が黙って守ってくれている 5 つの根本価値を学ぶ。",
      bullets: [
        "注文が入ったのに在庫が減らない原因は？(原子性)",
        "同じ顧客名が 4 行できる原因は？(一意性)",
        "停電で全部消える原因は？(永続性)",
      ],
      links: [
        { href: "/why-need-rdb", label: "壊れた Excel を見る" },
        { href: "/why-need-rdb/atomicity", label: "注文だけが残った夜" },
      ],
    },
    {
      key: "rdb-index" as const,
      seriesNumber: "SERIES 02",
      href: sections["rdb-index"].path,
      title: sections["rdb-index"].label,
      lead: "B-treeやハッシュ、複合インデックスの動きを、値を変えられる図解で辿る。",
      bullets: [
        "B-tree の探索を可視化",
        "複合インデックスのカラム順",
        "EXPLAIN の読み方 / 統計情報",
      ],
      links: [
        { href: "/rdb-index/basics/why-index", label: "なぜインデックスが必要か" },
        { href: "/rdb-index/btree", label: "B-tree インデックス" },
      ],
    },
    {
      key: "data-modeling" as const,
      seriesNumber: "SERIES 03",
      href: sections["data-modeling"].path,
      title: sections["data-modeling"].label,
      lead: "「変なER図」の間違い探しから ER 図の基本、そのまま正規化の 3 ステップへ。",
      bullets: [
        "「変なER図」で 9 つの違和感を数える",
        "エンティティ・関連・カーディナリティを図解",
        "関数従属と 1NF〜3NF の手続き",
      ],
      links: [
        { href: "/data-modeling/er-diagram", label: "変なER図" },
        { href: "/data-modeling/normalization/why", label: "なぜ正規化が必要か" },
      ],
    },
  ];

  return (
    <section id="pillars" className="scroll-mt-16 border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-20">
        <h2 className="mb-10 text-2xl md:text-3xl font-bold tracking-tight">
          3本の柱
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <article
              key={p.key}
              className="border border-[var(--border)] p-6 md:p-8 flex flex-col"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {p.seriesNumber}
              </div>
              <h3 className="mt-2 text-xl md:text-2xl font-bold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
                {p.lead}
              </p>
              <ul className="mt-5 space-y-1.5 text-sm">
                {p.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-[var(--muted-foreground)]">—</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex-1" />
              <Link
                href={p.href}
                className="mt-6 inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#262626] self-start"
              >
                このシリーズを見る →
              </Link>
              <ul className="mt-5 space-y-1 text-sm text-[var(--muted-foreground)]">
                {p.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="hover:text-[var(--foreground)] hover:underline underline-offset-4"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function WhyThisSite() {
  const features = [
    {
      title: "定義から入る",
      body: "各トピックの冒頭に、辞書レベルの厳密な定義を1文で置いています。曖昧な理解ではなく、そのまま引用できる定義から入ります。",
    },
    {
      title: "動く図解 / 静的な図解",
      body: "インデックス側はインタラクティブに値を変えて確かめられ、正規化側は Before/After と関数従属図で構造を追えます。",
    },
    {
      title: "実務判断まで踏み込む",
      body: "何を選ぶか、いつ崩すか。教科書の先にある「現場で決める」ための材料まで扱います。個別指導への導線もあります。",
    },
  ];
  return (
    <section className="border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          このサイトの特徴
        </h2>
        <div className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-3 md:divide-x md:divide-[var(--border)]">
          {features.map((f, i) => (
            <div key={i} className="md:px-8 first:md:pl-0 last:md:pr-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                特徴 {String(i + 1).padStart(2, "0")}
              </div>
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
