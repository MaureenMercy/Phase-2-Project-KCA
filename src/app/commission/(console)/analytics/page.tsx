import { AnalyticsBars } from "@/components/commission/AnalyticsBars";
import { ModuleSubnav, PageHeader, StatCard } from "@/components/commission/PageHeader";
import { OpsStatusBanner } from "@/components/commission/OpsStatusBanner";
import { opsAnalytics, opsHealth } from "@/lib/ops-client";
import { readRequestMeta } from "@/lib/request-meta";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Election analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAuthorizedSession();
  const store = await readStore();
  const [health, analytics, meta] = await Promise.all([
    opsHealth(),
    opsAnalytics(),
    readRequestMeta(),
  ]);
  const campusRows = (analytics?.byCampus ?? []).map((row) => ({
    ...row,
    label: store.campuses.find((campus) => campus.id === row.label)?.name ?? row.label,
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Integrity" title="Results analytics">
        Bar graphs are built from ballots stored in MongoDB. Official declaration
        still happens on the Results page after voting closes; this view is for
        live counts and post-result inspection.
      </PageHeader>
      <ModuleSubnav
        current="/commission/analytics"
        items={[
          { href: "/commission/tracking", label: "Who voted" },
          { href: "/commission/access", label: "Workstation access" },
          { href: "/commission/analytics", label: "Analytics" },
        ]}
      />
      <OpsStatusBanner online={Boolean(health?.ok)} currentIp={meta.ip} />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Election 1 ballots" value={String(analytics?.totals.election1Ballots ?? 0)} />
        <StatCard label="Cabinet ballots" value={String(analytics?.totals.cabinetBallots ?? 0)} />
        <StatCard label="Distinct IPs" value={String(analytics?.byIp.length ?? 0)} />
        <StatCard label="Denied attempts" value={String(analytics?.totals.deniedAttempts ?? 0)} />
      </section>

      <AnalyticsBars
        title="Election 1 — votes by candidate"
        hint="Each selected delegate on a ballot increments that candidate."
        rows={analytics?.byCandidate ?? []}
      />
      <AnalyticsBars title="Election 1 — ballots by campus" rows={campusRows} />
      <AnalyticsBars
        title="Cabinet — votes by choice"
        hint="Appears after Electoral College ballots are stored."
        rows={analytics?.byCabinetCandidate ?? []}
      />
      <AnalyticsBars title="Ballots by workstation IP" rows={analytics?.byIp ?? []} />
    </div>
  );
}
