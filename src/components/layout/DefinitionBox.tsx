import { cn } from "@/lib/utils";

/**
 * トピック / レッスンの冒頭に置く「定義」ブロック。
 *
 * data-speakable="definition" を必ず付ける (AEO / 音声アシスタント向けに
 * H1 と合わせて話し上げる対象になる)。手書き実装では抜けやすいので
 * このコンポーネントで一元化する。
 */
export function DefinitionBox({
  children,
  className,
  label = "定義",
}: {
  children: React.ReactNode;
  className?: string;
  /** 上のラベル (デフォルト「定義」)。用途が違う場合のみ差し替える。 */
  label?: string;
}) {
  return (
    <div
      className={cn(
        "border-l-2 border-[var(--foreground)] pl-4 py-1",
        className,
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </div>
      <p
        data-speakable="definition"
        className="mt-1 text-[var(--foreground)] leading-relaxed"
      >
        {children}
      </p>
    </div>
  );
}
