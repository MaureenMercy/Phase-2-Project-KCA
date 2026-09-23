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
      <header>
        <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">Accountability</p>
        <h1 className="font-serif text-4xl text-navy">Audit trail</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">
          This is the electoral action log. It is not the server, backup, or
          security-operations log used by ICT.
        </p>
      </header>

      <ol className="rounded-sm border border-navy/10 bg-white">
        {store.auditLog.map((event) => (
          <li key={event.id} className="border-b border-navy/10 px-5 py-4 last:border-b-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-navy">{event.action.replaceAll("_", " ")}</p>
              <p className="text-xs text-navy/45">{formatDateTime(event.at)}</p>
            </div>
            <p className="mt-1 text-sm text-navy/70">{event.detail}</p>
            <p className="mt-1 text-xs text-navy/45">
              {event.actorName} · {event.actorWorkId}
              {event.highRisk ? " · high-risk" : ""}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
