import Link from "next/link";
import { TopicNav } from "@/components/layout/TopicNav";
import { sections } from "@/content/sections";

/**
 * トップページ (Hub) 用のサイドバー。
 * 全セクションのトピックを sections の宣言順で縦に並べて表示する。
 */
export function HubTopicNav() {
  const list = Object.values(sections);
  return (
    <div className="text-sm">
      {list.map((section, i) => (
        <div key={section.key} className={i > 0 ? "mt-10" : ""}>
          <SectionHeading href={section.path}>{section.label}</SectionHeading>
          <TopicNav section={section.key} hideOtherSection />
        </div>
      ))}
    </div>
  );
}

function SectionHeading({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-4 block border-b border-[var(--foreground)] pb-2 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] hover:text-[var(--muted-foreground)]"
    >
      {children}
    </Link>
  );
}
