import { ActionButton } from "@/components/commission/ActionButton";
import { PageHeader } from "@/components/commission/PageHeader";
import { authorizeResults } from "@/lib/actions/auth";
import { CABINET_CONTESTS } from "@/lib/electoral";
import { formatDateTime } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Results & declaration" };
export const dynamic = "force-dynamic";

export default async function ElectionResultsPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const canView = store.election.stage === "CLOSED" || store.election.stage === "CERTIFIED";
  const canAuthorize = isAllowedNow(session.role!, "authorize_results", store.election.stage);

  const cabinetTotals = CABINET_CONTESTS.map((contest) => {
    const counts = new Map<string, number>();
    for (const vote of store.cabinetVotes) {
      const choice = vote.selections[contest.id];
      counts.set(choice, (counts.get(choice) ?? 0) + 1);
    }
    const rows = store.cabinetCandidates
      .filter((candidate) => candidate.contestId === contest.id)
      .map((candidate) => ({
        name: candidate.runningMateName
          ? `${candidate.fullName} + ${candidate.runningMateName}`
          : candidate.fullName,
        votes: counts.get(candidate.id) ?? 0,
      }));
    return { contest, rows };
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Results & declaration" title="Vote totals, reconciliation, publication">
        Results stay inside the election workflow. They are not a permanent
        hamburger item. The system preserves the record; it does not declare a
        legal outcome until the Chair authorizes it.
      </PageHeader>

      {!canView ? (
        <section className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm text-navy/70">
          Results remain withheld while voting is open. After closing: totals →
          reconciliation → verification → authorization → publication.
        </section>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
            <h2 className="font-serif text-2xl text-navy">Election 1 results</h2>
            <ul className="mt-3 divide-y divide-navy/10 text-sm">
              {store.electedDelegates.map((delegate) => (
                <li key={delegate.id} className="flex justify-between py-2">
                  <span>{delegate.fullName}</span>
                  <span>{delegate.votesReceived}</span>
                </li>
              ))}
            </ul>
          </section>
          {cabinetTotals.map((block) => (
            <section key={block.contest.id} className="rounded-2xl border border-navy/10 bg-white/90 p-6">
              <h2 className="font-serif text-2xl text-navy">{block.contest.title}</h2>
              <ul className="mt-3 divide-y divide-navy/10 text-sm">
                {block.rows.map((row) => (
                  <li key={row.name} className="flex justify-between py-2">
                    <span>{row.name}</span>
                    <span>{row.votes}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <p className="text-xs text-navy/50">
          Authorized by {store.election.resultsAuthorizedBy ?? "—"} on{" "}
          {formatDateTime(store.election.resultsAuthorizedAt)}
        </p>
        <div className="mt-4">
          <ActionButton
            label="Authorize official results"
            run={authorizeResults}
            disabled={!canAuthorize}
            disabledReason={
              session.role === "CHAIR"
                ? "The Chair may authorize results only after voting has closed."
                : "Special results privileges belong to the Commission Chair."
            }
          />
        </div>
      </section>
    </div>
  );
}
