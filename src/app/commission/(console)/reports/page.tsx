import { PageHeader } from "@/components/commission/PageHeader";
import { resolveUnits } from "@/lib/electoral";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireAuthorizedSession();
  const store = await readStore();
  const units = resolveUnits(store);
  const byUnit = units.map((unit) => ({
    unit,
    incidents: store.incidents.filter((item) => {
      const station = store.pollingStations.find((row) => row.id === item.stationId);
      return station?.campusId === unit.campusId;
    }).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reports" title="Electoral reporting sources">
        Incident, turnout, and candidate records feed reports. The system
        preserves the operational record; it does not write a legal judgment.
      </PageHeader>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Election incident summary</h2>
        <p className="mt-1 text-sm text-navy/60">
          Total incidents: {store.incidents.length}. Generated from the four
          station logs.
        </p>
        <ul className="mt-4 divide-y divide-navy/10 text-sm">
          {store.pollingStations.map((station) => (
            <li key={station.id} className="flex justify-between py-2">
              <span>{station.name}</span>
              <span>{store.incidents.filter((item) => item.stationId === station.id).length}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Turnout</h2>
        <p className="mt-2 text-sm text-navy/70">
          {store.studentElectors.filter((item) => item.voterStatus === "voted").length} /{" "}
          {store.studentElectors.length} Election 1 electors · {store.cabinetVotes.length} Cabinet ballots
        </p>
        <p className="mt-2 text-xs text-navy/45">{byUnit.length} electoral units in the official structure.</p>
      </section>
    </div>
  );
}
