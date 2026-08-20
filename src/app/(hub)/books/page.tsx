import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FAQ } from "@/components/layout/FAQ";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { BookDetailCard } from "@/components/cta/BookDetailCard";
import { BooksPageJsonLd } from "@/components/seo/JsonLd";
import { bookShelves, booksInShelf } from "@/content/book-shelves";

const PAGE_TITLE = "ITパスポート・基本情報・SQL・Python のおすすめ参考書";
const PAGE_DESCRIPTION =
  "個別指導でよく聞かれる「どの参考書を買えばいいか」への回答。ITパスポート試験・基本情報技術者試験・SQL・Python を分野ごとに 2 冊だけ紹介し、誰向けか・何が載っているか・どう使うか・どこが向かないかまで書いています。";

export const metadata: Metadata = {
  title: "おすすめ参考書｜ITパスポート・基本情報・SQL・Python",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/books" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/books",
  },
};

const faq = [
  {
    q: "参考書は何冊買えばいいですか？",
    a: "分野ごとに、まず 1 冊です。同じレベルの本を 2 冊並行して進めると、どちらも中途半端で終わりやすくなります。1 冊をやり切ってから次の段階の本に進んでください。基本情報技術者試験だけは、科目A と科目B で必要な内容が違うので 2 冊構成が前提になります。",
  },
  {
    q: "なぜ 1 分野 2 冊しか載せていないのですか？",
    a: "候補を並べるだけだと「結局どれを買えばいいのか」が読む人に残ってしまうからです。冊数を絞る代わりに、1 冊ずつ誰向けか・何が載っているか・どう使うか・どこが向かないかまで書いています。挙げていない本が悪いという意味ではありません。",
  },
  {
    q: "古い年度版を安く買っても大丈夫ですか？",
    a: "ITパスポート試験と基本情報技術者試験のテキストは、受験する年度に対応した最新版を選んでください。シラバス改訂で生成AI・データサイエンス分野などが追加されており、旧年度版はその範囲を含みません。一方 SQL や Python の技術書は改訂の間隔が長いので、現行の版かどうかだけ確認すれば十分です。",
  },
  {
    q: "紙と電子書籍のどちらがいいですか？",
    a: "手を動かす演習が中心の本（SQL のドリル、擬似言語のトレース）は紙が向きます。前のページに戻りながら書き込む使い方が多いためです。通読が中心の入門書や、必要な項目を検索して引く使い方の本は電子書籍で困りません。",
  },
  {
    q: "ITパスポートから基本情報技術者試験に進むべきですか？",
    a: "IT の実務経験がないなら、ITパスポートを先に受けると用語の土台ができて基本情報の科目A が楽になります。すでに開発の実務経験があるなら、ITパスポートを飛ばして基本情報から始めて問題ありません。",
  },
  {
    q: "SQL と Python はどちらから学ぶべきですか？",
    a: "目的によります。データを集計・分析したいなら SQL が先、作業を自動化したりツールを作りたいなら Python が先です。どちらも必要になる場合は、覚える文法が少ない SQL から片付ける方が負担が軽くなります。",
  },
];

export default function BooksPage() {
  const shelves = bookShelves.map((shelf) => ({
    shelf,
    entries: booksInShelf(shelf),
  }));

  return (
    <Container size="default" className="py-8 md:py-12">
      <BooksPageJsonLd
        path="/books"
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        shelves={shelves.map(({ shelf, entries }) => ({
          label: shelf.label,
          books: entries.map((e) => e.book),
        }))}
        faq={faq}
      />

      <Breadcrumb
        className="mb-6"
        items={[{ href: "/", label: "ホーム" }, { label: "おすすめ参考書" }]}
      />

      <Eyebrow>おすすめ参考書</Eyebrow>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
        {PAGE_TITLE}
      </h1>

      <p className="mt-6 max-w-3xl leading-relaxed">
        <Link
          href="/about"
          className="underline underline-offset-4 hover:no-underline"
        >
          個別指導
        </Link>
        をしていると、生徒さんから「どの参考書を買えばいいですか」とよく聞かれます。
        そのときにお伝えしている選び方を、分野ごとにまとめました。
      </p>
      <p className="mt-4 max-w-3xl leading-relaxed">
        挙げるのは 1 分野 2 冊だけです。候補を並べても「結局どれを買えばいいか」が残るので、
        冊数を絞る代わりに 1 冊ずつ、
        <strong>こんな人向け・中身・使い方・注意</strong>
        まで書きました。挙げていない本が悪いという意味ではありません。
      </p>
      <nav
        aria-label="分野"
        className="mt-8 flex flex-wrap gap-2 border-y border-[var(--border)] py-4"
      >
        {/* 冊数は全分野 2 冊で揃っているので出さない (出すと 4 つとも「2 冊」になるだけ) */}
        {shelves.map(({ shelf }) => (
          <a
            key={shelf.key}
            href={`#${shelf.key}`}
            className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:border-[var(--foreground)] transition-colors"
          >
            {shelf.label}
          </a>
        ))}
      </nav>

      {/*
        Amazon 運営規約 (参加者である旨の明示) / 景表法のステマ規制対応。
        **最初のアフィリエイトリンクより前から動かさないこと。** 消費者庁の運用基準は
        「大量の文章の記載の末尾に、周囲の文字と比較して小さく表示するもの」を
        問題となる例として挙げている。ページ末尾やフッターに下げるとその形になる。
        リード文の直下から分野ナビの下へは動かしてよい (2026-08-21 にそうした)。
      */}
      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        本ページはAmazonアソシエイトのリンクを含みます。
      </p>

      {shelves.map(({ shelf, entries }) => (
        <section key={shelf.key} id={shelf.key} className="mt-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {shelf.label}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-[var(--muted-foreground)]">
            {shelf.summary}
          </p>

          <h3 className="mt-8 text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
            選び方
          </h3>
          <ul className="mt-3 max-w-3xl space-y-2">
            {shelf.howToChoose.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className="text-[var(--muted-foreground)]">
                  —
                </span>
                {/*
                  globals.css の `word-break: keep-all` により CJK は min-content が
                  文字列全長になる。flex item の min-width: auto と組み合わさると
                  カラムを突き破るので min-w-0 + overflow-wrap: anywhere で縮める
                  (AGENTS.md)。
                */}
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {emphasize(line)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-5">
            {entries.map(({ book, role }) => (
              <BookDetailCard
                key={book.id}
                book={book}
                role={role}
                topic={`books-${shelf.key}`}
              />
            ))}
          </div>

          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {shelf.related.map((r) => (
              <li key={r.href} className="min-w-0">
                <Link
                  href={r.href}
                  className="[overflow-wrap:anywhere] underline underline-offset-4 hover:no-underline"
                >
                  {r.label} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <FAQ items={faq} />

      <MentorCTA />
    </Container>
  );
}

/**
 * `**強調**` だけを解釈する最小の記法。選び方の箇条書きは 1 行が長く、
 * どこが要点かを見た目で示せないと読み飛ばされる。
 * Markdown を全部入れる必要はないのでライブラリは足さない。
 */
function emphasize(text: string): React.ReactNode[] {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
  );
}
