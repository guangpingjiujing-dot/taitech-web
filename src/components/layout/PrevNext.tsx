import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { SectionKey } from "@/content/sections";
import {
  rdbTopics,
  dataModelingTopicsIn,
  whyNeedRdbTopics,
  queryPlanTopicsInOrder,
  findTopic,
  type DataModelingTopic,
  type Topic,
  type WhyNeedRdbTopic,
} from "@/content/topics";

/** Minimal shape needed by PrevNextCards. */
export interface PrevNextItem {
  href: string;
  shortTitle: string;
}

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

/*
 * 事故インパクト順 (atomicity から始めて衝撃度の高いものを先に、recap で総括)。
 *
 * **明示列挙なので、トピックを足したらここにも足すこと。** 未記載のトピックは
 * 下の `.filter(Boolean)` で黙って落ち、そのページだけ PrevNext が消える
 * (isolation-levels 追加時に実際に踏んだ)。`TopicNav.tsx` の section 分岐と同じ罠。
 */
const WHY_NEED_RDB_ORDER = [
  "atomicity",
  "concurrency",
  // 同時実行制御の深掘りなので concurrency の直後に置く
  "isolation-levels",
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
  /*
   * query-plan は順序を `stageOrder` に持たせている（手書きの slug 配列を作らない）。
   * ここを足し忘れると未知の section が末尾の NORMALIZATION_ORDER に落ち、
   * idx === -1 になって **全ページで前後ナビが消える**（why-need-rdb で実際に踏んだ事故）。
   */
  if (section === "query-plan") {
    return queryPlanTopicsInOrder();
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
 * Presentation: 前後リンクを 2 カラムのカードで表示する。
 * データ元 (Topic / FE lesson / その他) に依存しない汎用パーツ。
 */
export function PrevNextCards({
  prev,
  next,
  ariaLabel = "前後のトピック",
}: {
  prev: PrevNextItem | null;
  next: PrevNextItem | null;
  ariaLabel?: string;
}) {
  if (!prev && !next) return null;
  return (
    <nav
      aria-label={ariaLabel}
      className="not-prose mt-16 border-t border-[var(--border)] pt-8"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {prev ? (
          <Link
            href={prev.href}
            className="group flex flex-col justify-center items-center text-center border border-[var(--border-strong)] bg-[var(--card)] px-5 py-4 hover:bg-[var(--muted)]/60 transition-colors"
          >
            <Eyebrow size="compact" as="span">← 前へ</Eyebrow>
            <span className="mt-1 text-sm font-bold text-[var(--foreground)] group-hover:underline underline-offset-4">
              {prev.shortTitle}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.href}
            className="group flex flex-col justify-center items-center text-center border border-[var(--border-strong)] bg-[var(--card)] px-5 py-4 hover:bg-[var(--muted)]/60 transition-colors"
          >
            <Eyebrow size="compact" as="span">次へ →</Eyebrow>
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

/**
 * Topic 系ページ (rdb-index / data-modeling / why-need-rdb) 用のラッパー。
 * 学習順序に沿った prev / next リンクを PrevNextCards に渡す。
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
  return (
    <PrevNextCards
      prev={prev ? { href: prev.path, shortTitle: prev.shortTitle } : null}
      next={next ? { href: next.path, shortTitle: next.shortTitle } : null}
    />
  );
}
