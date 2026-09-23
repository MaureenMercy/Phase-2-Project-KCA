import Link from "next/link";
import { ElectionConfigForm } from "@/components/commission/ElectionConfigForm";
import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { resolveUnits, validateElection1Readiness } from "@/lib/electoral";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Election management" };
export const dynamic = "force-dynamic";

export default async function ElectionOverviewPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const canEdit = isAllowedNow(session.role!, "configure_election", store.election.stage);
  const issues = validateElection1Readiness(store);
  const units = resolveUnits(store);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Election management" title={store.election.name}>
        Control room for the electoral lifecycle — not technical infrastructure.
        Election 1 elects delegates. The SAKU leadership election is a second
        stage whose electorate is generated from those results.
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/commission/election/election-1" className="rounded-2xl border border-navy/10 bg-white/90 p-6 hover:border-gold">
          <StatusPill>Election 1</StatusPill>
          <h2 className="mt-3 font-serif text-2xl text-navy">Electoral College</h2>
          <p className="mt-2 text-sm leading-6 text-navy/65">
            Eligible KCA students elect delegates from their own electoral unit.
            {units.filter((unit) => unit.delegateSeats === null).length} units still have unconfigured seats.
          </p>
        </Link>
        <Link href="/commission/election/leadership" className="rounded-2xl border border-navy/10 bg-white/90 p-6 hover:border-gold">
          <StatusPill tone="gold">Election 2</StatusPill>
          <h2 className="mt-3 font-serif text-2xl text-navy">SAKU Leadership</h2>
          <p className="mt-2 text-sm leading-6 text-navy/65">
            Closed delegate election. Register status: {store.electoralCollege.status.replaceAll("_", " ")}.
            No manual second electorate is created.
          </p>
        </Link>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Election configuration</h2>
        <p className="mt-1 text-sm text-navy/60">
          Create or load the election. IP addresses and server settings stay with ICT.
        </p>
        <div className="mt-5">
          <ElectionConfigForm
            name={store.election.name}
            contest={store.election.contest}
            electionDate={store.election.electionDate}
            startTime={store.election.startTime}
            endTime={store.election.endTime}
            canEdit={canEdit}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Readiness for opening</h2>
        {issues.length === 0 ? (
          <p className="mt-2 text-sm text-navy/70">Every active Election 1 unit has a configured seat allocation and valid mappings.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-navy/70">
            {issues.slice(0, 8).map((issue) => (
              <li key={`${issue.code}-${issue.unitId ?? issue.message}`}>{issue.message}</li>
            ))}
            {issues.length > 8 ? <li>…and {issues.length - 8} more.</li> : null}
          </ul>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="text-sm font-semibold text-navy underline" href="/commission/election/results">
            Results & declaration
          </Link>
          <Link className="text-sm font-semibold text-navy underline" href="/elector">
            Preview Election 1 voting desk
          </Link>
          <Link className="text-sm font-semibold text-navy underline" href="/vote">
            Preview Cabinet voting desk
          </Link>
        </div>
      </section>
    </div>
  );
}
