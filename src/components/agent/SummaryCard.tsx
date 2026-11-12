export function SummaryCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_8px_24px_rgba(24,43,92,0.04)]">
      <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">{label}</p>
      <p className="mt-2 font-serif text-2xl text-navy">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-navy/60">{hint}</p> : null}
      {children}
    </article>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-6">
      <h2 className="font-serif text-2xl text-navy">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-navy/70">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="text-[11px] font-semibold tracking-[0.16em] text-navy/50 uppercase">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1 text-xs text-navy/50">{hint}</p> : null}
    </label>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy outline-none transition focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-gold/70";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 text-xs font-bold tracking-[0.16em] text-cream uppercase transition hover:bg-navy-mid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-navy/15 bg-white px-5 py-3 text-xs font-bold tracking-[0.16em] text-navy uppercase transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40";
