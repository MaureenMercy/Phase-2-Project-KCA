import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { dashboardFrom, requireRegisteredVoter } from "@/lib/voter-guard";
import { ELECTION2_STATUS_COPY } from "@/lib/voter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Election eligibility" };

export default async function VoterEligibilityPage() {
  const context = await requireRegisteredVoter();
  const model = dashboardFrom(context);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Election Eligibility" title="Which election you may take part in">
        Election 1 and Election 2 have different electorates. Registering as a voter or candidate does not grant Election 2 access.
      </PageHeader>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl text-navy">Election 1 — Delegates Election</h2>
        <p className="mt-1 text-sm text-navy/60">{model.electionOne.name}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill tone={model.election1Eligible ? "ok" : "gold"}>
            {model.election1Eligible ? "Eligible elector" : "Not yet approved as an eligible elector"}
          </StatusPill>
          <StatusPill tone="navy">{model.election1Participation}</StatusPill>
        </div>
        <p className="mt-4 text-sm leading-6 text-navy/70">
          Applicable Electoral College: {model.unitPending ? "Pending authorized configuration" : model.unitLabel ?? "Pending"}.
          You cannot choose a different college.
        </p>
        <p className="mt-2 text-xs text-navy/50">Participation is shown without any candidate selection.</p>
      </article>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl text-navy">Election 2 — SAKU Council Election</h2>
        <p className="mt-1 text-sm text-navy/60">{model.electionTwo.name}</p>
        <p className="mt-4 font-semibold">{ELECTION2_STATUS_COPY[model.election2Status].label}</p>
        <p className="mt-2 text-sm leading-6 text-navy/70">{model.election2Copy.meaning}</p>
        <p className="mt-4 text-sm text-navy/60">
          Election 2 eligibility is derived from the verified Election 1 outcome and the authorized Electoral College Register, not from this registration form.
        </p>
      </article>
    </div>
  );
}
