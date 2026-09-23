import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { formatDateTime } from "@/lib/format";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Legal & disputes" };
export const dynamic = "force-dynamic";

export default async function LegalPage() {
  await requireAuthorizedSession();
  const store = await readStore();
  const escalated = store.incidents.filter((item) => item.status === "escalated");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Legal & disputes" title="Evidence, not adjudication">
        The election system preserves operational records that can support a
        later investigation. It does not decide the legal outcome. Legal may
        read emergency and incident evidence; it cannot control a pause.
      </PageHeader>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Escalated incidents</h2>
        {escalated.length === 0 ? (
          <p className="mt-2 text-sm text-navy/60">No incidents have been referred to this process.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {escalated.map((item) => (
              <li key={item.id} className="border-b border-navy/10 pb-3">
                <p className="font-mono text-xs text-gold">{item.reference}</p>
                <p className="text-sm text-navy">{item.description}</p>
                <p className="text-xs text-navy/45">
                  {item.reportedByName} · {formatDateTime(item.recordedAt)} · {item.evidence.length} evidence file(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Emergency records</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {store.emergencies.map((item) => (
            <li key={item.id}>
              <StatusPill tone="danger">{item.kind}</StatusPill>{" "}
              {item.reason} · {item.status.replaceAll("_", " ")}
            </li>
          ))}
          {store.emergencies.length === 0 ? <li className="text-navy/50">None.</li> : null}
        </ul>
      </section>
    </div>
  );
}
