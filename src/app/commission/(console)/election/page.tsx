import Link from "next/link";
import { ActionButton } from "@/components/commission/ActionButton";
import { CloseElectionForm } from "@/components/commission/CloseElectionForm";
import { ElectionConfigForm } from "@/components/commission/ElectionConfigForm";
import { PageHeader, StatCard, StatusPill } from "@/components/commission/PageHeader";
import {
  advanceResultsWorkflow,
  finalizeElection1Results,
  generateElectoralCollege,
  verifyElectoralCollege,
} from "@/lib/actions/election";
import { authorizeElectionOpening } from "@/lib/actions/auth";
import { readElectionContext } from "@/lib/election-context";
import { contextElection, election1, election2, liveTotalsHidden } from "@/lib/elections";
import { resolveUnits, validateElection1Readiness } from "@/lib/electoral";
import { formatNumber } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { ELECTION_1_ID, ELECTION_2_ID } from "@/lib/seed-electorate";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Election management" };
export const dynamic = "force-dynamic";

export default async function ElectionOverviewPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const context = await readElectionContext(store);
  const active = contextElection(store);
  const first = election1(store);
  const second = election2(store);
  const canEdit = isAllowedNow(session.role!, "configure_election", active.stage);
  const canOpen = isAllowedNow(session.role!, "authorize_election_opening", active.stage);
  const canClose = isAllowedNow(session.role!, "authorize_election_closing", active.stage);
  const issues = validateElection1Readiness(store);
  const units = resolveUnits(store);
  const results = store.resultsByElection.find((item) => item.electionId === active.id);
  const hideTotals = liveTotalsHidden(active);
  const stations = store.stationElectionState.filter((item) => item.electionId === active.id);
  const openStations = stations.filter((item) => item.status === "OPEN").length;
  const voted =
    active.contest === "ELECTION_1_DELEGATE"
      ? store.studentElectors.filter((item) => item.election1VotingStatus === "voted").length
      : store.electoralCollege.entries.filter((item) => item.electorStatus === "voted").length;
  const electorate =
    active.contest === "ELECTION_1_DELEGATE"
      ? store.studentElectors.filter((item) => item.election1Eligibility === "eligible").length
      : store.electoralCollege.entries.length;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Election management" title={active.name}>
        One Commission dashboard administers both elections. Election 1 elects
        delegates. The Electoral College is a generated register, not a third
        election. Election 2 uses only authorised elected delegates.
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/commission/election/election-1" className="rounded-2xl border border-navy/10 bg-white/90 p-6 hover:border-gold">
          <StatusPill tone={first.stage === "VOTING" ? "ok" : "navy"}>Election 1</StatusPill>
          <h2 className="mt-3 font-serif text-2xl text-navy">Delegates Election</h2>
          <p className="mt-2 text-sm leading-6 text-navy/65">
            {units.length} Electoral Colleges · {formatNumber(store.studentElectors.length)} mock student electors · stage {first.stage.replaceAll("_", " ")}.
          </p>
        </Link>
        <Link href="/commission/election/election-1?tab=college" className="rounded-2xl border border-navy/10 bg-white/90 p-6 hover:border-gold">
          <StatusPill tone={store.electoralCollege.status === "active" ? "ok" : "gold"}>Electoral College</StatusPill>
          <h2 className="mt-3 font-serif text-2xl text-navy">Generated register</h2>
          <p className="mt-2 text-sm leading-6 text-navy/65">
            Version {store.electoralCollege.version} · {store.electoralCollege.status.replaceAll("_", " ")} · {store.electoralCollege.entries.length} electors.
          </p>
        </Link>
        <Link href="/commission/election/leadership" className="rounded-2xl border border-navy/10 bg-white/90 p-6 hover:border-gold">
          <StatusPill tone={second.stage === "VOTING" ? "ok" : "gold"}>Election 2</StatusPill>
          <h2 className="mt-3 font-serif text-2xl text-navy">SAKU Council Election</h2>
          <p className="mt-2 text-sm leading-6 text-navy/65">
            Separate ballot, electorate and results. Stage {second.stage.replaceAll("_", " ")}.
          </p>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active election" value={active.shortName} hint={active.stage.replaceAll("_", " ")} />
        <StatCard label="Electorate" value={formatNumber(electorate)} hint={context === "ELECTION_2" ? "Electoral College only" : "Election 1 students"} />
        <StatCard label="Votes submitted" value={formatNumber(voted)} hint="Participation only. No live candidate totals while voting is active." />
        <StatCard label="Stations reporting" value={`${openStations} open`} hint={`${stations.filter((item) => item.status === "CLOSED").length} closed / ${stations.length || 4}`} />
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">Configuration for the active election</h2>
        <p className="mt-1 text-sm text-navy/60">
          Each election keeps its own dates, electorate, candidates and ballot. ICT server controls stay outside this dashboard.
        </p>
        <div className="mt-5">
          <ElectionConfigForm
            name={active.name}
            contest={active.contest}
            electionDate={active.electionDate}
            startTime={active.startTime}
            endTime={active.endTime}
            canEdit={canEdit}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <ActionButton
            label={`Authorize opening of ${active.shortName}`}
            run={authorizeElectionOpening}
            disabled={!canOpen}
            disabledReason="Election-wide opening is reserved for authorised Commission leadership. Configuring a station does not open it."
          />
        </div>
        <div className="mt-6">
          <CloseElectionForm
            electionName={active.name}
            stage={active.stage}
            votesCast={voted}
            registeredElectors={electorate}
            stationsClosed={stations.filter((item) => item.status === "CLOSED").length}
            stationsTotal={stations.length || 4}
            blockingStations={stations.filter((item) => item.status === "OPEN" || item.status === "READY").length}
            canClose={canClose}
          />
        </div>
        {issues.length && context === "ELECTION_1" ? (
          <ul className="mt-4 list-disc pl-5 text-sm text-navy/70">
            {issues.slice(0, 4).map((issue) => (
              <li key={`${issue.code}-${issue.unitId ?? issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {context === "ELECTORAL_COLLEGE" || context === "ELECTION_1" ? (
        <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <h2 className="font-serif text-2xl text-navy">Election 1 results and Electoral College</h2>
          <p className="mt-2 text-sm text-navy/65">
            Generated → Reconciled → Verified → Declaration authorised → Declared → Published.
            Closing does not declare results. The register is generated only from verified elected delegates.
          </p>
          <p className="mt-2 text-sm text-navy/55">
            Current workflow: {results?.workflow.replaceAll("_", " ") ?? "NOT STARTED"}
            {hideTotals ? " · candidate totals hidden while voting is active" : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton label="Generate Election 1 totals" run={finalizeElection1Results} />
            <ActionButton label="Advance results workflow" run={() => advanceResultsWorkflow(ELECTION_1_ID)} />
            <ActionButton label="Generate Electoral College Register" run={generateElectoralCollege} />
            <ActionButton label="Approve register for Election 2" run={verifyElectoralCollege} />
          </div>
        </section>
      ) : null}

      {context === "ELECTION_2" ? (
        <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <h2 className="font-serif text-2xl text-navy">Election 2 results workflow</h2>
          <p className="mt-2 text-sm text-navy/65">
            Separate from Election 1. No manual Add Elector path. Joint President/Vice President ticket is one selection.
          </p>
          <ActionButton label="Advance Election 2 results" run={() => advanceResultsWorkflow(ELECTION_2_ID)} />
        </section>
      ) : null}

      {store.policyFlags.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-serif text-2xl text-navy">Items requiring Commission confirmation</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-navy/75">
            {store.policyFlags.map((flag) => (
              <li key={flag.id}>
                <strong>{flag.topic}.</strong> {flag.detail}
              </li>
            ))}
            {store.namingDiscrepancies.map((item) => (
              <li key={item.officeId}>{item.note}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
