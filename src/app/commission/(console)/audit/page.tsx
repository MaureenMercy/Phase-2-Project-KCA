import { PageHeader } from "@/components/commission/PageHeader";
import { formatDateTime } from "@/lib/format";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Audit trail" };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireAuthorizedSession();
  const store = await readStore();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Accountability" title="Audit trail">
        Electoral actions, structural changes, station events, and emergency
        records. This is not the ICT server, backup, or raw security-operations log.
      </PageHeader>

      <ol className="rounded-2xl border border-navy/10 bg-white/90">
        {store.auditLog.map((event) => (
          <li key={event.id} className="border-b border-navy/10 px-5 py-4 last:border-b-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-navy">{event.action.replaceAll("_", " ")}</p>
              <p className="text-xs text-navy/45">{formatDateTime(event.at)}</p>
            </div>
            <p className="mt-1 text-sm text-navy/70">{event.detail}</p>
            <p className="mt-1 text-xs text-navy/45">
              {event.actorName} · {event.actorWorkId}
              {event.stationId ? ` · ${event.stationId}` : ""}
              {event.entity ? ` · ${event.entity}` : ""}
              {event.highRisk ? " · high-risk" : ""}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
