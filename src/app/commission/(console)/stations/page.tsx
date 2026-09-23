import { StationConsole } from "@/components/commission/StationConsole";
import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { memberDirectory } from "@/lib/format";
import { isAllowedNow, ROLE_LABELS } from "@/lib/permissions";
import { COMMISSION_MEMBERS } from "@/lib/seed";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";
import { AssignForm } from "@/components/commission/AssignForm";

export const metadata = { title: "Electoral units & stations" };
export const dynamic = "force-dynamic";

export default async function StationsPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const members = memberDirectory();
  const canAssign = isAllowedNow(session.role!, "assign_polling_stations", store.election.stage);
  const canOperate = isAllowedNow(session.role!, "station_operations", store.election.stage);
  const mine = store.pollingStations.find((station) => session.pollingStationIds?.includes(station.id));

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Electoral units" title="Polling stations & assignments">
        Commission administration assigns who goes where. The assigned
        commissioner administers what happens at that station. Chair and Vice
        Chair do not sit as clerks at every campus.
      </PageHeader>

      {mine ? <StationConsole station={mine} canOperate={canOperate} /> : null}

      <section className="grid gap-4 md:grid-cols-2">
        {store.pollingStations.map((station) => {
          const assigned = store.assignments.filter((item) => item.stationId === station.id && item.active);
          const people = assigned.map((item) => members.find((member) => member.id === item.memberId)).filter(Boolean);
          return (
            <article key={station.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-gold">{station.code}</p>
                  <h2 className="font-serif text-2xl text-navy">{station.name}</h2>
                </div>
                <StatusPill tone={station.status === "OPEN" ? "ok" : station.status === "CLOSED" ? "navy" : "warn"}>
                  {station.status.replaceAll("_", " ")}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm text-navy/60">Votes cast: {station.votesCast}</p>
              <ul className="mt-3 text-sm">
                {people.map((member) => (
                  <li key={member!.id}>
                    {member!.fullName} · {ROLE_LABELS[member!.role]}
                  </li>
                ))}
                {people.length === 0 ? <li className="text-navy/45">No active assignment</li> : null}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Assignments</h2>
        {canAssign ? (
          <AssignForm
            members={COMMISSION_MEMBERS.filter((member) => member.role === "COMMISSIONER").map((member) => {
              const person = members.find((item) => item.id === member.id)!;
              return { id: member.id, label: `${person.fullName} · ${person.workId}` };
            })}
            stations={store.pollingStations.map((station) => ({ id: station.id, label: station.name }))}
          />
        ) : (
          <p className="mt-2 text-sm text-navy/60">Assignment is a central Commission administration function.</p>
        )}
        <h3 className="mt-6 text-sm font-semibold text-navy">History</h3>
        <ul className="mt-2 divide-y divide-navy/10 text-sm">
          {store.assignments.map((item) => {
            const person = members.find((member) => member.id === item.memberId);
            const station = store.pollingStations.find((row) => row.id === item.stationId);
            return (
              <li key={item.id} className="py-2">
                {person?.fullName} → {station?.name} · {item.active ? "active" : "ended"} · {item.assignedBy}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
