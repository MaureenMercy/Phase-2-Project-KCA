import { EscalateButton, EvidenceUpload, RecordIncidentForm } from "@/components/commission/IncidentForms";
import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { formatDateTime } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Incident log" };
export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const canRecord = isAllowedNow(session.role!, "record_incidents", store.election.stage) && Boolean(session.pollingStationIds?.[0]);
  const mine = session.pollingStationIds?.[0];
  const incidents = mine
    ? store.incidents.filter((item) => item.stationId === mine)
    : store.incidents;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Election-day operations" title="Incident log">
        Station commissioners record events and evidence. The system does not
        decide whether an incident is a violation. Evidence receives an audit
        reference for later investigation or dispute.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <h2 className="font-serif text-2xl text-navy">Record</h2>
          <p className="mt-1 text-xs text-navy/50">
            Station is taken from your assignment. You do not choose a campus.
          </p>
          <div className="mt-4">
            <RecordIncidentForm canRecord={canRecord} />
          </div>
        </section>

        <section className="space-y-4">
          {incidents.length === 0 ? (
            <p className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm text-navy/60">
              No incidents recorded {mine ? "for your station" : "yet"}.
            </p>
          ) : (
            incidents.map((incident) => {
              const station = store.pollingStations.find((item) => item.id === incident.stationId);
              return (
                <article key={incident.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-gold">{incident.reference}</p>
                      <h3 className="font-serif text-xl text-navy">{station?.name}</h3>
                    </div>
                    <StatusPill tone={incident.status === "escalated" ? "danger" : "warn"}>
                      {incident.status}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-navy/70">{incident.description}</p>
                  <p className="mt-2 text-xs text-navy/45">
                    {incident.reportedByName} · {formatDateTime(incident.recordedAt)} · {incident.category}
                  </p>
                  <ul className="mt-3 text-xs text-navy/60">
                    {incident.evidence.map((item) => (
                      <li key={item.id}>{item.reference} · {item.filename}</li>
                    ))}
                  </ul>
                  {canRecord ? <EvidenceUpload incidentId={incident.id} /> : null}
                  <div className="mt-3">
                    <EscalateButton incidentId={incident.id} />
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
