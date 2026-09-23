import { ActionButton } from "@/components/commission/ActionButton";
import { ModuleSubnav, PageHeader, StatCard } from "@/components/commission/PageHeader";
import { approveVoterRegister } from "@/lib/actions/auth";
import { resolveUnits } from "@/lib/electoral";
import { formatDateTime, formatNumber } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Voter management" };
export const dynamic = "force-dynamic";

export default async function VotersPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const canApprove = isAllowedNow(session.role!, "approve_voter_register", store.election.stage);
  const units = resolveUnits(store);
  const assigned = store.pollingStations.find((station) => session.pollingStationIds?.includes(station.id));

  const byCampus = store.campuses.map((campus) => ({
    campus,
    count: store.studentElectors.filter((student) => student.campusId === campus.id).length,
    voted: store.studentElectors.filter((student) => student.campusId === campus.id && student.voterStatus === "voted").length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Voter management" title="Voter register">
        Prototype register: mock first-year students. Eligibility that would
        depend on live university systems is suspended. The student never chooses
        a school or department.
      </PageHeader>
      <ModuleSubnav
        current="/commission/voters"
        items={[
          { href: "/commission/voters", label: "Register" },
          { href: "/commission/election/election-1?tab=electors", label: "Eligibility" },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Version" value={store.voterRegister.version} hint={`Status: ${store.voterRegister.status}`} />
        <StatCard label="Eligible electors" value={formatNumber(store.studentElectors.length)} hint={`${units.length} electoral units`} />
        <article className="rounded-2xl border border-navy/10 bg-white/90 p-5">
          <p className="text-sm text-navy/70">
            Submitted {formatDateTime(store.voterRegister.submittedAt)}. Last approved
            by {store.voterRegister.approvedBy ?? "—"} on {formatDateTime(store.voterRegister.approvedAt)}.
          </p>
          <div className="mt-4">
            <ActionButton
              label="Approve register"
              run={approveVoterRegister}
              disabled={!canApprove}
              disabledReason={
                session.role === "COMMISSIONER"
                  ? "Commissioners do not hold final voter-register approval."
                  : "The register can only be approved during the registration period."
              }
            />
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Per-station breakdown</h2>
        <ul className="mt-4 divide-y divide-navy/10 text-sm">
          {byCampus.map((row) => (
            <li key={row.campus.id} className="flex justify-between py-3">
              <span>
                {row.campus.name}
                {assigned?.campusId === row.campus.id ? " · your assignment" : ""}
              </span>
              <span>
                {row.voted} voted / {row.count} eligible
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
