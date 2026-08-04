import Link from "next/link";
import { cn } from "@/lib/utils";

type SeriesKey =
  | "why-need-rdb"
  | "rdb-index"
  | "normalization"
  | "er-diagram"
  | "fe";

type Series = {
  key: SeriesKey;
  label: string;
  href: string;
};

const SERIES: Series[] = [
  {
    key: "why-need-rdb",
    label: "もしRDBがなかったら",
    href: "/why-need-rdb",
  },
  {
    key: "rdb-index",
    label: "RDBインデックス図解",
    href: "/rdb-index",
  },
  {
    key: "normalization",
    label: "正規化",
    href: "/data-modeling/normalization",
  },
  {
    key: "er-diagram",
    label: "変なER図",
    href: "/data-modeling/er-diagram",
  },
  {
    key: "fe",
    label: "基本情報 擬似言語",
    href: "/fe",
  },
];

export function SeriesNav({ active }: { active?: SeriesKey }) {
  return (
    <nav aria-label="シリーズ一覧" className="text-sm">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        シリーズ
      </div>
      <ul>
        {SERIES.map((s) => {
          const isActive = active === s.key;
          return (
            <li key={s.key}>
              <Link
                href={s.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block border-l-2 -ml-px pl-3 py-1.5 font-bold leading-snug transition-colors",
                  isActive
                    ? "border-[var(--foreground)] text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:underline underline-offset-4",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
