import { ModuleSubnav, PageHeader, StatCard } from "@/components/commission/PageHeader";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Accessibility" };
export const dynamic = "force-dynamic";

const CATEGORIES = ["visual", "hearing", "mobility", "cognitive", "other"] as const;

export default async function AccessibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const { tab: rawTab } = await searchParams;
  const tab = rawTab ?? "overview";
  const assigned = store.pollingStations.find((station) => session.pollingStationIds?.includes(station.id));
  const declared = store.studentElectors.filter((student) => student.accessibility.declared);
  const scoped =
    session.role === "COMMISSIONER" && assigned
      ? declared.filter((student) => student.campusId === assigned.campusId)
      : declared;

  const byCategory = CATEGORIES.map((category) => ({
    category,
    count: scoped.filter((student) => student.accessibility.categories.includes(category)).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Accessibility" title="Polling-station accommodation">
        Retrieved from voluntary voter-registration declarations. This module does not create a second voter
        database and does not change eligibility or the ballot received.
      </PageHeader>
      <ModuleSubnav
        current={`/commission/accessibility${tab === "overview" ? "" : `?tab=${tab}`}`}
        items={[
          { href: "/commission/accessibility", label: "Overview" },
          { href: "/commission/accessibility?tab=students", label: "Students requiring assistance" },
          { href: "/commission/accessibility?tab=readiness", label: "Accommodation readiness" },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Students declaring needs" value={String(scoped.length)} hint="Mock prototype figures" />
        <StatCard
          label="Campuses covered"
          value={String(new Set(scoped.map((student) => student.campusId)).size)}
        />
        {byCategory.map((item) => (
          <StatCard key={item.category} label={`${item.category} assistance`} value={String(item.count)} />
        ))}
      </section>

      {tab === "overview" || tab === "students" ? (
        <section className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/90">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
              <tr>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3">Reg. no.</th>
                <th className="px-4 py-3">Accommodation required</th>
              </tr>
            </thead>
            <tbody>
              {scoped.map((student) => (
                <tr key={student.id} className="border-t border-navy/10">
                  <td className="px-4 py-3">
                    {store.campuses.find((item) => item.id === student.campusId)?.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{student.studentId}</td>
                  <td className="px-4 py-3">{student.accessibility.accommodations.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-navy/50">
            Individual medical diagnoses are not collected. Names are omitted from this operational table where a
            practical accommodation instruction is sufficient.
          </p>
        </section>
      ) : null}

      {tab === "readiness" ? (
        <section className="grid gap-4 md:grid-cols-2">
          {store.accessibilityReadiness.map((item) => {
            const campus = store.campuses.find((row) => row.id === item.campusId);
            return (
              <article key={item.stationId} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
                <h3 className="font-serif text-xl text-navy">{campus?.name}</h3>
                <p className="mt-2 text-sm text-navy/65">
                  {item.preparedCount} prepared · {item.outstandingCount} outstanding
                </p>
                <p className="mt-2 text-xs text-navy/50">{item.notes}</p>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
