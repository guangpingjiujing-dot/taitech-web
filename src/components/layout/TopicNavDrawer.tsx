"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { SectionKey } from "@/content/sections";
import { TopicNav } from "@/components/layout/TopicNav";
import { cn } from "@/lib/utils";

export function TopicNavDrawer({ section }: { section: SectionKey }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="トピック一覧を開閉"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M2 4h12M2 8h12M2 12h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="hidden sm:inline">トピック一覧</span>
      </button>

      {/* 常時 SSR して内部リンクを crawler に見せる。閉じている間は display:none 相当 */}
      <div
        className={cn("fixed inset-x-0 bottom-0 top-14 z-30", !open && "hidden")}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          onClick={() => setOpen(false)}
          aria-label="閉じる"
          tabIndex={open ? 0 : -1}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="トピック一覧"
          className="relative h-full w-72 max-w-[85vw] overflow-y-auto border-r border-[var(--border)] bg-[var(--background)] p-6 shadow-xl"
        >
          <TopicNav section={section} currentPath={pathname} />
        </div>
      </div>
    </>
  );
}
