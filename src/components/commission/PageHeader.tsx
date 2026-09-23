export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative">
      <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">{eyebrow}</p>
      <h1 className="mt-1 font-serif text-4xl text-navy">{title}</h1>
      {children ? <div className="mt-2 max-w-3xl text-sm leading-6 text-navy/65">{children}</div> : null}
    </header>
  );
}

export function ModuleSubnav({
  items,
  current,
}: {
  items: { href: string; label: string }[];
  current: string;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = current === item.href || current.startsWith(`${item.href}?`);
        return (
          <a
            key={item.href}
            href={item.href}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide",
              active ? "bg-navy text-cream" : "bg-white text-navy/70 ring-1 ring-navy/10 hover:bg-cream",
            ].join(" ")}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/10 bg-white/90 p-5">
      <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">{label}</p>
      <p className="mt-2 font-serif text-4xl text-navy">{value}</p>
      {hint ? <p className="mt-2 text-xs text-navy/55">{hint}</p> : null}
    </article>
  );
}

export function StatusPill({
  tone = "navy",
  children,
}: {
  tone?: "navy" | "gold" | "warn" | "ok" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    navy: "bg-navy text-cream",
    gold: "bg-gold text-navy",
    warn: "bg-amber-100 text-amber-900",
    ok: "bg-emerald-100 text-emerald-900",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
