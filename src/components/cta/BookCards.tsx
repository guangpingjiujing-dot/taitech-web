import type { Book } from "@/content/books";
import { AmazonLink } from "@/components/cta/AmazonLink";

/**
 * 書籍カードのグリッド（presentation）。
 *
 * データ層は呼び出し側が持つ:
 * - `AffiliateBooks` — topic slug から `booksForTopic` で解決して渡す
 * - `/books` — 棚 (`book-shelves.ts`) の並び順そのままで渡す
 *
 * **見た目の変更はこのファイルだけで完結させる。** カードを別ページで
 * コピーすると、はみ出し対策 (下記コメント) を片方だけ直す事故が起きる。
 */
export function BookCards({ items, topic }: { items: Book[]; topic: string }) {
  if (items.length === 0) return null;
  return (
    /*
      `grid-cols-1` を省かない。省くと 640px 未満で **暗黙のカラム** になり、
      暗黙トラックの `auto` は最大サイズが max-content なので、
      CJK (word-break: keep-all で分割されない) の長い書名・紹介文がそのまま
      カラムを押し広げ、body ごと横スクロールする。
      `grid-cols-1` は minmax(0, 1fr) を出すのでトラックが親幅に収まる。
      390px + 情報I の書名で発覚 (E2E「モバイルで body が横スクロールしない」)。
    */
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <AmazonLink
          key={b.id}
          href={b.amazonUrl}
          bookId={b.id}
          location="card"
          topic={topic}
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
          <div className="mt-1 [overflow-wrap:anywhere] text-xs text-[var(--muted-foreground)]">
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
  );
}
