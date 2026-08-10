import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import { topics } from "@/content/topics";
import { feQuizzes } from "@/content/fe/quiz";
import { joho1Lessons } from "@/content/joho1/lessons";

export function Footer() {
  const basics = topics.filter((t) => t.level === "basic");
  const advanced = topics.filter((t) => t.level === "advanced");
  // FE は topics レジストリを持たないので個別に列挙する。
  // フッターは全ページ・全ブレークポイントに出るので、モバイルから FE に入る唯一の導線でもある。
  const feLinks = [
    { href: "/fe", label: "実行シミュレーター" },
    { href: "/fe/lessons", label: "構文別レッスン" },
    { href: "/fe/quiz", label: `練習問題 ${feQuizzes.length} 問` },
    { href: "/fe/transpile", label: "多言語横並び比較" },
  ];
  // joho1 も同様。フッターが無いと、新規 9 ページがサイト全体からの恒常リンクを
  // ドロワーと hub カードしか持たない状態になる
  const joho1Links = [
    { href: "/joho1", label: "実行シミュレーター" },
    { href: "/joho1/lessons", label: `構文別レッスン ${joho1Lessons.length} 本` },
    { href: "/joho1/dncl", label: "DNCL との違い" },
  ];

  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--background)]">
      <Container size="wide" className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <div className="text-lg font-bold">{site.name}</div>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
              {site.description}
            </p>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              運営: {site.author.name}（{site.author.role}）
            </p>
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
              基礎トピック
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {basics.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={t.path}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {t.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
              発展トピック
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {advanced.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={t.path}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {t.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
              基本情報 擬似言語
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {feLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
              情報I プログラム表記
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {joho1Links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)] md:flex-row md:justify-between">
          <div>© {new Date().getFullYear()} {site.author.name} / {site.name}</div>
          <div className="flex gap-4">
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
