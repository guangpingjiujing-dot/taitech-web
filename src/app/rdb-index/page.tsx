import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { LevelBadge } from "@/components/ui/Badge";
import { SectionHubJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
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

/*
 * **このセクションの読者は未経験者ではなく実務エンジニア**なので、他セクションのような
 * 「未経験でも大丈夫」型の FAQ は置かない（読者とミスマッチで権威性を落とす）。
 * ここで効くのは「どれから読むか」「どこまでが実務で要るか」という順序と範囲の質問。
 */
const FAQ_ITEMS = [
  {
    q: "インデックスはどれから読むとわかりやすいですか？",
    a: "「なぜインデックスが必要か」から順に読んでください。フルスキャンがなぜ遅いのかを I/O の単位で押さえないと、B-tree の説明が「木の絵の暗記」になります。そのあと B-tree、クラスタ化、複合の 3 本を読めば、実務で貼るインデックスの判断はほぼ付きます。ハッシュ・部分・カバリングは必要になったときで構いません。",
  },
  {
    q: "実務で最低限おさえるべきインデックスはどれですか？",
    a: "B-tree と複合インデックスの 2 つです。実際に業務で作るインデックスのほとんどは B-tree で、遅いクエリの原因の多くは「複合インデックスの列順が検索条件と合っていない」ことに帰着します。次に実行計画 (EXPLAIN) の読み方、その次に更新コスト（貼りすぎのデメリット）の順で広げるのが効率的です。",
  },
  {
    q: "特定のデータベース製品の話ですか？",
    a: "いいえ。B-tree・ハッシュ・クラスタ化といった仕組みそのものを扱うので、MySQL・PostgreSQL・Oracle のどれを使っていても通用します。製品ごとに挙動が分かれる箇所（クラスタ化インデックスの有無、ハッシュインデックスの制約など）は、その都度どの製品の話かを明記しています。",
  },
  {
    q: "データベーススペシャリスト試験の対策になりますか？",
    a: "なります。実行計画・統計情報とオプティマイザ・カバリングインデックス・部分インデックスは、午後問題で問われる範囲です。ただし本セクションは試験の解法ではなく仕組みの理解を目的にしているので、過去問演習と併用してください。",
  },
];

export default function RdbIndexHome() {
  return (
    <>
      <SectionHubJsonLd section="rdb-index" />
      <FaqJsonLd
        items={FAQ_ITEMS}
        aboutName="RDB のインデックス"
        path={sectionMeta.path}
      />
      <Hero />
      <TopicIndex />
      <MentorSection />
      <WhyThisSite />
      <FaqSection />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-[var(--border)]">
      <Container size="wide" className="py-16 md:py-24">
        {/* grid-cols-1 を省くと 1024px 未満で暗黙カラムになり、
            トラックが max-content まで伸びて h1 の CJK が画面を突き破る */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="min-w-0">
            {/* keep-all で「RDBインデックスの仕組みを」が 1 つの分割不能な塊になる */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight [overflow-wrap:anywhere]">
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

        <div className="mt-12 border-l-2 border-[var(--foreground)] pl-5">
          <p className="text-[15px] leading-relaxed">
            <strong>貼ったインデックスが実際に使われているか</strong>は、実行計画を読むと分かります。
            読み方は<Link href="/query-plan" className="underline underline-offset-4">
              実行計画（EXPLAIN）の読み方
            </Link>
            にまとめてあります。2.16 秒かかる本物の計画を題材に、
            遅い原因のノードを指せるところまで扱っています。
          </p>
        </div>
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

function FaqSection() {
  return (
    <Container size="wide" className="pb-16">
      <div className="max-w-3xl">
        <FAQ items={FAQ_ITEMS} />
      </div>
    </Container>
  );
}

function MentorSection() {
  return (
    <Container size="wide" className="pt-4 pb-16">
      <MentorCTA />
    </Container>
  );
}
