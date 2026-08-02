import { cn } from "@/lib/utils";

/**
 * 見出しの直上に置く小さい uppercase ラベル (「eyebrow」)。
 * ページタイトル (H1) の分類・所属を示すのに使う。
 *
 * サイズ:
 *   default: text-xs / semibold / wider — ページヒーローで H1 の上に置く
 *   compact: text-[10px] / bold / widest — 小さいブロック内で使う
 *
 * variant で色 (muted / current) を切り替え可能。
 */
export function Eyebrow({
  children,
  size = "default",
  as: Tag = "p",
  className,
}: {
  children: React.ReactNode;
  size?: "default" | "compact";
  as?: "p" | "div" | "span";
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        size === "default" &&
          "text-xs font-semibold tracking-wider uppercase text-[var(--muted-foreground)]",
        size === "compact" &&
          "text-[10px] font-bold tracking-widest uppercase text-[var(--muted-foreground)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
