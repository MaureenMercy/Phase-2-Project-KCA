import { CandidateDecision } from "@/components/commission/CandidateDecision";
import { ModuleSubnav, PageHeader } from "@/components/commission/PageHeader";
import { formatDateTime } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Candidates" };
export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const canDecide = isAllowedNow(session.role!, "approve_candidates", store.election.stage);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Candidate management" title="Candidates">
        Leadership nominations are vetted here. Delegate candidates are mapped
        from the student record to an electoral unit — they cannot pick a
        department to contest.
      </PageHeader>
      <ModuleSubnav
        current="/commission/candidates"
        items={[
          { href: "/commission/candidates", label: "Leadership files" },
          { href: "/commission/election/election-1?tab=candidates", label: "Delegate candidates" },
        ]}
      />

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {store.candidates.map((candidate) => (
              <tr key={candidate.id} className="border-t border-navy/10">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {candidate.photo ? (
                      <img src={candidate.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : null}
                    <span>
                      <span className="block font-semibold text-navy">{candidate.fullName}</span>
                      <span className="text-xs text-navy/50">{candidate.campus}</span>
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
    </div>
  );
}
