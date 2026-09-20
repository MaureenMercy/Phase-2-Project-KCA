import { CandidateDecision } from "@/components/commission/CandidateDecision";
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
      <header>
        <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">Nominations</p>
        <h1 className="font-serif text-4xl text-navy">Candidates</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">
          Commissioners may approve or reject nominations when the election stage
          permits it. This is electoral authority, not technical access.
        </p>
      </header>

      <div className="overflow-hidden rounded-sm border border-navy/10 bg-white">
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
                  <p className="font-semibold text-navy">{candidate.fullName}</p>
                  <p className="text-xs text-navy/50">{candidate.campus}</p>
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
