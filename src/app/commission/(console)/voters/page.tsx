import { ActionButton } from "@/components/commission/ActionButton";
import { ModuleSubnav, PageHeader, StatCard, StatusPill } from "@/components/commission/PageHeader";
import { approveVoterRegister } from "@/lib/actions/auth";
import { decideVoterException } from "@/lib/actions/voters";
import { ExceptionForm } from "@/components/commission/VoterAdmin";
import { unitForStudent, unitLabel } from "@/lib/electoral";
import { formatDateTime, formatNumber } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Voter management" };
export const dynamic = "force-dynamic";

export default async function VotersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const { tab: rawTab, q } = await searchParams;
  const tab = rawTab === "exceptions" ? "exceptions" : rawTab === "lookup" ? "lookup" : "register";
  const canApprove = isAllowedNow(session.role!, "approve_voter_register", store.election.stage);
  const canDecide = isAllowedNow(session.role!, "decide_voter_exceptions", store.election.stage);
  const assigned = store.pollingStations.find((station) => session.pollingStationIds?.includes(station.id));
  const query = (q ?? "").trim().toLowerCase();
  const records = store.studentElectors.filter((student) => {
    if (session.role === "COMMISSIONER" && assigned && student.campusId !== assigned.campusId) {
      return tab === "register" ? true : student.campusId === assigned.campusId;
    }
    if (!query) return true;
    return (
      student.fullName.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query)
    );
  });

  const exceptions =
    session.role === "COMMISSIONER" && assigned
      ? store.voterExceptions.filter((item) => item.campusId === assigned.campusId)
      : store.voterExceptions;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Voter management" title="Commission voter register">
        Administrative view of mock student electors. This is not the student ballot.
        Participation is visible; candidate selections are never shown here.
      </PageHeader>
      <ModuleSubnav
        current={`/commission/voters${tab === "register" ? "" : `?tab=${tab}`}`}
        items={[
          { href: "/commission/voters", label: "Voter Register" },
          { href: "/commission/voters?tab=lookup", label: "Voter status" },
          { href: "/commission/voters?tab=exceptions", label: "Exceptions" },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Register" value={store.voterRegister.version} hint={store.voterRegister.status} />
        <StatCard label="Election 1 eligible" value={formatNumber(store.studentElectors.length)} hint="Mock first-year register" />
        <StatCard
          label="Voted (Election 1)"
          value={formatNumber(store.studentElectors.filter((item) => item.election1VotingStatus === "voted").length)}
          hint="No ballot choices attached"
        />
        <StatCard label="Pending exceptions" value={String(exceptions.filter((item) => item.status === "PENDING").length)} />
      </section>

      {tab === "lookup" ? (
        <div className="space-y-4">
          <form action="/commission/voters" className="flex gap-2">
            <input type="hidden" name="tab" value="lookup" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Registration number or name"
              className="flex-1 rounded-xl border border-navy/15 px-3 py-2 text-sm"
            />
            <button className="rounded-xl bg-navy px-4 py-2 text-xs font-bold tracking-wide text-cream uppercase" type="submit">
              Search
            </button>
          </form>
          {query
            ? records.slice(0, 8).map((student) => {
                const unit = unitForStudent(store, student);
                const campus = store.campuses.find((item) => item.id === student.campusId);
                const station = store.pollingStations.find((item) => item.campusId === student.campusId);
                return (
                  <article key={student.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
                    <p className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">Voter status</p>
                    <h2 className="mt-1 font-serif text-2xl text-navy">{student.fullName}</h2>
                    <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-navy/40">Registration number</dt>
                        <dd className="font-mono">{student.studentId}</dd>
                      </div>
                      <div>
                        <dt className="text-navy/40">Campus</dt>
                        <dd>{campus?.name}</dd>
                      </div>
                      <div>
                        <dt className="text-navy/40">Electoral unit</dt>
                        <dd>{unit ? unitLabel(unit) : "Unmapped"}</dd>
                      </div>
                      <div>
                        <dt className="text-navy/40">Assigned polling station</dt>
                        <dd>{station?.name ?? "Unassigned"}</dd>
                      </div>
                      <div>
                        <dt className="text-navy/40">Registration / eligibility</dt>
                        <dd>
                          {student.verificationStatus} · Election 1 {student.election1Eligibility}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-navy/40">Vote status</dt>
                        <dd>
                          {student.election1VotingStatus === "voted" ? "VOTE CAST ✓" : "NOT YET VOTED"}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-navy/45">
                      Candidate selections are never displayed. Election 2 eligibility is separate and requires
                      Electoral College membership.
                    </p>
                  </article>
                );
              })
            : null}
        </div>
      ) : null}

      {tab === "register" ? (
        <>
          <form action="/commission/voters" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or registration number"
              className="flex-1 rounded-xl border border-navy/15 px-3 py-2 text-sm"
            />
            <button className="rounded-xl bg-navy px-4 py-2 text-xs font-bold tracking-wide text-cream uppercase" type="submit">
              Search
            </button>
          </form>
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/90">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
                <tr>
                  <th className="px-4 py-3">Reg. no.</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Campus / unit</th>
                  <th className="px-4 py-3">E1</th>
                  <th className="px-4 py-3">Delegate</th>
                  <th className="px-4 py-3">E2</th>
                </tr>
              </thead>
              <tbody>
                {records.map((student) => {
                  const unit = unitForStudent(store, student);
                  return (
                    <tr key={student.id} className="border-t border-navy/10">
                      <td className="px-4 py-3 font-mono text-xs">{student.studentId}</td>
                      <td className="px-4 py-3 font-semibold text-navy">{student.fullName}</td>
                      <td className="px-4 py-3">{unit ? unitLabel(unit) : "Unmapped"}</td>
                      <td className="px-4 py-3">{student.election1VotingStatus.replaceAll("_", " ")}</td>
                      <td className="px-4 py-3">{student.electedDelegateStatus.replaceAll("_", " ")}</td>
                      <td className="px-4 py-3">{student.election2VotingStatus.replaceAll("_", " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ActionButton
            label="Approve register"
            run={approveVoterRegister}
            disabled={!canApprove}
            disabledReason="Commissioners do not hold final voter-register approval."
          />
        </>
      ) : null}

      {tab === "exceptions" ? (
        <div className="space-y-6">
          <ExceptionForm
            campuses={store.campuses.map((item) => ({ id: item.id, name: item.name }))}
            defaultCampusId={assigned?.campusId ?? store.campuses[0]?.id ?? ""}
          />
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/90">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((item) => (
                  <tr key={item.id} className="border-t border-navy/10 align-top">
                    <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-navy">{item.fullName}</span>
                      <span className="text-xs text-navy/50">{item.registrationNumber}</span>
                    </td>
                    <td className="px-4 py-3">{item.issue.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3">{formatDateTime(item.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={item.status === "PENDING" ? "warn" : item.status === "APPROVED" ? "ok" : "navy"}>
                        {item.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      {canDecide && item.status === "PENDING" ? (
                        <div className="flex flex-col gap-2">
                          <ActionButton
                            label="Request more info"
                            run={() =>
                              decideVoterException({
                                id: item.id,
                                status: "MORE_INFO",
                                decisionNote: "Further verification required. Eligibility not independently granted.",
                              })
                            }
                          />
                          <ActionButton
                            label="Approve exception"
                            run={() =>
                              decideVoterException({
                                id: item.id,
                                status: "APPROVED",
                                decisionNote: "Mock authorised review outcome.",
                              })
                            }
                          />
                          <ActionButton
                            label="Reject"
                            run={() =>
                              decideVoterException({
                                id: item.id,
                                status: "REJECTED",
                                decisionNote: "Mock authorised rejection.",
                              })
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-navy/45">{item.decisionNote ?? "No further action"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
