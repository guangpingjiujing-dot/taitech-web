import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { HubHomeJsonLd } from "@/components/seo/JsonLd";
import { HubTopicNav } from "@/components/layout/HubTopicNav";
import { site } from "@/lib/site";
import { sections } from "@/content/sections";
import { feQuizzes } from "@/content/fe/quiz";
import { joho1Lessons } from "@/content/joho1/lessons";

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
          <SeriesGroups />
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
            <Eyebrow size="compact" as="div">たいてっく</Eyebrow>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              データベースと擬似言語を、動かして理解する。
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed">
              教科書で挫折しがちな概念を、実際に触れる図解と辞書的な厳密な定義で解説します。
              RDB のインデックス・正規化・ER 図は
              <Link
                href="/data-modeling/er-diagram"
                className="underline underline-offset-4 hover:text-[var(--foreground)]"
              >
                「変なER図」
              </Link>
              の間違い探しのように、動かしながら読み解けます。
              試験の擬似言語は、書いたコードを 1 行ずつ実行して変数の変化を目で追えます。
            </p>
          </div>
          <HeroVisual />
        </div>

        {/*
          CTA はグループの入口 2 つ + 目玉 1 つの計 3 本に絞る。
          セクションの数だけボタンを並べると、増えるたびにモバイルで折り返して選べなくなる
          (docs/wip/20260807-joho1/00-overview.md §8-3)。
        */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={sections["why-need-rdb"].path}
            className="inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-5 py-3 text-sm font-bold hover:bg-[#262626]"
          >
            データベースを学ぶ →
          </Link>
          <Link
            href={sections.fe.path}
            className="inline-flex items-center gap-2 border border-[var(--foreground)] px-5 py-3 text-sm font-bold hover:bg-[var(--muted)]"
          >
            擬似言語を動かす →
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
    <div className="relative aspect-[8/5] w-full max-w-md justify-self-end">
      <svg viewBox="0 0 480 300" className="w-full h-full" role="img" aria-label="2 つの入口">
        <rect x="0" y="0" width="480" height="300" fill="#f2f2f0" />
        <g transform="translate(24, 36)" fontFamily="monospace">
          {/* データベース側 */}
          <rect x="0" y="0" width="200" height="196" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="100" y="28" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="2" fill="#6b6b68">DATABASE</text>
          <line x1="16" y1="44" x2="184" y2="44" stroke="#d9d9d5" strokeWidth="1" />
          <text x="16" y="70" fontSize="10" fontWeight="700" fill="#0a0a0a">B-tree / Hash</text>
          <text x="16" y="94" fontSize="10" fontWeight="700" fill="#0a0a0a">Clustered</text>
          <text x="16" y="118" fontSize="10" fontWeight="700" fill="#0a0a0a">1NF / 2NF / 3NF</text>
          <text x="16" y="142" fontSize="10" fontWeight="700" fill="#0a0a0a">ER / Cardinality</text>
          <text x="16" y="166" fontSize="10" fontWeight="700" fill="#0a0a0a">ACID</text>

          {/* 擬似言語側 */}
          <rect x="216" y="0" width="200" height="196" fill="#0a0a0a" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="316" y="28" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="2" fill="#a3a3a0">PSEUDO CODE</text>
          <line x1="232" y1="44" x2="400" y2="44" stroke="#3d3d3a" strokeWidth="1" />
          <text x="232" y="70" fontSize="10" fontWeight="700" fill="#ffffff">整数型: n ← 5</text>
          <text x="232" y="94" fontSize="10" fontWeight="700" fill="#ffffff">if / while / for</text>
          <text x="232" y="126" fontSize="10" fontWeight="700" fill="#ffffff">kingaku = 46</text>
          <text x="232" y="150" fontSize="10" fontWeight="700" fill="#ffffff">もし〜ならば：</text>
          <text x="232" y="174" fontSize="9" fontWeight="700" fill="#a3a3a0">1 行ずつ実行</text>
        </g>
      </svg>
    </div>
  );
}

/**
 * セクションを **2 つのグループ**に分けて並べる。
 *
 * フラットに N 枚並べない理由: 読者が実務者と受験者に分かれているので、
 * 同一平面に並べるとどちらにとってもノイズになる。
 * また「4本の柱」のように**数を見出しに焼き付けると**、セクションが増えるたびに
 * 文言の追随が必要になる (docs/wip/20260807-joho1/00-overview.md §8-2)。
 */
function SeriesGroups() {
  const groups: {
    key: string;
    heading: string;
    lead: string;
    cards: {
      key: string;
      href: string;
      title: string;
      lead: string;
      bullets: string[];
      links: { href: string; label: string }[];
    }[];
  }[] = [
    {
      key: "database",
      heading: "データベースを理解する",
      lead: "なぜ必要かという動機から、インデックスの仕組み、設計の手続きまで。",
      cards: [
        {
          key: "why-need-rdb",
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
          key: "rdb-index",
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
          key: "data-modeling",
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
      ],
    },
    {
      key: "pseudo-code",
      heading: "試験の擬似言語を動かす",
      lead: "読むだけでは追えないコードを、1 行ずつ実行して変数の変化で理解する。",
      cards: [
        {
          key: "fe",
          href: sections.fe.path,
          title: "基本情報 擬似言語 実行シミュレーター",
          lead: "科目 B の擬似言語をブラウザで書いて動かす。一行ずつ実行して変数の変化を追い、Python / TypeScript に変換して読み比べられる。",
          bullets: [
            "擬似言語を一行ずつ実行して変数を可視化",
            "構文別レッスン 6 本 (変数 / if / while / for / 配列 / 関数)",
            `オリジナル練習問題 ${feQuizzes.length} 問 (解説つき)`,
          ],
          links: [
            { href: "/fe/lessons", label: "構文別レッスン" },
            { href: "/fe/quiz", label: "練習問題を解く" },
          ],
        },
        {
          key: "joho1",
          href: sections.joho1.path,
          title: "共通テスト 情報I プログラム表記 実行シミュレーター",
          lead: "共通テスト「情報I」のプログラムを 1 行ずつ実行できる。問題冊子から貼り付けると行番号と罫線は自動で外れる。",
          bullets: [
            "試験と同じ行番号とブロック罫線で表示",
            "配列の添字は 0 始まり / 1 始まりを切り替え",
            `構文別レッスン ${joho1Lessons.length} 本`,
          ],
          links: [
            { href: "/joho1/lessons", label: "構文別レッスン" },
            { href: "/joho1/dncl", label: "DNCL との違い" },
          ],
        },
      ],
    },
  ];

  return (
    <section id="pillars" className="scroll-mt-16 border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-20">
        {groups.map((group, gi) => (
          <div key={group.key} className={gi > 0 ? "mt-16" : ""}>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {group.heading}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {group.lead}
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {group.cards.map((c) => (
                <article
                  key={c.key}
                  className="border border-[var(--border)] p-6 md:p-8 flex flex-col"
                >
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {c.lead}
                  </p>
                  <ul className="mt-5 space-y-1.5 text-sm">
                    {c.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="text-[var(--muted-foreground)]">—</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex-1" />
                  <Link
                    href={c.href}
                    className="mt-6 inline-flex items-center gap-2 bg-[var(--foreground)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#262626] self-start"
                  >
                    このシリーズを見る →
                  </Link>
                  <ul className="mt-5 space-y-1 text-sm text-[var(--muted-foreground)]">
                    {c.links.map((l) => (
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
          </div>
        ))}
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
      title: "動かして確かめられる",
      body: "インデックスは値を変えて挙動を確かめられ、擬似言語は書いたコードを 1 行ずつ実行して変数の変化を追えます。読むだけでは飛ばしてしまう部分が目に見えます。",
    },
    {
      title: "実務でも試験でも使える深さ",
      body: "現場で「何を選ぶか、いつ崩すか」を決める材料まで扱いつつ、基本情報技術者試験や共通テスト「情報I」の出題範囲もそのまま押さえられます。",
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
