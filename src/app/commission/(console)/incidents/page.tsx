import {
  ClassifyButtons,
  EscalateButton,
  EvidenceUpload,
  LinkIncidentForm,
  RecordIncidentForm,
} from "@/components/commission/IncidentForms";
import { ModuleSubnav, PageHeader, StatCard, StatusPill } from "@/components/commission/PageHeader";
import { formatDateTime } from "@/lib/format";
import { INCIDENT_SOURCES, scopedIncidents } from "@/lib/incidents";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Central incident log" };
export const dynamic = "force-dynamic";

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; source?: string }>;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const { tab: rawTab, source } = await searchParams;
  const tab = rawTab === "evidence" ? "evidence" : rawTab === "escalations" ? "escalations" : rawTab === "reports" ? "reports" : "records";
  const canRecord =
    isAllowedNow(session.role!, "record_incidents", store.election.stage) && Boolean(session.pollingStationIds?.[0]);
  const canClassify = isAllowedNow(session.role!, "view_incidents", store.election.stage);
  const incidents = scopedIncidents(store, session).filter((item) => {
    if (source === "agent") return item.reporterKind === "agent";
    if (source === "commission") return item.reporterKind === "commission";
    return true;
  });
  const evidence = incidents.flatMap((item) =>
    item.evidence.map((file) => ({ ...file, incident: item })),
  );
  const escalated = incidents.filter((item) => item.status === "escalated");

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Incidents & escalations" title="Central incident log">
        Four campus Commissioners and accredited election agents independently feed one Commission log.
        Original reports are preserved. Agents cannot classify, officially escalate, or close incidents.
      </PageHeader>
      <ModuleSubnav
        current={`/commission/incidents${tab === "records" ? "" : `?tab=${tab}`}`}
        items={[
          { href: "/commission/incidents", label: "Incident records" },
          { href: "/commission/incidents?tab=evidence", label: "Evidence" },
          { href: "/commission/incidents?tab=escalations", label: "Escalations" },
          { href: "/commission/incidents?tab=reports", label: "Incident reports" },
        ]}
      />

      <section className="rounded-2xl border border-navy/10 bg-navy p-5 text-cream">
        <p className="text-center text-[10px] tracking-[0.2em] text-gold uppercase">Sources of incident data</p>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {INCIDENT_SOURCES.map((item) => {
            const count =
              item.kind === "agent"
                ? incidents.filter((row) => row.reporterKind === "agent").length
                : incidents.filter((row) => row.stationId === item.id && row.reporterKind === "commission").length;
            return (
              <article key={item.id} className="rounded-2xl bg-[#182B5C] px-3 py-3 text-center ring-1 ring-gold/30">
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="mt-1 text-[10px] tracking-wide text-gold uppercase">
                  {item.kind === "agent" ? "Accredited agents" : "Electoral Commission"} · {count}
                </p>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-gold/80">All sources write to this central incident log.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Records in scope" value={String(incidents.length)} />
        <StatCard label="Agent-originated" value={String(incidents.filter((item) => item.reporterKind === "agent").length)} />
        <StatCard label="Photographs / videos" value={String(evidence.filter((item) => item.kind !== "document").length)} />
        <StatCard label="Escalated" value={String(escalated.length)} />
      </section>

      {tab === "records" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
            <h2 className="font-serif text-2xl text-navy">Record from assigned station</h2>
            <p className="mt-1 text-xs text-navy/50">
              Campus Commissioners record only at their assigned station. Chair, Vice Chair and Secretary General review the consolidated log.
            </p>
            <div className="mt-4">
              <RecordIncidentForm canRecord={canRecord} />
            </div>
          </section>
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <a className="rounded-full border border-navy/15 px-3 py-1" href="/commission/incidents">
                All sources
              </a>
              <a className="rounded-full border border-navy/15 px-3 py-1" href="/commission/incidents?source=commission">
                Commission
              </a>
              <a className="rounded-full border border-navy/15 px-3 py-1" href="/commission/incidents?source=agent">
                Accredited agents
              </a>
            </div>
            {incidents.map((incident) => {
              const station = store.pollingStations.find((item) => item.id === incident.stationId);
              const linked = incidents.filter(
                (item) =>
                  item.id !== incident.id &&
                  (item.id === incident.linkedIncidentId ||
                    item.linkedIncidentId === incident.id ||
                    (incident.linkedIncidentId && item.linkedIncidentId === incident.linkedIncidentId)),
              );
              return (
                <article key={incident.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-gold">{incident.reference}</p>
                      <h3 className="font-serif text-xl text-navy">{station?.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <StatusPill tone={incident.reporterKind === "agent" ? "gold" : "navy"}>
                        {incident.reporterKind === "agent" ? "Agent report" : "Commissioner report"}
                      </StatusPill>
                      <StatusPill tone={incident.status === "escalated" ? "danger" : incident.status === "closed" ? "ok" : "warn"}>
                        {incident.status}
                      </StatusPill>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-navy/70">{incident.description}</p>
                  <p className="mt-2 text-xs text-navy/45">
                    {incident.reportedByName} · {formatDateTime(incident.recordedAt)} · {incident.category}
                  </p>
                  {linked.length ? (
                    <p className="mt-2 text-xs text-navy/60">
                      Linked independent reports: {linked.map((item) => item.reference).join(", ")}
                    </p>
                  ) : null}
                  <ul className="mt-3 text-xs text-navy/60">
                    {incident.evidence.map((item) => (
                      <li key={item.id}>
                        {item.kind} · {item.reference} · {item.filename}
                      </li>
                    ))}
                  </ul>
                  {canRecord ? <EvidenceUpload incidentId={incident.id} /> : null}
                  {canClassify ? (
                    <div className="mt-3 space-y-2">
                      <ClassifyButtons incidentId={incident.id} />
                      <EscalateButton incidentId={incident.id} />
                      <LinkIncidentForm
                        incidentId={incident.id}
                        options={incidents
                          .filter((item) => item.id !== incident.id)
                          .map((item) => ({ id: item.id, label: `${item.reference} · ${item.reportedByName}` }))}
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        </div>
      ) : null}

      {tab === "evidence" ? (
        <section className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/90">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
              <tr>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Incident</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">File</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((item) => (
                <tr key={item.id} className="border-t border-navy/10">
                  <td className="px-4 py-3">{item.kind}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                  <td className="px-4 py-3">{item.incident.reference}</td>
                  <td className="px-4 py-3">{item.incident.reporterKind}</td>
                  <td className="px-4 py-3">{item.filename}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "escalations" ? (
        <section className="space-y-3">
          {escalated.map((item) => (
            <article key={item.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
              <p className="font-mono text-xs text-gold">{item.reference}</p>
              <p className="mt-1 text-sm">{item.description}</p>
              <p className="mt-2 text-xs text-navy/50">{item.escalationNote}</p>
            </article>
          ))}
          {escalated.length === 0 ? (
            <p className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm text-navy/60">No official escalations in this scope.</p>
          ) : null}
        </section>
      ) : null}

      {tab === "reports" ? (
        <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <h2 className="font-serif text-2xl text-navy">Incident reports</h2>
          <p className="mt-1 text-sm text-navy/60">
            Operational summary from the central log. This is not a legal judgment.
          </p>
          <ul className="mt-4 divide-y divide-navy/10 text-sm">
            {store.pollingStations.map((station) => {
              const rows = incidents.filter((item) => item.stationId === station.id);
              return (
                <li key={station.id} className="flex justify-between py-2">
                  <span>{station.name}</span>
                  <span>
                    {rows.length} records · {rows.filter((item) => item.reporterKind === "agent").length} agent ·{" "}
                    {rows.filter((item) => item.status === "escalated").length} escalated
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
