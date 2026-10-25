export function AnalyticsBars({
  title,
  hint,
  rows,
}: {
  title: string;
  hint?: string;
  rows: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
      <h2 className="font-serif text-2xl text-navy">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-navy/50">{hint}</p> : null}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-navy/55">No stored ballots for this chart yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-navy">{row.label}</span>
                <span className="text-navy/60">{row.value}</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-3 rounded-full bg-gold"
                  style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
