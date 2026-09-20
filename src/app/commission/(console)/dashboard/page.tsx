import { AuthorityPanel } from "@/components/commission/AuthorityPanel";
import { ActionButton } from "@/components/commission/ActionButton";
import {
  authorizeElectionClosing,
  authorizeElectionOpening,
  authorizeResults,
} from "@/lib/actions/auth";
import { formatDateTime, formatNumber } from "@/lib/format";
import { isAllowedNow, ROLE_LABELS, STAGE_LABELS } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Commission dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const role = session.role!;
  const pendingCandidates = store.candidates.filter((item) => item.status === "pending");
  const stations = store.pollingStations.filter((station) =>
    session.pollingStationIds?.includes(station.id),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">
            Electoral Commission
          </p>
          <h1 className="mt-1 font-serif text-4xl text-navy">
            Welcome, {session.shortName}
          </h1>
          <p className="mt-2 text-sm text-navy/65">
            {ROLE_LABELS[role]} · {store.election.name} · {STAGE_LABELS[store.election.stage]}
          </p>
        </div>
        <div className="rounded-sm border border-gold bg-white px-4 py-3 text-right">
          <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">Stage</p>
          <p className="font-serif text-xl text-navy">{store.election.stage.replaceAll("_", " ")}</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Registered voters" value={formatNumber(store.voterRegister.voterCount)} hint={store.voterRegister.version} />
        <StatCard label="Pending nominations" value={String(pendingCandidates.length)} hint="Candidate files awaiting a decision" />
        <StatCard
          label="Assigned stations"
          value={String(stations.length)}
          hint={stations.map((station) => station.name).join(" · ") || "Oversight"}
        />
      </section>

      <AuthorityPanel role={role} stage={store.election.stage} />

      <section className="rounded-sm border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl text-navy">High-risk electoral actions</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-navy/65">
          Opening the election, closing voting, and authorizing results require
          both the correct role and the correct election stage. They also require
          re-authentication. Technical staff cannot perform these actions here.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <ActionButton
            label="Authorize opening"
            run={authorizeElectionOpening}
            disabled={!isAllowedNow(role, "authorize_election_opening", store.election.stage)}
            disabledReason={
              role === "CHAIR" || role === "VICE_CHAIR"
                ? "Opening can only be authorized during the registration period."
                : "Final opening authorization is reserved to the Chair and Vice Chair."
            }
          />
          <ActionButton
            label="Authorize closing"
            tone="navy"
            run={authorizeElectionClosing}
            disabled={!isAllowedNow(role, "authorize_election_closing", store.election.stage)}
            disabledReason="Closing can only be authorized while voting is in progress, by the Chair or Vice Chair."
          />
          <ActionButton
            label="Authorize official results"
            run={authorizeResults}
            disabled={!isAllowedNow(role, "authorize_results", store.election.stage)}
            disabledReason={
              role === "CHAIR"
                ? "Results can be authorized only after voting has closed."
                : "The Chair holds special results privileges. Other members cannot authorize official results."
            }
          />
        </div>
        <dl className="mt-6 grid gap-3 text-sm text-navy/60 md:grid-cols-3">
          <div>
            <dt className="text-[10px] tracking-[0.16em] uppercase">Opened</dt>
            <dd>{formatDateTime(store.election.openedAt)}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.16em] uppercase">Closed</dt>
            <dd>{formatDateTime(store.election.closedAt)}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.16em] uppercase">Results authorized</dt>
            <dd>
              {store.election.resultsAuthorizedBy
                ? `${store.election.resultsAuthorizedBy} · ${formatDateTime(store.election.resultsAuthorizedAt)}`
                : "Pending"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-sm border border-navy/10 bg-white p-5">
      <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">{label}</p>
      <p className="mt-2 font-serif text-4xl text-navy">{value}</p>
      <p className="mt-2 text-xs text-navy/55">{hint}</p>
    </article>
  );
}
