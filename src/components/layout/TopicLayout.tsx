import { Container } from "@/components/ui/Container";
import { LevelBadge } from "@/components/ui/Badge";
import { MentorCTA } from "@/components/cta/MentorCTA";
import { AffiliateBooks } from "@/components/cta/AffiliateBooks";
import { BookSidebar } from "@/components/cta/BookSidebar";
import { RelatedTopics } from "@/components/layout/RelatedTopics";
import { PrevNext } from "@/components/layout/PrevNext";
import { SeriesNav } from "@/components/layout/SeriesNav";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { findTopic } from "@/content/topics";
import { sections, dataModelingCategories, type SectionKey } from "@/content/sections";

const RDB_GROUP_LABEL = {
  prereq: "前提知識",
  "index-type": "インデックスの種類",
  related: "関連トピック",
} as const;

export function TopicLayout({
  section,
  slug,
  children,
}: {
  section: SectionKey;
  slug: string;
  children: React.ReactNode;
}) {
  const topic = findTopic(section, slug);
  if (!topic) throw new Error(`Topic not found: ${section}/${slug}`);
  const sectionMeta = sections[section];

  const subLabel =
    topic.section === "rdb-index"
      ? RDB_GROUP_LABEL[topic.group]
      : topic.section === "data-modeling"
        ? dataModelingCategories[topic.category].label
        : ""; // why-need-rdb は sub-classification なし

  return (
    <Container size="wide" className="py-8 md:py-12">
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[1fr_15rem]">
        <article className="min-w-0">
          <Breadcrumb
            className="mb-6"
            items={((): BreadcrumbItem[] => {
              const items: BreadcrumbItem[] = [
                { href: "/", label: "ホーム" },
                { href: sectionMeta.path, label: sectionMeta.shortLabel },
              ];
              if (topic.section === "data-modeling") {
                items.push({
                  href: dataModelingCategories[topic.category].path,
                  label: dataModelingCategories[topic.category].label,
                });
              }
              items.push({ label: topic.shortTitle });
              return items;
            })()}
          />

          <div className="mb-4 flex items-center gap-3">
            <LevelBadge level={topic.level} />
            {subLabel && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {subLabel}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {topic.title}
          </h1>

          <DefinitionBox className="mt-6">{topic.definition}</DefinitionBox>

          <div className="prose-jp mt-10 max-w-none">{children}</div>

          <PrevNext section={section} currentSlug={slug} />

          <RelatedTopics section={section} currentSlug={slug} />

          <AffiliateBooks topicSlug={slug} />

          <MentorCTA />
        </article>

        <aside className="hidden lg:flex lg:sticky lg:top-14 lg:self-start lg:flex-col lg:gap-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pt-4 lg:pb-8">
          <SeriesNav
            active={
              topic.section === "rdb-index"
                ? "rdb-index"
                : topic.section === "why-need-rdb"
                  ? "why-need-rdb"
                  : topic.category
            }
          />
          <BookSidebar topicSlug={slug} />
        </aside>
      </div>
    </Container>
  );
}
