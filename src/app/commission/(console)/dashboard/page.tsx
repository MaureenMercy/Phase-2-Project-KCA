import Link from "next/link";
import { AuthorityPanel } from "@/components/commission/AuthorityPanel";
import { ActionButton } from "@/components/commission/ActionButton";
import { PageHeader, StatCard, StatusPill } from "@/components/commission/PageHeader";
import {
  authorizeElectionClosing,
  authorizeElectionOpening,
  authorizeResults,
} from "@/lib/actions/auth";
import { resolveUnits } from "@/lib/electoral";
import { formatDateTime, formatNumber } from "@/lib/format";
import { CONTEST_LABELS, isAllowedNow, ROLE_LABELS, STAGE_LABELS } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Commission dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const role = session.role!;
  const pendingCandidates = store.candidates.filter((item) => item.status === "pending");
  const assigned = store.pollingStations.filter((station) =>
    session.pollingStationIds?.includes(station.id),
  );
  const units = resolveUnits(store);
  const unconfigured = units.filter((unit) => unit.delegateSeats === null).length;
  const voted = store.studentElectors.filter((item) => item.voterStatus === "voted").length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Electoral Commission" title={`Welcome, ${session.shortName}`}>
          {ROLE_LABELS[role]} · {store.election.name} · {CONTEST_LABELS[store.election.contest]}
        </PageHeader>
        <div className="rounded-2xl border border-gold bg-white/90 px-4 py-3 text-right">
          <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">Lifecycle</p>
          <p className="font-serif text-xl text-navy">{STAGE_LABELS[store.election.stage]}</p>
          {store.election.emergencyStatus === "PAUSED" ? (
            <StatusPill tone="danger">Paused</StatusPill>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Eligible Election 1 electors"
          value={formatNumber(store.studentElectors.length)}
          hint={`${voted} have voted · mock first-year register`}
        />
        <StatCard
          label="Electoral units"
          value={String(units.length)}
          hint={`${unconfigured} still need seat allocation`}
        />
        <StatCard
          label="Pending nominations"
          value={String(pendingCandidates.length)}
          hint="Leadership files awaiting a decision"
        />
        <StatCard
          label={assigned.length ? "Assigned station" : "Commission role"}
          value={assigned.length ? assigned.map((station) => station.campus).join(", ") : ROLE_LABELS[role]}
          hint={assigned[0]?.status.replaceAll("_", " ") ?? "Central administration"}
        />
      </section>

      {assigned[0] ? (
        <section className="rounded-2xl border border-gold bg-white/90 p-6">
          <p className="text-[10px] tracking-[0.18em] text-gold-dim uppercase">Election officer mode</p>
          <h2 className="mt-1 font-serif text-2xl text-navy">{assigned[0].name}</h2>
          <p className="mt-2 text-sm text-navy/65">
            Your commission identity stays the same. Station assignment activates
            opening, voter checks, and incident recording for this location only.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase" href="/commission/stations">
              Open station console
            </Link>
            <Link className="rounded-sm border border-navy/15 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" href="/commission/incidents">
              Incident log
            </Link>
          </div>
        </section>
      ) : null}

      <AuthorityPanel role={role} stage={store.election.stage} />

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <h2 className="font-serif text-2xl text-navy">High-risk electoral actions</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-navy/65">
          Opening, closing, and authorizing results require the correct role and
          stage, plus re-authentication. They never touch servers, databases, or
          deployments.
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
