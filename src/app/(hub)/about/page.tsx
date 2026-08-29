import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { FAQ } from "@/components/layout/FAQ";
import { AuthorJsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "著者について",
  description: `${site.author.name}のプロフィール。SQL・データベース・クラウド・AI活用・IPA試験対策を1対1で教えるオンラインエンジニア講師。`,
  alternates: { canonical: "/about" },
};

const experiences = [
  {
    title: "6年以上のWeb系実務経験・現役エンジニア",
    body: "自社開発企業でバックエンド・データエンジニア・クラウド設計を担当。",
  },
  {
    title: "SQL・データベース設計・データ分析基盤とそのパイプライン開発と運用・データガバナンス",
    body: "PostgreSQL / MySQL / BigQuery / Redshift 等を実務で運用。dbt・Airflowなどのデータ基盤も構築。",
  },
  {
    title: "AWS認定12種すべてを取得（全冠達成）",
    body: "2022〜2024年に当時の全12認定を取得。クラウドインフラ〜サーバーレス、データ分析基盤まで範囲をカバーする。以降は更新していないため、有効期限（3年）を過ぎたものから順次失効している。",
  },
  {
    title: "IPAデータベーススペシャリスト（2023年）",
    body: "ほかに応用情報技術者（2022年）、基本情報技術者（2021年）、OSS-DB Silver（2024年）。IPA試験に有効期限は無い。Azure / Power Platform / LPICレベル1〜3 / G検定 / Python3エンジニア認定なども含め、IT資格は計30種以上。",
  },
  {
    title: "AIエージェント / AIプロダクト開発",
    body: "LLM を組み込んだプロダクトの設計・実装経験に加え、業務要件に合わせて AI エージェントを自ら作れる。Claude Code など既製エージェントを使いこなす立場と、内部を理解して作る立場の両方を持つ。",
  },
];

const techStack = [
  {
    category: "クラウド",
    items: "AWS / GCP / Azure",
  },
  {
    category: "データベース・DWH",
    items: "PostgreSQL / MySQL / SQL Server / DuckDB / MongoDB / Supabase / Neon / BigQuery / Amazon RDS / Amazon Redshift / Athena / Azure SQL Database / Treasure Data / Microsoft Access",
  },
  {
    category: "データ基盤・ETL/ELT・可視化",
    items: "dbt / Digdag / Dagster / Airflow / Redash / Lightdash / Evidence / Superset",
  },
  {
    category: "言語",
    items: "Python / SQL / Java / TypeScript",
  },
  {
    category: "AI・AI Agent",
    items: "Claude Code / Codex / Cursor / Google ADK / RAG / LangChain / Langfuse",
  },
  {
    category: "その他",
    items: "Power Platform / Apache Tomcat",
  },
];

const plans = [
  {
    title: "月額プラン（共通）",
    description:
      "個人の希望に合わせてSQL、データベース、クラウド、資格対策など柔軟に対応。まずは無料相談から。",
  },
  {
    title: "データベース特化プラン",
    description:
      "SQL基礎〜応用、データベース設計、パフォーマンスチューニング、データパイプライン構築まで。",
  },
  {
    title: "IPA・AWS試験対策",
    description:
      "試験範囲の体系学習、過去問解説、記述式・午後II対策まで実務者視点で。",
  },
  {
    title: "AIエージェント開発 / AIプロダクト開発",
    description:
      "LLM API を使ったプロダクト設計、AI エージェントの自作、Claude Code など既製エージェントの実務導入まで。「使う側」で止まらず「作る側」に回りたいエンジニア向け。",
  },
];

const faq = [
  {
    q: "無料相談だけで終わっても大丈夫ですか？",
    a: "問題ありません。相性・希望・レベル感を確認する場なので、そのままご検討を終えていただいてOKです。",
  },
  {
    q: "初心者すぎても対応してくれますか？",
    a: "プログラミング未経験・SQL未経験・DB初学者・AI未経験から、IPA・AWS試験レベル、実務のパフォーマンスチューニング・本格的なデータ基盤の構築まで幅広く対応しています。事前ヒアリングでレベルに合わせて内容を組み立てます。",
  },
  {
    q: "対応時間帯・頻度は？",
    a: "オンライン中心で、時間帯・頻度は事前相談で柔軟に調整します。月ごとに変えることも可能です。",
  },
  {
    q: "教材は用意してくれますか？",
    a: "専用の教材は原則ありません。書籍・公式ドキュメント・実際の業務課題を組み合わせて、あなたに必要な形で構成します。",
  },
  {
    q: "オンラインのみですか？",
    a: "はい、Google MeetやZoom等を使ったオンライン指導です。全国どこからでも受講できます。",
  },
];

export default function AboutPage() {
  return (
    <Container size="narrow" className="py-12 md:py-16">
      <AuthorJsonLd faq={faq} />

      <Eyebrow size="compact" as="div">著者について</Eyebrow>
      <div className="mt-4 flex items-center gap-5">
        <Image
          src="/taitech-icon.svg"
          alt={site.author.name}
          width={72}
          height={72}
          className="rounded-full shrink-0"
        />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {site.author.name}
          </h1>
          <div className="mt-1 text-[var(--muted-foreground)]">
            {site.author.role}
          </div>
        </div>
      </div>

      <p className="mt-8 leading-relaxed">{site.author.bio}</p>
      <p className="mt-4 text-sm text-[var(--muted-foreground)] leading-relaxed">
        生徒の希望・レベルに合わせて内容をカスタマイズします。
        今まで数多くの生徒のSQL・DB・クラウド・開発・資格対策学習をサポート。
      </p>

      <div className="mt-8 flex flex-wrap gap-4 items-center">
        <Link
          href={site.author.mentorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-[var(--foreground)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#262626] transition-colors"
        >
          無料相談を予約する →
        </Link>
        <Link
          href="https://menta.work/user/179723"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--muted-foreground)] underline underline-offset-4 hover:text-[var(--foreground)]"
        >
          提供プランを見る
        </Link>
      </div>

      <h2 className="mt-16 text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        実績・強み
      </h2>
      <ul className="mt-4 border-y border-[var(--border)] divide-y divide-[var(--border)]">
        {experiences.map((e) => (
          <li key={e.title} className="py-4">
            <div className="font-bold">{e.title}</div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
              {e.body}
            </p>
          </li>
        ))}
      </ul>

      {/*
        外部プロフィール。**`site.author.profiles` が唯一の正**で、
        `AuthorJsonLd` / `SiteJsonLd` の `sameAs` が同じ配列を読んでいる。
        ここにベタ書きすると構造化データと可視情報がずれる (guide.md §4-4)。
      */}
      <h2 className="mt-16 text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        外部での発信
      </h2>
      <ul className="mt-4 border-y border-[var(--border)] divide-y divide-[var(--border)]">
        {site.author.profiles.map((p) => (
          <li key={p.url} className="flex flex-wrap items-baseline gap-x-3 py-4">
            <ExternalLink href={p.url} className="font-bold">
              {p.label}
            </ExternalLink>
            <span className="text-sm text-[var(--muted-foreground)]">
              {p.handle}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-16 text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        技術スタック
      </h2>
      <ul className="mt-4 border-y border-[var(--border)] divide-y divide-[var(--border)]">
        {techStack.map((t) => (
          <li key={t.category} className="py-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              {t.category}
            </div>
            <p className="mt-1 leading-relaxed">{t.items}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
        DX 推進、データ分析基盤の構築・運用、業務システム開発、可視化ツール開発など、複数プロジェクトで運用してきた技術群。
      </p>

      <h2 className="mt-16 text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        提供プラン
      </h2>
      <ul className="mt-4 border-y border-[var(--border)] divide-y divide-[var(--border)]">
        {plans.map((p) => (
          <li key={p.title} className="py-4">
            <div className="font-bold">{p.title}</div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
              {p.description}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-sm">
        <Link
          href={site.author.mentorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:no-underline"
        >
          プラン詳細と申込みはこちら →
        </Link>
      </div>

      <FAQ items={faq} />

      <MentorCTA />
    </Container>
  );
}
