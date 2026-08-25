import Link from "next/link";
import { topics, findTopic } from "@/content/topics";
import type { SectionKey } from "@/content/sections";
import { LevelBadge } from "@/components/ui/Badge";

export function RelatedTopics({
  section,
  currentSlug,
}: {
  section: SectionKey;
  currentSlug: string;
}) {
  const current = findTopic(section, currentSlug);
  if (!current) return null;

  const related = topics
    .filter((t) => {
      if (t.section !== current.section || t.slug === currentSlug) return false;
      if (current.section === "rdb-index" && t.section === "rdb-index") {
        return t.group === current.group;
      }
      if (current.section === "data-modeling" && t.section === "data-modeling") {
        return t.category === current.category;
      }
      if (current.section === "query-plan" && t.section === "query-plan") {
        return t.stage === current.stage;
      }
      if (current.section === "why-need-rdb" && t.section === "why-need-rdb") {
        return t.group === current.group;
      }
      return false;
    })
    .slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="mt-20 border-t border-[var(--border)] pt-8">
      <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        関連トピック
      </h2>
      <ul className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {related.map((t) => (
          <li key={t.slug}>
            <Link
              href={t.path}
              className="group flex items-start justify-between gap-4 py-4 hover:bg-[var(--muted)]/60 px-2 -mx-2 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-semibold group-hover:underline underline-offset-4">
                  {t.shortTitle}
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                  {t.summary}
                </p>
              </div>
              <LevelBadge level={t.level} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
