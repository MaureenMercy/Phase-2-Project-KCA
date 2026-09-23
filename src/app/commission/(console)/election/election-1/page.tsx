import { ActionButton } from "@/components/commission/ActionButton";
import { CampusSeatForm } from "@/components/commission/CampusSeatForm";
import { SeatConfigForm } from "@/components/commission/SeatConfigForm";
import { ModuleSubnav, PageHeader, StatusPill } from "@/components/commission/PageHeader";
import {
  applyDemonstrationTallies,
  finalizeElection1Results,
  generateElectoralCollege,
  verifyElectoralCollege,
} from "@/lib/actions/election";
import { candidatesForUnit, resolveUnits, unitLabel } from "@/lib/electoral";
import { formatNumber } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Election 1 — Delegate Election" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "electors", label: "Eligible student electors" },
  { id: "structure", label: "Electoral structure" },
  { id: "candidates", label: "Delegate candidates" },
  { id: "ballot", label: "Ballot structure" },
  { id: "voting", label: "Voting status" },
  { id: "results", label: "Results" },
  { id: "college", label: "Electoral College Register" },
] as const;

export default async function Election1Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; campus?: string }>;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const { tab: rawTab, campus } = await searchParams;
  const tab = TABS.some((item) => item.id === rawTab) ? rawTab! : "overview";
  const units = resolveUnits(store);
  const campusFilter = campus ?? "all";
  const campuses = store.campuses;
  const filtered = campusFilter === "all" ? units : units.filter((unit) => unit.campusId === campusFilter);
  const canSeats = isAllowedNow(session.role!, "configure_delegate_seats", store.election.stage);
  const canRegister = isAllowedNow(session.role!, "approve_voter_register", store.election.stage);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Election 1" title="Delegate Election">
        Students vote only for approved delegate candidates in their own
        electoral unit. The system derives school and department. Seat numbers
        stay unconfigured until the Commission enters an authoritative allocation.
      </PageHeader>

      <ModuleSubnav
        current={`/commission/election/election-1?tab=${tab}`}
        items={TABS.map((item) => ({
          href: `/commission/election/election-1?tab=${item.id}`,
          label: item.label,
        }))}
      />

      {tab === "overview" ? (
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-navy/10 bg-white/90 p-5">
            <p className="text-xs text-navy/40 uppercase">Electors</p>
            <p className="font-serif text-4xl text-navy">{formatNumber(store.studentElectors.length)}</p>
            <p className="text-xs text-navy/55">Mock first-year students. No live ERP.</p>
          </article>
          <article className="rounded-2xl border border-navy/10 bg-white/90 p-5">
            <p className="text-xs text-navy/40 uppercase">Units needing seats</p>
            <p className="font-serif text-4xl text-navy">{units.filter((unit) => unit.delegateSeats === null).length}</p>
            <p className="text-xs text-navy/55">No default of 3. Nothing is inferred.</p>
          </article>
          <article className="rounded-2xl border border-navy/10 bg-white/90 p-5">
            <p className="text-xs text-navy/40 uppercase">Approved delegates</p>
            <p className="font-serif text-4xl text-navy">{store.delegateCandidates.filter((item) => item.approvalStatus === "approved").length}</p>
          </article>
        </section>
      ) : null}

      {tab === "electors" ? (
        <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/90">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3">School / department</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {store.studentElectors.map((student) => {
                const unit = units.find(
                  (item) =>
                    item.campusId === student.campusId &&
                    item.schoolId === student.schoolId &&
                    (item.departmentId ?? null) === (student.departmentId ?? null),
                );
                return (
                  <tr key={student.id} className="border-t border-navy/10">
                    <td className="px-4 py-3 font-mono text-xs">{student.studentId}</td>
                    <td className="px-4 py-3 font-semibold text-navy">{student.fullName}</td>
                    <td className="px-4 py-3">{unit?.campusName}</td>
                    <td className="px-4 py-3">{unit ? `${unit.schoolName}${unit.departmentName ? ` · ${unit.departmentName}` : ""}` : "Unmapped"}</td>
                    <td className="px-4 py-3 capitalize">{student.voterStatus.replace("_", " ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "structure" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <a href="/commission/election/election-1?tab=structure" className={chip(campusFilter === "all")}>All campuses</a>
            {campuses.map((item) => (
              <a
                key={item.id}
                href={`/commission/election/election-1?tab=structure&campus=${item.id}`}
                className={chip(campusFilter === item.id)}
              >
                {item.name}
              </a>
            ))}
          </div>
          {canSeats ? (
            <CampusSeatForm
              campusId={campusFilter === "all" ? undefined : campusFilter}
              campusName={
                campusFilter === "all"
                  ? "all remaining units"
                  : campuses.find((item) => item.id === campusFilter)?.name ?? "campus"
              }
            />
          ) : null}
          {filtered.map((unit) => (
            <article key={unit.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-navy/40">{unit.campusName}</p>
                  <h3 className="font-serif text-2xl text-navy">{unit.schoolName}</h3>
                  {unit.departmentName ? <p className="text-sm text-navy/70">{unit.departmentName}</p> : (
                    <p className="text-xs text-navy/45">No department specified for this campus school — that is intentional.</p>
                  )}
                  <p className="mt-2 text-xs text-navy/50">
                    Programmes: none supplied in the official structure. Mappings are not invented.
                  </p>
                </div>
                <StatusPill tone={unit.delegateSeats ? "ok" : "warn"}>
                  {unit.delegateSeats ? `${unit.delegateSeats} seats · ${unit.seatStatus}` : "Needs seat configuration"}
                </StatusPill>
              </div>
              <div className="mt-4">
                <SeatConfigForm
                  unitId={unit.id}
                  current={unit.delegateSeats}
                  canEdit={canSeats}
                  canApprove={canSeats && unit.seatStatus === "SUBMITTED"}
                />
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "candidates" || tab === "ballot" ? (
        <div className="space-y-4">
          {units.map((unit) => {
            const candidates = candidatesForUnit(store, unit);
            if (tab === "ballot" && candidates.length === 0) return null;
            return (
              <article key={unit.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
                <h3 className="font-serif text-xl text-navy">{unitLabel(unit)}</h3>
                <p className="text-xs text-navy/50">
                  Delegate seats: {unit.delegateSeats ?? "NOT CONFIGURED"}
                </p>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {candidates.map((candidate) => (
                    <li key={candidate.id} className="flex items-center gap-3 rounded-xl bg-cream/70 p-3">
                      <img src={candidate.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                      <span>
                        <span className="block font-semibold text-navy">{candidate.fullName}</span>
                        <span className="text-xs text-navy/50">{candidate.approvalStatus} · {candidate.votesReceived} votes</span>
                      </span>
                    </li>
                  ))}
                  {candidates.length === 0 ? <li className="text-sm text-navy/50">No approved candidates mapped to this unit.</li> : null}
                </ul>
              </article>
            );
          })}
        </div>
      ) : null}

      {tab === "voting" ? (
        <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <p className="text-sm text-navy/70">
            {store.studentElectors.filter((item) => item.voterStatus === "voted").length} of{" "}
            {store.studentElectors.length} mock electors have voted. Ballots are generated
            from unit + configured seats + approved candidates.
          </p>
        </section>
      ) : null}

      {tab === "results" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ActionButton label="Apply demonstration tallies" run={applyDemonstrationTallies} disabled={!canSeats} disabledReason="Configuration permission required." />
            <ActionButton label="Finalize elected delegates" tone="navy" run={finalizeElection1Results} disabled={!canSeats} disabledReason="Finalizing Election 1 is a Commission configuration action after seats exist." />
          </div>
          <ul className="divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-white/90">
            {store.delegateCandidates
              .slice()
              .sort((a, b) => b.votesReceived - a.votesReceived)
              .map((candidate) => (
                <li key={candidate.id} className="flex justify-between px-4 py-3 text-sm">
                  <span>{candidate.fullName}</span>
                  <span>{candidate.votesReceived} votes</span>
                </li>
              ))}
          </ul>
          {store.electedDelegates.length === 0 ? (
            <p className="text-sm text-navy/60">No elected delegates yet. After tallies, finalize to identify winners by configured seats.</p>
          ) : (
            <ul className="divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-white/90">
              {store.electedDelegates.map((delegate) => (
                <li key={delegate.id} className="flex justify-between px-4 py-3 text-sm">
                  <span>{delegate.fullName}</span>
                  <span>{delegate.votesReceived} votes</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "college" ? (
        <section className="space-y-4 rounded-2xl border border-navy/10 bg-white/90 p-6">
          <p className="text-sm text-navy/70">
            Status: <strong>{store.electoralCollege.status.replaceAll("_", " ")}</strong>. The
            register is derived from confirmed Election 1 results — it is never typed in by hand.
          </p>
          <div className="flex flex-wrap gap-3">
            <ActionButton label="Generate register from results" run={generateElectoralCollege} disabled={!canRegister} disabledReason="Register generation is a Commission administration power." />
            <ActionButton label="Verify and activate" tone="navy" run={verifyElectoralCollege} disabled={!canRegister} disabledReason="Verification required before the Cabinet electorate becomes active." />
          </div>
          <ul className="divide-y divide-navy/10 text-sm">
            {store.electoralCollege.entries.map((entry) => (
              <li key={entry.id} className="flex justify-between py-3">
                <span>{entry.fullName} · {entry.registrationNumber}</span>
                <span className="capitalize">{entry.electorStatus.replaceAll("_", " ")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function chip(active: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-xs font-semibold",
    active ? "bg-navy text-cream" : "bg-white text-navy/70 ring-1 ring-navy/10",
  ].join(" ");
}
