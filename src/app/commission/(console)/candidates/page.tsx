import { ActionButton } from "@/components/commission/ActionButton";
import { ModuleSubnav, PageHeader, StatusPill } from "@/components/commission/PageHeader";
import {
  lockCandidateConfiguration,
  sendCandidateVerification,
  setApplicationVetting,
  setCandidateParticipation,
} from "@/lib/actions/applications";
import { overlayCandidatePhotos } from "@/lib/ops-overlay";
import { isAllowedNow } from "@/lib/permissions";
import { ELECTION_1_ID, ELECTION_2_ID } from "@/lib/seed-electorate";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Candidate management" };
export const dynamic = "force-dynamic";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const { kind: rawKind } = await searchParams;
  const kind = rawKind === "council" ? "council" : rawKind === "pool" ? "pool" : "delegates";
  const canDecide = isAllowedNow(session.role!, "approve_candidates", store.election.stage);
  const canLock = isAllowedNow(session.role!, "lock_candidate_list", store.election.stage);
  const applications = await overlayCandidatePhotos(
    store.candidateApplications.filter((item) =>
      kind === "council" ? item.electionKind === "COUNCIL" : item.electionKind === "DELEGATE",
    ),
  );
  const pool = store.candidateApplications.filter((item) => item.vettingStatus === "APPROVED");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Candidate management" title="Applications, vetting and participation">
        Vetting asks whether a person is approved to be a candidate. Election configuration asks which approved
        candidate participates in which election. Those are separate decisions. Campus Commissioners may view
        records but cannot add an unapproved candidate to a ballot.
      </PageHeader>
      <ModuleSubnav
        current={
          kind === "council"
            ? "/commission/candidates?kind=council"
            : kind === "pool"
              ? "/commission/candidates?kind=pool"
              : "/commission/candidates"
        }
        items={[
          { href: "/commission/candidates", label: "Delegate applications" },
          { href: "/commission/candidates?kind=council", label: "Council applications" },
          { href: "/commission/candidates?kind=pool", label: "Approved pool" },
          { href: "/candidate", label: "Candidate Portal" },
        ]}
      />

      {kind === "pool" ? (
        <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
          <h2 className="font-serif text-2xl text-navy">{pool.length} approved candidates</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {pool.map((item) => (
              <li key={item.id} className="rounded-xl bg-cream/70 p-3">
                <p className="font-semibold text-navy">{item.fullName}</p>
                <p className="text-xs text-navy/55">
                  {item.studentId} · {item.electionKind} · {item.positionLabel} · participation {item.participationStatus}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label={`Lock ${kind === "council" ? "Election 2" : "Election 1"} candidate list`}
              run={lockCandidateConfiguration}
              args={kind === "council" ? ELECTION_2_ID : ELECTION_1_ID}
              disabled={!canLock}
              disabledReason="Locking the candidate configuration is reserved for authorised Commission leadership."
            />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/90">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Vetting</th>
                  <th className="px-4 py-3">Participation</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((item) => (
                  <tr key={item.id} className="border-t border-navy/10 align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.photo ? <img src={item.photo} alt="" className="h-10 w-10 rounded-full object-cover" /> : null}
                        <span>
                          <span className="block font-semibold text-navy">{item.fullName}</span>
                          <span className="text-xs text-navy/50">{item.studentId}</span>
                          {item.runningMateName ? (
                            <span className="block text-xs text-navy/45">Running mate: {item.runningMateName}</span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.positionLabel}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={item.vettingStatus === "APPROVED" ? "ok" : item.vettingStatus === "REJECTED" ? "danger" : "warn"}>
                        {item.vettingStatus}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">{item.participationStatus}</td>
                    <td className="px-4 py-3">{item.verificationStatus.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3">
                      {canDecide ? (
                        <div className="flex flex-col gap-2">
                          {item.vettingStatus === "PENDING" ? (
                            <>
                              <ActionButton
                                label="Approve vetting"
                                run={setApplicationVetting}
                                args={{
                                  id: item.id,
                                  vettingStatus: "APPROVED",
                                  notes: "Mock authorised vetting decision.",
                                }}
                              />
                              <ActionButton
                                label="Reject"
                                run={setApplicationVetting}
                                args={{
                                  id: item.id,
                                  vettingStatus: "REJECTED",
                                  notes: "Mock rejection.",
                                }}
                              />
                            </>
                          ) : null}
                          {item.vettingStatus === "APPROVED" ? (
                            <ActionButton
                              label={item.participationStatus === "SELECTED" ? "Remove from election" : "Select for election"}
                              run={setCandidateParticipation}
                              args={{
                                id: item.id,
                                participationStatus:
                                  item.participationStatus === "SELECTED" ? "NOT_SELECTED" : "SELECTED",
                              }}
                            />
                          ) : null}
                          <ActionButton label="Send verification" run={sendCandidateVerification} args={item.id} />
                        </div>
                      ) : (
                        <span className="text-xs text-navy/40">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
