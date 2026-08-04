import Link from "next/link";
import {
  rdbTopicsBy,
  dataModelingTopicsIn,
  whyNeedRdbTopics,
} from "@/content/topics";
import { feLessons } from "@/content/fe/lessons";
import { feQuizzes } from "@/content/fe/quiz";
import { sections, dataModelingCategories, type SectionKey } from "@/content/sections";
import { cn } from "@/lib/utils";

const RDB_GROUPS = [
  { key: "prereq", label: "前提知識" },
  { key: "index-type", label: "インデックスの種類" },
  { key: "related", label: "関連トピック" },
] as const;

type Group = {
  key: string;
  label: string;
  items: { slug: string; path: string; shortTitle: string }[];
};

export function TopicNav({
  section,
  currentSlug,
  hideOtherSection = false,
}: {
  section: SectionKey;
  currentSlug?: string;
  /** true にすると末尾の「他のシリーズ」ブロックを描画しない (Hub で両セクションを並べる時に使う) */
  hideOtherSection?: boolean;
}) {
  const groups: Group[] =
    section === "rdb-index"
      ? RDB_GROUPS.map((g) => ({
          key: g.key,
          label: g.label,
          items: rdbTopicsBy(g.key),
        }))
      : section === "why-need-rdb"
        ? [
            {
              key: "why-need-rdb",
              label: "もしRDBがなかったら",
              items: whyNeedRdbTopics,
            },
          ]
        : section === "fe"
          ? [
              {
                key: "fe-lessons",
                label: "構文別レッスン",
                items: feLessons.map((l) => ({
                  slug: l.slug,
                  path: `/fe/lessons/${l.slug}`,
                  shortTitle: l.shortTitle,
                })),
              },
            ]
          : Object.values(dataModelingCategories).map((c) => ({
              key: c.key,
              label: c.label,
              items: dataModelingTopicsIn(c.key),
            }));

  const otherSections: SectionKey[] = (
    Object.keys(sections) as SectionKey[]
  ).filter((k) => k !== section);

  return (
    <nav aria-label="トピック一覧" className="text-sm">
      {groups.map((g) => (
        <div key={g.key} className="mb-6">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            {g.label}
          </div>
          <ul className="border-l border-[var(--border)]">
            {g.key === "er-diagram" && (
              <li>
                <Link
                  href="/data-modeling/er-diagram"
                  className="group block border-l-2 -ml-px border-transparent px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
                >
                  <div className="font-semibold group-hover:underline underline-offset-4">
                    変なER図
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                    9 つの違和感、全て指摘できますか？
                  </div>
                </Link>
              </li>
            )}
            {g.key === "why-need-rdb" && (
              <li>
                <Link
                  href="/why-need-rdb"
                  className="group block border-l-2 -ml-px border-transparent px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
                >
                  <div className="font-semibold group-hover:underline underline-offset-4">
                    壊れた Excel
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                    7 つの違和感、指摘できますか？
                  </div>
                </Link>
              </li>
            )}
            {g.key === "fe-lessons" && (
              <>
                <li>
                  <Link
                    href="/fe"
                    className="group block border-l-2 -ml-px border-transparent px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
                  >
                    <div className="font-semibold group-hover:underline underline-offset-4">
                      実行シミュレーター
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                      その場で書いて、一行ずつ動かす
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fe/transpile"
                    className="group block border-l-2 -ml-px border-transparent px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
                  >
                    <div className="font-semibold group-hover:underline underline-offset-4">
                      多言語横並び比較
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                      Python / TypeScript と読み比べる
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fe/quiz"
                    className="group block border-l-2 -ml-px border-transparent px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors"
                  >
                    <div className="font-semibold group-hover:underline underline-offset-4">
                      練習問題 {feQuizzes.length} 問
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                      出力を当てられるか試す
                    </div>
                  </Link>
                </li>
              </>
            )}
            {g.items.map((t) => {
              const active = t.slug === currentSlug;
              return (
                <li key={t.slug}>
                  <Link
                    href={t.path}
                    className={cn(
                      "block border-l-2 -ml-px px-3 py-1.5 leading-snug transition-colors",
                      active
                        ? "border-[var(--foreground)] text-[var(--foreground)] font-semibold bg-[var(--muted)]/60"
                        : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {t.shortTitle}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {!hideOtherSection && otherSections.length > 0 && (
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            他のシリーズ
          </div>
          {otherSections.map((key) => (
            <Link
              key={key}
              href={sections[key].path}
              className="block px-3 py-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/60"
            >
              {sections[key].shortLabel} →
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
