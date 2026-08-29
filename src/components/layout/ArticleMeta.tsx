import Link from "next/link";
import { site } from "@/lib/site";
import { findPageDates } from "@/content/page-dates";

/**
 * 記事の著者と最終更新日を 1 行で出す。
 *
 * **構造化データと可視情報を一致させるためにある。** JSON-LD には全ページ
 * `author` が入っているのに本文には出ていない、という状態だった
 * (docs/wip/20260828-seo-aeo-review/00-review.md §3)。日付も同じで、
 * `dateModified` を主張するなら読者にも見えている必要がある。
 *
 * 日付は `content/page-dates.ts` から引く。**JSON-LD・sitemap と同じ値**が出る
 * (同じ関数を読んでいるので構造的にずれない)。登録が無ければ日付は出さない。
 *
 * 文言は `site.author` が一次情報。ここに名前や肩書きをベタ書きしない。
 *
 * ## `showAuthor` / `dateLabel` を足した理由（2026-08-29）
 *
 * `/privacy` `/terms` にも改定日が要る。**規約に「著者 たいてっく（エンジニア講師）」は
 * 出さない** — 規約の名義は運営者であって記事の著者ではない。日付だけ出す形が要る。
 * 併せてラベルも「最終更新」より「最終改定」が正しいので差し替えられるようにした。
 */
export function ArticleMeta({
  path,
  className = "",
  showAuthor = true,
  dateLabel = "最終更新",
}: {
  path: string;
  className?: string;
  /** false で日付だけ出す。規約系ページ用 */
  showAuthor?: boolean;
  /** 日付の前に出す語。規約系は「最終改定」 */
  dateLabel?: string;
}) {
  const dates = findPageDates(path);
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted-foreground)] ${className}`}
    >
      {showAuthor && (
        <span>
          著者{" "}
          <Link
            href="/about"
            className="font-semibold text-[var(--foreground)] underline-offset-4 hover:underline"
          >
            {site.author.name}
          </Link>
          （{site.author.role}）
        </span>
      )}
      {dates && (
        <>
          {showAuthor && <span aria-hidden>·</span>}
          <span>
            {dateLabel}{" "}
            <time dateTime={dates.updated}>{dates.updated}</time>
          </span>
        </>
      )}
    </div>
  );
}
