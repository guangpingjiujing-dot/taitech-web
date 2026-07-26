import { booksForTopic } from "@/content/books";
import { MentorSidebarCTA } from "@/components/cta/MentorSidebarCTA";
import { AmazonLink } from "@/components/cta/AmazonLink";

export function BookSidebar({ topicSlug }: { topicSlug: string }) {
  const items = booksForTopic(topicSlug);

  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            関連書籍
          </h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {items.map((b) => (
              <li key={b.id} className="py-3 first:pt-0 last:pb-0">
                <AmazonLink
                  href={b.amazonUrl}
                  bookId={b.id}
                  location="sidebar"
                  topic={topicSlug}
                  className="group block"
                >
                  <div className="flex flex-col items-start gap-1.5">
                    {b.recommended && (
                      <span className="rounded-sm bg-[var(--foreground)] px-1 py-0.5 text-[9px] font-semibold tracking-wide text-[var(--background)]">
                        おすすめ
                      </span>
                    )}
                    <div className="text-sm font-semibold leading-snug group-hover:underline underline-offset-4">
                      {b.title}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {b.author}
                  </div>
                  <div className="mt-1.5 text-[10px] font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                    Amazon で見る →
                  </div>
                </AmazonLink>
              </li>
            ))}
          </ul>
        </div>
      )}
      <MentorSidebarCTA />
    </div>
  );
}
