import { SeriesNav } from "@/components/layout/SeriesNav";
import { BookSidebar } from "@/components/cta/BookSidebar";

/**
 * `/joho1` ページの右サイドバー。FeSidebar と同じ構成 (シリーズ一覧 + 書籍 + menta CTA)。
 *
 * FeSidebar をそのまま呼べないのは `SeriesNav` の active と書籍の domain が違うためだけで、
 * 見た目は完全に同じ。中身のカードは BookSidebar / SeriesNav に閉じているので、
 * ここが二重管理になるのは className の 3 パターンだけに留まる。
 *
 * `from` は出し始めるブレークポイント。ページが抱えるツールの横幅要求で決める:
 * - `lg`  lesson / quiz / 用語ページ — 本文主体
 * - `xl`  実行シミュレーター — エディタ + 変数ペイン
 * - `2xl` Python 横並び — 2 ペインを均等割りする
 */
export function Joho1Sidebar({
  topicSlug,
  from = "lg",
}: {
  topicSlug: string;
  from?: "lg" | "xl" | "2xl";
}) {
  // Tailwind はクラス名を静的に走査するので、文字列連結せず全パターンを書き下す
  const className =
    from === "2xl"
      ? "hidden 2xl:flex 2xl:sticky 2xl:top-14 2xl:self-start 2xl:flex-col 2xl:gap-4 2xl:max-h-[calc(100vh-4rem)] 2xl:overflow-y-auto 2xl:pt-4 2xl:pb-8"
      : from === "xl"
        ? "hidden xl:flex xl:sticky xl:top-14 xl:self-start xl:flex-col xl:gap-4 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto xl:pt-4 xl:pb-8"
        : "hidden lg:flex lg:sticky lg:top-14 lg:self-start lg:flex-col lg:gap-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pt-4 lg:pb-8";

  return (
    <aside className={className}>
      <SeriesNav active="joho1" />
      <BookSidebar topicSlug={topicSlug} domain="joho1" />
    </aside>
  );
}
