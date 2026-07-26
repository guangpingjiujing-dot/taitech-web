import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LevelBadge } from "@/components/ui/Badge";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { FAQ } from "@/components/layout/FAQ";
import { SectionHubJsonLd } from "@/components/seo/JsonLd";
import { sections } from "@/content/sections";
import { whyNeedRdbTopics } from "@/content/topics";
import { BrokenExcelAnomalyList } from "@/components/viz/rdb-fundamentals/BrokenExcelAnomalyList";

const sectionMeta = sections["why-need-rdb"];

const PAGE_TITLE =
  "もしもこの世界にRDBがなかったら｜あなたには、この Excel の何が壊れているかわかりますか？";
const PAGE_DESCRIPTION =
  "Excel をバックエンドにしたある会社の 7 つの事故を題材に、原子性・同時実行制御・一意性・参照整合性・永続性など RDB が黙って守ってくれている 5 つの根本価値を体系的に理解する図解シリーズ。";

const FLAGSHIP_DEFINITION =
  "リレーショナルデータベース管理システム (RDBMS) とは、リレーショナルモデルに基づいてデータを表形式で管理し、トランザクションによる ACID 特性と一意性・参照整合性などの宣言的制約を通じて、複数ユーザー環境でのデータ整合性を構造的に保証するデータ管理システムである。";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: sectionMeta.path },
  openGraph: {
    title: PAGE_TITLE,
    description:
      "Excel をバックエンドにした 7 つの事故から RDB の根本価値を体系的に理解する。",
    url: sectionMeta.path,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description:
      "Excel をバックエンドにした 7 つの事故から RDB の根本価値を体系的に理解する。",
  },
};

const LEARNING_ORDER = [
  "atomicity",
  "concurrency",
  "uniqueness",
  "referential-integrity",
  "durability",
  "recap",
] as const;

const faq = [
  {
    q: "「もしもこの世界にRDBがなかったら」って結局何が言いたいのですか？",
    a: "Excel でバックエンドを組んだ時に発生する 7 つの具体的な事故を通じて、RDB が黙って守ってくれている 5 つの根本価値 (原子性 / 同時実行制御 / 一意性 / 参照整合性 / 永続性) を体感するシリーズです。",
  },
  {
    q: "RDB とは何ですか？",
    a: "リレーショナルモデルに基づいてデータを表形式で管理し、ACID 特性と宣言的制約を通じて複数ユーザー環境でのデータ整合性を構造的に保証するデータ管理システムです。詳細は総括ページ「RDB が黙って守ってくれている 5 つの根本価値」で扱います。",
  },
  {
    q: "Excel をデータベース代わりに使ってはいけないのですか？",
    a: "個人の一時的な作業や少人数の限定的な運用なら問題ありません。ただし複数人が同時更新する業務データや、消えては困る取引記録には向きません。本シリーズの 6 記事でその理由を具体的に扱います。",
  },
  {
    q: "このシリーズを読んだら SQL が書けるようになりますか？",
    a: "SQL 構文の詳細は扱いませんが、「なぜトランザクションを使うのか」「なぜ制約が必要か」の判断力が身につきます。SQL 実装の詳細は RDBインデックス図解 と データモデリング体系 の 2 セクションを参照してください。",
  },
  {
    q: "「変なER図」との違いは？",
    a: "「変なER図」は ER 図の読み方を謎解きで学ぶコンテンツ、「もしRDBがなかったら」は RDB そのものの存在意義を思考実験で学ぶコンテンツです。前者はテーブル間の関係設計、後者は DBMS の根本価値がテーマです。",
  },
];

export default function WhyNeedRdbHub() {
  const ordered = LEARNING_ORDER.map(
    (slug) => whyNeedRdbTopics.find((t) => t.slug === slug)!,
  );

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      <SectionHubJsonLd
        section="why-need-rdb"
        faq={faq}
        flagshipDefinition={FLAGSHIP_DEFINITION}
      />

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-10 md:py-14">
          <nav
            aria-label="パンくず"
            className="text-xs text-[var(--muted-foreground)]"
          >
            <Link href="/" className="hover:text-[var(--foreground)]">
              ホーム
            </Link>
            <span className="mx-2">/</span>
            <span>{sectionMeta.shortLabel}</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              もしもこの世界に
              <br className="md:hidden" />
              RDBがなかったら
              <span className="mt-4 block text-base md:text-xl text-[var(--muted-foreground)] font-normal tracking-wide">
                あなたには、この Excel の何が壊れているかわかりますか？
              </span>
            </h1>
            <p className="mt-8 text-base md:text-lg text-[var(--foreground)]/90 leading-relaxed">
              下に、架空 EC サイトの受注管理 Excel があります。仕込まれているのは 7 つの明らかにおかしい箇所。
            </p>
            <p className="mt-4 text-base md:text-lg text-[var(--foreground)]/90 leading-relaxed">
              「Excel でどうにかなる」で止まっていた業務データ管理の限界を、RDB が黙って守ってくれている 5 つの根本価値で 1 つずつ言語化していきましょう。
            </p>
          </div>

          {/* 定義文 (AEO / speakable 用、視覚的には控えめ) */}
          <p data-speakable="definition" className="sr-only">
            {FLAGSHIP_DEFINITION}
          </p>

          <div className="mt-10">
            <BrokenExcelAnomalyList />
          </div>
        </Container>
      </section>

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-12 md:py-16">
          <h2 className="mb-2 text-xl md:text-2xl font-bold tracking-tight">
            RDB の 5 つの根本価値を体系的に学ぶ
          </h2>
          <p className="mb-8 text-sm text-[var(--muted-foreground)] leading-relaxed">
            事故インパクトの大きい順に並べています。7 つの違和感の解説から辿ってきた場合は、
            該当ページだけ拾い読みしても構いません。
          </p>
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

      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-12 md:py-16">
          <h2 className="mb-2 text-xl md:text-2xl font-bold tracking-tight">
            RDB を選んだあと、次に学ぶこと
          </h2>
          <p className="mb-6 text-sm text-[var(--muted-foreground)] leading-relaxed">
            「なぜ RDB か」を掴んだら、次は「どう動くか (性能)」と「どう設計するか (スキーマ)」の 2 面へ。
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href={sections["rdb-index"].path}
              className="group block border border-[var(--border-strong)] bg-[var(--card)] p-6 hover:bg-[var(--muted)]/60"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                性能を掘る
              </div>
              <div className="mt-2 text-lg font-bold group-hover:underline underline-offset-4">
                {sections["rdb-index"].label} →
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                B-tree、ハッシュ、複合インデックスの動きを図解で辿る。
              </p>
            </Link>
            <Link
              href={sections["data-modeling"].path}
              className="group block border border-[var(--border-strong)] bg-[var(--card)] p-6 hover:bg-[var(--muted)]/60"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                設計を掘る
              </div>
              <div className="mt-2 text-lg font-bold group-hover:underline underline-offset-4">
                {sections["data-modeling"].label} →
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                「変なER図」で ER の読み方を、そのまま正規化 1NF〜3NF へ。
              </p>
            </Link>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        <FAQ items={faq} />
      </Container>

      <Container size="wide" className="pt-4 pb-16">
        <AffiliateBooks topicSlug="recap" />
      </Container>

      <Container size="wide" className="pt-4 pb-16">
        <MentorCTA />
      </Container>
    </div>
  );
}
