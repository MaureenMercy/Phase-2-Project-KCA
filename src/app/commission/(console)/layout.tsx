import { CommissionShell } from "@/components/commission/CommissionShell";
import { SessionGuard } from "@/components/commission/SessionGuard";
import { activePermissions } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const stations = store.pollingStations.filter((station) =>
    session.pollingStationIds?.includes(station.id),
  );
  const notifications = store.notifications.filter(
    (item) =>
      item.audience === "all" ||
      (session.role && Array.isArray(item.audience) && item.audience.includes(session.role)),
  );
  const permissions = activePermissions(session.role!, store.election.stage);

  return (
    <CommissionShell
      user={{
        fullName: session.fullName,
        shortName: session.shortName,
        workId: session.workId,
        role: session.role!,
        stationNames: stations.map((station) => station.name),
      }}
      electionName={store.election.name}
      stage={store.election.stage}
      contest={store.election.contest}
      emergencyPaused={store.election.emergencyStatus === "PAUSED"}
      permissions={permissions}
      notifications={notifications}
    >
      <SessionGuard />
      {children}
    </CommissionShell>
  );
}
