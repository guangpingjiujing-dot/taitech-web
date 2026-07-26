import Link from "next/link";
import type { SectionKey } from "@/content/sections";
import {
  rdbTopics,
  dataModelingTopicsIn,
  whyNeedRdbTopics,
  findTopic,
  type DataModelingTopic,
  type Topic,
  type WhyNeedRdbTopic,
} from "@/content/topics";

const NORMALIZATION_ORDER = [
  "why",
  "functional-dependency",
  "keys",
  "1nf",
  "2nf",
  "3nf",
  "denormalization",
] as const;

const ER_DIAGRAM_ORDER = [
  "entity",
  "relationship",
  "cardinality",
  "optionality",
  "many-to-many",
  "weak-entity",
  "notation",
] as const;

// 事故インパクト順 (atomicity から始めて衝撃度の高いものを先に、recap で総括)
const WHY_NEED_RDB_ORDER = [
  "atomicity",
  "concurrency",
  "uniqueness",
  "referential-integrity",
  "durability",
  "recap",
] as const;

function getOrderedTopics(
  section: SectionKey,
  category?: DataModelingTopic["category"],
): Topic[] {
  if (section === "rdb-index") {
    return rdbTopics;
  }
  if (section === "why-need-rdb") {
    return WHY_NEED_RDB_ORDER
      .map((slug) => whyNeedRdbTopics.find((t) => t.slug === slug))
      .filter((t): t is WhyNeedRdbTopic => Boolean(t));
  }
  if (category === "er-diagram") {
    const items = dataModelingTopicsIn("er-diagram");
    return ER_DIAGRAM_ORDER
      .map((slug) => items.find((t) => t.slug === slug))
      .filter((t): t is DataModelingTopic => Boolean(t));
  }
  const items = dataModelingTopicsIn("normalization");
  return NORMALIZATION_ORDER
    .map((slug) => items.find((t) => t.slug === slug))
    .filter((t): t is DataModelingTopic => Boolean(t));
}

/**
 * 前後トピックへのナビゲーション。
 * 学習順序に沿った prev / next リンクを表示する。
 */
export function PrevNext({
  section,
  currentSlug,
}: {
  section: SectionKey;
  currentSlug: string;
}) {
  const current = findTopic(section, currentSlug);
  const category =
    current && current.section === "data-modeling" ? current.category : undefined;
  const ordered = getOrderedTopics(section, category);
  const idx = ordered.findIndex((t) => t.slug === currentSlug);
  if (idx === -1) return null;
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="前後のトピック"
      className="not-prose mt-16 border-t border-[var(--border)] pt-8"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {prev ? (
          <Link
            href={prev.path}
            className="group flex flex-col justify-center items-center text-center border border-[var(--border-strong)] bg-[var(--card)] px-5 py-4 hover:bg-[var(--muted)]/60 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              ← 前へ
            </span>
            <span className="mt-1 text-sm font-bold text-[var(--foreground)] group-hover:underline underline-offset-4">
              {prev.shortTitle}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.path}
            className="group flex flex-col justify-center items-center text-center border border-[var(--border-strong)] bg-[var(--card)] px-5 py-4 hover:bg-[var(--muted)]/60 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              次へ →
            </span>
            <span className="mt-1 text-sm font-bold text-[var(--foreground)] group-hover:underline underline-offset-4">
              {next.shortTitle}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}
