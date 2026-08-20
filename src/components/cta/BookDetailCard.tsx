import type { Book } from "@/content/books";
import { AmazonLink } from "@/components/cta/AmazonLink";

/**
 * `/books` の 1 冊ぶんの詳細紹介ブロック。
 *
 * トピックページの `BookCards` (3 列グリッドの短いカード) とは**別物**。
 * あちらは「ついでに目に入る」導線なので 1 行で終わらせ、こちらは
 * 「買うかどうかを決めに来た人」向けに、こんな人向け / 中身 / 使い方 / 注意 の
 * 4 項目を必ず出す。**片方の見た目をもう片方に寄せないこと。**
 */
export function BookDetailCard({
  book,
  role,
  topic,
}: {
  book: Book;
  role: string;
  topic: string;
}) {
  const d = book.detail;
  const facts = d
    ? [
        d.publisher,
        d.format ? `${d.format}判 ${d.pages} ページ` : `${d.pages} ページ`,
        `${formatPublished(d.published)} 発売`,
      ]
    : [];

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
      {/*
        `book.recommended` の「おすすめ」バッジは出さない。**このページに載っている
        時点で全部おすすめ**なので、8 冊すべてに付いたバッジは情報量 0 になる。
        代わりに棚の中での役割 (科目A / 科目B など) を出す。
      */}
      <div>
        <span className="inline-block rounded-sm bg-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--background)]">
          {role}
        </span>
      </div>

      {/*
        globals.css の `word-break: keep-all` で CJK は min-content が文字列全長になる。
        長い書名を素で置くと箱を突き破るので overflow-wrap: anywhere で縮める (AGENTS.md)。
      */}
      <h3 className="mt-3 [overflow-wrap:anywhere] text-xl md:text-2xl font-bold tracking-tight leading-snug">
        <AmazonLink
          href={book.amazonUrl}
          bookId={book.id}
          location="detail"
          topic={topic}
          className="hover:underline underline-offset-4"
        >
          {book.title}
        </AmazonLink>
      </h3>
      <div className="mt-1.5 [overflow-wrap:anywhere] text-sm text-[var(--muted-foreground)]">
        {book.author}
      </div>

      <p className="mt-4 [overflow-wrap:anywhere] leading-relaxed">
        {book.description}
      </p>

      {d && (
        <>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
            {facts.map((f) => (
              <li key={f} className="min-w-0 [overflow-wrap:anywhere]">
                {f}
              </li>
            ))}
          </ul>
          {d.extras && (
            <p className="mt-1.5 [overflow-wrap:anywhere] text-xs text-[var(--muted-foreground)]">
              {d.extras}
            </p>
          )}

          <dl className="mt-5 border-t border-[var(--border)]">
            <DetailRow label="こんな人向け">{d.forWho}</DetailRow>
            <DetailRow label="中身">{d.contents}</DetailRow>
            <DetailRow label="使い方">{d.howToUse}</DetailRow>
            <DetailRow label="注意">{d.caution}</DetailRow>
          </dl>
        </>
      )}

      <AmazonLink
        href={book.amazonUrl}
        bookId={book.id}
        location="detail"
        topic={topic}
        className="mt-5 inline-flex items-center border border-[var(--foreground)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-[var(--background)]"
      >
        Amazon で見る →
      </AmazonLink>
    </article>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)] py-3 sm:grid sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </dt>
      {/*
        grid item の min-width は auto。keep-all の CJK では min-content が
        文字列全長になるため、min-w-0 を付けないとカラムごと横に溢れる
      */}
      <dd className="mt-1 min-w-0 sm:mt-0 [overflow-wrap:anywhere] text-sm leading-relaxed">
        {children}
      </dd>
    </div>
  );
}

/** "2025-11-25" → "2025年11月25日" */
function formatPublished(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}
