import Link from "next/link";
import {
  rdbTopicsBy,
  dataModelingTopicsIn,
  whyNeedRdbTopics,
} from "@/content/topics";
import { feLessons } from "@/content/fe/lessons";
import { joho1Lessons } from "@/content/joho1/lessons";
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
  currentPath,
  hideOtherSection = false,
}: {
  section: SectionKey;
  /**
   * 現在の pathname。項目の path と突き合わせて現在地をハイライトする。
   * slug 比較にすると topics レジストリを持たない FE で常に外れるので path で比較する。
   */
  currentPath?: string;
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
              // ツールと読み物を同じ見出しの下に混ぜない (ツールが「構文別レッスン」配下に見えてしまう)
              { key: "fe-tools", label: "ツール", items: [] },
              {
                key: "fe-lessons",
                label: "構文別レッスン",
                items: feLessons.map((l) => ({
                  slug: l.slug,
                  path: `/fe/algorithm/lessons/${l.slug}`,
                  shortTitle: l.shortTitle,
                })),
              },
              {
                key: "fe-quiz",
                label: `練習問題 ${feQuizzes.length} 問`,
                items: [],
              },
            ]
          : section === "joho1"
            ? [
                { key: "joho1-tools", label: "ツール", items: [] },
                {
                  key: "joho1-lessons",
                  label: "構文別レッスン",
                  items: joho1Lessons.map((l) => ({
                    slug: l.slug,
                    path: `/joho1/lessons/${l.slug}`,
                    shortTitle: l.shortTitle,
                  })),
                },
                { key: "joho1-terms", label: "用語", items: [] },
              ]
            : Object.values(dataModelingCategories).map((c) => ({
              key: c.key,
              label: c.label,
              items: dataModelingTopicsIn(c.key),
            }));

  /** ハードコードで並べている固定リンク (ツール / 旗艦ページ) 用の現在地判定 */
  const linkClass = (href: string, base: string) =>
    cn(
      base,
      href === currentPath
        ? "border-[var(--foreground)] bg-[var(--muted)]/60"
        : "border-transparent",
    );
  const current = (href: string) =>
    href === currentPath ? ("page" as const) : undefined;

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
                  className={linkClass(
                    "/data-modeling/er-diagram",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/data-modeling/er-diagram")}
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
                  className={linkClass(
                    "/why-need-rdb",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/why-need-rdb")}
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
            {g.key === "fe-tools" && (
              <>
                <li>
                  <Link
                    href="/fe"
                    className={linkClass(
                    "/fe",
                    "block border-l-2 -ml-px px-3 py-1.5 leading-snug text-[var(--foreground)] font-semibold hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/fe")}
                  >
                    対策ツール一覧
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fe/algorithm"
                    className={linkClass(
                    "/fe/algorithm",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/fe/algorithm")}
                  >
                    <div className="font-semibold group-hover:underline underline-offset-4">
                      擬似言語 実行シミュレーター
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                      その場で書いて、一行ずつ動かす
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fe/sql"
                    className={linkClass(
                    "/fe/sql",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/fe/sql")}
                  >
                    <div className="font-semibold group-hover:underline underline-offset-4">
                      SQL 実行シミュレーター
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                      評価順を 1 つずつ確認する
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fe/algorithm/transpile"
                    className={linkClass(
                    "/fe/algorithm/transpile",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/fe/algorithm/transpile")}
                  >
                    <div className="font-semibold group-hover:underline underline-offset-4">
                      多言語横並び比較
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                      Python / TypeScript と読み比べる
                    </div>
                  </Link>
                </li>
              </>
            )}
            {g.key === "joho1-tools" && (
              <li>
                <Link
                  href="/joho1"
                  className={linkClass(
                    "/joho1",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/joho1")}
                >
                  <div className="font-semibold group-hover:underline underline-offset-4">
                    実行シミュレーター
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                    問題のプログラムを貼って動かす
                  </div>
                </Link>
              </li>
            )}
            {g.key === "joho1-lessons" && (
              <li>
                <Link
                  href="/joho1/lessons"
                  className={linkClass(
                    "/joho1/lessons",
                    "block border-l-2 -ml-px px-3 py-1.5 leading-snug text-[var(--foreground)] font-semibold hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/joho1/lessons")}
                >
                  レッスン一覧
                </Link>
              </li>
            )}
            {g.key === "joho1-terms" && (
              <li>
                <Link
                  href="/joho1/dncl"
                  className={linkClass(
                    "/joho1/dncl",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/joho1/dncl")}
                >
                  <div className="font-semibold group-hover:underline underline-offset-4">
                    DNCL との違い
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                    情報Iの言語は DNCL ではない
                  </div>
                </Link>
              </li>
            )}
            {g.key === "fe-lessons" && (
              <li>
                <Link
                  href="/fe/algorithm/lessons"
                  className={linkClass(
                    "/fe/algorithm/lessons",
                    "block border-l-2 -ml-px px-3 py-1.5 leading-snug text-[var(--foreground)] font-semibold hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/fe/algorithm/lessons")}
                >
                  レッスン一覧
                </Link>
              </li>
            )}
            {g.key === "fe-quiz" && (
              <li>
                <Link
                  href="/fe/algorithm/quiz"
                  className={linkClass(
                    "/fe/algorithm/quiz",
                    "group block border-l-2 -ml-px px-3 py-2 leading-snug text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]/60 transition-colors",
                  )}
                  aria-current={current("/fe/algorithm/quiz")}
                >
                  <div className="font-semibold group-hover:underline underline-offset-4">
                    練習問題をすべて見る
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)] leading-tight">
                    出力を当てられるか試す
                  </div>
                </Link>
              </li>
            )}
            {g.items.map((t) => {
              const active = t.path === currentPath;
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
