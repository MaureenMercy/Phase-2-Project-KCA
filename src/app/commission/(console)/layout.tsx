import { CommissionShell } from "@/components/commission/CommissionShell";
import { SessionGuard } from "@/components/commission/SessionGuard";
import { readElectionContext, stageForContext } from "@/lib/election-context";
import { contextElection } from "@/lib/elections";
import { navForPermissions } from "@/lib/nav";
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
  const electionContext = await readElectionContext(store);
  const election = contextElection(store);
  const permissions = activePermissions(session.role!, stageForContext(store, electionContext));

  return (
    <CommissionShell
      user={{
        fullName: session.fullName,
        shortName: session.shortName,
        workId: session.workId,
        role: session.role!,
        stationNames: stations.map((station) => station.name),
      }}
      electionName={election.name}
      stage={election.stage}
      contest={election.contest}
      emergencyPaused={election.emergencyStatus === "PAUSED"}
      electionContext={electionContext}
      items={navForPermissions(permissions)}
      notifications={notifications}
    >
      <SessionGuard />
      {children}
    </CommissionShell>
  );
}
