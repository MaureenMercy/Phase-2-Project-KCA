import { ModuleSubnav, PageHeader, StatCard } from "@/components/commission/PageHeader";
import { OpsStatusBanner } from "@/components/commission/OpsStatusBanner";
import { formatDateTime } from "@/lib/format";
import { opsAnalytics, opsHealth } from "@/lib/ops-client";
import { readRequestMeta } from "@/lib/request-meta";
import { requireAuthorizedSession } from "@/lib/session";

export const metadata = { title: "Vote tracking" };
export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  await requireAuthorizedSession();
  const [health, analytics, meta] = await Promise.all([
    opsHealth(),
    opsAnalytics(),
    readRequestMeta(),
  ]);
  const online = Boolean(health?.ok);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Integrity" title="Vote and IP tracking">
        Students who have voted are stored on the operations API in MongoDB, not
        only in the page store. Each ballot keeps the workstation IP and a
        long-lived workstation cookie so irregularities can be reconstructed.
      </PageHeader>
      <ModuleSubnav
        current="/commission/tracking"
        items={[
          { href: "/commission/tracking", label: "Who voted" },
          { href: "/commission/access", label: "Workstation access" },
          { href: "/commission/analytics", label: "Analytics" },
        ]}
      />
      <OpsStatusBanner online={online} currentIp={meta.ip} />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Election 1 ballots" value={String(analytics?.totals.election1Ballots ?? 0)} />
        <StatCard label="Cabinet ballots" value={String(analytics?.totals.cabinetBallots ?? 0)} />
        <StatCard label="Access events" value={String(analytics?.totals.accessEvents ?? 0)} />
        <StatCard
          label="Denied attempts"
          value={String(analytics?.totals.deniedAttempts ?? 0)}
          hint="Blocked by the IP allow-list"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
        <h2 className="px-5 py-4 font-serif text-2xl text-navy">Election 1 voters</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Workstation</th>
              <th className="px-4 py-3">Cast at</th>
            </tr>
          </thead>
          <tbody>
            {(analytics?.voters ?? []).map((voter) => (
              <tr key={`${voter.studentId}-${voter.castAt}`} className="border-t border-navy/10">
                <td className="px-4 py-3">
                  <span className="block font-semibold text-navy">{voter.fullName}</span>
                  <span className="text-xs text-navy/50">{voter.studentId}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{voter.ip || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{voter.workstationId || "—"}</td>
                <td className="px-4 py-3 text-xs text-navy/60">{formatDateTime(voter.castAt)}</td>
              </tr>
            ))}
            {!analytics?.voters.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-navy/50">
                  No Election 1 ballots have been written to MongoDB yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
        <h2 className="px-5 py-4 font-serif text-2xl text-navy">Cabinet electors</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
            <tr>
              <th className="px-4 py-3">Elector</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Workstation</th>
              <th className="px-4 py-3">Cast at</th>
            </tr>
          </thead>
          <tbody>
            {(analytics?.cabinetVoters ?? []).map((voter) => (
              <tr key={`${voter.studentId}-${voter.castAt}`} className="border-t border-navy/10">
                <td className="px-4 py-3">
                  <span className="block font-semibold text-navy">{voter.fullName}</span>
                  <span className="text-xs text-navy/50">{voter.studentId}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{voter.ip || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{voter.workstationId || "—"}</td>
                <td className="px-4 py-3 text-xs text-navy/60">{formatDateTime(voter.castAt)}</td>
              </tr>
            ))}
            {!analytics?.cabinetVoters.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-navy/50">
                  No Cabinet ballots have been written to MongoDB yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90">
        <h2 className="px-5 py-4 font-serif text-2xl text-navy">Access log</h2>
        <ol>
          {(analytics?.recentEvents ?? []).map((event, index) => (
            <li key={`${event.at}-${index}`} className="border-t border-navy/10 px-5 py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-navy">{event.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-navy/45">{formatDateTime(event.at)}</p>
              </div>
              <p className="mt-1 text-xs text-navy/55">
                {event.actor || "unknown"} · {event.ip || "no IP"} · {event.allowed ? "allowed" : "denied"}
                {event.reason ? ` · ${event.reason}` : ""}
              </p>
            </li>
          ))}
          {!analytics?.recentEvents.length ? (
            <li className="px-5 py-6 text-sm text-navy/50">No access events stored yet.</li>
          ) : null}
        </ol>
      </section>
    </div>
  );
}
