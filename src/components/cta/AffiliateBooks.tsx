import { booksForTopic, type BookDomain } from "@/content/books";
import { AmazonLink } from "@/components/cta/AmazonLink";

export function AffiliateBooks({
  topicSlug,
  domain = "rdb",
  limit,
  heading = "もっと学びたい方へ（おすすめ書籍）",
}: {
  topicSlug: string;
  domain?: BookDomain;
  limit?: number;
  heading?: string;
}) {
  const items = booksForTopic(topicSlug, { domain, limit });
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        {heading}
      </h2>
      {/*
        `grid-cols-1` を省かない。省くと 640px 未満で **暗黙のカラム** になり、
        暗黙トラックの `auto` は最大サイズが max-content なので、
        CJK (word-break: keep-all で分割されない) の長い書名・紹介文がそのまま
        カラムを押し広げ、body ごと横スクロールする。
        `grid-cols-1` は minmax(0, 1fr) を出すのでトラックが親幅に収まる。
        390px + 情報I の書名で発覚 (E2E「モバイルで body が横スクロールしない」)。
      */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => (
          <AmazonLink
            key={b.id}
            href={b.amazonUrl}
            bookId={b.id}
            location="card"
            topic={topicSlug}
            className="group flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/40"
          >
            <div className="flex items-start gap-2">
              {b.recommended && (
                <span className="mt-0.5 shrink-0 rounded-sm bg-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--background)]">
                  おすすめ
                </span>
              )}
              {/*
                狭いカードでは `break-words` だと min-content 幅が縮まず、書名が
                カードからはみ出す。min-content を縮める `overflow-wrap: anywhere`
                を使う (AGENTS.md / BookSidebar と同じ理由)。
              */}
              <div className="min-w-0 flex-1 [overflow-wrap:anywhere] font-semibold leading-snug group-hover:underline underline-offset-4">
                {b.title}
              </div>
            </div>
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">
              {b.author}
            </div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
              {b.description}
            </p>
            <div className="mt-auto pt-4 text-xs font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
              Amazon で見る →
            </div>
          </AmazonLink>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        本セクションはAmazonアソシエイトのリンクを含みます。
      </p>
    </section>
  );
}
