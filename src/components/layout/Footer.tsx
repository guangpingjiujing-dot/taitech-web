import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import { topicsInSection } from "@/content/topics";
import { sections } from "@/content/sections";
import { feQuizzes } from "@/content/fe/quiz";
import { sqlLessons } from "@/content/fe/sql/lessons";
import { sqlQuizzes } from "@/content/fe/sql/quiz";
import { joho1Lessons } from "@/content/joho1/lessons";

/**
 * サイト全体のフッター。
 *
 * **列の軸はセクション。** 以前は「基礎トピック / 発展トピック」の 2 列だったが、
 * これは `level` という**セクションを横断する軸**で、基礎 26 件 / 発展 6 件と
 * 極端に偏っていた。しかも発展側の中身がほぼ rdb-index だったため、
 * 読者からは「RDB インデックスだけ 2 列ある」ように見えていた (2026-08-16 に是正)。
 *
 * さらに、トピック個別ページを並べる 2 列とツール単位で並べる 2 列が混在していて、
 * **粒度も揃っていなかった**。セクション単位に統一し、各列が
 * 「セクションの入口 + その中身」という同じ形になるようにしている。
 *
 * リンクの総数は据え置き。フッターは全ページ・全ブレークポイントに出るので、
 * **モバイルから各セクションに入る唯一の恒常導線**でもあり、減らすと
 * サイドバー (lg 以上でしか出ない) を持たない画面幅で到達性が落ちる。
 */
export function Footer() {
  const feLinks = [
    { href: "/fe", label: "対策ツール一覧" },
    { href: "/fe/algorithm", label: "擬似言語 実行シミュレーター" },
    { href: "/fe/algorithm/lessons", label: "擬似言語 レッスン" },
    { href: "/fe/algorithm/quiz", label: `擬似言語 練習問題 ${feQuizzes.length} 問` },
    { href: "/fe/algorithm/transpile", label: "多言語横並び比較" },
    { href: "/fe/sql", label: "SQL 実行シミュレーター" },
    { href: "/fe/sql/lessons", label: `SQL レッスン ${sqlLessons.length} 本` },
    { href: "/fe/sql/quiz", label: `SQL 練習問題 ${sqlQuizzes.length} 問` },
  ];
  const joho1Links = [
    { href: "/joho1", label: "実行シミュレーター" },
    { href: "/joho1/lessons", label: `構文別レッスン ${joho1Lessons.length} 本` },
    { href: "/joho1/dncl", label: "DNCL との違い" },
  ];

  /** セクションの入口 + そのセクションのトピック */
  const topicColumn = (key: "why-need-rdb" | "rdb-index" | "data-modeling") => ({
    key,
    heading: sections[key].shortLabel,
    links: [
      { href: sections[key].path, label: "セクション一覧" },
      ...topicsInSection(key).map((t) => ({
        href: t.path,
        label: t.shortTitle,
      })),
    ],
  });

  const columns = [
    topicColumn("why-need-rdb"),
    topicColumn("rdb-index"),
    topicColumn("data-modeling"),
    { key: "fe", heading: sections.fe.shortLabel, links: feLinks },
    { key: "joho1", heading: sections.joho1.shortLabel, links: joho1Links },
  ];

  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--background)]">
      <Container size="wide" className="py-12">
        <div className="max-w-2xl">
          <div className="text-lg font-bold">{site.name}</div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            {site.description}
          </p>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            運営: {site.author.name}（{site.author.role}）
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {columns.map((column) => (
            <div key={column.key} className="min-w-0">
              <div className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
                {column.heading}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {column.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block [overflow-wrap:anywhere] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)] md:flex-row md:justify-between">
          <div>© {new Date().getFullYear()} {site.author.name} / {site.name}</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-[var(--foreground)]">
              著者について
            </Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-[var(--foreground)]">
              利用規約
            </Link>
            <Link href="/contact" className="hover:text-[var(--foreground)]">
              お問い合わせ
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
