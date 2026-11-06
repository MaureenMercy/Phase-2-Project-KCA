import { AddDelegateCandidateForm } from "@/components/commission/AddDelegateCandidateForm";
import { AddLeadershipCandidateForm } from "@/components/commission/AddLeadershipCandidateForm";
import { CandidateDecision } from "@/components/commission/CandidateDecision";
import { CandidatePhotoUpload } from "@/components/commission/CandidatePhotoUpload";
import { ModuleSubnav, PageHeader } from "@/components/commission/PageHeader";
import { courseOptions } from "@/lib/courses";
import { CABINET_CONTESTS, resolveUnits, unitLabel } from "@/lib/electoral";
import { formatDateTime } from "@/lib/format";
import { overlayCandidatePhotos } from "@/lib/ops-overlay";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Candidates" };
export const dynamic = "force-dynamic";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const { kind: rawKind } = await searchParams;
  const kind = rawKind === "delegates" ? "delegates" : "leadership";
  const canDecide = isAllowedNow(session.role!, "approve_candidates", store.election.stage);
  const addReason = "Adding candidates is a Commission nomination power at this election stage.";
  const candidates = await overlayCandidatePhotos(store.candidates);
  const delegates = await overlayCandidatePhotos(store.delegateCandidates);
  const units = resolveUnits(store);
  const campuses = store.campuses.filter((campus) => campus.status === "active").map((campus) => campus.name);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Candidate management" title="Candidates">
        Add more Leadership (Cabinet) candidates and more Election 1 delegate candidates here.
        New names are placed on the matching ballot as soon as you add them.
      </PageHeader>
      <ModuleSubnav
        current={kind === "delegates" ? "/commission/candidates?kind=delegates" : "/commission/candidates?kind=leadership"}
        items={[
          { href: "/commission/candidates?kind=leadership", label: "Leadership" },
          { href: "/commission/candidates?kind=delegates", label: "Delegates" },
          { href: "/commission/election/election-1?tab=candidates", label: "Election 1 list" },
          { href: "/commission/election/leadership", label: "Cabinet ballot" },
        ]}
      />

      {kind === "leadership" ? (
        <>
          <AddLeadershipCandidateForm
            contests={CABINET_CONTESTS.map((contest) => ({
              id: contest.id,
              title: contest.title,
              kind: contest.kind,
            }))}
            campuses={campuses}
            canAdd={canDecide}
            disabledReason={addReason}
          />
          <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Portrait</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-navy/10">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {candidate.photo ? (
                          <img src={candidate.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : null}
                        <span>
                          <span className="block font-semibold text-navy">{candidate.fullName}</span>
                          <span className="text-xs text-navy/50">{candidate.campus}</span>
                          {candidate.runningMateName ? (
                            <span className="block text-xs text-navy/45">Running mate: {candidate.runningMateName}</span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{candidate.position}</td>
                    <td className="px-4 py-4">{candidate.ticket}</td>
                    <td className="px-4 py-4 capitalize">
                      {candidate.status}
                      {candidate.reviewedBy ? (
                        <span className="block text-xs text-navy/45">
                          {candidate.reviewedBy} · {formatDateTime(candidate.reviewedAt ?? null)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <CandidatePhotoUpload candidateId={candidate.id} kind="leadership" disabled={!canDecide} />
                    </td>
                    <td className="px-4 py-4">
                      {candidate.status === "pending" ? (
                        <CandidateDecision
                          candidateId={candidate.id}
                          disabled={!canDecide}
                          disabledReason="Candidate approval is not available at this election stage."
                        />
                      ) : (
                        <span className="text-xs text-navy/40">Recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <AddDelegateCandidateForm
            courses={courseOptions()}
            canAdd={canDecide}
            disabledReason={addReason}
          />
          <div className="space-y-4">
            {units.map((unit) => {
              const mapped = delegates.filter(
                (candidate) =>
                  candidate.status === "active" &&
                  candidate.campusId === unit.campusId &&
                  candidate.schoolId === unit.schoolId &&
                  (candidate.departmentId ?? null) === (unit.departmentId ?? null),
              );
              return (
                <article key={unit.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
                  <h3 className="font-serif text-xl text-navy">{unitLabel(unit)}</h3>
                  <p className="text-xs text-navy/50">{mapped.length} delegate candidate{mapped.length === 1 ? "" : "s"}</p>
                  <ul className="mt-3 grid gap-3 md:grid-cols-2">
                    {mapped.map((candidate) => (
                      <li key={candidate.id} className="flex items-center gap-3 rounded-xl bg-cream/70 p-3">
                        <img src={candidate.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-navy">{candidate.fullName}</span>
                          <span className="text-xs text-navy/50">
                            {candidate.studentId} · {candidate.approvalStatus}
                          </span>
                          <div className="mt-2">
                            <CandidatePhotoUpload
                              candidateId={candidate.id}
                              kind="delegate"
                              disabled={!canDecide}
                            />
                          </div>
                        </span>
                      </li>
                    ))}
                    {mapped.length === 0 ? (
                      <li className="text-sm text-navy/50">No delegate candidates mapped to this unit yet.</li>
                    ) : null}
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
