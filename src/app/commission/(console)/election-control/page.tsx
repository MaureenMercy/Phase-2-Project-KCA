import { ActionButton } from "@/components/commission/ActionButton";
import {
  authorizeElectionClosing,
  authorizeElectionOpening,
} from "@/lib/actions/auth";
import { formatDateTime } from "@/lib/format";
import { isAllowedNow, STAGE_LABELS } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Election control" };
export const dynamic = "force-dynamic";

export default async function ElectionControlPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const role = session.role!;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">Control</p>
        <h1 className="font-serif text-4xl text-navy">Election control</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">
          Opening and closing are high-risk actions. They require the right
          Electoral Commission role, the right stage, and a fresh password
          confirmation. They do not touch servers, databases, or deployments.
        </p>
      </header>

      <section className="rounded-sm border border-navy/10 bg-white p-6">
        <p className="text-[10px] tracking-[0.18em] text-gold uppercase">Now</p>
        <p className="mt-2 font-serif text-3xl text-navy">
          {STAGE_LABELS[store.election.stage]}
        </p>
        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-navy/40">Opened</dt>
            <dd>{formatDateTime(store.election.openedAt)}</dd>
          </div>
          <div>
            <dt className="text-navy/40">Closed</dt>
            <dd>{formatDateTime(store.election.closedAt)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton
            label="Authorize opening"
            run={authorizeElectionOpening}
            disabled={!isAllowedNow(role, "authorize_election_opening", store.election.stage)}
            disabledReason="Only the Chair or Vice Chair may authorize opening, and only during registration."
          />
          <ActionButton
            label="Authorize closing"
            tone="navy"
            run={authorizeElectionClosing}
            disabled={!isAllowedNow(role, "authorize_election_closing", store.election.stage)}
            disabledReason="Only the Chair or Vice Chair may close voting, and only while voting is in progress."
          />
        </div>
      </section>
    </div>
  );
}
