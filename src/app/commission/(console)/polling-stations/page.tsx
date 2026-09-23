import { memberDirectory } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Polling stations" };
export const dynamic = "force-dynamic";

export default async function PollingStationsPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const members = memberDirectory();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">Field</p>
        <h1 className="font-serif text-4xl text-navy">Polling stations</h1>
        <p className="mt-2 text-sm text-navy/65">
          Commissioners are assigned to stations. Chair, Vice Chair, and
          Secretary General retain oversight of all stations.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {store.pollingStations.map((station) => {
          const assigned = members.filter((member) =>
            member.pollingStationIds.includes(station.id),
          );
          const mine = session.pollingStationIds?.includes(station.id);
          return (
            <article
              key={station.id}
              className={`rounded-sm border bg-white p-5 ${mine ? "border-gold" : "border-navy/10"}`}
            >
              <p className="font-mono text-xs text-gold">{station.code}</p>
              <h2 className="mt-1 font-serif text-2xl text-navy">{station.name}</h2>
              <p className="text-sm text-navy/55">{station.campus}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {assigned.map((member) => (
                  <li key={member.id}>
                    {member.fullName} · {ROLE_LABELS[member.role]}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
