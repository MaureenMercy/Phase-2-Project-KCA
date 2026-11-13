import "server-only";

import { readElectionContext, stageForContext } from "@/lib/election-context";
import { isAllowedNow, isHighRisk } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { isReauthFresh } from "@/lib/session-crypto";
import { readStore } from "@/lib/store";
import type { ElectoralPermission } from "@/lib/types";

export async function assertPermission(permission: ElectoralPermission) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const context = await readElectionContext(store);
  const stage = stageForContext(store, context);
  if (!session.role || !isAllowedNow(session.role, permission, stage)) {
    return {
      session,
      store,
      error:
        "Your Electoral Commission authority does not permit this action at the current election stage.",
    };
  }
  if (isHighRisk(permission) && !isReauthFresh(session)) {
    return { session, store, needsReauth: true as const };
  }
  return { session, store, context, stage };
}

export function assignedStationId(session: { pollingStationIds?: string[] }) {
  return session.pollingStationIds?.[0] ?? null;
}

export function assertOwnStation(
  session: { role?: string; pollingStationIds?: string[] },
  stationId: string,
) {
  if (session.role !== "COMMISSIONER") {
    return "Station opening and closing are performed only by the assigned campus Commissioner.";
  }
  const mine = assignedStationId(session);
  if (!mine) return "No polling station is assigned to this commissioner.";
  if (mine !== stationId) return "You may only operate your assigned polling station.";
  return null;
}
