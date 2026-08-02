import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  /** Absent for the current page (last item). */
  href?: string;
  label: string;
}

/**
 * サイト共通のパンくず。
 *
 * - items の最後の要素は現在ページ (href なし) として非リンク表示する。
 * - 外側 margin (mb-6 など) は callers が className で足す。
 */
export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="パンくず"
      className={cn("text-xs text-[var(--muted-foreground)]", className)}
    >
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
