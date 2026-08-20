import { booksForTopic, type BookDomain } from "@/content/books";
import { BookCards } from "@/components/cta/BookCards";

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
      <div className="mt-4">
        <BookCards items={items} topic={topicSlug} />
      </div>
      {/* Amazon 運営規約 / 景表法（ステマ規制）で必須。消さない (AGENTS.md) */}
      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        本セクションはAmazonアソシエイトのリンクを含みます。
      </p>
    </section>
  );
}
