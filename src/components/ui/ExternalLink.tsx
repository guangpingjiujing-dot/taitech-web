import Link from "next/link";

/**
 * 外部サイトへのリンク。**一次資料への出典リンクはこれを通す。**
 *
 * ## なぜコンポーネントにしたか
 *
 * `target="_blank"` + `rel="noopener noreferrer"` を毎回手で書くと付け忘れる。
 * 実際 `/query-plan` の 3 本はそれぞれ独立に手書きされていた。
 *
 * 見た目も揃える必要がある。`.prose-jp a` (globals.css) はアンカーに下線を
 * 付けるが、**prose の外ではアンカーに何のスタイルも当たらない**
 * (Tailwind Preflight が `color: inherit / text-decoration: inherit` にする)。
 * ヘッダーやキャプションのような prose 外に素の `<Link>` を置くと、
 * **リンクだと分からない**ままになる。ここで既定のスタイルを持たせて防ぐ。
 *
 * prose の中では `.prose-jp a` (0,2,1) が同じ値で勝つので、見た目は変わらない。
 */
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline underline-offset-4 decoration-[var(--border-strong)] hover:decoration-[var(--foreground)] ${className}`}
    >
      {children}
    </Link>
  );
}
