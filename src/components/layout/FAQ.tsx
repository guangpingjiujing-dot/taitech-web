export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section className="mt-16" data-speakable="faq">
      <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
        よくある疑問
      </h2>
      <div className="mt-4 border-y border-[var(--border)] divide-y divide-[var(--border)]">
        {items.map((it, i) => (
          <div key={i} className="py-5">
            <div className="flex items-baseline gap-3">
              <span className="text-[var(--muted-foreground)] font-mono text-sm shrink-0">
                Q.
              </span>
              <span className="font-semibold">{it.q}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
              <span className="font-mono text-[var(--muted-foreground)] shrink-0">
                A.
              </span>
              <span>{it.a}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
