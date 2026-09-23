import { EmergencyForm } from "@/components/commission/EmergencyForm";
import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { formatDateTime } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";
import { redirect } from "next/navigation";

export const metadata = { title: "Emergency election control" };
export const dynamic = "force-dynamic";

export default async function EmergencyPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const canInitiate = isAllowedNow(session.role!, "initiate_emergency", store.election.stage);
  const canAuthorize = isAllowedNow(session.role!, "authorize_emergency", store.election.stage);
  if (!canInitiate && !canAuthorize) redirect("/commission/dashboard");

  const pending = store.emergencies.find((item) => item.status === "pending_authorization") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Restricted control" title="Emergency election control">
        Only the Chair and Vice Chair may use this function, and two-person
        authorization is required. A pause stops voting. The database, audit
        trail, and technical infrastructure continue operating. Legal may later
        read the record; it does not control the pause.
      </PageHeader>

      <section className="rounded-2xl border border-red-200 bg-white/90 p-6">
        <StatusPill tone={store.election.emergencyStatus === "PAUSED" ? "danger" : "ok"}>
          Election is {store.election.emergencyStatus}
        </StatusPill>
        <div className="mt-5">
          <EmergencyForm
            canInitiate={canInitiate}
            canAuthorize={canAuthorize}
            pendingId={pending?.id ?? null}
            isInitiator={pending?.initiatedByWorkId === session.workId}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Emergency history</h2>
        <ol className="mt-4 space-y-4">
          {store.emergencies.length === 0 ? (
            <li className="text-sm text-navy/50">No emergency actions recorded.</li>
          ) : (
            store.emergencies.map((item) => (
              <li key={item.id} className="border-b border-navy/10 pb-4 text-sm">
                <p className="font-semibold text-navy">
                  {item.kind} · {item.status.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-navy/70">{item.reason}</p>
                <p className="mt-1 text-xs text-navy/45">
                  Initiated by {item.initiatedByName} at {formatDateTime(item.initiatedAt)}
                  {item.authorizedByName
                    ? ` · Authorized by ${item.authorizedByName} at ${formatDateTime(item.authorizedAt)}`
                    : " · Awaiting second authorization"}
                </p>
                <p className="text-xs text-navy/45">
                  Status before: {item.statusBefore}
                  {item.statusAfter ? ` · after: ${item.statusAfter}` : ""}
                </p>
              </li>
            ))
          )}
        </ol>
      </section>
    </div>
  );
}
