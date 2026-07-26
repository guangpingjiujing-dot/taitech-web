import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TopicNavDrawer } from "@/components/layout/TopicNavDrawer";
import { site } from "@/lib/site";
import { sections, type SectionKey } from "@/content/sections";

type HeaderSection = "hub" | SectionKey;

const HEADER_META: Record<HeaderSection, { label: string }> = {
  hub: { label: site.name },
  "rdb-index": { label: sections["rdb-index"].label },
  "data-modeling": { label: sections["data-modeling"].label },
  "why-need-rdb": { label: sections["why-need-rdb"].shortLabel },
};

export function Header({ section = "rdb-index" }: { section?: HeaderSection } = {}) {
  const meta = HEADER_META[section];
  const inSection = section !== "hub";
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]">
      <Container size="wide">
        <div className="flex h-14 items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            {inSection && <TopicNavDrawer section={section} />}
            <Link
              href="/"
              aria-label={inSection ? `${site.name} トップへ` : undefined}
              className="flex items-center gap-2.5 font-bold tracking-tight shrink-0"
            >
              <LogoMark />
              <span className="hidden sm:inline">{site.name}</span>
            </Link>
            {inSection && (
              <>
                <span
                  aria-hidden
                  className="hidden sm:inline text-[var(--muted-foreground)] mx-1"
                >
                  /
                </span>
                <Link
                  href={sections[section].path}
                  className="hidden sm:inline font-bold tracking-tight text-[var(--foreground)] hover:opacity-80 truncate"
                >
                  {meta.label}
                </Link>
              </>
            )}
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/about"
              className="hidden sm:inline-block px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              著者について
            </Link>
            <Link
              href={site.author.mentorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center border border-[var(--foreground)] px-3 py-1.5 text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-white transition-colors"
            >
              無料相談
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}

function LogoMark() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 64 64"
      fill="none"
    >
      <rect width="64" height="64" rx="12" fill="#0a0a0a" />
      <g
        stroke="#fafafa"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <ellipse cx="32" cy="14" rx="20" ry="5" />
        <line x1="12" y1="14" x2="12" y2="50" />
        <line x1="52" y1="14" x2="52" y2="50" />
        <path d="M 12 26 Q 32 36 52 26" />
        <path d="M 12 38 Q 32 48 52 38" />
        <path d="M 12 50 Q 32 60 52 50" />
      </g>
    </svg>
  );
}
