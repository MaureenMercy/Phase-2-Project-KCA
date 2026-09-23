import { ActionButton } from "@/components/commission/ActionButton";
import { authorizeResults } from "@/lib/actions/auth";
import { formatDateTime } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Results" };
export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const stage = store.election.stage;
  const canView = stage === "CLOSED" || stage === "CERTIFIED";
  const canAuthorize = isAllowedNow(session.role!, "authorize_results", stage);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">Tabulation</p>
        <h1 className="font-serif text-4xl text-navy">Results</h1>
      </header>

      <section className="rounded-sm border border-navy/10 bg-white p-6">
        {!canView ? (
          <p className="text-sm leading-6 text-navy/70">
            Results are withheld while voting is open. After closing, the
            Commission may view the tabulation. Only the Chair may authorize the
            official result.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-navy/70">
              Demonstration totals for SAKU Elections 2026. These figures are
              visible to the Commission after voting closes; they are not public
              until the Chair authorizes them.
            </p>
            <ul className="divide-y divide-navy/10 text-sm">
              <li className="flex justify-between py-3">
                <span>Janet Njeri · Chairperson</span>
                <span className="font-semibold">6,412</span>
              </li>
              <li className="flex justify-between py-3">
                <span>Samuel Kariuki · Chairperson</span>
                <span className="font-semibold">5,901</span>
              </li>
            </ul>
            <p className="text-xs text-navy/50">
              Authorized by {store.election.resultsAuthorizedBy ?? "—"} on{" "}
              {formatDateTime(store.election.resultsAuthorizedAt)}
            </p>
          </div>
        )}

        <div className="mt-6">
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
